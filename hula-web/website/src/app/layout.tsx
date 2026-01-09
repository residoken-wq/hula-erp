import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

// Heading font - Montserrat: Strong and distinctive
const montserrat = Montserrat({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-heading',
    display: 'swap',
});

// Body font - Open Sans: Clean and easy to read
const openSans = Open_Sans({
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
        <html lang="vi" className={`${montserrat.variable} ${openSans.variable}`}>
            <body className="min-h-screen flex flex-col font-body antialiased">
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </html>
    );
}
