import { PropsWithChildren } from 'react';

import { TwoFAProvider } from './2fa';
import { SessionProvider } from './session';
import { WagmiProvider } from './wagmi';

export const Providers: React.FC<PropsWithChildren> = ({ children }) => (
  <SessionProvider>
    <WagmiProvider>
      <TwoFAProvider>{children}</TwoFAProvider>
    </WagmiProvider>
  </SessionProvider>
);
