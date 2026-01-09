import { NextResponse, NextRequest } from 'next/server';

// Cache the site mode to avoid excessive API calls
let cachedMode: string | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function getSiteMode(): Promise<string> {
    const now = Date.now();

    // Return cached value if still valid
    if (cachedMode && (now - cacheTime) < CACHE_DURATION) {
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

        const res = await fetch(`${apiUrl}/system/config/SITE_MODE`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('Failed to fetch site mode:', res.status);
            return 'live'; // Default to live on error
        }

        const data = await res.json();
        const mode: string = data.value || 'live';
        cachedMode = mode;
        cacheTime = now;
        return mode;
    } catch (error) {
        console.error('Failed to fetch site mode:', error);
        return 'live'; // Default to live on error
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

    const mode = await getSiteMode();

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
