import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "ar", "tr", "ku"],
  defaultLocale: "en",
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};
