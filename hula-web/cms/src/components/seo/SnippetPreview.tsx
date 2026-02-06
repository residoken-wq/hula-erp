import React, { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { MobileOutlined, DesktopOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

interface SnippetPreviewProps {
    title: string;
    description: string;
    slug: string;
    date?: string;
}

export const SnippetPreview: React.FC<SnippetPreviewProps> = ({ title, description, slug, date }) => {
    const [mode, setMode] = useState<'mobile' | 'desktop'>('mobile');

    const domain = 'nemmamnon.com';
    const cleanSlug = slug?.replace(/^\/+/, '') || 'bai-viet-moi';
    const fullUrl = `https://${domain}/tin-tuc/${cleanSlug}`;

    // Truncate logic
    const displayTitle = title?.length > 60 ? title.substring(0, 57) + '...' : (title || 'Tiêu đề bài viết chưa có');
    const displayDesc = description?.length > 160 ? description.substring(0, 157) + '...' : (description || 'Mô tả bài viết chưa có. Vui lòng nhập meta description để tối ưu SEO.');

    const PreviewCard = ({ isMobile }: { isMobile: boolean }) => (
        <div style={{
            fontFamily: 'arial, sans-serif',
            maxWidth: isMobile ? 375 : 600,
            background: '#fff',
            padding: 12,
            border: isMobile ? '1px solid #ddd' : 'none',
            borderRadius: isMobile ? 8 : 0,
            margin: '0 auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#f1f3f4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: 12
                }}>
                    <img src="/logo.png" alt="Icon" style={{ width: 16, height: 16, objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, color: '#202124', lineHeight: '1.3' }}>{domain}</span>
                    <span style={{ fontSize: 12, color: '#5f6368', lineHeight: '1.3' }}>{fullUrl}</span>
                </div>
            </div>

            <a href="#" onClick={(e) => e.preventDefault()} style={{ textDecoration: 'none' }}>
                <h3 style={{
                    fontSize: 20,
                    color: '#1a0dab',
                    margin: '4px 0',
                    fontWeight: 400,
                    lineHeight: '1.3',
                    cursor: 'pointer'
                }} className="hover:underline">
                    {displayTitle}
                </h3>
            </a>

            <div style={{ fontSize: 14, color: '#4d5156', lineHeight: '1.58' }}>
                {date && <span style={{ color: '#70757a', marginRight: 4 }}>{date} — </span>}
                {displayDesc}
            </div>
        </div>
    );

    return (
        <Card
            title="Google Snippet Preview"
            size="small"
            extra={
                <Tabs
                    activeKey={mode}
                    onChange={(k) => setMode(k as 'mobile' | 'desktop')}
                    size="small"
                    items={[
                        { key: 'mobile', label: <span><MobileOutlined /> Mobile</span> },
                        { key: 'desktop', label: <span><DesktopOutlined /> Desktop</span> }
                    ]}
                    style={{ marginBottom: -10 }}
                />
            }
        >
            <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8 }}>
                <PreviewCard isMobile={mode === 'mobile'} />
            </div>
        </Card>
    );
};
