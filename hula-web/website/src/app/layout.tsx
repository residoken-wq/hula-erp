import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

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
        <html lang="vi">
            <body className="min-h-screen flex flex-col">
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </html>
    );
}

