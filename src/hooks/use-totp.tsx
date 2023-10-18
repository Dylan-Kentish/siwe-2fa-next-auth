import { signIn } from 'next-auth/react';

export const useTOTP = () => {
  async function verifyAsync(id: string, code: string) {
    const result = await signIn('totp', {
      id,
      code,
      redirect: false,
    });

    if (!result?.ok) {
      console.error('Failed to verify 2FA code.');
    }

    return result?.ok ?? false;
  }

  return { verifyAsync };
};
