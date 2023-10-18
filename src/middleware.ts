import { JWT } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';

const protectedRoutes: Record<string, (token: JWT | null) => boolean> = {
  '/admin': token => token?.role === 'ADMIN',
  '/me': token => !!token,
};

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const { pathname } = req.nextUrl;

      if (token?.is2FAEnabled && !token?.is2FAVerified) {
        return false;
      }

      for (const route in protectedRoutes) {
        if (pathname.startsWith(route)) {
          return protectedRoutes[route]?.(token) || false;
        }
      }

      // Default behavior for other routes
      return true;
    },
  },
});

// match all routes except those starting with /api and /siwe
export const config = { matcher: ['/((?!api|siwe).*)'] };
