import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import { getSettings, getHomeConfig } from '@/lib/api';

// Be Vietnam Pro: Modern, clean, native Vietnamese support
const mainFont = Be_Vietnam_Pro({
    subsets: ['latin', 'latin-ext', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-main',
    display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
    let settings: any = null;
    let homeConfig: any = null;
    try {
        [settings, homeConfig] = await Promise.all([
            getSettings(),
            getHomeConfig(),
        ]);
    } catch { /* fallback to defaults */ }

    const faviconUrl = settings?.favicon_url;
    let iconUrl = '/favicon.ico';

    if (faviconUrl && typeof faviconUrl === 'string') {
        if (faviconUrl.startsWith('/uploads/')) {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
            const base = API_URL.endsWith('/api') ? API_URL.replace(/\/api$/, '') : API_URL;
            iconUrl = `${base}/api/upload/files/${faviconUrl.replace('/uploads/', '')}`;
        } else {
            iconUrl = faviconUrl;
        }
    }

    // Resolve OG image: settings.og_image > hero_image > favicon
    let ogImageUrl = iconUrl;
    
    // Safely extract image URL if it's an object (e.g. hero_images element)
    const extractUrl = (img: any): string | null => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        if (img.url && typeof img.url === 'string') return img.url;
        return null;
    };

    const rawOgImage = extractUrl(settings?.og_image)
        || extractUrl(homeConfig?.hero_images?.[0])
        || extractUrl(homeConfig?.hero_image)
        || null;

    if (rawOgImage && typeof rawOgImage === 'string') {
        if (rawOgImage.startsWith('/uploads/')) {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
            const base = API_URL.endsWith('/api') ? API_URL.replace(/\/api$/, '') : API_URL;
            ogImageUrl = `${base}/api/upload/files/${rawOgImage.replace('/uploads/', '')}`;
        } else if (rawOgImage.startsWith('http')) {
            ogImageUrl = rawOgImage;
        }
    }

    const siteName = settings?.site_name || 'HULA - Giải Pháp Nệm Trường Học Toàn Diện';
    const siteDescription = settings?.site_description || 'HULA - Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện. Thiết kế nhận diện, sản xuất khép kín, giao hàng toàn quốc.';

    return {
        title: siteName,
        description: siteDescription,
        keywords: ['nệm trường học', 'nệm mầm non', 'HULA', 'nệm học đường', 'giấc ngủ học đường', 'nệm gối chăn trường học'],
        icons: {
            icon: iconUrl,
            apple: iconUrl,
        },
        metadataBase: new URL('https://nemmamnon.com'),
        openGraph: {
            title: siteName,
            description: siteDescription,
            type: 'website',
            locale: 'vi_VN',
            url: 'https://nemmamnon.com',
            siteName: siteName,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: siteName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: siteName,
            description: siteDescription,
            images: [ogImageUrl],
        },
    };
}

import AnalyticsTracker from '@/components/AnalyticsTracker';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={mainFont.variable}>
            <head>
                {/* Google Analytics */}
                <Script src="https://www.googletagmanager.com/gtag/js?id=G-RZ5Q0E2CEV" strategy="afterInteractive" />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-RZ5Q0E2CEV');
                    `}
                </Script>
                <meta name="p:domain_verify" content="9af76ab5f1321904b5e026363318faa3" />
            </head>
            <body className="min-h-screen flex flex-col font-sans antialiased">
                <AnalyticsTracker />
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
                {/* Zalo OA Widget */}
                <div className="zalo-chat-widget" data-oaid="1367466153235995806" data-welcome-message="Rất vui khi được hỗ trợ bạn!" data-autopopup="0" data-width="" data-height=""></div>
                <Script src="https://sp.zalo.me/plugins/sdk.js" strategy="lazyOnload" />
            </body>
        </html>
    );
}
