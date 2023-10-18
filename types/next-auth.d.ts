import { Role } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    is2FAEnabled: boolean;
    is2FAVerified?: boolean;
  }

  interface Session {
    user: User;
    iat: number;
    exp: number;
    is2FAVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    is2FAEnabled: boolean;
    is2FAVerified?: boolean;
    iat: number;
    exp: number;
  }
}
