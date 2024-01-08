import React from 'react';

import { getServerSession } from '@/app/api/auth/options';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function secondsSinceEpochToDate(secondsSinceEpoch: number) {
  return new Date(secondsSinceEpoch * 1000);
}

export const Info: React.FC = async () => {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return (
    <Card className="mb-auto w-1/2">
      <CardHeader>
        <CardTitle>Session Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Session:</p>
        <p className="truncate">
          Issued At: {secondsSinceEpochToDate(session.iat).toLocaleString()}
        </p>
        <p className="truncate">
          Expires At: {secondsSinceEpochToDate(session.exp).toLocaleString()}
        </p>
        <p>
          2FA Verified: <strong>{session.is2FAVerified ? 'TRUE' : 'FALSE'}</strong>
        </p>
      </CardContent>
      <CardContent>
        <p>User:</p>
        <p className="truncate">ID: {session.user.id}</p>
        <p>
          Role: <strong>{session.user.role}</strong>
        </p>
        <p>Chain: {session.user.chainId}</p>
        <p>
          2FA Enabled: <strong>{session.user.is2FAEnabled ? 'TRUE' : 'FALSE'}</strong>
        </p>
      </CardContent>
    </Card>
  );
};
