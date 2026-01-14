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
                            colorPrimary: '#667eea',
                            colorSuccess: '#10b981',
                            colorWarning: '#f59e0b',
                            colorError: '#ef4444',
                            colorInfo: '#3b82f6',
                            borderRadius: 10,
                            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            controlHeight: 40,
                        },
                        components: {
                            Button: {
                                borderRadius: 10,
                                controlHeight: 40,
                                fontWeight: 500,
                            },
                            Card: {
                                borderRadiusLG: 16,
                            },
                            Input: {
                                borderRadius: 10,
                                controlHeight: 42,
                            },
                            Select: {
                                borderRadius: 10,
                                controlHeight: 42,
                            },
                            Modal: {
                                borderRadiusLG: 16,
                            },
                            Table: {
                                borderRadius: 12,
                            },
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

