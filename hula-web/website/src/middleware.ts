import { NextResponse, NextRequest } from 'next/server';

// Cache the site mode to avoid excessive API calls
let cachedMode: string | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds (reduced from 5 minutes for faster mode switching)

async function getSiteMode(forceRefresh: boolean = false): Promise<string> {
    const now = Date.now();

    // Return cached value if still valid and not forcing refresh
    if (!forceRefresh && cachedMode && (now - cacheTime) < CACHE_DURATION) {
        console.log('[Middleware] Using cached mode:', cachedMode);
        return cachedMode;
    }

    try {
        // In Docker: API_URL should be http://hula_app:3000
        // If not set, default to 'live' mode (safer than failing)
        const apiUrl = process.env.API_URL;
        if (!apiUrl) {
            console.log('[Middleware] API_URL not configured, defaulting to live mode');
            return 'live';
        }

        console.log('[Middleware] Fetching site mode from:', `${apiUrl}/api/system/config/SITE_MODE`);

        // Backend uses global prefix /api
        const res = await fetch(`${apiUrl}/api/system/config/SITE_MODE`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        if (!res.ok) {
            console.error('[Middleware] Failed to fetch site mode:', res.status, res.statusText);
            // If config doesn't exist yet (404), default to live
            if (res.status === 404) {
                cachedMode = 'live';
                cacheTime = now;
                return 'live';
            }
            return cachedMode || 'live'; // Use cached value or default to live on error
        }

        const data = await res.json();
        console.log('[Middleware] API response:', JSON.stringify(data));

        const mode: string = data.value || 'live';
        cachedMode = mode;
        cacheTime = now;
        console.log('[Middleware] Site mode set to:', mode);
        return mode;
    } catch (error) {
        console.error('[Middleware] Failed to fetch site mode:', error);
        return cachedMode || 'live'; // Use cached value or default to live on error
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for special pages, static assets, and API routes
    if (
        pathname.startsWith('/coming-soon') ||
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Static files like .ico, .png, .css, .js
    ) {
        return NextResponse.next();
    }

    // beta.nemmamnon.com always shows full website (bypass SITE_MODE)
    const host = request.headers.get('host') || '';
    if (host.startsWith('beta.')) {
        return NextResponse.next();
    }

    // Check for force refresh query param (used after changing mode in CMS)
    const forceRefresh = request.nextUrl.searchParams.has('refresh_mode');

    const mode = await getSiteMode(forceRefresh);

    // Redirect based on site mode
    if (mode === 'coming-soon') {
        return NextResponse.redirect(new URL('/coming-soon', request.url));
    }

    if (mode === 'maintenance') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // Mode is 'live' - allow normal access
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
