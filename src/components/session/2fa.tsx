import React from 'react';

import { Register as RegisterPasskey } from '@/components/2fa/passkeys/register';
import { PassKeysTable } from '@/components/2fa/tables/passkeys';
import { VerificationCodesTable } from '@/components/2fa/tables/totp';
import { Register as RegisterTOTP } from '@/components/2fa/totp/register';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TwoFA: React.FC = () => {
  return (
    <Card className="w-1/2">
      <CardHeader>
        <div className="flex grow justify-between">
          <CardTitle>2FA Methods</CardTitle>

          <span className="flex gap-2">
            <RegisterPasskey />
            <RegisterTOTP />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <PassKeysTable />
      </CardContent>
      <CardContent>
        <VerificationCodesTable />
      </CardContent>
    </Card>
  );
};
