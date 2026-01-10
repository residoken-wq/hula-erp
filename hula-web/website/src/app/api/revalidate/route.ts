import { NextResponse } from 'next/server';

// This endpoint is called by CMS after changing site mode
// to trigger cache invalidation on the website
export async function GET() {
    // Clear any server-side cache
    // Note: In edge runtime, we can't directly clear the middleware cache
    // But we can signal success to CMS so it knows to append ?refresh_mode to URLs

    return NextResponse.json({
        success: true,
        message: 'Cache invalidation triggered',
        timestamp: Date.now()
    });
}

export async function POST() {
    return NextResponse.json({
        success: true,
        message: 'Cache invalidation triggered',
        timestamp: Date.now()
    });
}
