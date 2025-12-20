import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, theme, Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  DesktopOutlined, PieChartOutlined, TeamOutlined, ShopOutlined, DropboxOutlined, CloudUploadOutlined,
  SettingOutlined, UserOutlined, LogoutOutlined, BankOutlined, CalendarOutlined, ShoppingCartOutlined
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
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import FinancePage from './pages/FinancePage';
import TasksPage from './pages/TasksPage'; 
import PurchasingPage from './pages/PurchasingPage';
import SalesPage from './pages/SalesPage'; // <--- QUAN TRỌNG: Import trang Đơn hàng

// Import Components
import HeaderNotifications from './components/HeaderNotifications'; 

const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem { 
    return { key, icon, children, label } as MenuItem; 
}

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);

  // Check Token & Load Permissions
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        const user = JSON.parse(userStr);
        setIsAuthenticated(true);
        setCurrentUser(user);
        const perms = user.permissions || [];
        setPermissions(perms);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      window.location.href = '/login';
  };

  const hasPerm = (moduleCode: string) => {
      if (currentUser?.username === 'admin') return true; 
      const p = permissions.find((perm: any) => perm.module_code === moduleCode);
      return !!(p && (p.can_view === true || p.can_view === 1));
  };

  const menuItems = useMemo(() => {
      const items: MenuItem[] = [];

      // 1. Tổng quan
      if (hasPerm('DASHBOARD') || true) { 
          items.push(getItem(<Link to="/">Tổng quan</Link>, '1', <PieChartOutlined />));
      }

      // 2. Quản lý sản phẩm
      if (hasPerm('PRODUCT')) {
          items.push(getItem('Quản lý sản phẩm', 'sub_prod', <ShopOutlined />, [
            getItem(<Link to="/categories">Danh mục & Định giá</Link>, 'cat_page'),
            getItem(<Link to="/products">Sản phẩm (Lẻ)</Link>, '2'),
            getItem(<Link to="/combos">Combo sản phẩm</Link>, 'combo_page'),
          ]));
      }

      // 3. Nhập liệu
      if (hasPerm('PRODUCT') || hasPerm('INVENTORY')) {
          items.push(getItem(<Link to="/upload">Nhập liệu (Excel)</Link>, 'upload', <CloudUploadOutlined />));
      }

      // 4. Kho hàng & NCC
      if (hasPerm('INVENTORY')) {
          items.push(getItem('Kho hàng & NCC', 'sub1', <DropboxOutlined />, [
            getItem(<Link to="/materials">Nguyên liệu</Link>, '3'),
            getItem(<Link to="/suppliers">Nhà cung cấp (NPL)</Link>, 'supp'),
            getItem(<Link to="/manufacturers">Nhà gia công</Link>, 'manu'),
            getItem(<Link to="/inventory">Nhập xuất kho</Link>, '4'),
          ]));
      }

      // 5. Bán hàng (CRM & Orders) --> CẬP NHẬT CẤU TRÚC MENU
      if (hasPerm('SALES')) {
          items.push(getItem('Bán hàng (CRM)', 'sub2', <TeamOutlined />, [ 
            getItem(<Link to="/sales">Leads & Báo giá</Link>, 'crm_lead'), // Đổi tên cho rõ
            getItem(<Link to="/orders">Đơn Hàng (SO)</Link>, 'crm_order'), // <--- MỚI: Menu Đơn hàng
            getItem(<Link to="/customers">Danh sách Khách hàng</Link>, 'cust'),
            getItem(<Link to="/sales/pricelist">Bảng giá (Price List)</Link>, 'pl_page'),
          ]));
      }

      // 6. Sản xuất (MRP)
      if (hasPerm('PRODUCTION')) {
          items.push(getItem('Sản xuất (MRP)', '9', <DesktopOutlined />, [
            getItem(<Link to="/planning">Lập Kế Hoạch SX</Link>, 'plan'),
            getItem(<Link to="/purchasing">Đơn Mua Hàng & GC</Link>, 'po_page'),
            getItem(<Link to="/routes">Định nghĩa Quy trình</Link>, 'route'),
            getItem(<Link to="/processes">DM Công Đoạn</Link>, 'proc_list'),
          ]));
      }

      // 7. Tài chính
      if (hasPerm('FINANCE') || hasPerm('SALES')) { 
          items.push(getItem(<Link to="/finance">Tài chính (Thu/Chi)</Link>, 'finance', <BankOutlined />));
      }

      // 8. Công việc
      if (isAuthenticated) {
          items.push(getItem(<Link to="/tasks">Công việc & Nhắc nhở</Link>, 'tasks', <CalendarOutlined />));
      }

      // 9. Hệ thống
      if (hasPerm('USERS')) {
          items.push(getItem('Hệ thống & Phân quyền', 'sub_sys', <SettingOutlined />, [
            getItem(<Link to="/users">Danh sách User</Link>, 'user_list'),
            getItem(<Link to="/users/groups">Nhóm & Phân quyền</Link>, 'group_perm'),
          ]));
      }

      return items;
  }, [permissions, currentUser, isAuthenticated]);

  const userMenu = (
      <Menu items={[
          { key: '1', label: <span>Xin chào, <b>{currentUser?.full_name}</b></span>, icon: <UserOutlined/> },
          { key: '2', label: 'Đăng xuất', icon: <LogoutOutlined/>, onClick: handleLogout, danger: true }
      ]} />
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/portal/quote/:uuid" element={<PortalQuotePage />} />
        <Route path="/portal/po/:uuid" element={<PortalPurchasePage />} />

        <Route path="*" element={
          isAuthenticated ? (
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: '#fff', lineHeight: '32px', fontWeight: 'bold' }}>HULA ERP</div>
                <Menu theme="dark" selectedKeys={[window.location.pathname]} mode="inline" items={menuItems} />
                </Sider>
                <Layout>
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <HeaderNotifications />
                    <div style={{ width: 20 }} /> 
                    <Dropdown overlay={userMenu}>
                        <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                            <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                        </div>
                    </Dropdown>
                </Header>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG, marginTop: 16 }}>
                    <Routes>
                        <Route path="/" element={<h2>Chào mừng đến với Hula ERP</h2>} />
                        
                        {(hasPerm('PRODUCT') || hasPerm('INVENTORY')) && <Route path="/upload" element={<UploadPage />} />}
                        
                        {hasPerm('PRODUCT') && (
                            <>
                                <Route path="/products" element={<ProductsPage />} />
                                <Route path="/combos" element={<CombosPage />} />
                                <Route path="/categories" element={<CategoriesPage />} />
                            </>
                        )}

                        {hasPerm('INVENTORY') && (
                            <>
                                <Route path="/materials" element={<MaterialsPage />} />
                                <Route path="/suppliers" element={<SuppliersPage />} />
                                <Route path="/manufacturers" element={<ManufacturersPage />} />
                                <Route path="/inventory" element={<InventoryPage />} />
                            </>
                        )}

                        {hasPerm('SALES') && (
                            <>
                                <Route path="/sales" element={<CrmPage />} /> {/* CRM Page */}
                                <Route path="/orders" element={<SalesPage />} /> {/* <--- MỚI: Route cho trang Đơn hàng */}
                                <Route path="/customers" element={<CustomersPage />} />
                                <Route path="/sales/pricelist" element={<PriceListsPage />} />
                            </>
                        )}

                        {hasPerm('PRODUCTION') && (
                            <>
                                <Route path="/planning" element={<PlanningPage />} />
                                <Route path="/routes" element={<ProductionRoutePage />} />
                                <Route path="/processes" element={<ProcessesPage />} />
                                <Route path="/purchasing" element={<PurchasingPage />} />
                            </>
                        )}

                        {(hasPerm('FINANCE') || hasPerm('SALES')) && (
                            <Route path="/finance" element={<FinancePage />} />
                        )}

                        <Route path="/tasks" element={<TasksPage />} />

                        {hasPerm('USERS') && (
                            <>
                                <Route path="/users" element={<UsersPage />} />
                                <Route path="/users/groups" element={<UserGroupsPage />} />
                            </>
                        )}

                        <Route path="*" element={<h2>Không tìm thấy trang hoặc bạn không có quyền truy cập.</h2>} />
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