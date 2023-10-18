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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export const AccountButton: React.FC = () => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectMethodOpen, setSelectMethodOpen] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const { open } = useWeb3Modal();
  const { open: isOpen } = useWeb3ModalState();
  const { disconnectAsync } = useDisconnect();
  const { siweAsync, siwpkAsync } = useLogin();
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

      const ok = await siweAsync(address);

      if (!ok) {
        await disconnectAsync();
      }

      setDisabled(false);
    },
  });

  function handleLogout() {
    logoutAsync().catch(console.error);
  }

  function handleWalletConnect() {
    open().catch(console.error);
  }

  async function handlePassKey() {
    await siwpkAsync().then(() => {
      setSelectMethodOpen(false);
    });
  }

  function handleClick() {
    if (session) {
      handleLogout();
    } else {
      setSelectMethodOpen(true);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectMethodOpen(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session && !session.user.is2FAEnabled) {
      redirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  useEffect(() => {
    if (session && session.user.is2FAEnabled && !session.is2FAVerified) {
      verify2FA().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <Dialog open={selectMethodOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          onClick={handleClick}
          disabled={sessionStatus === 'loading' || isOpen || disabled}
        >
          {session ? 'Logout' : 'Login'}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login methods</DialogTitle>
          <DialogDescription>Select a login method to continue.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button onClick={handleWalletConnect}>WalletConnect</Button>

          <Button onClick={handlePassKey}>PassKey</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
