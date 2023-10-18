import { startAuthentication } from '@simplewebauthn/browser';
import { getCsrfToken, signIn } from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { useChainId, useSignMessage } from 'wagmi';

import { prepareAuth } from '@/actions/passkeys';

export const useLogin = () => {
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  async function siweAsync(address: string) {
    const message = new SiweMessage({
      domain: window.location.host,
      address: address,
      statement: 'Sign in with Ethereum to the app.',
      uri: window.location.origin,
      version: '1',
      chainId: chainId,
      nonce: await getCsrfToken(),
    });

    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });

    if (!signature) {
      console.error('Signature is empty');
      return false;
    }

    const result = await signIn('siwe', {
      message: JSON.stringify(message),
      signature,
      redirect: false,
    });

    if (!result?.ok) {
      console.error('Failed to sign in with Ethereum.');
    }

    return result?.ok ?? false;
  }

  async function siwpkAsync() {
    const data = await prepareAuth();
    const authResp = await startAuthentication({ ...data });

    const result = await signIn('webauthn', {
      verification: JSON.stringify(authResp),
      // TODO: is this a hack, used to maintain the auth challenge?
      challenge: data.challenge,
      redirect: false,
    });

    if (!result?.ok) {
      console.error('Failed to sign in with passkey.');
    }

    return result?.ok ?? false;
  }

  return { siweAsync, siwpkAsync };
};
