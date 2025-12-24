import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Tag, Descriptions, Divider, Badge } from 'antd';
import { CodeOutlined, DatabaseOutlined, CloudServerOutlined, ToolOutlined, DeploymentUnitOutlined } from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Paragraph, Text } = Typography;

const DocsPage: React.FC = () => {
    const [selectedKey, setSelectedKey] = useState('intro');

    const renderContent = () => {
        switch (selectedKey) {
            case 'intro':
                return (
                    <div>
                        <Title level={2}>🛠️ HULA ERP Technical Documentation</Title>
                        <Paragraph>
                            Tài liệu kỹ thuật dành cho Developer và DevOps. Hệ thống được xây dựng trên kiến trúc Monorepo (Frontend + Backend) với Docker hóa toàn bộ.
                        </Paragraph>
                        <Descriptions title="Tech Stack" bordered column={1}>
                            <Descriptions.Item label="Backend">NestJS (Express), TypeORM, PostgreSQL</Descriptions.Item>
                            <Descriptions.Item label="Frontend">ReactJS (CRA), Ant Design, TypeScript</Descriptions.Item>
                            <Descriptions.Item label="Database">PostgreSQL 14 (Dockerized)</Descriptions.Item>
                            <Descriptions.Item label="Containerization">Docker, Docker Compose</Descriptions.Item>
                            <Descriptions.Item label="CI/CD">GitHub Actions (Planned)</Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            case 'backend':
                return (
                    <div>
                        <Tag color="red">Backend (NestJS)</Tag>
                        <Title level={2}>Backend Architecture</Title>
                        <Paragraph>
                            Backend nằm trong thư mục gốc (root), sử dụng framework NestJS.
                        </Paragraph>

                        <Title level={4}>Modules chính</Title>
                        <ul>
                            <li><b>SalesModule:</b> Quản lý Báo giá, Đơn hàng, SP mua (Quotations, Orders, Deliveries).</li>
                            <li><b>FinanceModule:</b> Quản lý Thu/Chi (Transactions), Danh mục (TransactionCategories).</li>
                            <li><b>UsersModule:</b>: Quản lý Users, Roles, Permissions.</li>
                            <li><b>ProductsModule:</b> Quản lý Sản phẩm, Combo, BOM.</li>
                            <li><b>PlanningModule:</b> Lập kế hoạch sản xuất (MRP).</li>
                        </ul>

                        <Title level={4}>Database Schema (PostgreSQL)</Title>
                        <Paragraph>
                            Sử dụng TypeORM với cơ chế `synchronize: true` (Dev mode).
                            Các Entity chính: `SalesOrder`, `SalesOrderItem`, `Transaction`, `Product`, `Customer`.
                        </Paragraph>

                        <Divider />
                        <Title level={4}>Key Services</Title>
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="FinanceService">
                                Xử lý logic tạo phiếu thu/chi. Tự động liên kết với SalesOrder (Reference Code).
                                <br /><code>createPayment(data)</code>: Tạo phiếu thu từ Sales.
                                <br /><code>createPOPayment(data)</code>: Tạo phiếu chi từ Import PO.
                            </Descriptions.Item>
                            <Descriptions.Item label="SalesService">
                                Logic tạo đơn hàng, tính toán tổng tiền, VAT, và quản lý trạng thái đơn hàng.
                                <br /><code>validatePriceAgainstPriceList</code>: Kiểm tra giá sàn.
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            case 'frontend':
                return (
                    <div>
                        <Tag color="blue">Frontend (React)</Tag>
                        <Title level={2}>Frontend Architecture</Title>
                        <Paragraph>
                            Frontend nằm trong thư mục `/frontend`, là một ứng dụng React SPA (Create React App).
                        </Paragraph>

                        <Title level={4}>Cấu trúc thư mục</Title>
                        <ul>
                            <li><code>src/pages</code>: Các trang chính (SalesPage, FinancePage, etc.).</li>
                            <li><code>src/components</code>: Components tái sử dụng (SalesOrderDetail, HeaderNotifications).</li>
                            <li><code>src/utils/api.ts</code>: Axios instance với Interceptor xử lý Auth Token.</li>
                        </ul>

                        <Divider />
                        <Title level={4}>Mẹo cho Developer</Title>
                        <ul>
                            <li><b>State Management:</b> Chủ yếu dùng Local State (`useState`) và Context API đơn giản cho Auth.</li>
                            <li><b>Styling:</b> Sử dụng `Ant Design` components và inline styles (cần refactor sang CSS Modules/styled-components nếu scale).</li>
                            <li><b>Validation:</b> Sử dụng `Ant Form` để validate dữ liệu nhập.</li>
                        </ul>
                    </div>
                );
            case 'deployment':
                return (
                    <div>
                        <Tag color="green">DevOps</Tag>
                        <Title level={2}>Deployment Guide</Title>

                        <Title level={4}>1. Chạy với Docker (Khuyên dùng)</Title>
                        <div style={{ background: '#f0f0f0', padding: 10, borderRadius: 5 }}>
                            <CodeOutlined /> <Text code>docker-compose up --build -d</Text>
                        </div>
                        <Paragraph>
                            Lệnh này sẽ khởi chạy 3 container:
                            <ul>
                                <li><code>postgres_hula</code>: Database (Port 5432)</li>
                                <li><code>hula_backend</code>: NestJS API (Port 3000)</li>
                                <li><code>hula_frontend</code>: React Nginx Server (Port 80)</li>
                            </ul>
                        </Paragraph>

                        <Title level={4}>2. Biến môi trường (.env)</Title>
                        <Paragraph>
                            Cần tạo file `.env` ở root với các biến sau:
                        </Paragraph>
                        <pre style={{ background: '#222', color: '#fff', padding: 10, borderRadius: 5 }}>
                            POSTGRES_USER=admin
                            POSTGRES_PASSWORD=your_password
                            POSTGRES_DB=hula_erp
                            DB_HOST=postgres_hula
                            JWT_SECRET=super_secret_key
                        </pre>

                        <Title level={4}>3. Troubleshooting</Title>
                        <ul>
                            <li><b>Lỗi kết nối DB:</b> Đảm bảo container DB đã healthy trước khi Backend start.</li>
                            <li><b>Frontend 404 Refresh:</b> Cấu hình Nginx `try_files $uri /index.html` đã được tích hợp trong Dockerfile Frontend.</li>
                        </ul>
                    </div>
                );
            default:
                return <div>Select a topic</div>;
        }
    };

    return (
        <Layout style={{ height: '100%', background: '#fff' }}>
            <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CodeOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                    <span style={{ fontSize: 18, fontWeight: 'bold' }}>Dev Docs</span>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={(e) => setSelectedKey(e.key)}
                    style={{ borderRight: 0 }}
                    items={[
                        { key: 'intro', icon: <DeploymentUnitOutlined />, label: 'Tổng quan' },
                        { key: 'backend', icon: <DatabaseOutlined />, label: 'Backend Guide' },
                        { key: 'frontend', icon: <ToolOutlined />, label: 'Frontend Guide' },
                        { key: 'deployment', icon: <CloudServerOutlined />, label: 'Deployment (Docker)' },
                    ]}
                />
            </Sider>
            <Layout style={{ padding: '24px' }}>
                <Content style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DocsPage;
