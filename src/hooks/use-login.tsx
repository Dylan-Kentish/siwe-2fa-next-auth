import { startAuthentication } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';

import { prepareAuth } from '@/actions/passkeys';

export const useLogin = () => {
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

  return { siwpkAsync };
};
