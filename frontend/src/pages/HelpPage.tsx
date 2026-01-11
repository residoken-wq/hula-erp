import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Steps, Divider, Tag, Alert, Row, Col, Button, Breadcrumb, Tree, Descriptions } from 'antd';
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
    BellOutlined,
    ProjectOutlined,
    AppstoreAddOutlined,
    ExperimentOutlined,
    BranchesOutlined,
    DatabaseOutlined,
    TagsOutlined,
    GiftOutlined,
    ContainerOutlined,
    CalculatorOutlined,
    ShoppingCartOutlined,
    WalletOutlined,
    HeartOutlined
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

                        <Divider style={{ margin: '40px 0' }} />

                        <Tag color="cyan" style={{ marginBottom: 16 }}>Tổng quan hệ thống</Tag>
                        <Title level={2}>🔄 Quy trình Vận hành Tổng thể (Overall Workflow)</Title>
                        <Paragraph>
                            Hệ thống HULA ERP vận hành theo luồng dữ liệu khép kín, đảm bảo tính liên kết chặt chẽ giữa các phòng ban.
                            Dưới đây là hành trình của một đơn hàng từ khi phát sinh nhu cầu đến khi hoàn tất thanh toán.
                        </Paragraph>

                        <Steps
                            direction="vertical"
                            current={-1}
                            items={[
                                {
                                    title: <Text strong>1. Kinh Doanh (Sales)</Text>,
                                    description: 'Tiếp nhận yêu cầu -> Tạo Báo giá (Quote) -> Chốt Đơn hàng (SO).',
                                    icon: <SolutionOutlined />,
                                    status: 'process'
                                },
                                {
                                    title: <Text strong>2. Kế Hoạch (Planning)</Text>,
                                    description: 'Tổng hợp các SO đã chốt -> Chạy phân tích MRP -> Xác định nhu cầu Nguyên phụ liệu (NPL) & Gia công.',
                                    icon: <ProjectOutlined />,
                                    status: 'wait'
                                },
                                {
                                    title: <Text strong>3. Mua Hàng (Purchasing)</Text>,
                                    description: 'Tạo Đơn mua hàng (PO) từ yêu cầu của bộ phận Kế hoạch -> Gửi cho Nhà cung cấp.',
                                    icon: <ShopOutlined />,
                                    status: 'wait'
                                },
                                {
                                    title: <Text strong>4. Kho Vận (Inventory)</Text>,
                                    description: 'Nhập kho NPL (GRN) -> Soạn hàng & Xuất kho cho Sản xuất hoặc Giao hàng.',
                                    icon: <ContainerOutlined />,
                                    status: 'wait'
                                },
                                {
                                    title: <Text strong>5. Sản Xuất (Production)</Text>,
                                    description: 'Nhận NPL -> Thực hiện gia công (Cắt/May/Ủi) -> Nhập kho Thành phẩm.',
                                    icon: <ExperimentOutlined />,
                                    status: 'wait'
                                },
                                {
                                    title: <Text strong>6. Giao Hàng (Logistics)</Text>,
                                    description: 'Đóng gói thành phẩm -> Giao cho khách hàng (Delivery Note).',
                                    icon: <CarOutlined />,
                                    status: 'wait'
                                },
                                {
                                    title: <Text strong>7. Tài Chính (Finance)</Text>,
                                    description: 'Xuất hóa đơn GTGT -> Theo dõi công nợ -> Thu tiền (Payment).',
                                    icon: <DollarOutlined />,
                                    status: 'wait'
                                }
                            ]}
                        />

                        <Divider />
                        <Title level={4}>Vai trò của từng bộ phận</Title>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Kinh Doanh" bordered={false} style={{ background: '#e6f7ff' }}>
                                    Người khởi tạo quy trình. Chịu trách nhiệm về doanh số và thông tin khách hàng.
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Kế Hoạch & Mua Hàng" bordered={false} style={{ background: '#f6ffed' }}>
                                    "Bộ não" của sản xuất. Đảm bảo có đủ nguyên liệu đúng lúc, đúng chỗ.
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Kho & Sản Xuất" bordered={false} style={{ background: '#fff7e6' }}>
                                    Bộ phận thực thi. Chuyển hóa nguyên liệu thành sản phẩm cuối cùng.
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Kế Toán" bordered={false} style={{ background: '#fff0f6' }}>
                                    Người gác đền. Kiểm soát dòng tiền và hạch toán chính xác.
                                </Card>
                            </Col>
                        </Row>
                    </div>
                );
            case 'internal-sales':
                return (
                    <div>
                        <Tag color="geekblue" style={{ marginBottom: 16 }}>Nghiệp vụ đặc biệt</Tag>
                        <Title level={2}>🏢 Quy trình Bán hàng Nội bộ (Internal SO)</Title>
                        <Paragraph>
                            Đơn hàng nội bộ (Internal Sales Order) được sử dụng khi xuất hàng cho các mục đích không phát sinh doanh thu thương mại thông thường, ví dụ:
                            xuất chuyển kho chi nhánh, xuất cho nhân viên mua ưu đãi, hoặc xuất làm mẫu marketing.
                        </Paragraph>

                        <Divider orientation="left">Quy trình thực hiện</Divider>
                        <Steps
                            current={-1}
                            direction="vertical"
                            items={[
                                {
                                    title: 'Bước 1: Tạo Khách hàng "Nội bộ"',
                                    description: (
                                        <div>
                                            Tạo một mã khách hàng đại diện cho phòng ban hoặc mục đích sử dụng.
                                            <ul>
                                                <li><b>Tên KH:</b> CÔNG TY ABC - PHÒNG MARKETING</li>
                                                <li><b>Phân loại:</b> Chọn nhóm khách hàng là "Internal" (nếu có) để dễ lọc báo cáo.</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <UserOutlined />
                                },
                                {
                                    title: 'Bước 2: Tạo Đơn hàng (SO)',
                                    description: 'Tạo SO như bình thường, chọn Khách hàng nội bộ vừa tạo.',
                                    icon: <FileDoneOutlined />
                                },
                                {
                                    title: 'Bước 3: Áp dụng Chính sách giá',
                                    description: (
                                        <div>
                                            <Paragraph>Tùy theo mục đích mà chọn giá bán phù hợp:</Paragraph>
                                            <ul>
                                                <li><b>Xuất dùng/Biếu tặng:</b> Đơn giá = 0 (Hoặc dùng chức năng Discount 100%).</li>
                                                <li><b>Bán cho nhân viên:</b> Sử dụng <b>"Internal Price List"</b> (Thường bằng Giá vốn + Chi phí quản lý).</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <DollarOutlined />
                                },
                                {
                                    title: 'Bước 4: Duyệt & Xuất kho',
                                    description: 'Quy trình duyệt và xuất kho thực hiện tương tự đơn hàng thương mại để đảm bảo trừ tồn kho chính xác.',
                                    icon: <CheckCircleOutlined />
                                }
                            ]}
                        />

                        <Alert
                            message="Lưu ý về Hạch toán"
                            description="Đối với đơn hàng nội bộ giá 0 đồng, Kế toán cần hạch toán vào Chi phí (Marketing, Phúc lợi...) thay vì Doanh thu thuần."
                            type="warning"
                            showIcon
                            style={{ marginTop: 24 }}
                        />
                    </div>
                );
            case 'sales-process':
                return (
                    <div>
                        <Tag color="blue" style={{ marginBottom: 16 }}>Modules: Sales</Tag>
                        <Title level={2}>🤝 Quy trình phối kết hợp Bán hàng (Wholesale Sales Workflow)</Title>
                        <Paragraph>
                            Quy trình phối hợp chặt chẽ giữa <b>Sales Team</b>, <b>Purchasing Team</b> (Mua hàng) và <b>Production Team</b> (Sản xuất/Kho) để phục vụ khách hàng sỉ.
                        </Paragraph>

                        {/* PHASE 1: LEAD & CONSULTING */}
                        <Card title="Giai đoạn 1: Chăm sóc & Tư vấn (Pre-Sales)" style={{ marginBottom: 20, borderColor: '#91d5ff' }}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Steps direction="vertical" size="small" current={-1} items={[
                                        {
                                            title: <Text strong>1. Chăm sóc Lead & Tư vấn giải pháp</Text>,
                                            description: 'Sales Team tiếp nhận Lead từ thị trường, tư vấn giải pháp, dịch vụ vượt trội và sản phẩm phù hợp.',
                                            icon: <UserOutlined style={{ color: '#1890ff' }} />
                                        },
                                        {
                                            title: <Text strong>2. Kiểm tra tồn kho (Kho - Production Team)</Text>,
                                            description: 'Sales Team phối hợp với Kho (Production) để kiểm tra số lượng tồn kho và lên kế hoạch giao nhận sơ bộ.',
                                            icon: <ShopOutlined style={{ color: '#52c41a' }} />
                                        },
                                        {
                                            title: <Text strong>3. Báo giá khả thi</Text>,
                                            description: 'Dựa trên năng lực cung ứng và tồn kho, Sales Team gửi báo giá khả thi cho khách hàng.',
                                            icon: <DollarOutlined style={{ color: '#faad14' }} />
                                        }
                                    ]} />
                                </Col>
                            </Row>
                        </Card>

                        {/* PHASE 2: ORDER & PLANNING */}
                        <Card title="Giai đoạn 2: Đơn hàng & Kế hoạch (Order Processing)" style={{ marginBottom: 20, borderColor: '#ffd666' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={10}>
                                    <Card size="small" title="Sales Team" bordered={false} style={{ background: '#e6f7ff' }}>
                                        <div style={{ fontWeight: 600, marginBottom: 5 }}>2. Đơn hàng (Sale Order)</div>
                                        <ul>
                                            <li>Chốt sản phẩm mẫu & Chi tiết đơn hàng.</li>
                                            <li>Xác nhận thông tin giao hàng.</li>
                                            <li>Ký kết Hợp đồng & Nhận thanh toán.</li>
                                        </ul>
                                    </Card>
                                </Col>
                                <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontSize: 20 }}>➔</div>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" title="Phối hợp Liên phòng ban" bordered={false} style={{ background: '#fffbe6' }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <Tag color="orange">Purchasing Team</Tag>
                                            <br />
                                            <span>Nhận BOM ➔ Tạo <b>2. PO NPL</b> (Nguyên phụ liệu) dựa trên thông tin giao hàng & hợp đồng.</span>
                                        </div>
                                        <div>
                                            <Tag color="green">Production Team</Tag>
                                            <br />
                                            <span>Tiếp nhận <b>2. KHSX</b> (Kế hoạch SX) ➔ Lên PO NGC, Kiểm soát chất lượng SP & Kế hoạch giao hàng chi tiết.</span>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>

                        {/* PHASE 3: DELIVERY */}
                        <Card title="Giai đoạn 3: Giao hàng & Sau bán hàng" style={{ marginBottom: 20, borderColor: '#95de64' }}>
                            <Steps direction="vertical" size="small" current={-1} items={[
                                {
                                    title: <Text strong>3. Giao hàng & Thanh lý HĐ</Text>,
                                    description: (
                                        <div>
                                            <ul>
                                                <li><b>Production Team:</b> Thực hiện Đóng gói & Vận chuyển (Giao hàng).</li>
                                                <li><b>Sales Team:</b> Phối hợp bàn giao, làm thủ tục thanh lý hợp đồng và đo lường mức độ hài lòng của khách.</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <CarOutlined style={{ color: '#13c2c2' }} />
                                },
                                {
                                    title: <Text strong>4. Chăm sóc sau bán hàng</Text>,
                                    description: 'Sales Team tiếp tục duy trì mối quan hệ và hỗ trợ khách hàng sau khi đơn hàng hoàn tất.',
                                    icon: <HeartOutlined style={{ color: '#eb2f96' }} />
                                }
                            ]} />
                        </Card>
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
                                    title: 'Bước 3: Xác nhận & Sản Xuất',
                                    description: 'Sale nhấn nút "Duyệt Mẫu" để chuyển sang trạng thái "Đang Sản Xuất" (IN_PRODUCTION).',
                                },
                                {
                                    title: 'Bước 4: Giao hàng (Shipping)',
                                    description: (
                                        <div>
                                            <Paragraph>Sản phẩm hoàn thiện sẽ được xuất kho giao cho khách:</Paragraph>
                                            <ul>
                                                <li><b>Giao 1 Phần (Partial Delivery):</b> Khi chỉ giao trước một số lượng nhỏ.</li>
                                                <li><b>Hoàn tất:</b> Khi đã giao đủ và thu đủ tiền.</li>
                                            </ul>
                                        </div>
                                    ),
                                    status: 'process',
                                },
                                {
                                    title: 'Bước 5: Thông báo Giao hàng (Email)',
                                    description: (
                                        <div>
                                            <Paragraph>Gửi email thông báo tự động cho khách hàng:</Paragraph>
                                            <ul>
                                                <li>Trong tab <b>Giao Hàng (Deliveries)</b>, nhấn nút <b>"Gửi Email"</b> <span style={{ fontSize: 10 }}>✉️</span>.</li>
                                                <li>Hệ thống gửi email chứa thông tin tài xế/đơn vị vận chuyển và link theo dõi.</li>
                                                <li>Trạng thái đơn hàng trên Portal chuyển thành <b>"Đang giao"</b> hoặc <b>"Đã giao"</b>.</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <RocketOutlined style={{ color: '#eb2f96' }} />
                                }
                            ]}
                        />

                        <Divider />
                        <Title level={3}>✅ Trợ lý Kiểm tra (Checklist)</Title>
                        <Paragraph>
                            Để đảm bảo không bỏ sót bước nào trong quy trình, mỗi đơn hàng sẽ có một <b>Checklist</b> tự động (Tab Checklist).
                        </Paragraph>
                        <Alert
                            message="Quy trình tự động"
                            description={
                                <ul>
                                    <li><b>Tự động tạo:</b> Checklist được tạo ngay khi mở đơn hàng.</li>
                                    <li><b>Tự động cập nhật:</b> Khi bạn đổi trạng thái đơn (VD: Từ Báo giá &rarr; Sản xuất), các việc cần làm mới sẽ tự động hiện ra.</li>
                                </ul>
                            }
                            type="info"
                            showIcon
                        />

                        <Divider />
                        <Title level={3}>📷 Tab 7: Mẫu SX Được Duyệt (Sample Images)</Title>
                        <Paragraph>
                            Tab mới cho phép quản lý hình ảnh mẫu sản xuất đã được khách hàng duyệt.
                        </Paragraph>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card title="Tính năng chính" size="small" bordered style={{ borderColor: '#91caff' }}>
                                    <ul>
                                        <li><b>Nhập URL Google Drive:</b> Tối đa 10 hình ảnh mẫu.</li>
                                        <li><b>Xem trước (Slideshow):</b> Carousel hiển thị các hình ảnh.</li>
                                        <li><b>Nút Duyệt mẫu SX:</b> Chuyển từ footer lên tab này.</li>
                                        <li><b>Ribbon Badge:</b> Hiện "✓ Đã duyệt" khi mẫu được approve.</li>
                                    </ul>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Portal Khách Hàng" size="small" bordered style={{ borderColor: '#b7eb8f' }}>
                                    <ul>
                                        <li><b>Slideshow công khai:</b> Khách hàng xem được hình mẫu đã duyệt ngay trên Portal.</li>
                                        <li><b>Click phóng to:</b> Xem chi tiết từng hình ảnh.</li>
                                        <li><b>Minh bạch:</b> Khách biết chính xác mẫu sản xuất đã thống nhất.</li>
                                    </ul>
                                </Card>
                            </Col>
                        </Row>
                        <Alert
                            message="Hỗ trợ Google Drive"
                            description="Hệ thống tự động chuyển đổi link chia sẻ Google Drive (https://drive.google.com/file/d/xxx/view) thành link trực tiếp để hiển thị hình ảnh."
                            type="success"
                            showIcon
                            style={{ marginTop: 16 }}
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
            case 'sales-pos':
                return (
                    <div>
                        <Tag color="cyan" style={{ marginBottom: 16 }}>Bán lẻ & Cửa hàng</Tag>
                        <Title level={2}>🏪 Bán Lẻ Tại Quầy (POS)</Title>
                        <Paragraph>
                            Giao diện POS (Point of Sale) được thiết kế tối giản để nhân viên bán hàng thao tác nhanh chóng, chính xác ngay tại quầy thu ngân.
                        </Paragraph>

                        <Row gutter={16}>
                            <Col span={16}>
                                <Card title="Quy trình Bán hàng POS" bordered={false} style={{ background: '#f9f9f9' }}>
                                    <Steps
                                        current={-1}
                                        items={[
                                            { title: 'Chọn Hàng', description: 'Quét mã vạch hoặc tìm tên.', icon: <SearchOutlined /> },
                                            { title: 'Giỏ Hàng', description: 'Điều chỉnh số lượng.', icon: <ShoppingCartOutlined /> },
                                            { title: 'Khách Hàng', description: 'Chọn thành viên (nếu có).', icon: <UserOutlined /> },
                                            { title: 'Thanh Toán', description: 'Xuất phiếu thu ngay lập tức.', icon: <WalletOutlined /> },
                                        ]}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Alert
                                    message="Kiểm soát Tồn kho"
                                    description="Hệ thống tự động chặn không cho thêm vào giỏ hàng đối với các sản phẩm có Tồn kho < 0 để tránh bán âm."
                                    type="error"
                                    showIcon
                                />
                            </Col>
                        </Row>

                        <Divider orientation="left">Các tính năng chính</Divider>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card size="small" title="1. Tra cứu thông minh">
                                    Hỗ trợ tìm kiếm theo <b>Tên, SKU</b> hoặc <b>Barcode</b>. Hiển thị ngay hình ảnh sản phẩm và giá bán để nhân viên dễ tư vấn.
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" title="2. Quản lý Khách lẻ">
                                    Mặc định là "Khách lẻ". Bạn có thể chọn khách hàng thành viên để tích điểm hoặc áp dụng chính sách giá riêng.
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" title="3. Xử lý nhanh">
                                    Thanh toán 1 chạm. Đơn hàng sau khi hoàn tất sẽ tự động chuyển trạng thái <b>COMPLETED</b> và trừ tồn kho ngay lập tức.
                                </Card>
                            </Col>
                        </Row>
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
            case 'mrp-guide':
                return (
                    <div>
                        <Tag color="volcano" style={{ marginBottom: 16 }}>Sản Xuất & Kho</Tag>
                        <Title level={2}>🏭 Quản lý Nhu Cầu Nguyên Liệu (MRP)</Title>
                        <Paragraph>
                            Phân hệ Planning giúp tính toán tự động nhu cầu nguyên vật liệu (Material) và gia công (Outsourcing) dựa trên các đơn hàng bán (Sales Orders).
                        </Paragraph>

                        <Divider orientation="left">I. Quy trình vận hành MRP</Divider>
                        <Steps
                            current={-1}
                            direction="vertical"
                            items={[
                                {
                                    title: 'Bước 1: Gom đơn hàng (Planning)',
                                    description: 'Tại màn hình Sales Order, chọn các đơn hàng "Đã duyệt mẫu" để lập thành một Kế hoạch Sản xuất (Purchase Plan).',
                                    icon: <ProjectOutlined />
                                },
                                {
                                    title: 'Bước 2: Phân tích MRP (Analysis)',
                                    description: (
                                        <div>
                                            <ul>
                                                <li><b>Nguyên liệu (BOM):</b> Hệ thống bóc tách BOM để tính tổng lượng vải/phụ liệu cần thiết.</li>
                                                <li><b>Gia công (Routing):</b> Dựa trên quy trình (Cắt &rarr; May &rarr; Ủi) để tính chi phí và số lượng cần thuê ngoài.</li>
                                                <li><b>Cân đối kho:</b> <i>Cần mua = Tổng nhu cầu - (Tồn kho thực tế - Đang giữ chỗ)</i>.</li>
                                            </ul>
                                        </div>
                                    ),
                                    icon: <ExperimentOutlined />
                                },
                                {
                                    title: 'Bước 3: Tạo Đơn Mua Hàng (PO)',
                                    description: (
                                        <ul>
                                            <li>Dựa trên kết quả phân tích, nhấn "Tạo PO" để hệ thống tự động sinh ra các đơn hàng nháp.</li>
                                            <li><b>Lưu ý:</b> PO được tách tự động theo Nhà cung cấp (Supplier).</li>
                                        </ul>
                                    ),
                                    icon: <AppstoreAddOutlined />
                                }
                            ]}
                        />

                        <Divider orientation="left">II. Tính năng Gộp Đơn (Pooled Order)</Divider>
                        <Alert
                            message="Tại sao cần gộp đơn?"
                            description="Thay vì gửi 10 đơn lẻ lắt nhắt cho cùng 1 nhà cung cấp, bạn có thể gộp chúng lại thành 1 đơn lớn để dễ theo dõi và vận chuyển."
                            type="info"
                            showIcon
                            style={{ marginBottom: 20 }}
                        />

                        <Card title="Hướng dẫn tạo PO Gộp" size="small" bordered>
                            <Steps
                                progressDot
                                current={-1}
                                items={[
                                    {
                                        title: 'Bước 1: Chốt đơn lẻ',
                                        description: 'Đảm bảo các PO con (NPL hoặc Gia công) đã ở trạng thái "Đã đặt hàng" (ORDERED).'
                                    },
                                    {
                                        title: 'Bước 2: Vào Tab Tổng Hợp',
                                        description: 'Truy cập menu Purchasing &rarr; Tab "Tổng Hợp Nhu Cầu NPL" (hoặc GC).'
                                    },
                                    {
                                        title: 'Bước 3: Chọn & Gộp',
                                        description: 'Tích chọn nhiều PO cùng loại &rarr; Nhấn nút "+ Tạo PO Gộp" &rarr; Chọn Nhà cung cấp tổng.'
                                    },
                                    {
                                        title: 'Bước 4: Theo dõi',
                                        description: 'PO Gộp mới sẽ xuất hiện ở Tab "PO Gộp" với danh sách các PO con bên trong.'
                                    }
                                ]}
                            />
                        </Card>

                        <Divider orientation="left">III. Thuật ngữ quan trọng</Divider>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card size="small" title="BOM (Bill of Materials)">
                                    Định mức nguyên vật liệu. Quy định 1 sản phẩm cần bao nhiêu vải, chỉ, nút...
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" title="Wastage (Hao hụt)">
                                    % nguyên liệu dư thừa dự kiến trong quá trình sản xuất (VD: cắt vải vụn).
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" title="Routing (Quy trình)">
                                    Thứ tự các bước gia công (Cắt &rarr; In &rarr; May). Mỗi bước có thể làm tại xưởng hoặc gửi ngoài.
                                </Card>
                            </Col>
                        </Row>
                    </div>
                );
            case 'product-guide':
                return (
                    <div>
                        <Tag color="geekblue" style={{ marginBottom: 16 }}>Kho & Sản Phẩm</Tag>
                        <Title level={2}>🧬 Cấu trúc Sản phẩm & Biến thể</Title>
                        <Paragraph>
                            HULA ERP sử dụng mô hình sản phẩm cha-con (Master-Variant) để quản lý hàng hóa có nhiều thuộc tính (Màu sắc, kích thước...).
                        </Paragraph>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Card title="Mô hình phân cấp (Hierarchy)" size="small">
                                    <Tree
                                        showLine
                                        showIcon
                                        defaultExpandAll
                                        treeData={[
                                            {
                                                title: <Text strong>Áo Thun Basic (Master Product)</Text>,
                                                key: '0-0',
                                                icon: <DatabaseOutlined />,
                                                children: [
                                                    {
                                                        title: 'Thuộc tính: Màu sắc (Color)',
                                                        key: '0-0-0',
                                                        icon: <TagsOutlined />,
                                                        children: [
                                                            { title: 'Đỏ (Red)', key: '0-0-0-0' },
                                                            { title: 'Xanh (Blue)', key: '0-0-0-1' },
                                                        ],
                                                    },
                                                    {
                                                        title: 'Thuộc tính: Size',
                                                        key: '0-0-1',
                                                        icon: <TagsOutlined />,
                                                        children: [
                                                            { title: 'Size M', key: '0-0-1-0' },
                                                            { title: 'Size L', key: '0-0-1-1' },
                                                        ],
                                                    },
                                                    {
                                                        title: 'Thuộc tính: Logo',
                                                        key: '0-0-2',
                                                        icon: <TagsOutlined />,
                                                        children: [
                                                            { title: 'NIKE', key: '0-0-2-0' },
                                                            { title: 'ADIDAS', key: '0-0-2-1' },
                                                        ],
                                                    },
                                                    {
                                                        title: <Text type="success" strong>Biến thể (Variants - SKU)</Text>,
                                                        key: '0-0-3',
                                                        icon: <BranchesOutlined />,
                                                        children: [
                                                            { title: 'Áo Thun - Đỏ - Size M (AT-RED-M)', key: '0-0-3-0', isLeaf: true },
                                                            { title: 'Áo Thun - Đỏ - Size L (AT-RED-L)', key: '0-0-3-1', isLeaf: true },
                                                            { title: 'Áo Thun - Xanh - Size M (AT-BLUE-M)', key: '0-0-3-2', isLeaf: true },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Alert
                                    message="Giải thích thuật ngữ"
                                    description={
                                        <ul>
                                            <li><b>Master Product:</b> Sản phẩm đại diện, chứa thông tin chung (Tên, Mô tả, Quy trình). Không dùng để bán/tồn kho trực tiếp.</li>
                                            <li><b>Attributes:</b> Các thuộc tính biến đổi (Màu, Size, Chất liệu).</li>
                                            <li><b>Variant (SKU):</b> Sản phẩm thực tế được sinh ra từ việc tổ hợp các thuộc tính. Đây là đối tượng để quản lý Tồn kho và Giá bán.</li>
                                        </ul>
                                    }
                                    type="info"
                                    showIcon
                                />
                            </Col>
                        </Row>
                    </div>
                );
            case 'combo-guide':
                return (
                    <div>
                        <Tag color="purple" style={{ marginBottom: 16 }}>Chiến lược bán hàng</Tag>
                        <Title level={2}>🎁 Cấu trúc & Quy trình Combo</Title>
                        <Paragraph>
                            Combo (Gói sản phẩm) là một mã hàng ảo, được cấu thành từ nhiều sản phẩm đơn lẻ khác nhau.
                            Khi bán Combo, kho sẽ trừ tồn của các sản phẩm thành phần.
                        </Paragraph>

                        <Divider orientation="left">Sơ đồ cấu tạo</Divider>
                        <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
                            <Row align="middle" justify="center" gutter={16}>
                                <Col>
                                    <Card size="small" style={{ width: 180, borderColor: '#722ed1' }}>
                                        <GiftOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                                        <div><b>Combo Tết 2024</b></div>
                                        <div style={{ fontSize: 12, color: '#888' }}>(SKU: CBT24)</div>
                                    </Card>
                                </Col>
                                <Col>
                                    <BranchesOutlined style={{ fontSize: 24, color: '#999', transform: 'rotate(90deg)' }} />
                                </Col>
                                <Col>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <Card size="small" style={{ width: 200 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Bánh Quy (x2)</span>
                                                <Tag color="blue">SKU: BQ01</Tag>
                                            </div>
                                        </Card>
                                        <Card size="small" style={{ width: 200 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Rượu Vang (x1)</span>
                                                <Tag color="blue">SKU: RV01</Tag>
                                            </div>
                                        </Card>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <Divider orientation="left">Lưu ý khi vận hành</Divider>
                        <Steps
                            current={-1}
                            items={[
                                { title: 'Tạo Combo', description: 'Vào menu Sản phẩm -> Tạo mới -> Chọn loại "Combo".' },
                                { title: 'Chọn thành phần', description: 'Add các SKU đơn lẻ và số lượng tương ứng.' },
                                { title: 'Giá vốn (COGS)', description: 'Tự động tính bằng Tổng giá vốn các thành phần.' },
                                { title: 'Tồn kho', description: 'Combo không có tồn kho riêng. Số lượng khả dụng = Min(Tồn kho thành phần / Định mức).' },
                            ]}
                        />
                    </div>
                );
            case 'inventory-guide':
                return (
                    <div>
                        <Tag color="cyan" style={{ marginBottom: 16 }}>Quản lý Kho</Tag>
                        <Title level={2}>📦 Quản lý Kho & Quy đổi Đơn vị (Unit Conversion)</Title>
                        <Paragraph>
                            HULA ERP hỗ trợ quản lý đa đơn vị tính cho Nguyên vật liệu (NPL), giúp doanh nghiệp dễ dàng nhập kho theo quy cách mua hàng và xuất kho theo quy cách sản xuất.
                        </Paragraph>

                        <Divider orientation="left">I. Khái niệm cơ bản</Divider>
                        <Row gutter={16} style={{ marginBottom: 20 }}>
                            <Col span={8}>
                                <Card title="Đơn vị Cơ sở (Base Unit)" size="small" bordered>
                                    <Text type="secondary">Là đơn vị nhỏ nhất dùng để tính toán tồn kho và BOM.</Text>
                                    <div style={{ marginTop: 8 }}><b>Ví dụ:</b> Mét (m), Gram (g), Cái (pcs).</div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Đơn vị Mua (Purchase Unit)" size="small" bordered>
                                    <Text type="secondary">Là đơn vị khi đặt hàng từ nhà cung cấp.</Text>
                                    <div style={{ marginTop: 8 }}><b>Ví dụ:</b> Cây (Roll), Bao (Bag), Thùng.</div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Hệ số Quy đổi (Factor)" size="small" bordered>
                                    <Text type="secondary">Tỷ lệ chuyển đổi giữa đơn vị mua và đơn vị cơ sở.</Text>
                                    <div style={{ marginTop: 8 }}><b>Ví dụ:</b> 1 Cây = 50 Mét <br />(Factor = 50).</div>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">II. Công thức quy đổi (Formula)</Divider>
                        <Alert
                            message="Nguyên tắc tính toán"
                            description={
                                <div>
                                    <Paragraph>
                                        Hệ thống luôn quy đổi mọi giao dịch về <b>Đơn vị Cơ sở</b> để ghi nhận vào kho.
                                    </Paragraph>
                                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                                        <li style={{ marginBottom: 10 }}>
                                            <CalculatorOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
                                            <b>Số lượng Tồn kho (Base)</b> = <Text code>Số lượng Nhập (Mua)</Text> × <Text code>Hệ số quy đổi</Text>
                                        </li>
                                        <li>
                                            <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            <b>Giá vốn (Base Cost)</b> = <Text code>Giá mua (Đơn vị mua)</Text> ÷ <Text code>Hệ số quy đổi</Text>
                                        </li>
                                    </ul>
                                </div>
                            }
                            type="success"
                            showIcon
                            icon={<ExperimentOutlined />}
                        />

                        <Divider orientation="left">III. Ví dụ minh họa</Divider>
                        <Card style={{ background: '#fafafa' }}>
                            <Descriptions title="Nhập kho Vải Thun (Mã: V01)" bordered column={1}>
                                <Descriptions.Item label="Thiết lập Ban đầu">
                                    Đơn vị cơ sở: <b>Mét (m)</b> <br />
                                    Đơn vị mua: <b>Cây (Roll)</b> <br />
                                    Hệ số (Conversion Factor): <b>40</b> (Tức là 1 Cây = 40 Mét)
                                </Descriptions.Item>
                                <Descriptions.Item label="Giao dịch Nhập hàng">
                                    Nhập: <b>10 Cây</b> <br />
                                    Đơn giá mua: <b>100.000đ / Cây</b>
                                </Descriptions.Item>
                                <Descriptions.Item label="Kết quả trong Kho">
                                    Tồn kho tăng thêm: 10 * 40 = <b>400 Mét</b> <br />
                                    Giá vốn bình quân: 100.000 / 40 = <b>2.500đ / Mét</b>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                    </div>
                );
            case 'changelog':
                return (
                    <div>
                        <Tag color="green" style={{ marginBottom: 16 }}>Cập nhật mới</Tag>
                        <Title level={2}>🚀 Tính năng mới (từ 31/12/2025)</Title>

                        <Card title="04/01/2026 - Cập nhật Module CRM & Dashboard" style={{ marginBottom: 16 }}>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Chăm sóc Lead (CRM)">
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li>Thêm Tab <b>"Chăm sóc Lead"</b> trong modal Khách hàng</li>
                                        <li>Tổng hợp bình luận từ các đơn hàng + bình luận trực tiếp</li>
                                        <li>Nút <b>"Gợi ý AI"</b> gợi ý trả lời dựa trên lịch sử chat và sản phẩm</li>
                                        <li>Modal <b>Lead Care</b> độc lập - truy cập nhanh từ Dashboard</li>
                                    </ul>
                                </Descriptions.Item>
                                <Descriptions.Item label="Dashboard">
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li><b>"Công việc của tôi"</b> - Hiển thị tasks được phân công</li>
                                        <li><b>"Leads cần chăm sóc"</b> - Danh sách lead chưa chuyển đổi</li>
                                        <li>UI mới với gradient cards, badges count</li>
                                    </ul>
                                </Descriptions.Item>
                                <Descriptions.Item label="Activity Logs">
                                    Sửa cột <b>"Chi tiết thay đổi"</b> - hiển thị old → new rõ ràng
                                </Descriptions.Item>
                                <Descriptions.Item label="Check List trong SO">
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li>Tab <b>"Check List"</b> trong chi tiết đơn hàng</li>
                                        <li>Danh sách công việc cần làm theo từng giai đoạn</li>
                                        <li>Tự động thêm task khi chuyển trạng thái đơn hàng</li>
                                        <li>Đánh dấu hoàn thành với người thực hiện và thời gian</li>
                                    </ul>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="04/01/2026 - Cập nhật Module Khách hàng" style={{ marginBottom: 16 }}>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Tự sinh mã khách hàng">
                                    Mã KH tự động tạo theo format: <Tag color="blue">KH-YYMM-XXXX</Tag>
                                    <br />Ví dụ: KH-2601-0001, KH-2601-0002...
                                </Descriptions.Item>
                                <Descriptions.Item label="Lịch sử mua hàng">
                                    Mặc định hiển thị <b>TẤT CẢ</b> đơn hàng (không lọc theo năm)
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="31/12/2025 - Cập nhật Module Sales" style={{ marginBottom: 16 }}>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Giao hàng từng phần (Partial Delivery)">
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li>Hỗ trợ giao nhiều đợt cho 1 đơn hàng</li>
                                        <li>Theo dõi số lượng đã giao / còn lại</li>
                                        <li>Tự động cập nhật trạng thái: PARTIAL_DELIVERED → DELIVERED</li>
                                    </ul>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tìm kiếm Tài chính">
                                    Tìm kiếm nhanh theo mã đơn hàng, mô tả, tên khách hàng
                                </Descriptions.Item>
                                <Descriptions.Item label="Portal Layout">
                                    Điều chỉnh cột "Sản Phẩm" và "Mô Tả VAT" cho cân đối hơn
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Alert
                            message="Mẹo"
                            description="Các tính năng mới sẽ được cập nhật liên tục. Theo dõi trang này để nắm bắt các thay đổi mới nhất!"
                            type="info"
                            showIcon
                        />
                    </div>
                );
            case 'sales-payment':
                return (
                    <div>
                        <Tag color="cyan" style={{ marginBottom: 16 }}>Phân hệ Bán Hàng</Tag>
                        <Title level={2}>💸 Thanh toán & Tất toán Đơn hàng</Title>
                        <Paragraph>
                            Hệ thống hỗ trợ quản lý thanh toán linh hoạt, cho phép ghi nhận thanh toán từng phần, đặt cọc và xử lý các trường hợp thanh toán thừa (Overpayment).
                        </Paragraph>

                        <Divider orientation="left">I. Quy trình Thanh toán</Divider>
                        <Steps
                            current={-1}
                            items={[
                                { title: 'Mở đơn hàng', description: 'Truy cập chi tiết đơn hàng (SO) cần thanh toán.' },
                                { title: 'Tab Giao Hàng & Thanh Toán', description: 'Chọn tab thứ 3 "Giao Hàng & Thanh Toán".' },
                                { title: 'Thêm thanh toán', description: 'Click nút "Thêm thanh toán" để mở form.' },
                                { title: 'Nhập thông tin', description: 'Nhập số tiền, loại thanh toán, và đính kèm chứng từ (nếu có).' },
                            ]}
                        />

                        <Divider orientation="left">II. Xử lý Thanh toán Thừa & Tất toán</Divider>
                        <Alert
                            message="Tính năng Mới"
                            description="Hệ thống hiện cho phép nhập số tiền thanh toán LỚN HƠN số tiền còn lại của đơn hàng."
                            type="info"
                            showIcon
                            style={{ marginBottom: 20 }}
                        />

                        <Row gutter={16}>
                            <Col span={12}>
                                <Card title="Trường hợp 1: Tạo Credit (Số dư)" size="small">
                                    <Text>Khi khách hàng chuyển khoản dư hoặc muốn để lại tiền thừa cho đơn sau:</Text>
                                    <ul style={{ marginTop: 10 }}>
                                        <li>Hệ thống ghi nhận đơn hàng đã thanh toán đủ.</li>
                                        <li>Phần tiền thừa được tạo thành một giao dịch <b>CREDIT</b>.</li>
                                        <li>Số dư này có thể được dùng để cấn trừ cho các đơn hàng sau.</li>
                                    </ul>
                                    <Tag color="blue">Khuyên dùng</Tag>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Trường hợp 2: Hoàn tiền mặt" size="small">
                                    <Text>Khi cửa hàng trả lại tiền thừa ngay lập tức cho khách:</Text>
                                    <ul style={{ marginTop: 10 }}>
                                        <li>Hệ thống ghi nhận đơn hàng đã thanh toán đủ.</li>
                                        <li>Tự động tạo một phiếu chi <b>(EXPENSE)</b> với lý do hoàn tiền.</li>
                                        <li>Giúp cân bằng sổ quỹ tiền mặt/ngân hàng.</li>
                                    </ul>
                                    <Tag color="orange">Dùng cho khách lẻ</Tag>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">III. Các loại giao dịch</Divider>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
                            <thead style={{ background: '#fafafa' }}>
                                <tr>
                                    <th style={{ padding: 8, border: '1px solid #f0f0f0' }}>Loại</th>
                                    <th style={{ padding: 8, border: '1px solid #f0f0f0' }}>Mô tả</th>
                                    <th style={{ padding: 8, border: '1px solid #f0f0f0' }}>Ý nghĩa</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}><Tag>DEPOSIT</Tag></td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Đặt cọc</td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Khoản thanh toán trước khi giao hàng</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}><Tag color="blue">PAYMENT</Tag></td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Thanh toán</td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Thanh toán thông thường theo đợt</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}><Tag color="green">FINAL</Tag></td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Tất toán</td>
                                    <td style={{ padding: 8, border: '1px solid #f0f0f0' }}>Khoản thanh toán cuối cùng để đóng đơn</td>
                                </tr>
                            </tbody>
                        </table>
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
                        { key: 'changelog', icon: <GiftOutlined />, label: <span style={{ color: '#52c41a', fontWeight: 600 }}>Tính năng mới 🎉</span> },
                        { type: 'divider' },
                        {
                            key: 'sub1',
                            label: 'Phân hệ Bán Hàng',
                            icon: <ShopOutlined />,
                            children: [

                                { key: 'sales-process', label: 'Quy trình Bán hàng' },
                                { key: 'internal-sales', label: 'Bán hàng Nội bộ' }, // <--- NEW
                                { key: 'sales-create', label: 'Tạo đơn mới' },
                                { key: 'sales-approval', label: 'Duyệt mẫu' },
                                { key: 'sales-revisions', label: 'Quản lý version (Báo giá)' }, // <--- NEW
                                { key: 'sales-pos', label: 'Bán Lẻ (POS)' }, // <--- NEW POS
                                { key: 'sales-portal', label: 'Customer Portal' },
                                { key: 'sales-payment', label: 'Thanh toán & Tất toán' }, // <--- NEW PAYMENT
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
                        },
                        {
                            key: 'sub4',
                            label: 'Phân hệ Sản Xuất',
                            icon: <ExperimentOutlined />,
                            children: [
                                { key: 'mrp-guide', label: 'Lập Kế Hoạch (MRP)' },
                                { key: 'product-guide', label: 'Cấu trúc Sản phẩm' },
                                { key: 'combo-guide', label: 'Quản lý Combo' },
                            ]
                        },
                        {
                            key: 'sub5',
                            label: 'Phân hệ Kho Vận',
                            icon: <ContainerOutlined />,
                            children: [
                                { key: 'inventory-guide', label: 'Kho & Quy đổi Đơn vị' },
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
