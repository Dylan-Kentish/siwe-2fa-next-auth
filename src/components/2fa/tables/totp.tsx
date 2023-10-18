import { Remove } from '@/components/2fa/totp/remove';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getVerificationCodes } from '@/server/totp';

export const VerificationCodesTable: React.FC = async () => {
  const verificationCodes = await getVerificationCodes();

  return (
    <Table>
      <TableCaption>
        {verificationCodes.length > 0
          ? 'A list of your registered Authenticator Apps.'
          : 'No Authenticator Apps registered.'}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-center">Verified</TableHead>
          <TableHead className="text-center">Updated</TableHead>
          <TableHead className="w-0 px-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {verificationCodes.map(verificationCode => (
          <TableRow key={verificationCode.id}>
            <TableCell>{verificationCode.name}</TableCell>
            <TableCell className="text-center">
              {verificationCode.verified ? 'Yes' : 'No'}
            </TableCell>
            <TableCell className="text-center">
              {verificationCode.updatedAt.toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })}
            </TableCell>
            <TableCell className="text-end">
              <Remove id={verificationCode.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
