import type { Metadata } from 'next';
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

// Heading font - Baloo 2: Friendly and playful (for kids/education)
const headingFont = Baloo_2({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-heading',
    display: 'swap',
});

// Body font - Be Vietnam Pro: Modern and highly readable
const bodyFont = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-body',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Nệm Mầm Non HULA - Giấc Ngủ Ngon Cho Bé Yêu',
    description: 'Nệm mầm non HULA chất lượng cao, an toàn cho sức khỏe bé. Nguyên liệu tự nhiên, thiết kế chống khuẩn, bảo hành 12 tháng.',
    keywords: ['nệm mầm non', 'nệm trẻ em', 'HULA', 'nệm cao cấp', 'nệm an toàn'],
    openGraph: {
        title: 'Nệm Mầm Non HULA',
        description: 'Giấc ngủ ngon cho bé yêu',
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
        <html lang="vi" className={`${headingFont.variable} ${bodyFont.variable}`}>
            <body className="min-h-screen flex flex-col font-body antialiased">
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </html>
    );
}
