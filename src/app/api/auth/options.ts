import 'server-only';

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { AuthenticationResponseJSON } from '@simplewebauthn/server/script/deps';
import {
  type NextAuthOptions,
  getServerSession as getServerSessionInternal,
  Session,
  RequestInternal,
} from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getCsrfToken } from 'next-auth/react';
import { authenticator } from 'otplib';
import { SiweMessage } from 'siwe';

import { env } from '@/env.mjs';
import { fromBase64, toBase64 } from '@/lib/convert';
import { prisma } from '@/server/db';

export const rpName = 'SIWE + WEBAUTHN + NEXT-AUTH';
export const rpID = env.NEXT_PUBLIC_VERCEL_URL || 'localhost';
export const domain = env.NODE_ENV === 'production' ? rpID : `${rpID}:3000`;
export const origin = env.NODE_ENV === 'production' ? `https://${rpID}` : `http://${rpID}`;
export const expectedOrigin = env.NODE_ENV === 'production' ? origin : `${origin}:3000`;

async function webauthnVerification(
  session: Session,
  request: Pick<RequestInternal, 'body' | 'query' | 'headers' | 'method'>
) {
  const userId = session.user.id;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      currentChallenge: true,
      passKeys: {
        select: {
          id: true,
          credentialID: true,
          credentialPublicKey: true,
          counter: true,
        },
      },
    },
  });

  if (!user || !user.currentChallenge || !user.passKeys.length) {
    return null;
  }

  const expectedChallenge = user.currentChallenge;

  const authenticationResponse = JSON.parse(
    request.body?.verification
  ) as AuthenticationResponseJSON;

  const passKey = user.passKeys.find(
    passKey => toBase64(passKey.credentialID) === authenticationResponse.id
  );

  if (!passKey) {
    throw new Error(`Could not find passKey ${authenticationResponse.id} for user ${user.id}`);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: new Uint8Array(passKey.credentialID),
        credentialPublicKey: new Uint8Array(passKey.credentialPublicKey),
        counter: passKey.counter,
      },
    });
  } catch (error) {
    console.error(error);
    return null;
  }

  if (!verification.verified) {
    return null;
  }

  // await prisma.passKey.update({
  //   where: {
  //     id: passKey.
  //   },
  //   data: {
  //     counter: verification.authenticationResponse...newCounter,
  //   },
  // });

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      currentChallenge: null,
    },
  });

  return {
    id: user.id,
    role: user.role,
    is2FAEnabled: true,
    is2FAVerified: verification.verified,
  };
}

async function webauthnAuthentication(
  request: Pick<RequestInternal, 'body' | 'query' | 'headers' | 'method'>
) {
  const authenticationResponse = JSON.parse(
    request.body?.verification
  ) as AuthenticationResponseJSON;

  const challenge = request.body?.challenge;

  const passKey = await prisma.passKey.findUnique({
    where: {
      userId: authenticationResponse.response.userHandle,
      credentialID: fromBase64(authenticationResponse.id) as Buffer,
    },
    select: {
      credentialID: true,
      credentialPublicKey: true,
      counter: true,
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!passKey) {
    return null;
  }

  const verification = await verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge: challenge,
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: new Uint8Array(passKey.credentialID),
      credentialPublicKey: new Uint8Array(passKey.credentialPublicKey),
      counter: passKey.counter,
    },
  });

  if (!verification.verified) {
    return null;
  }

  return {
    id: passKey.user.id,
    role: passKey.user.role,
    is2FAEnabled: true,
    is2FAVerified: true,
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      id: 'siwe',
      name: 'SIWE',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0',
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0',
        },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials) throw new Error('No credentials');

          const siwe = new SiweMessage(JSON.parse(credentials.message));
          const nonce = await getCsrfToken({ req: { headers: req.headers } });

          const result = await siwe.verify({
            signature: credentials.signature,
            domain,
            nonce,
          });

          if (result.success) {
            const user = await prisma.user.upsert({
              where: {
                id: siwe.address,
              },
              update: {},
              create: {
                id: siwe.address,
              },
              select: {
                id: true,
                role: true,
                _count: {
                  select: {
                    totp: {
                      where: {
                        verified: true,
                      },
                    },
                    passKeys: true,
                  },
                },
              },
            });

            return {
              id: user.id,
              role: user.role,
              is2FAEnabled: user._count.totp > 0 || user._count.passKeys > 0,
            };
          } else {
            return null;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      },
    }),
    Credentials({
      id: 'webauthn',
      name: 'WebAuthn',
      credentials: {},
      async authorize(_, request) {
        const session = await getServerSession();

        if (session) {
          return webauthnVerification(session, request);
        } else {
          return webauthnAuthentication(request);
        }
      },
    }),
    Credentials({
      id: 'totp',
      name: 'totp',
      credentials: {
        id: {
          label: 'ID',
          type: 'text',
          placeholder: '123456',
        },
        code: {
          label: 'Code',
          type: 'text',
          placeholder: '123456',
        },
      },
      async authorize(credentials) {
        if (!credentials) throw new Error('No credentials');

        const session = await getServerSession();

        if (!session) {
          return null;
        }
        const userId = session.user.id;

        if (!userId) return null;

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            role: true,
            currentChallenge: true,
            totp: {
              select: {
                id: true,
                secret: true,
              },
              where: {
                verified: true,
              },
            },
          },
        });

        if (!user || !user.totp.length) {
          return null;
        }

        const totp = user.totp.find(totp => totp.id === credentials.id);

        if (!totp) {
          throw new Error(`Could not find Verification Code ${credentials.id} for user ${user.id}`);
        }

        const valid = authenticator.check(credentials.code, totp.secret);

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          role: user.role,
          is2FAEnabled: true,
          is2FAVerified: valid,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.is2FAEnabled = user.is2FAEnabled;
        token.is2FAVerified = user.is2FAVerified;
      }

      // TODO: update user between sessions
      // monitor for role changes, etc

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.iat = token.iat;
      session.exp = token.exp;

      session.user.is2FAEnabled = token.is2FAEnabled;
      session.is2FAVerified = token.is2FAVerified as boolean;
      return session;
    },
  },
  pages: {
    signIn: '/siwe',
  },
};

export async function getServerSession() {
  const session = await getServerSessionInternal(authOptions);

  return session;
}
