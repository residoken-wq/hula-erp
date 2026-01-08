'use client';

import { ConfigProvider, App } from 'antd';
import viVN from 'antd/locale/vi_VN';
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>
                <ConfigProvider
                    locale={viVN}
                    theme={{
                        token: {
                            colorPrimary: '#2563eb',
                            borderRadius: 8,
                        },
                    }}
                >
                    <App>
                        {children}
                    </App>
                </ConfigProvider>
            </body>
        </html>
    );
}
