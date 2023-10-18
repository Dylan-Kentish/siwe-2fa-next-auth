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
          <TableHead className="text-center">Device</TableHead>
          <TableHead className="text-center">Updated</TableHead>
          <TableHead className="w-0 px-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {passkeys.map(passkey => (
          <TableRow key={passkey.id}>
            <TableCell>{passkey.name}</TableCell>
            <TableCell className="text-center">{passkey.credentialDeviceType}</TableCell>
            <TableCell className="text-center">
              {passkey.updatedAt.toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })}
            </TableCell>
            <TableCell className="text-end">
              <Remove id={passkey.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
