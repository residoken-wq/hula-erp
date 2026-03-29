'use client';

import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Dropdown, Avatar, Badge, Space, Typography } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    ShopOutlined,
    TeamOutlined,
    SettingOutlined,
    HomeOutlined,
    LayoutOutlined,
    BellOutlined,
    LogoutOutlined,
    UserOutlined,
    MoonOutlined,
    FormatPainterOutlined,
    PictureOutlined,
    ProjectOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Text } = Typography;

const menuItems = [
    {
        path: '/dashboard',
        name: 'Dashboard',
        icon: <DashboardOutlined />,
    },
    {
        path: '/appearance',
        name: 'Trang chủ',
        icon: <FormatPainterOutlined />,
    },
    {
        path: '/about-hula',
        name: 'Về Hula',
        icon: <HomeOutlined />,
    },
    {
        path: '/media',
        name: 'Hình ảnh',
        icon: <PictureOutlined />,
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
        path: '/projects',
        name: 'Dự án Website',
        icon: <ProjectOutlined />,
    },
    {
        path: '/leads',
        name: 'Leads',
        icon: <TeamOutlined />,
    },
    {
        path: '/policies',
        name: 'Chính sách',
        icon: <FileTextOutlined />,
    },
    {
        path: '/wizard-config',
        name: 'Cấu hình Wizard',
        icon: <SettingOutlined />,
    },
    {
        path: '/settings',
        name: 'Cài đặt',
        icon: <SettingOutlined />,
        routes: [
            {
                path: '/settings',
                name: 'Cài đặt chung',
            },
            {
                path: '/settings/menu',
                name: 'Menu & Hiển thị',
            }
        ]
    },
];

// User dropdown menu
const userMenuItems = [
    {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
    },
    {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt tài khoản',
    },
    {
        key: 'theme',
        icon: <MoonOutlined />,
        label: 'Chế độ tối',
    },
    {
        type: 'divider' as const,
    },
    {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
    },
];

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

// ... (other imports)

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // If loading or checking auth
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Require Login check is handled in useAuth or individual pages or middleware.
    // However, AdminLayout is generally used for protected pages.
    // We can add a simple check here if not on login page.
    if (!user && pathname !== '/login') {
        // This might cause hydration issues if not handled carefully, 
        // but since useAuth handles redirection, we can just return null or loader.
        router.push('/login');
        return null;
    }

    // User menu items with logic
    const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            logout();
        } else if (key === 'profile') {
            // router.push('/profile');
        }
    };

    return (
        <ProLayout
            title="HULA CMS"
            logo={
                <div style={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 18,
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                }}>
                    H
                </div>
            }
            layout="mix"
            fixedHeader
            fixSiderbar
            contentWidth="Fluid"
            siderWidth={240}
            token={{
                header: {
                    colorBgHeader: 'rgba(255, 255, 255, 0.85)',
                },
                sider: {
                    colorMenuBackground: 'transparent',
                    colorTextMenu: 'rgba(255, 255, 255, 0.75)',
                    colorTextMenuSelected: '#ffffff',
                    colorBgMenuItemSelected: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
            }}
            route={{
                path: '/',
                routes: menuItems.map(item => ({
                    path: item.path,
                    name: item.name,
                    icon: item.icon,
                    routes: item.routes,
                })),
            }}
            location={{ pathname }}
            menuItemRender={(item, dom) => (
                <Link href={item.path || '/'}>{dom}</Link>
            )}
            headerTitleRender={(logo, title) => (
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {logo}
                    <span style={{
                        fontWeight: 700,
                        fontSize: 18,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        HULA CMS
                    </span>
                </Link>
            )}
            actionsRender={() => [
                // Notifications
                <Badge key="notifications" count={3} size="small" offset={[-4, 4]}>
                    <div style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}>
                        <BellOutlined style={{ fontSize: 18, color: '#64748b' }} />
                    </div>
                </Badge>,

                // User Avatar Dropdown
                <Dropdown
                    key="user"
                    menu={{ items: userMenuItems, onClick: handleMenuClick }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 10 }}>
                        <Avatar
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`}
                            size={36}
                            style={{
                                border: '2px solid #667eea',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                            <Text strong style={{ fontSize: 13 }}>{user?.fullName || user?.username || 'Admin'}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{user?.group?.name || 'User'}</Text>
                        </div>
                    </Space>
                </Dropdown>,
            ]}
            footerRender={() => (
                <div style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    background: '#1e293b',
                    color: 'rgba(255,255,255,0.65)'
                }}>
                    <div style={{ marginBottom: 12 }}>
                        <img 
                            src="/logo.png" 
                            alt="Hula CMS Logo" 
                            style={{ 
                                height: 32, 
                                filter: 'brightness(0) invert(1)',
                                objectFit: 'contain'
                            }} 
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <div>HULA CMS ©{new Date().getFullYear()}</div>
                </div>
            )}
        >
            <PageContainer
                header={{
                    ghost: true,
                }}
            >
                {children}
            </PageContainer>
        </ProLayout>
    );
}
