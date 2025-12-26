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
    RocketOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    UploadOutlined,
    SaveOutlined,
    HistoryOutlined,
    CopyOutlined,
    BellOutlined
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
                                <Card size="small" className="feature-card">
                                    <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                    <Title level={4}>Bắt đầu nhanh</Title>
                                    <Text type="secondary">Làm quen với giao diện và các tính năng cơ bản.</Text>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" className="feature-card">
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
            case 'finance-guide':
                return (
                    <div>
                        <Tag color="green" style={{ marginBottom: 16 }}>Modules: Finance</Tag>
                        <Title level={2}>💰 Quản lý Tài chính & Thu Chi</Title>
                        <Paragraph>
                            Phân hệ Tài chính giúp theo dõi dòng tiền, công nợ và sổ quỹ tiền mặt.
                            Bao gồm 4 Tab chính: <b>Thu, Chi, Báo Cáo Tài Chính</b> và <b>Danh Mục</b>.
                        </Paragraph>

                        <Divider orientation="left">I. Quản lý Thu / Chi</Divider>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card title="1. Tab Thu (Income)" size="small" bordered style={{ borderColor: '#b7eb8f' }}>
                                    <ul>
                                        <li>Quản lý danh sách các phiếu thu tiền.</li>
                                        <li><b>Tự động:</b> Khi khách hàng thanh toán cho đơn hàng (Sales Order).</li>
                                        <li><b>Thủ công:</b> Tạo phiếu thu khác (VD: Thu tiền thanh lý tài sản...).</li>
                                    </ul>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="2. Tab Chi (Expense)" size="small" bordered style={{ borderColor: '#ffa39e' }}>
                                    <ul>
                                        <li>Quản lý danh sách các phiếu chi tiền.</li>
                                        <li><b>Tự động:</b> Khi thanh toán cho nhà cung cấp (Purchase Order).</li>
                                        <li><b>Thủ công:</b> Tạo phiếu chi nội bộ (Tiền điện, nước, lương, tiếp khách...).</li>
                                    </ul>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">II. Hạch Toán & Báo Cáo</Divider>

                        <Card title={<span style={{ fontWeight: 'bold', color: '#1890ff' }}>📝 1. Quy trình Hạch toán (Accounting)</span>} style={{ marginBottom: 20 }}>
                            <Paragraph>
                                Để đảm bảo số liệu chính xác cho kế toán thuế và báo cáo lợi nhuận, các giao dịch cần được "Hạch toán".
                            </Paragraph>
                            <Steps
                                progressDot
                                current={-1}
                                items={[
                                    { title: 'Bước 1', description: 'Kế toán kiểm tra giao dịch tại Tab Thu hoặc Chi.' },
                                    { title: 'Bước 2', description: 'Nhấn nút "Hạch toán" trên dòng giao dịch.' },
                                    { title: 'Bước 3', description: 'Nhập "Số Hóa Đơn / Chứng Từ" và Ghi chú.' },
                                    { title: 'Hoàn tất', description: 'Giao dịch chuyển sang trạng thái "Đã HT" (Đã hạch toán).' },
                                ]}
                            />
                        </Card>

                        <Card title={<span style={{ fontWeight: 'bold', color: '#722ed1' }}>📊 2. Báo Cáo Tài Chính (Financial Report)</span>} style={{ marginBottom: 20 }}>
                            <Paragraph>
                                Tab "Báo Cáo Tài Chính" tổng hợp tất cả các giao dịch <b>ĐÃ ĐƯỢC HẠCH TOÁN</b>.
                            </Paragraph>
                            <ul>
                                <li><b>Bộ lọc linh hoạt:</b> Xem báo cáo theo <b>Tháng</b> hoặc <b>Năm</b>.</li>
                                <li><b>Chỉ số quan trọng:</b> Tự động tính toán <b>Tổng Thu</b>, <b>Tổng Chi</b> và <b>Lợi Nhuận (Profit)</b>.</li>
                                <li><b>Chi tiết:</b> Bảng kê chi tiết từng hóa đơn, chứng từ đã hạch toán.</li>
                            </ul>
                        </Card>
                    </div>
                );
            case 'sales-approval':
                return (
                    <div>
                        <Tag color="gold" style={{ marginBottom: 16 }}>Quy trình kiểm soát chất lượng</Tag>
                        <Title level={2}>✅ Quy trình Duyệt Mẫu & Giao Hàng</Title>
                        <Paragraph>
                            Quy trình từ lúc chốt mẫu cho đến khi giao hàng hoàn tất.
                        </Paragraph>

                        <Steps
                            direction="vertical"
                            current={1}
                            items={[
                                {
                                    title: 'Bước 1: Gửi mẫu & Chờ phản hồi',
                                    description: 'Đơn hàng ở trạng thái "Chờ Duyệt Mẫu" (SO_PENDING). Sale gửi mẫu cho khách.',
                                },
                                {
                                    title: 'Bước 2: Khách hàng chốt mẫu',
                                    description: 'Khách xác nhận mẫu đạt yêu cầu.',
                                    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                                },
                                {
                                    title: 'Bước 3: Xác nhận trên hệ thống',
                                    description: 'Sale nhấn nút "Duyệt Mẫu" trên đơn hàng.',
                                },
                                {
                                    title: 'Bước 4: Giao hàng (1 phần hoặc toàn bộ)',
                                    description: (
                                        <div>
                                            <Paragraph>Trong quá trình giao hàng, bạn có thể cập nhật trạng thái:</Paragraph>
                                            <ul>
                                                <li><b>Giao 1 Phần (Partial Delivery):</b> Khi chỉ giao trước một số lượng nhỏ. Đơn hàng sẽ hiện ở tab "Đã giao" để dễ theo dõi.</li>
                                                <li><b>Hoàn tất:</b> Khi đã giao đủ và thu đủ tiền.</li>
                                            </ul>
                                        </div>
                                    ),
                                    status: 'process',
                                }
                            ]}
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
            case 'price-list':
                return (
                    <div>
                        <Tag color="magenta" style={{ marginBottom: 16 }}>Kiểm soát & Chiến lược</Tag>
                        <Title level={2}>💲 Chính sách giá & Kiểm soát lợi nhuận</Title>
                        <Paragraph>
                            Module PriceList giúp doanh nghiệp thiết lập các quy tắc về giá bán để đảm bảo biên lợi nhuận (Margin) và cung cấp chính sách giá sỉ (Tiered Pricing) nhất quán cho nhân viên kinh doanh.
                        </Paragraph>

                        <Divider orientation="left">I. Cấu trúc bảng giá</Divider>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Card title="1. Thông tin chung (Header)" size="small" bordered>
                                    <ul>
                                        <li><b>Tên bảng giá:</b> Ví dụ "Bảng giá Đại lý cấp 1", "Giá bán lẻ 2024".</li>
                                        <li><b>Hiệu lực:</b> Thiết lập ngày bắt đầu và kết thúc (Valid From - To).</li>
                                        <li><b>Nhóm khách hàng:</b> Áp dụng bảng giá cụ thể cho từng nhóm đối tượng.</li>
                                    </ul>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="2. Quy tắc chi tiết (Rules)" size="small" bordered>
                                    <ul>
                                        <li><b>Theo SKU:</b> Mỗi dòng hàng có quy tắc riêng.</li>
                                        <li><b>Giá sàn (Min Price):</b> Mức giá thấp nhất nhân viên được phép bán.</li>
                                        <li><b>Giới hạn Margin:</b> Cảnh báo nếu biên lợi nhuận thấp hơn mức quy định (VD: dưới 15%).</li>
                                    </ul>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">II. Các tính năng chính</Divider>

                        <Card title={<span style={{ fontWeight: 'bold', color: '#cf1322' }}>🛑 1. Kiểm soát giá sàn (Floor Price Control)</span>} style={{ marginBottom: 20 }}>
                            <Paragraph>
                                Hệ thống sẽ tự động chặn hoặc cảnh báo khi nhân viên kinh doanh nhập đơn giá thấp hơn mức quy định.
                            </Paragraph>
                            <Alert
                                message="Cơ chế hoạt động"
                                description={
                                    <ul style={{ marginBottom: 0 }}>
                                        <li>Nếu <b>Giá bán &lt; Min Price</b>: Hệ thống báo lỗi và không cho lưu đơn hàng.</li>
                                        <li>Nếu <b>Lợi nhuận gộp (Margin) &lt; Min Margin %</b>: Cần xin phê duyệt từ quản lý (Tính năng nâng cao).</li>
                                    </ul>
                                }
                                type="error"
                            />
                        </Card>

                        <Card title={<span style={{ fontWeight: 'bold', color: '#52c41a' }}>📊 2. Bảng giá theo số lượng (Tiered Pricing)</span>} style={{ marginBottom: 20 }}>
                            <Paragraph>
                                Hỗ trợ nhân viên báo giá nhanh dựa trên mốc số lượng đặt hàng chuẩn.
                            </Paragraph>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa' }}>
                                            <th style={{ padding: 10, border: '1px solid #f0f0f0' }}>SKU</th>
                                            <th style={{ padding: 10, border: '1px solid #f0f0f0', color: '#666' }}>Giá SL 30</th>
                                            <th style={{ padding: 10, border: '1px solid #f0f0f0', color: '#1890ff' }}>Giá SL 50</th>
                                            <th style={{ padding: 10, border: '1px solid #f0f0f0', color: '#52c41a' }}>Giá SL 100+</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: 10, border: '1px solid #f0f0f0', fontWeight: 'bold' }}>IPHONE-15-PRO</td>
                                            <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>28.500.000</td>
                                            <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>28.200.000</td>
                                            <td style={{ padding: 10, border: '1px solid #f0f0f0' }}>27.900.000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 13, color: '#888', fontStyle: 'italic' }}>
                                * Hệ thống gợi ý giá này khi tạo báo giá, nhân viên có thể điều chỉnh nhưng không được thấp hơn giá sàn.
                            </div>
                        </Card>

                        <Divider />
                        <Title level={4}>Hướng dẫn thiết lập</Title>
                        <Steps
                            current={-1}
                            items={[
                                { title: 'Bước 1', description: 'Vào menu Sales ➔ Price List.' },
                                { title: 'Bước 2', description: 'Tạo bảng giá mới (Header).' },
                                { title: 'Bước 3', description: 'Import file Excel danh sách quy tắc hoặc nhập tay từng SKU.' },
                                { title: 'Bước 4', description: 'Kích hoạt "Active" để áp dụng ngay lập tức.' },
                            ]}
                        />
                    </div>
                );
            case 'sales-revisions':
                return (
                    <div>
                        <Tag color="orange" style={{ marginBottom: 16 }}>Tính năng mới</Tag>
                        <Title level={2}>🕒 Quản lý Phiên bản Báo giá (Revisions)</Title>
                        <Paragraph>
                            Tính năng này giúp nhân viên kinh doanh lưu lại lịch sử các lần thay đổi báo giá gửi cho khách hàng.
                            Bạn có thể tạo nhiều phiên bản (Version) cho cùng một mã báo giá mà không cần tạo đơn mới.
                        </Paragraph>

                        <Divider orientation="left">Quy trình thực hiện</Divider>
                        <Steps
                            current={-1}
                            direction="vertical"
                            items={[
                                {
                                    title: 'Bước 1: Tạo Báo Giá (Draft)',
                                    description: 'Tạo báo giá như bình thường. Trạng thái là "QUOTATION".',
                                    icon: <SolutionOutlined />,
                                },
                                {
                                    title: 'Bước 2: Tạo Phiên bản mới (Snapshot)',
                                    description: (
                                        <div>
                                            <Paragraph>
                                                Khi cần chỉnh sửa (VD: Khách muốn đổi số lượng hoặc thêm sản phẩm):
                                            </Paragraph>
                                            <ul>
                                                <li>Nhấn nút <b>"Tạo Version Mới" <CopyOutlined /></b> trên giao diện chi tiết đơn hàng.</li>
                                                <li>Hệ thống sẽ lưu lại toàn bộ dữ liệu hiện tại vào "Lịch sử".</li>
                                                <li>Số phiên bản (Version) sẽ tự động tăng lên (v1 ➔ v2).</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <CopyOutlined />,
                                },
                                {
                                    title: 'Bước 3: Xem lại lịch sử',
                                    description: 'Nhấn nút "Lịch sử" <HistoryOutlined /> để xem lại thông tin cũ. Bạn có thể xem chi tiết từng phiên bản để đối chiếu.',
                                    icon: <HistoryOutlined />,
                                }
                            ]}
                        />

                        <Alert
                            message="Lưu ý quan trọng"
                            description="Chỉ có thể tạo Revision khi đơn hàng đang ở trạng thái Báo Giá (Quotation). Khi đã chuyển thành Đơn hàng (SO) huỷ hoặc hoàn tất, tính năng này sẽ bị khóa để đảm bảo tính toàn vẹn dữ liệu."
                            type="warning"
                            showIcon
                            style={{ marginTop: 24 }}
                        />
                    </div>
                );
            case 'customers':
                return (
                    <div>
                        <Tag color="geekblue" style={{ marginBottom: 16 }}>CRM & Công Nợ</Tag>
                        <Title level={2}>👥 Quản lý Khách hàng</Title>
                        <Paragraph>
                            Phân hệ Khách hàng giúp lưu trữ tập trung thông tin đối tác, lịch sử mua hàng và theo dõi công nợ chi tiết.
                        </Paragraph>

                        <Divider orientation="left">Thông tin chi tiết</Divider>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card title="1. Hồ sơ khách hàng" size="small" bordered>
                                    <ul>
                                        <li><b>Thông tin cơ bản:</b> Tên công ty, MST, Địa chỉ, SĐT.</li>
                                        <li><b>Người liên hệ:</b> Danh sách nhiều người liên hệ (Kế toán, Mua hàng...) để tiện gửi mail/gọi điện.</li>
                                        <li><b>Ghi chú nội bộ:</b> Lưu lại các đặc thù của khách (VD: "Khách khó tính", "Chỉ giao giờ hành chính").</li>
                                    </ul>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="2. Theo dõi Công nợ" size="small" bordered>
                                    <ul>
                                        <li><b>Hạn mức nợ (Credit Limit):</b> Cảnh báo khi khách mua vượt mức tín dụng cho phép.</li>
                                        <li><b>Số ngày được nợ (Payment Terms):</b> Quy định thời hạn thanh toán (VD: Net 30).</li>
                                        <li><b>Lịch sử:</b> Xem lại toàn bộ đơn hàng và phiếu thu của khách đó.</li>
                                    </ul>
                                </Card>
                            </Col>
                        </Row>

                        <div style={{ marginTop: 20 }}>
                            <Alert
                                message="Mẹo quản lý"
                                description="Bạn nên nhập đầy đủ thông tin 'Người liên hệ' (Email/Zalo) để hệ thống có thể tự động gửi thông báo hoặc Báo giá sau này."
                                type="info"
                                showIcon
                            />
                        </div>
                    </div>
                );
            case 'reminders':
                return (
                    <div>
                        <Tag color="cyan" style={{ marginBottom: 16 }}>Chăm sóc khách hàng</Tag>
                        <Title level={2}>⏰ Nhắc việc & Trao đổi nội bộ</Title>
                        <Paragraph>
                            Tính năng giúp bạn không bỏ lỡ các đầu việc quan trọng với khách hàng (Gọi điện, Gửi mẫu, Đòi nợ...).
                        </Paragraph>

                        <Steps
                            direction="vertical"
                            current={-1}
                            items={[
                                {
                                    title: 'Bước 1: Tạo nhắc nhở',
                                    description: 'Tại màn hình chi tiết Khách hàng hoặc Đơn hàng, nhấn vào tab "Hoạt động / Activity". Chọn "Thêm nhắc nhở".',
                                    icon: <PlusOutlined />
                                },
                                {
                                    title: 'Bước 2: Thiết lập thời gian',
                                    description: 'Chọn ngày giờ cụ thể và nội dung công việc (VD: "Gọi lại chốt đơn lúc 14h").',
                                    icon: <HistoryOutlined />
                                },
                                {
                                    title: 'Bước 3: Nhận thông báo',
                                    description: 'Đến giờ hẹn, hệ thống sẽ hiện thông báo (Notification) trên thanh menu để nhắc bạn.',
                                    icon: <BellOutlined />
                                },
                                {
                                    title: 'Bước 4: Đánh dấu hoàn thành',
                                    description: 'Sau khi thực hiện xong, hãy tích vào ô "Hoàn thành" để đóng nhắc nhở.',
                                    icon: <CheckCircleOutlined />
                                }
                            ]}
                        />
                    </div>
                );
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
                                { key: 'sales-approval', label: 'Duyệt mẫu' },
                                { key: 'sales-approval', label: 'Duyệt mẫu' },
                                { key: 'sales-revisions', label: 'Quản lý version (Báo giá)' }, // <--- NEW
                                { key: 'sales-portal', label: 'Customer Portal' },
                                { key: 'price-list', label: 'Chính sách giá' },
                            ]
                        },
                        {
                            key: 'sub2',
                            label: 'Phân hệ Khách Hàng',
                            icon: <UserOutlined />,
                            children: [
                                { key: 'customers', label: 'Danh Sách & Công Nợ' },
                                { key: 'reminders', label: 'Nhắc Việc & Chăm Sóc' },
                            ]
                        },
                        {
                            key: 'sub3',
                            label: 'Phân hệ Tài Chính',
                            icon: <DollarOutlined />,
                            children: [
                                { key: 'finance-guide', label: 'Quản lý Thu/Chi' },
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
