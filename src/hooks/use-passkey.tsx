import { startAuthentication } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';

import { prepareVerify } from '@/actions/passkeys';

export const usePassKey = () => {
  async function verifyAsync() {
    const data = await prepareVerify();
    try {
      // Pass the options to the authenticator and wait for a response
      const asseResp = await startAuthentication(data);
      const result = await signIn('webauthn', {
        verification: JSON.stringify(asseResp),
        redirect: false,
      });

      if (!result?.ok) {
        console.error('Failed to verify 2FA code.');
      }

      return result?.ok ?? false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  return { verifyAsync };
};
