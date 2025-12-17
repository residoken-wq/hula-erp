import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  DesktopOutlined, PieChartOutlined, TeamOutlined, ShopOutlined, DropboxOutlined, CloudUploadOutlined,
  SettingOutlined, UserOutlined, LogoutOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import Pages
import ProductsPage from './pages/ProductsPage';
import CombosPage from './pages/CombosPage';
import UploadPage from './pages/UploadPage';
import MaterialsPage from './pages/MaterialsPage';
import SuppliersPage from './pages/SuppliersPage';
import CrmPage from './pages/CrmPage';
import CustomersPage from './pages/CustomersPage';
import PlanningPage from './pages/PlanningPage';
import ManufacturersPage from './pages/ManufacturersPage';
import ProductionRoutePage from './pages/ProductionRoutePage';
import ProcessesPage from './pages/ProcessesPage';
import CategoriesPage from './pages/CategoriesPage';
import PortalQuotePage from './pages/PortalQuotePage';
import PortalPurchasePage from './pages/PortalPurchasePage';
import PriceListsPage from './pages/PriceListPage'; 
import UsersPage from './pages/UsersPage';
import UserGroupsPage from './pages/UserGroupsPage';
import LoginPage from './pages/LoginPage'; // Import trang Login

const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];
function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem { return { key, icon, children, label } as MenuItem; }

const items: MenuItem[] = [
  getItem(<Link to="/">Tổng quan</Link>, '1', <PieChartOutlined />),
  getItem('Quản lý sản phẩm', 'sub_prod', <ShopOutlined />, [
    getItem(<Link to="/categories">Danh mục & Định giá</Link>, 'cat_page'),
    getItem(<Link to="/products">Sản phẩm (Lẻ)</Link>, '2'),
    getItem(<Link to="/combos">Combo sản phẩm</Link>, 'combo_page'),
  ]),
  getItem(<Link to="/upload">Nhập liệu (Excel)</Link>, 'upload', <CloudUploadOutlined />),
  getItem('Kho hàng & NCC', 'sub1', <DropboxOutlined />, [
    getItem(<Link to="/materials">Nguyên liệu</Link>, '3'),
    getItem(<Link to="/suppliers">Nhà cung cấp (NPL)</Link>, 'supp'),
    getItem(<Link to="/manufacturers">Nhà gia công</Link>, 'manu'),
    getItem(<Link to="/inventory">Nhập xuất kho</Link>, '4'),
  ]),
  getItem('Bán hàng (CRM)', 'sub2', <TeamOutlined />, [ 
    getItem(<Link to="/sales">Pipeline Bán Hàng</Link>, '5'),
    getItem(<Link to="/customers">Danh sách Khách hàng</Link>, 'cust'),
    getItem(<Link to="/sales/pricelist">Bảng giá (Price List)</Link>, 'pl_page'),
  ]),
  getItem('Sản xuất (MRP)', '9', <DesktopOutlined />, [
    getItem(<Link to="/planning">Lập Kế Hoạch SX</Link>, 'plan'),
    getItem(<Link to="/routes">Định nghĩa Quy trình</Link>, 'route'),
    getItem(<Link to="/processes">DM Công Đoạn</Link>, 'proc_list'),
  ]),
  getItem('Hệ thống & Phân quyền', 'sub_sys', <SettingOutlined />, [
    getItem(<Link to="/users">Danh sách User</Link>, 'user_list'),
    getItem(<Link to="/users/groups">Nhóm & Phân quyền</Link>, 'group_perm'),
  ]),
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check Token khi load trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
        setIsAuthenticated(true);
        if(userStr) setCurrentUser(JSON.parse(userStr));
        // Cấu hình Header mặc định cho Axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      window.location.href = '/login';
  };

  const userMenu = (
      <Menu items={[
          { key: '1', label: 'Hồ sơ cá nhân', icon: <UserOutlined/> },
          { key: '2', label: 'Đăng xuất', icon: <LogoutOutlined/>, onClick: handleLogout, danger: true }
      ]} />
  );

  return (
    <Router>
      <Routes>
        {/* --- CÁC TRANG PUBLIC (KHÔNG CẦN LOGIN) --- */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/portal/quote/:uuid" element={<PortalQuotePage />} />
        <Route path="/portal/po/:uuid" element={<PortalPurchasePage />} />

        {/* --- CÁC TRANG CẦN BẢO VỆ (PROTECTED ROUTES) --- */}
        <Route path="*" element={
          isAuthenticated ? (
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: '#fff', lineHeight: '32px', fontWeight: 'bold' }}>HULA ERP</div>
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
                </Sider>
                <Layout>
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Dropdown overlay={userMenu}>
                        <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                            <span style={{fontWeight: 600}}>{currentUser?.full_name || 'Admin'}</span>
                            <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                        </div>
                    </Dropdown>
                </Header>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG, marginTop: 16 }}>
                    <Routes>
                        <Route path="/" element={<h2>Chào mừng đến với Hula ERP</h2>} />
                        <Route path="/upload" element={<UploadPage />} /> 
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/combos" element={<CombosPage />} /> 
                        <Route path="/materials" element={<MaterialsPage />} />
                        <Route path="/suppliers" element={<SuppliersPage />} />
                        <Route path="/sales" element={<CrmPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/planning" element={<PlanningPage />} />
                        <Route path="/manufacturers" element={<ManufacturersPage />} />
                        <Route path="/routes" element={<ProductionRoutePage />} />
                        <Route path="/processes" element={<ProcessesPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/sales/pricelist" element={<PriceListsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/users/groups" element={<UserGroupsPage />} />
                        <Route path="*" element={<h2>404 - Không tìm thấy trang</h2>} />
                    </Routes>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>Hula ERP ©2025 Created by AI</Footer>
                </Layout>     
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>     
    </Router>
  );
};
export default App;