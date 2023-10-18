'use client';

import { useEffect, useState } from 'react';

import { hasPasskey } from '@/actions/passkeys';
import { Button } from '@/components/ui/button';
import { usePassKey } from '@/hooks/use-passkey';

type Props = {
  className?: string;
  onVerified: (valid: boolean) => void;
};

export const Verify: React.FC<Props> = ({ className, onVerified }) => {
  const [hasPassKey, setHasPassKey] = useState(false);

  const { verifyAsync } = usePassKey();

  function handlePasskey() {
    verifyAsync().then(onVerified);
  }

  useEffect(() => {
    hasPasskey().then(setHasPassKey);
  }, []);

  return (
    <Button type="button" className={className} disabled={!hasPassKey} onClick={handlePasskey}>
      PassKey
    </Button>
  );
};
