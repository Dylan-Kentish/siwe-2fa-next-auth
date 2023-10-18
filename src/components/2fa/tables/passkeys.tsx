import { Remove } from '@/components/2fa/passkeys/remove';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPasskeys } from '@/server/passkey';

export const PassKeysTable: React.FC = async () => {
  const passkeys = await getPasskeys();

  return (
    <Table>
      <TableCaption>
        {passkeys.length > 0 ? 'A list of your registered PassKeys.' : 'No PassKeys registered.'}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {passkeys.map(passkey => (
          <TableRow key={passkey.id}>
            <TableCell>TODO: add name</TableCell>
            <TableCell>{passkey.credentialDeviceType}</TableCell>
            <TableCell>
              {passkey.updatedAt.toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })}
            </TableCell>
            <TableCell>
              <Remove id={passkey.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
