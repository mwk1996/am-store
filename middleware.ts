import createMiddleware from "next-intl/middleware";

// Public routes (no auth gating in middleware — auth checks are per-route in API handlers)
// All [locale]/* pages are publicly accessible by default.
// verify-email, forgot-password, reset-password pages are intentionally public (D-03).

export default createMiddleware({
  locales: ["en", "ar", "tr", "ku"],
  defaultLocale: "en",
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
