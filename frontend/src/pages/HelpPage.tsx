import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Steps, Divider, Tag, Alert, Row, Col, Button, Breadcrumb } from 'antd';
import {
    BookOutlined,
    ShopOutlined,
    UserOutlined,
    SolutionOutlined,
    FileDoneOutlined,
    DollarOutlined,
    CarOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
    RocketOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text } = Typography;

const HelpPage: React.FC = () => {
    const [selectedKey, setSelectedKey] = useState('sales-process');

    const renderContent = () => {
        switch (selectedKey) {
            case 'intro':
                return (
                    <div>
                        <Title level={2}>👋 Chào mừng đến với HULA ERP Knowledge Base</Title>
                        <Paragraph>
                            Đây là cổng thông tin hướng dẫn sử dụng hệ thống HULA ERP. Tại đây bạn có thể tìm thấy các quy trình,
                            hướng dẫn thao tác và mẹo sử dụng để tối ưu hóa công việc của mình.
                        </Paragraph>
                        <Alert
                            message="Mẹo nhanh"
                            description="Sử dụng thanh điều hướng bên trái để truy cập tài liệu chi tiết cho từng phân hệ."
                            type="info"
                            showIcon
                        />
                        <Divider />
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card padding="small" className="feature-card">
                                    <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                    <Title level={4}>Bắt đầu nhanh</Title>
                                    <Text type="secondary">Làm quen với giao diện và các tính năng cơ bản.</Text>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card padding="small" className="feature-card">
                                    <ShopOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                    <Title level={4}>Quy trình Bán hàng</Title>
                                    <Text type="secondary">Từ Báo giá đến Chốt đơn và Giao hàng.</Text>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                );
            case 'sales-process':
                return (
                    <div>
                        <Tag color="blue" style={{ marginBottom: 16 }}>Modules: Sales</Tag>
                        <Title level={2}>🛒 Quy trình Bán hàng (Sales Workflow)</Title>
                        <Paragraph>
                            Hệ thống quản lý quy trình bán hàng khép kín từ lúc khởi tạo báo giá cho đến khi đơn hàng hoàn tất.
                            Dưới đây là sơ đồ luồng công việc tiêu chuẩn:
                        </Paragraph>

                        {/* WORKFLOW DIAGRAM */}
                        <Card style={{ background: '#f9f9f9', marginBottom: 30 }} bordered={false}>
                            <Steps
                                current={-1}
                                labelPlacement="vertical"
                                items={[
                                    {
                                        title: 'Tạo Báo Giá',
                                        description: 'Nhân viên Sales',
                                        icon: <SolutionOutlined />,
                                    },
                                    {
                                        title: 'Gửi Khách Hàng',
                                        description: 'Portal Link',
                                        icon: <UserOutlined />,
                                    },
                                    {
                                        title: 'Xác Nhận',
                                        description: 'Khách duyệt/từ chối',
                                        icon: <FileDoneOutlined />,
                                    },
                                    {
                                        title: 'Đặt Cọc',
                                        description: 'Thanh toán',
                                        icon: <DollarOutlined />,
                                    },
                                    {
                                        title: 'Giao Hàng',
                                        description: 'Kho vận',
                                        icon: <CarOutlined />,
                                    },
                                    {
                                        title: 'Hoàn Tất',
                                        description: 'Nghiệm thu',
                                        icon: <CheckCircleOutlined />,
                                    },
                                ]}
                            />
                        </Card>

                        <Title level={3}>1. Tạo Báo Giá (Quotations)</Title>
                        <Paragraph>
                            Truy cập menu <b>Bán hàng (Sales)</b> và chọn nút <b>"Thêm Đơn Hàng"</b>.
                            Tại đây, bạn điền thông tin khách hàng và chọn sản phẩm.
                        </Paragraph>
                        <ul>
                            <li><Text strong>Khách hàng:</Text> Chọn khách hàng cũ hoặc tạo mới ngay trên form.</li>
                            <li><Text strong>Sản phẩm:</Text> Tìm kiếm theo tên hoặc SKU. Hệ thống tự động điền giá bán và hình ảnh.</li>
                            <li><Text strong>Mô tả VAT:</Text> Nhập thông tin mô tả cụ thể cho hóa đơn nếu cần thiết (Khác với tên sản phẩm nội bộ).</li>
                        </ul>

                        <Divider />

                        <Title level={3}>2. Cổng Thông Tin Khách Hàng (Customer Portal)</Title>
                        <Paragraph>
                            Sau khi tạo báo giá, bạn có thể gửi link <b>Portal</b> cho khách hàng.
                            Tại Portal, khách hàng có thể:
                        </Paragraph>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Xem chi tiết" bordered>
                                    Xem hình ảnh sản phẩm, thông số kỹ thuật và tổng tiền chi tiết.
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Tương tác" bordered>
                                    Chat trực tiếp với Sale, <Text type="success">Xác nhận đồng ý</Text> hoặc <Text type="danger">Từ chối</Text> báo giá.
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <Title level={3}>3. Chuyển đổi thành Đơn hàng (Sales Order)</Title>
                        <Paragraph>
                            Khi khách hàng xác nhận trên Portal (hoặc bạn xác nhận thủ công), trạng thái sẽ chuyển sang <b>SO_PENDING</b>.
                            Lúc này, các bộ phận khác (Kho, Kế toán) sẽ nhận được thông tin để tiến hành xuất kho và thu tiền.
                        </Paragraph>
                    </div>
                );
            case 'sales-create':
                return (
                    <div>
                        <Tag color="cyan" style={{ marginBottom: 16 }}>Hướng dẫn thao tác</Tag>
                        <Title level={2}>📝 Tạo Đơn Hàng Mới</Title>
                        <Paragraph>
                            Chức năng này dùng để tạo Báo giá (Quote) hoặc Đơn hàng bán (Sales Order) mới.
                            Mọi đơn hàng đều bắt đầu từ bước này.
                        </Paragraph>

                        <Steps
                            direction="vertical"
                            current={-1}
                            items={[
                                {
                                    title: 'Bước 1: Truy cập giao diện',
                                    description: <span>Vào menu <b>Bán hàng (CRM)</b> ➔ <b>Sales Orders</b>. Nhấn nút <b>"Thêm Mới" <PlusOutlined /></b> ở góc phải.</span>,
                                },
                                {
                                    title: 'Bước 2: Điền thông tin Khách hàng',
                                    description: (
                                        <ul>
                                            <li>Tìm kiếm khách hàng bằng Tên hoặc SĐT tại ô <SearchOutlined />.</li>
                                            <li>Nếu chưa có, nhấn icon <b>(+) <PlusOutlined /></b> để tạo nhanh khách hàng mới.</li>
                                            <li>Hệ thống sẽ tự động điền địa chỉ giao hàng và thông tin VAT mặc định.</li>
                                        </ul>
                                    )
                                },
                                {
                                    title: 'Bước 3: Thêm sản phẩm',
                                    description: (
                                        <ul>
                                            <li>Gõ tên sản phẩm hoặc SKU vào ô tìm kiếm dòng hàng.</li>
                                            <li><b>Đơn giá:</b> Có thể chỉnh sửa trực tiếp <EditOutlined /> (Hệ thống hiển thị giá gốc tham chiếu).</li>
                                            <li><b>Mô tả VAT:</b> Nhấn vào ô text để sửa tên hiển thị trên hóa đơn đỏ.</li>
                                            <li><b>Hình ảnh:</b> Nhấn icon <UploadOutlined /> để upload ảnh mẫu thực tế nếu sản phẩm có tùy biến.</li>
                                        </ul>
                                    )
                                },
                                {
                                    title: 'Bước 4: Cấu hình Thanh toán & VAT',
                                    description: 'Nhập % Thuế VAT (8% hoặc 10%) và chọn phương thức thanh toán. Hệ thống tự động tính Tổng tiền.',
                                },
                                {
                                    title: 'Bước 5: Lưu & Gửi',
                                    description: <span>Nhấn <b>"Lưu" <SaveOutlined /></b> để tạo đơn. Sau đó copy Link Portal gửi cho khách.</span>,
                                }
                            ]}
                        />

                        <Divider orientation="left">💡 Mẹo: Tùy biến sản phẩm (Variants)</Divider>
                        <Alert
                            message="Tạo sản phẩm 'Custom' cho từng khách hàng"
                            description={
                                <div>
                                    <Paragraph>
                                        Bạn có thể bán một sản phẩm với quy cách/ngoại quan khác biệt cho từng khách mà <b>không cần tạo mã SKU mới</b> trong kho.
                                    </Paragraph>
                                    <ul style={{ marginBottom: 0 }}>
                                        <li><b>Sửa tên hiển thị (VAT Content):</b> Thay đổi tên sản phẩm trên báo giá/hóa đơn để khách dễ hiểu (VD: <i>"Bàn học A"</i> ➔ <i>"Bàn học A (Màu hồng, Họa tiết mèo)"</i>).</li>
                                        <li><b>Upload ảnh thực tế:</b> Nhấn vào icon ảnh nhỏ <UploadOutlined /> ở đầu dòng để tải lên hình ảnh mẫu hoặc bản vẽ kỹ thuật riêng cho đơn hàng này. Hình ảnh này sẽ hiện trên Portal của khách.</li>
                                        <li><b>Giá bán flexible:</b> Nhập giá bán thỏa thuận trực tiếp tại cột "Đơn giá".</li>
                                    </ul>
                                </div>
                            }
                            type="info"
                            showIcon
                            icon={<RocketOutlined />}
                        />
                    </div>
                );
            case 'sales-portal':
                return (
                    <div>
                        <Tag color="purple" style={{ marginBottom: 16 }}>Tính năng nâng cao</Tag>
                        <Title level={2}>🌐 Customer Portal (Cổng Khách Hàng)</Title>
                        <Paragraph>
                            Customer Portal là trang web dành riêng cho khách hàng để xem chi tiết báo giá và tương tác với doanh nghiệp mà không cần đăng nhập.
                        </Paragraph>

                        <Divider orientation="left">Cách truy cập</Divider>
                        <Paragraph>
                            Mỗi đơn hàng có một đường dẫn (Link) duy nhất và bảo mật.
                            Bạn có thể lấy link này bằng cách nhấn nút <b>"Copy Link"</b> hoặc <b>"Xem Portal"</b> trên chi tiết đơn hàng.
                        </Paragraph>

                        <Divider orientation="left">Các tính năng chính</Divider>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card title="1. Xem Báo Giá Online" bordered={false} style={{ background: '#f0f5ff' }}>
                                    <Paragraph>
                                        Hiển thị bảng báo giá chuyên nghiệp với đầy đủ hình ảnh, mô tả kỹ thuật và giá tiền.
                                        Tương thích tốt trên cả điện thoại và máy tính.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="2. Tương Tác Hai Chiều" bordered={false} style={{ background: '#f6ffed' }}>
                                    <Paragraph>
                                        Khách hàng có thể để lại bình luận/câu hỏi ngay trên từng báo giá.
                                        Nút <b>"Đồng ý"</b> hoặc <b>"Từ chối"</b> giúp chốt đơn nhanh chóng.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="3. Thanh Toán QR" bordered={false} style={{ background: '#fff7e6' }}>
                                    <Paragraph>
                                        Tích hợp mã QR VietQR động. Khách hàng chỉ cần mở app ngân hàng quét mã để chuyển khoản chính xác số tiền.
                                    </Paragraph>
                                </Card>
                            </Col>
                        </Row>

                        <Title level={4} style={{ marginTop: 30 }}>Lưu ý quan trọng</Title>
                        <Alert
                            message="Bảo mật liên kết"
                            description="Link Portal chứa thông tin cá nhân của khách hàng. Chỉ chia sẻ link này cho đúng người mua hàng."
                            type="warning"
                            showIcon
                        />
                    </div>
                );
            case 'customers':
                return (
                    <div>
                        <Title level={2}>👥 Quản lý Khách hàng</Title>
                        <Paragraph>Coming soon...</Paragraph>
                    </div>
                )
            default:
                return <div>Select a topic</div>;
        }
    };

    return (
        <Layout style={{ height: '100%', background: '#fff' }}>
            <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <span style={{ fontSize: 18, fontWeight: 'bold' }}>HULA Docs</span>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={(e) => setSelectedKey(e.key)}
                    style={{ borderRight: 0 }}
                    items={[
                        { key: 'intro', icon: <RocketOutlined />, label: 'Giới thiệu chung' },
                        { type: 'divider' },
                        {
                            key: 'sub1',
                            label: 'Phân hệ Bán Hàng',
                            icon: <ShopOutlined />,
                            children: [
                                { key: 'sales-process', label: 'Quy trình chuẩn' },
                                { key: 'sales-create', label: 'Tạo đơn mới' },
                                { key: 'sales-portal', label: 'Customer Portal' },
                            ]
                        },
                        {
                            key: 'sub2',
                            label: 'Phân hệ Khách Hàng',
                            icon: <UserOutlined />,
                            children: [
                                { key: 'customers', label: 'Danh sách khách hàng' },
                            ]
                        }
                    ]}
                />
            </Sider>
            <Layout style={{ padding: '0 24px 24px' }}>
                <Breadcrumb style={{ margin: '16px 0' }} items={[{ title: 'Knowledge Base' }, { title: selectedKey }]} />
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

export default HelpPage;
