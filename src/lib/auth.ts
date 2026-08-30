import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Credentials-based auth via NextAuth: NextAuth owns session cookie
 * security, CSRF protection, and token handling (docs/PRODUCT_STRATEGY.md
 * §11, §13 — "a managed provider... not a place to save engineering
 * time"), while password hashing/verification is ours, scoped to a single
 * well-reviewed path below.
 *
 * JWT session strategy is used (no `Session`/`Account` tables) since the
 * only provider is credentials — there is no OAuth token exchange to
 * persist server-side.
 */
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();

        // Phase 5, Module 6: keyed on the submitted email, not IP — this
        // is what actually stops someone brute-forcing one known
        // account's password, which is the real threat model for login
        // (as opposed to registration's broad signup-abuse concern).
        // Rate-limited attempts fail the exact same way as a wrong
        // password (return null) so this never becomes a distinct,
        // enumerable signal.
        if (isRateLimited(`login:${email}`, 10, 15 * 60 * 1000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Convenience only — for UI display (e.g. showing an admin nav
        // link). Never the basis for authorizing an admin action: every
        // admin route re-checks role against the database via
        // requireAdmin() (src/lib/session.ts), since a role revoked after
        // sign-in wouldn't be reflected here until the token refreshes.
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
};
