import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi dasar NextAuth yang edge-safe (tidak mengandung bcrypt atau Prisma).
 * File ini dipakai oleh middleware.ts (yang jalan di Edge Runtime), sedangkan
 * provider Credentials yang butuh database ada di lib/auth.ts (Node.js runtime).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
