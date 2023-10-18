'use client';

import { PropsWithChildren, createContext, useContext, useRef, useState } from 'react';

import { Verify } from '@/components/2fa/verify';
import { useLogout } from '@/hooks/use-logout';

type ContextProps = {
  verify2FA: () => Promise<boolean>;
};

const TwoFAContext = createContext<ContextProps>({} as ContextProps);

export const TwoFAProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const resolveRef = useRef<(ok: boolean) => void>();

  function handleVerified(valid: boolean) {
    resolveRef.current?.(valid);
  }

  async function verify2FA() {
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;

      setOpen(true);
    });
  }

  return (
    <TwoFAContext.Provider value={{ verify2FA }}>
      {children}

      <Verify open={open} setOpen={setOpen} onVerified={handleVerified} />
    </TwoFAContext.Provider>
  );
};

type Options = {
  redirect?: boolean;
  onVerified: (ok: boolean) => void;
};

export const use2FA = (option: Options) => {
  const { verify2FA } = useContext(TwoFAContext);
  const { logoutAsync } = useLogout();

  async function withOptions() {
    const ok = await verify2FA();

    if (!ok) {
      await logoutAsync(option.redirect);
    } else {
      option.onVerified(ok);
    }
  }
  return { verify2FA: withOptions };
};
