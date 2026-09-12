import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Single user auth.
 *
 * GitHub rather than email, because the app already talks to GitHub and one
 * identity is better than two. The allowlist is one login. There is no signup,
 * no password reset and no user table.
 */

const ALLOWED = (process.env.GD_ALLOWED_LOGIN ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ profile }) {
      const login = String(profile?.login ?? "").toLowerCase();
      if (!ALLOWED.length) return false;       // fail closed. no allowlist, no entry
      return ALLOWED.includes(login);
    },
    async jwt({ token, profile }) {
      if (profile?.login) token.login = profile.login;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { login?: string }).login = token.login as string;
      return session;
    }
  }
});
