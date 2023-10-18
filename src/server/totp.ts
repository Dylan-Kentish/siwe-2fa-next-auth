import { getServerSession } from '@/app/api/auth/options';

import { prisma } from './db';

export async function getVerificationCodes() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return await prisma.tOTP.findMany({
    where: {
      userId: session.user.id,
      verified: true,
    },
    select: {
      id: true,
      name: true,
      verified: true,
      updatedAt: true,
    },
  });
}
