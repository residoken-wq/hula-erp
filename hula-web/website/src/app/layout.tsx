import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import { getSettings } from '@/lib/api';

// Be Vietnam Pro: Modern, clean, native Vietnamese support
const mainFont = Be_Vietnam_Pro({
    subsets: ['latin', 'latin-ext', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-main',
    display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    const faviconUrl = settings?.favicon_url;
    let iconUrl = '/favicon.ico';
    
    if (faviconUrl) {
        if (faviconUrl.startsWith('/uploads/')) {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
            const base = API_URL.endsWith('/api') ? API_URL.replace(/\/api$/, '') : API_URL;
            iconUrl = `${base}/api/upload/files/${faviconUrl.replace('/uploads/', '')}`;
        } else {
            iconUrl = faviconUrl;
        }
    }

    return {
        title: settings?.site_name || 'HULA - Giải Pháp Nệm Trường Học Toàn Diện',
        description: settings?.site_description || 'HULA - Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện. Thiết kế nhận diện, sản xuất khép kín, giao hàng toàn quốc.',
        keywords: ['nệm trường học', 'nệm mầm non', 'HULA', 'nệm học đường', 'giấc ngủ học đường', 'nệm gối chăn trường học'],
        icons: {
            icon: iconUrl,
            apple: iconUrl,
        },
        openGraph: {
            title: settings?.site_name || 'HULA - Giải Pháp Nệm Trường Học Toàn Diện',
            description: settings?.site_description || 'Hơn 10 năm đồng hành cùng giấc ngủ học đường',
            type: 'website',
            locale: 'vi_VN',
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
            <body className="min-h-screen flex flex-col font-sans antialiased">
                <AnalyticsTracker />
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </html>
    );
}
