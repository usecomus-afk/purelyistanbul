import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Host Redirect Middleware
 * Redirects purelyistanbul.uk, purelyistanbul.co.uk, purelyistanbul.co and any non-canonical domains
 * directly to https://purelyistanbul.com while preserving query parameters and pathnames.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Normalize host (remove port if local/dev)
  const cleanHost = host.split(':')[0].toLowerCase();

  // Alternative domains that should permanently redirect to purelyistanbul.com
  const redirectDomains = [
    'purelyistanbul.uk',
    'www.purelyistanbul.uk',
    'purelyistanbul.co.uk',
    'www.purelyistanbul.co.uk',
    'purelyistanbul.co',
    'www.purelyistanbul.co',
    'www.purelyistanbul.com',
  ];

  if (redirectDomains.includes(cleanHost)) {
    const targetUrl = new URL(`https://purelyistanbul.com${pathname}${search}`);
    return NextResponse.redirect(targetUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
