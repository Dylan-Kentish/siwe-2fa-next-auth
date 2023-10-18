'use server';

import { revalidatePath } from 'next/cache';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

import { getServerSession } from '@/app/api/auth/options';
import { prisma } from '@/server/db';

const SERVICE_NAME = 'SIWE & 2FA - NEXT AUTH EXAMPLE';

export async function list() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const totps = await prisma.tOTP.findMany({
    where: {
      userId: session.user.id,
      verified: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return totps;
}

export async function create() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const authenticatorSecret = authenticator.generateSecret();

  await prisma.tOTP.deleteMany({
    where: {
      userId: session.user.id,
      verified: false,
    },
  });

  const totp = await prisma.tOTP.create({
    data: {
      name: 'Default',
      userId: session.user.id,
      secret: authenticatorSecret,
    },
    select: {
      id: true,
    },
  });

  const otpauth = authenticator.keyuri(session.user.id, SERVICE_NAME, authenticatorSecret);

  const imageUrl = await qrcode.toDataURL(otpauth);

  revalidatePath('/me');

  return {
    id: totp.id,
    imageUrl,
  };
}

export async function register(id: string, token: string) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const totp = await prisma.tOTP.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      secret: true,
    },
  });

  if (!totp) {
    throw new Error('Unauthorized');
  }

  const valid = authenticator.check(token, totp?.secret);

  if (!valid) {
    return false;
  }

  await prisma.tOTP.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      verified: true,
    },
  });

  revalidatePath('/me');

  return true;
}

export async function rename(id: string, name: string) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const totp = await prisma.tOTP.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!totp) {
    throw new Error('Unauthorized');
  }

  await prisma.tOTP.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      name,
    },
  });

  revalidatePath('/me');

  return true;
}

export async function remove(id: string) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  await prisma.tOTP.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidatePath('/me');

  return true;
}
