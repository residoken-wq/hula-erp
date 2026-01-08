'use client';

import { ProLayout, PageContainer } from '@ant-design/pro-components';
import {
    DashboardOutlined,
    FileTextOutlined,
    ShopOutlined,
    TeamOutlined,
    SettingOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    {
        path: '/dashboard',
        name: 'Dashboard',
        icon: <DashboardOutlined />,
    },
    {
        path: '/blogs',
        name: 'Quản lý Blog',
        icon: <FileTextOutlined />,
    },
    {
        path: '/products',
        name: 'Sản phẩm',
        icon: <ShopOutlined />,
    },
    {
        path: '/leads',
        name: 'Leads',
        icon: <TeamOutlined />,
    },
    {
        path: '/settings',
        name: 'Cài đặt',
        icon: <SettingOutlined />,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <ProLayout
            title="HULA CMS"
            logo={
                <div style={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    H
                </div>
            }
            layout="mix"
            fixedHeader
            fixSiderbar
            contentWidth="Fluid"
            route={{
                path: '/',
                routes: menuItems.map(item => ({
                    path: item.path,
                    name: item.name,
                    icon: item.icon,
                })),
            }}
            location={{ pathname }}
            menuItemRender={(item, dom) => (
                <Link href={item.path || '/'}>{dom}</Link>
            )}
            headerTitleRender={(logo, title) => (
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {logo}
                    {title}
                </Link>
            )}
            avatarProps={{
                src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                size: 'small',
                title: 'Admin',
            }}
        >
            <PageContainer>
                {children}
            </PageContainer>
        </ProLayout>
    );
}
