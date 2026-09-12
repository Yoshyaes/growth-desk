export { auth as middleware } from "@/auth";

export const config = {
  // everything except the sign in page, the auth endpoints and static assets
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"]
};
