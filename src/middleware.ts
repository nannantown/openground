import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Optionally enable locale detection based on user preferences
  localeDetection: true
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match the root path
    '/',
    // Match all paths except API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};