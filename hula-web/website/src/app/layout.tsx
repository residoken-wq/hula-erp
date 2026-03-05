import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

// Be Vietnam Pro: Modern, clean, native Vietnamese support
const mainFont = Be_Vietnam_Pro({
    subsets: ['latin', 'latin-ext', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-main',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'HULA - Giải Pháp Nệm Trường Học Toàn Diện',
    description: 'HULA - Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện. Thiết kế nhận diện, sản xuất khép kín, giao hàng toàn quốc.',
    keywords: ['nệm trường học', 'nệm mầm non', 'HULA', 'nệm học đường', 'giấc ngủ học đường', 'nệm gối chăn trường học'],
    openGraph: {
        title: 'HULA - Giải Pháp Nệm Trường Học Toàn Diện',
        description: 'Hơn 10 năm đồng hành cùng giấc ngủ học đường',
        type: 'website',
        locale: 'vi_VN',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={mainFont.variable}>
            <body className="min-h-screen flex flex-col font-sans antialiased">
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </html>
    );
}
