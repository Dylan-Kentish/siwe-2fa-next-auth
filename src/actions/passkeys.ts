'use server';

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { type RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { revalidatePath } from 'next/cache';

import { getServerSession, webauthnSettings, rpName } from '@/app/api/auth/options';
import { prisma } from '@/server/db';

export async function hasPasskey() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const passKeys = await prisma.passKey.count({
    where: {
      userId: session.user.id,
    },
  });

  return passKeys > 0;
}

export async function create() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const userPassKeys = await prisma.passKey.findMany({
    where: {
      userId: session.user.id,
    },
  });

  const { rpID } = webauthnSettings();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: session.user.id,
    userName: session.user.id,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: userPassKeys.map(passKey => ({
      id: passKey.credentialID,
      type: 'public-key',
    })),
    authenticatorSelection: {
      // "Discoverable credentials" used to be called "resident keys". The
      // old name persists in the options passed to `navigator.credentials.create()`.
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Remember the challenge for this user
  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      currentChallenge: options.challenge,
    },
  });

  return options;
}

export async function register(response: RegistrationResponseJSON) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      currentChallenge: true,
    },
  });

  if (!user) {
    throw new Error('Unauthorized');
  }

  const expectedChallenge = user.currentChallenge;

  if (!expectedChallenge) {
    throw new Error('Unauthorized');
  }

  const { rpID, expectedOrigin } = webauthnSettings();

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification) {
    throw new Error('Unauthorized');
  }

  const { registrationInfo } = verification;
  const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } =
    registrationInfo || {};

  if (!credentialID || !credentialPublicKey) {
    throw new Error('Unauthorized');
  }

  const passKey = await prisma.passKey.create({
    data: {
      name: 'Default',
      credentialID: Buffer.from(credentialID),
      credentialPublicKey: Buffer.from(credentialPublicKey),
      counter: counter ?? 0,
      credentialBackedUp: credentialBackedUp ?? false,
      credentialDeviceType: credentialDeviceType ?? 'singleDevice',
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  revalidatePath('/me');

  return passKey.id;
}

export async function prepareVerify() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const existingPassKeys = await prisma.passKey.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      credentialID: true,
    },
  });

  if (!existingPassKeys?.length) {
    throw new Error('Unauthorized');
  }

  const { rpID } = webauthnSettings();

  const options = await generateAuthenticationOptions({
    allowCredentials: existingPassKeys.map(existingPassKey => ({
      id: new Uint8Array(existingPassKey.credentialID),
      type: 'public-key',
    })),
    // Set to `'discouraged'` when asserting as part of a 2FA flow
    userVerification: 'discouraged',
    rpID,
  });

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      currentChallenge: options.challenge,
    },
  });

  return options;
}

export async function prepareAuth() {
  const { rpID } = webauthnSettings();

  const options = await generateAuthenticationOptions({
    userVerification: 'required',
    rpID,
  });

  return options;
}

export async function rename(id: string, name: string) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  await prisma.passKey.update({
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

  await prisma.passKey.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidatePath('/me');

  return true;
}
