'use client';

import { Verify as VerifyPasskey } from '@/components/2fa/passkeys/verify';
import { Verify as VerifyTOTP } from '@/components/2fa/totp/verify';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onVerified: (valid: boolean) => void;
};

export const Verify: React.FC<Props> = ({ open, setOpen, onVerified }) => {
  async function handleSubmit(ok: boolean) {
    setOpen(false);
    onVerified(ok);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>2FA Verification</AlertDialogTitle>
          <AlertDialogDescription>Please choose a verification method.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <VerifyTOTP className="w-1/2" onVerified={handleSubmit} />
          <VerifyPasskey className="w-1/2" onVerified={handleSubmit} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
