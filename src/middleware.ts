import { withAuth } from "next-auth/middleware";

// Protects the authenticated app shell. Unauthenticated visitors are
// redirected to /login with a callbackUrl back to where they were headed.
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/assessment/:path*",
    "/profile/:path*",
    "/matches/:path*",
    "/careers/:slug/plan",
    "/side-income/:path*",
    "/assistant/:path*",
    "/portfolio/:path*",
  ],
};
