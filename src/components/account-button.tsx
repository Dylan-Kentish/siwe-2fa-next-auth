'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAccount, useDisconnect } from 'wagmi';

import { useLogin } from '@/hooks/use-login';
import { useLogout } from '@/hooks/use-logout';

import { use2FA } from './providers/2fa';
import { Button } from './ui/button';

export const AccountButton: React.FC = () => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();
  const { open } = useWeb3Modal();
  const { open: isOpen } = useWeb3ModalState();
  const { disconnectAsync } = useDisconnect();
  const { loginAsync } = useLogin();
  const { logoutAsync } = useLogout();

  const redirect = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl') || `${path}?${searchParams}`;

    router.replace(callbackUrl, {
      scroll: false,
    });
  }, [path, router, searchParams]);

  const { verify2FA } = use2FA({
    redirect: false,
    onVerified: () => {
      redirect();
      setDisabled(false);
    },
  });

  const [disabled, setDisabled] = useState(false);

  useAccount({
    onConnect: async ({ address }) => {
      if (!address || sessionStatus === 'loading') {
        return;
      }

      setDisabled(true);

      const ok = await loginAsync(address);

      if (!ok) {
        await disconnectAsync();
      }

      setDisabled(false);
    },
  });

  async function handleClick() {
    if (session) {
      await logoutAsync().catch(console.error);
    } else {
      open().catch(console.error);
    }
  }

  useEffect(() => {
    if (session) {
      if (session.user.is2FAEnabled && !session.is2FAVerified) {
        verify2FA().catch(console.error);
      } else {
        redirect();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <Button
      size="lg"
      onClick={handleClick}
      disabled={sessionStatus === 'loading' || isOpen || disabled}
    >
      {session ? 'Logout' : 'Login'}
    </Button>
  );
};
