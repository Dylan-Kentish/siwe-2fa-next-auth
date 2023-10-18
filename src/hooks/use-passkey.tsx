import { startAuthentication } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';

import { prepareVerify } from '@/actions/passkeys';

export const usePassKey = () => {
  async function verifyAsync() {
    const data = await prepareVerify();
    const asseResp = await startAuthentication(data);
    const result = await signIn('webauthn', {
      verification: JSON.stringify(asseResp),
      redirect: false,
    });

    if (!result?.ok) {
      console.error('Failed to verify passkey.');
    }

    return result?.ok ?? false;
  }

  return { verifyAsync };
};
