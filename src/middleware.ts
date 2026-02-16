import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The "Sovereign Handoff" Protocol (State M4)
// Enforces Data Residency immediately upon conversion.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to the "Sign Up" / Handoff route
  if (pathname === '/signup' || pathname === '/analyze') {
    // Get the country code from Vercel Edge headers
    // Vercel populates 'x-vercel-ip-country'
    const country = request.headers.get('x-vercel-ip-country') || 'US';

    // Route to the appropriate Sovereign Cell
    if (country === 'CA') {
      return NextResponse.redirect(new URL('https://auth.bidmaster.ca/signup', request.url));
    } else if (country === 'US') {
      return NextResponse.redirect(new URL('https://auth.bidmaster.us/signup', request.url));
    } else {
      // Default fallback (e.g., US or International landing page)
      // For strict compliance, we default to US (CUI/ITAR baseline) or block.
      // EDD says: "Fail State: If the region cannot be determined, default to the stricter standard (or block access if strictly Sovereign)."
      // We'll default to US for now as the "Defensive" baseline.
      return NextResponse.redirect(new URL('https://auth.bidmaster.us/signup', request.url));
    }
  }

  return NextResponse.next();
}

// Configure matcher to run only on relevant paths for performance
export const config = {
  matcher: ['/signup', '/analyze'],
};
