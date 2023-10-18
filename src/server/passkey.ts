import { getServerSession } from '@/app/api/auth/options';

import { prisma } from './db';

export async function getPasskeys() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return await prisma.passKey.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      credentialDeviceType: true,
      updatedAt: true,
    },
  });
}
