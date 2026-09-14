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
    /**
     * The gate on every route the middleware matcher covers.
     *
     * Without this, `export { auth as middleware }` does not block anything.
     * It only attaches session info to the request, and every page stays
     * reachable signed out. Auth.js v5 needs this callback for the
     * middleware to actually refuse. It fails closed.
     */
    authorized({ auth: session, request }) {
      if (request.nextUrl.pathname.startsWith("/signin")) return true;
      return Boolean(session?.user);
    },
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
