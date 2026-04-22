import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

// ============================================================
// B2B PORTAL DASHBOARD
// Design: hula-website CSS globals (Be Vietnam Pro, #23A7D3, card-v2)
// Layout: Header → Hero → Stats → Orders → Promotions → Tracking
// ============================================================

interface CustomerInfo {
    id: number;
    name: string;
    code: string;
    email: string;
    phone: string;
    address?: string;
}

interface OrderItem {
    sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    image_url?: string;
}

interface Order {
    id: number;
    uuid: string;
    order_code: string;
    status: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    order_date: string;
    delivery_date: string;
    assigned_to: { full_name: string } | null;
    items: OrderItem[];
}

interface PromotionInfo {
    id: number;
    name: string;
    description: string;
    discount_type: string;
    discount_value: number;
    start_date: string;
    end_date: string;
}

interface PromotionProduct {
    id: number;
    sku: string;
    name: string;
    unit: string;
    base_price: number;
    image_url?: string;
    category: string;
}

interface DashboardData {
    customer: CustomerInfo;
    stats: { total_orders: number; total_revenue: number; active_orders: number };
    orders: Order[];
    promotions: PromotionInfo[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    QUOTATION: { label: 'Báo giá', color: '#1890ff', bg: '#e6f7ff' },
    SO_PENDING: { label: 'Chờ xử lý', color: '#fa8c16', bg: '#fff7e6' },
    DEPOSITED: { label: 'Đã cọc', color: '#52c41a', bg: '#f6ffed' },
    SAMPLE_APPROVED: { label: 'Duyệt mẫu', color: '#13c2c2', bg: '#e6fffb' },
    IN_PRODUCTION: { label: 'Sản xuất', color: '#722ed1', bg: '#f9f0ff' },
    PLANNED: { label: 'Kế hoạch SX', color: '#722ed1', bg: '#f9f0ff' },
    MANUFACTURING_COMPLETED: { label: 'SX xong', color: '#2f54eb', bg: '#f0f5ff' },
    PARTIAL_DELIVERY: { label: 'Giao một phần', color: '#eb2f96', bg: '#fff0f6' },
    DELIVERED: { label: 'Đã giao', color: '#52c41a', bg: '#f6ffed' },
    COMPLETED: { label: 'Hoàn thành', color: '#389e0d', bg: '#f6ffed' },
    CANCELLED: { label: 'Đã hủy', color: '#ff4d4f', bg: '#fff2f0' },
};

const TRACKING_STEPS = [
    { key: 'CREATED', label: 'Tạo đơn', icon: '📋' },
    { key: 'DEPOSITED', label: 'Đã cọc', icon: '💰' },
    { key: 'IN_PRODUCTION', label: 'Sản xuất', icon: '🏭' },
    { key: 'DELIVERED', label: 'Giao hàng', icon: '🚚' },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: '✅' },
];

const getTrackingStep = (status: string): number => {
    const map: Record<string, number> = {
        QUOTATION: 0, SO_PENDING: 0,
        DEPOSITED: 1, SAMPLE_APPROVED: 2,
        IN_PRODUCTION: 2, PLANNED: 2,
        MANUFACTURING_COMPLETED: 3,
        PARTIAL_DELIVERY: 3, DELIVERED: 3,
        COMPLETED: 4,
        CANCELLED: -1,
    };
    return map[status] ?? 0;
};

const PortalDashboardPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reorderLoading, setReorderLoading] = useState<number | null>(null);
    const [reorderResult, setReorderResult] = useState<{ success: boolean; message: string } | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const token = sessionStorage.getItem('portal_token');

    const fetchDashboard = useCallback(async () => {
        if (!token) {
            navigate('/portal/login');
            return;
        }
        try {
            const res = await axios.get(`${API_URL}/public/portal/dashboard/${slug}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                sessionStorage.clear();
                navigate('/portal/login');
                return;
            }
            setError(err.response?.data?.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [slug, token, navigate]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const handleReorder = async (order: Order) => {
        if (!token) return;
        setReorderLoading(order.id);
        setReorderResult(null);
        try {
            const res = await axios.post(
                `${API_URL}/public/portal/reorder/${slug}`,
                { order_id: order.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReorderResult({ success: true, message: res.data.message || 'Đã tạo báo giá mới!' });
            fetchDashboard();
        } catch (err: any) {
            setReorderResult({ success: false, message: err.response?.data?.message || 'Lỗi đặt hàng lại' });
        } finally {
            setReorderLoading(null);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/portal/login');
    };

    const fmt = (n: number) => Number(n).toLocaleString('vi-VN');

    // ===== PROMOTION MODAL STATE =====
    const [promoModal, setPromoModal] = useState<{ promo: PromotionInfo; products: PromotionProduct[] } | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoCart, setPromoCart] = useState<Record<string, number>>({});
    const [promoOrderLoading, setPromoOrderLoading] = useState(false);

    const openPromoModal = async (promo: PromotionInfo) => {
        if (!token) return;
        setPromoLoading(true);
        try {
            const res = await axios.get(`${API_URL}/public/portal/promotion/${slug}/${promo.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPromoModal({ promo: res.data.promotion, products: res.data.products });
            setPromoCart({});
        } catch (err: any) {
            setReorderResult({ success: false, message: err.response?.data?.message || 'Lỗi tải khuyến mãi' });
        } finally {
            setPromoLoading(false);
        }
    };

    const updatePromoQty = (sku: string, qty: number) => {
        setPromoCart(prev => {
            const next = { ...prev };
            if (qty <= 0) delete next[sku];
            else next[sku] = qty;
            return next;
        });
    };

    const promoCartTotal = promoModal ? Object.entries(promoCart).reduce((sum, [sku, qty]) => {
        const p = promoModal.products.find(x => x.sku === sku);
        return sum + (p ? p.base_price * qty : 0);
    }, 0) : 0;

    const promoDiscount = promoModal ? (
        promoModal.promo.discount_type === 'PERCENTAGE'
            ? promoCartTotal * Number(promoModal.promo.discount_value) / 100
            : Number(promoModal.promo.discount_value)
    ) : 0;

    const handlePromoOrder = async () => {
        if (!token || !promoModal) return;
        const items = Object.entries(promoCart)
            .filter(([, qty]) => qty > 0)
            .map(([sku, qty]) => {
                const p = promoModal.products.find(x => x.sku === sku);
                return { sku, quantity: qty, unit_price: p?.base_price || 0 };
            });
        if (items.length === 0) return;

        setPromoOrderLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/public/portal/promotion/${slug}/${promoModal.promo.id}/order`,
                { items },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReorderResult({ success: true, message: res.data.message || 'Đã tạo báo giá!' });
            setPromoModal(null);
            fetchDashboard();
        } catch (err: any) {
            setReorderResult({ success: false, message: err.response?.data?.message || 'Lỗi đặt hàng' });
        } finally {
            setPromoOrderLoading(false);
        }
    };

    if (loading) return (
        <div style={{ ...S.wrapper, justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
                <div style={{ color: '#666', fontSize: 15 }}>Đang tải dữ liệu...</div>
            </div>
        </div>
    );

    if (error || !data) return (
        <div style={{ ...S.wrapper, justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h2 style={{ color: '#333', marginBottom: 8 }}>Không thể truy cập</h2>
                <p style={{ color: '#888', marginBottom: 24 }}>{error || 'Phiên đăng nhập không hợp lệ'}</p>
                <button onClick={() => navigate('/portal/login')} style={S.primaryBtn}>
                    Đăng nhập lại
                </button>
            </div>
        </div>
    );

    const { customer, stats, orders, promotions } = data;

    return (
        <div style={S.wrapper}>
            {/* ===== HEADER ===== */}
            <header style={S.header}>
                <div style={S.headerInner}>
                    <a href="https://nemmamnon.com" target="_blank" rel="noopener noreferrer" style={S.headerLogo}>
                        <img src="/logo-hula.png" alt="HULA" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
                        {!isMobile && <span style={{ fontSize: 12, color: '#aaa', marginLeft: 10 }}>Cổng Đối Tác</span>}
                    </a>
                    <div style={S.headerRight}>
                        <span style={{ fontSize: 14, color: '#555' }}>
                            Xin chào, <strong style={{ color: '#23A7D3' }}>{customer.name}</strong>
                        </span>
                        <button onClick={handleLogout} style={S.logoutBtn}>Đăng xuất</button>
                    </div>
                </div>
            </header>

            <main style={S.main}>
                {/* ===== HERO SECTION ===== */}
                <section style={S.heroSection}>
                    <div style={S.heroOverlay} />
                    <div style={S.heroContent}>
                        <h1 style={S.heroTitle}>CỔNG ĐỐI TÁC ĐỘC QUYỀN</h1>
                        <p style={S.heroDesc}>
                            Chào mừng <strong>{customer.name}</strong> — Quản lý đơn hàng, đặt hàng nhanh và nhận ưu đãi đối tác.
                        </p>
                        {promotions.length > 0 && (
                            <div style={S.heroBadge}>
                                🎁 {promotions.length} chương trình khuyến mãi đang áp dụng cho bạn
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== STATS CARDS ===== */}
                <section style={S.statsSection}>
                    <div style={S.statsGrid}>
                        <div style={{ ...S.statCard, borderLeftColor: '#23A7D3' }}>
                            <div style={S.statIcon}>📦</div>
                            <div>
                                <div style={S.statValue}>{stats.total_orders}</div>
                                <div style={S.statLabel}>Tổng đơn hàng</div>
                            </div>
                        </div>
                        <div style={{ ...S.statCard, borderLeftColor: '#52c41a' }}>
                            <div style={S.statIcon}>💰</div>
                            <div>
                                <div style={S.statValue}>{fmt(stats.total_revenue)}đ</div>
                                <div style={S.statLabel}>Tổng doanh thu</div>
                            </div>
                        </div>
                        <div style={{ ...S.statCard, borderLeftColor: '#fa8c16' }}>
                            <div style={S.statIcon}>🔄</div>
                            <div>
                                <div style={S.statValue}>{stats.active_orders}</div>
                                <div style={S.statLabel}>Đơn đang xử lý</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== PROMOTIONS ===== */}
                {promotions.length > 0 && (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>🎁 Ưu Đãi Dành Cho Bạn</h2>
                        <div style={S.promoGrid}>
                            {promotions.map(p => (
                                <div key={p.id} style={S.promoCard}>
                                    <div style={S.promoHeader}>
                                        <span style={S.promoBadge}>
                                            {p.discount_type === 'PERCENTAGE' ? `Giảm ${p.discount_value}%` :
                                                p.discount_type === 'FIXED_AMOUNT' ? `Giảm ${fmt(p.discount_value)}đ` : p.discount_type}
                                        </span>
                                    </div>
                                    <h3 style={S.promoName}>{p.name}</h3>
                                    {p.description && <p style={S.promoDesc}>{p.description}</p>}
                                    <div style={S.promoDate}>
                                        📅 {new Date(p.start_date).toLocaleDateString('vi-VN')} - {new Date(p.end_date).toLocaleDateString('vi-VN')}
                                    </div>
                                    {(p.discount_type === 'PERCENTAGE' || p.discount_type === 'FIXED_AMOUNT') && (
                                        <button
                                            onClick={() => openPromoModal(p)}
                                            disabled={promoLoading}
                                            style={{ ...S.reorderBtn, marginTop: 12, width: '100%', padding: '10px 0', fontSize: 13 }}
                                        >
                                            {promoLoading ? '⏳ Đang tải...' : '🛒 Xem & Đặt hàng'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== RESULT MESSAGE ===== */}
                {reorderResult && (
                    <div style={{
                        ...S.resultBox,
                        background: reorderResult.success ? '#f6ffed' : '#fff2f0',
                        borderColor: reorderResult.success ? '#b7eb8f' : '#ffccc7',
                        color: reorderResult.success ? '#389e0d' : '#cf1322',
                    }}>
                        {reorderResult.success ? '✅' : '❌'} {reorderResult.message}
                        <button onClick={() => setReorderResult(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </div>
                )}

                {/* ===== ORDER HISTORY ===== */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>📋 Lịch Sử Đơn Hàng</h2>

                    {orders.length === 0 ? (
                        <div style={S.emptyState}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                            <p style={{ color: '#888' }}>Chưa có đơn hàng nào</p>
                        </div>
                    ) : (
                        <div style={S.orderList}>
                            {orders.map(order => {
                                const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: '#666', bg: '#f5f5f5' };
                                const trackingStep = getTrackingStep(order.status);

                                return (
                                    <div key={order.id} style={S.orderCard}>
                                        {/* Order Header */}
                                        <div style={S.orderHeader}>
                                            <div>
                                                <span style={S.orderCode}>{order.order_code}</span>
                                                <span style={{
                                                    ...S.statusTag,
                                                    color: statusInfo.color,
                                                    background: statusInfo.bg,
                                                    border: `1px solid ${statusInfo.color}22`,
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div style={S.orderDate}>
                                                {new Date(order.order_date).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>

                                        {/* Order Items Preview */}
                                        <div style={S.orderItems}>
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} style={S.orderItem}>
                                                    <span style={S.itemName}>{item.product_name}</span>
                                                    <span style={S.itemQty}>x{item.quantity}</span>
                                                    <span style={S.itemPrice}>{fmt(item.subtotal)}đ</span>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div style={{ fontSize: 12, color: '#999', paddingLeft: 4 }}>
                                                    +{order.items.length - 3} sản phẩm khác
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Footer */}
                                        <div style={S.orderFooter}>
                                            <div>
                                                <span style={S.totalLabel}>Tổng:</span>
                                                <span style={S.totalValue}>{fmt(order.total_amount)}đ</span>
                                                {order.paid_amount > 0 && (
                                                    <span style={S.paidBadge}>Đã thanh toán: {fmt(order.paid_amount)}đ</span>
                                                )}
                                            </div>
                                            <div style={S.orderActions}>
                                                <button
                                                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                                    style={S.outlineBtn}
                                                >
                                                    {selectedOrder?.id === order.id ? 'Ẩn' : '👁 Theo dõi'}
                                                </button>
                                                <a
                                                    href={`/portal/quote/${order.uuid}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ ...S.outlineBtn, textDecoration: 'none' }}
                                                >
                                                    📄 Xem báo giá
                                                </a>
                                                {order.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        disabled={reorderLoading === order.id}
                                                        style={{
                                                            ...S.reorderBtn,
                                                            opacity: reorderLoading === order.id ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {reorderLoading === order.id ? '⏳...' : '🔁 Đặt lại'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tracking Timeline (expandable) */}
                                        {selectedOrder?.id === order.id && order.status !== 'CANCELLED' && (
                                            <div style={S.trackingSection}>
                                                <div style={S.trackingTitle}>📍 Theo dõi đơn hàng</div>
                                                <div style={S.trackingTimeline}>
                                                    {TRACKING_STEPS.map((step, idx) => {
                                                        const isActive = idx <= trackingStep;
                                                        const isCurrent = idx === trackingStep;
                                                        return (
                                                            <div key={step.key} style={S.trackingStep}>
                                                                <div style={{
                                                                    ...S.trackingDot,
                                                                    background: isActive ? '#23A7D3' : '#e0e0e0',
                                                                    transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
                                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(35,167,211,0.2)' : 'none',
                                                                }}>
                                                                    <span style={{ fontSize: 14 }}>{step.icon}</span>
                                                                </div>
                                                                {idx < TRACKING_STEPS.length - 1 && (
                                                                    <div style={{
                                                                        ...S.trackingLine,
                                                                        background: idx < trackingStep ? '#23A7D3' : '#e0e0e0',
                                                                    }} />
                                                                )}
                                                                <div style={{
                                                                    ...S.trackingLabel,
                                                                    color: isActive ? '#23A7D3' : '#aaa',
                                                                    fontWeight: isCurrent ? 700 : 400,
                                                                }}>
                                                                    {step.label}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ===== B2B SUPPORT ===== */}
                <section style={S.section}>
                    <div style={S.supportCard}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>Hỗ Trợ B2B</h3>
                        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
                            Cần hỗ trợ về đơn hàng, báo giá hoặc sản phẩm? Liên hệ đội ngũ Sales ngay.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="tel:0983882210" style={{ ...S.supportBtn, background: '#23A7D3', color: '#fff' }}>
                                📞 Hotline
                            </a>
                            <a href="mailto:sales@nemmamnon.com" style={{ ...S.supportBtn, background: '#fff', color: '#23A7D3', border: '1px solid #23A7D3' }}>
                                ✉️ Email
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* ===== PROMOTION DETAIL MODAL ===== */}
            {promoModal && (
                <div style={S.modalOverlay} onClick={() => setPromoModal(null)}>
                    <div style={S.modalContent} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={S.modalHeader}>
                            <div>
                                <span style={{ ...S.promoBadge, fontSize: 11, marginRight: 8 }}>
                                    {promoModal.promo.discount_type === 'PERCENTAGE'
                                        ? `Giảm ${promoModal.promo.discount_value}%`
                                        : `Giảm ${fmt(promoModal.promo.discount_value)}đ`}
                                </span>
                                <span style={{ fontSize: 11, color: '#999' }}>
                                    📅 {new Date(promoModal.promo.start_date).toLocaleDateString('vi-VN')} - {new Date(promoModal.promo.end_date).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <button onClick={() => setPromoModal(null)} style={S.modalClose}>✕</button>
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>🎁 {promoModal.promo.name}</h2>
                        {promoModal.promo.description && (
                            <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.5 }}>{promoModal.promo.description}</p>
                        )}

                        {/* Product List */}
                        {promoModal.products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                                <p>Chương trình này chưa có sản phẩm cụ thể.<br />Vui lòng liên hệ Sales để biết thêm chi tiết.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>Chọn sản phẩm ({promoModal.products.length})</div>
                                <div style={S.productList}>
                                    {promoModal.products.map(p => {
                                        const qty = promoCart[p.sku] || 0;
                                        return (
                                            <div key={p.sku} style={S.productRow}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                    <div style={{ fontSize: 11, color: '#aaa' }}>{p.sku} • {p.unit || 'Cái'}{p.category ? ` • ${p.category}` : ''}</div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#23A7D3', marginTop: 2 }}>{fmt(p.base_price)}đ</div>
                                                </div>
                                                <div style={S.qtyControl}>
                                                    <button onClick={() => updatePromoQty(p.sku, qty - 1)} style={S.qtyBtn} disabled={qty <= 0}>−</button>
                                                    <input
                                                        type="number"
                                                        value={qty}
                                                        onChange={e => updatePromoQty(p.sku, Math.max(0, parseInt(e.target.value) || 0))}
                                                        style={S.qtyInput}
                                                        min={0}
                                                    />
                                                    <button onClick={() => updatePromoQty(p.sku, qty + 1)} style={S.qtyBtn}>+</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary */}
                                {Object.keys(promoCart).length > 0 && (
                                    <div style={S.promoSummary}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: '#888' }}>Tạm tính:</span>
                                            <span style={{ fontWeight: 600 }}>{fmt(promoCartTotal)}đ</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: '#fa8c16' }}>Giảm giá:</span>
                                            <span style={{ fontWeight: 700, color: '#fa8c16' }}>-{fmt(promoDiscount)}đ</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 8, marginTop: 4 }}>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>Ước tính:</span>
                                            <span style={{ fontWeight: 800, fontSize: 16, color: '#23A7D3' }}>{fmt(Math.max(0, promoCartTotal - promoDiscount))}đ</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handlePromoOrder}
                                    disabled={promoOrderLoading || Object.keys(promoCart).length === 0}
                                    style={{
                                        ...S.primaryBtn,
                                        width: '100%',
                                        marginTop: 12,
                                        opacity: (promoOrderLoading || Object.keys(promoCart).length === 0) ? 0.5 : 1,
                                    }}
                                >
                                    {promoOrderLoading ? '⏳ Đang xử lý...' : '🛒 Tạo Báo Giá Từ Ưu Đãi'}
                                </button>
                                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 8 }}>
                                    Báo giá sẽ được đội Sales xác nhận trước khi chốt đơn.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ===== FOOTER ===== */}
            <footer style={S.footer}>
                <p>© 2024 HULA — Nệm Mầm Non | Cổng Đối Tác B2B</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>
                    <a href="https://nemmamnon.com" style={{ color: '#23A7D3', textDecoration: 'none' }}>nemmamnon.com</a>
                    {' '} | erp.nemmamnon.com
                </p>
            </footer>
        </div>
    );
};

// ============================================================
// STYLES
// ============================================================
const S: Record<string, React.CSSProperties> = {
    wrapper: {
        minHeight: '100vh',
        background: '#f4f7fa',
        fontFamily: "'Be Vietnam Pro', 'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
    },
    // Header
    header: {
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },
    headerInner: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLogo: {
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    logoutBtn: {
        padding: '6px 16px',
        background: 'transparent',
        border: '1px solid #ddd',
        borderRadius: 20,
        fontSize: 12,
        color: '#888',
        cursor: 'pointer',
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    // Main
    main: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 20px 40px',
        width: '100%',
        flex: 1,
    },
    // Hero
    heroSection: {
        background: 'linear-gradient(135deg, #23A7D3 0%, #1a8daf 50%, #156b87 100%)',
        borderRadius: '0 0 24px 24px',
        padding: '48px 32px',
        textAlign: 'center' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        marginBottom: 24,
    },
    heroOverlay: {
        position: 'absolute' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.5,
    },
    heroContent: {
        position: 'relative' as const,
        zIndex: 1,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: 3,
        margin: '0 0 12px',
        textShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    heroDesc: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        maxWidth: 500,
        margin: '0 auto 16px',
        lineHeight: 1.6,
    },
    heroBadge: {
        display: 'inline-block',
        padding: '8px 20px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: 50,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.2)',
    },
    // Stats
    statsSection: {
        marginBottom: 24,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
    },
    statCard: {
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderLeft: '4px solid',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    statIcon: { fontSize: 32 },
    statValue: { fontSize: 22, fontWeight: 800, color: '#1a1a1a' },
    statLabel: { fontSize: 13, color: '#888', marginTop: 2 },
    // Sections
    section: { marginBottom: 32 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 800,
        color: '#1a1a1a',
        marginBottom: 16,
    },
    // Promotions
    promoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    promoCard: {
        background: 'linear-gradient(135deg, #fffbf0 0%, #fff7e8 100%)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #ffe4a0',
        boxShadow: '0 2px 8px rgba(250,140,22,0.08)',
    },
    promoHeader: { marginBottom: 10 },
    promoBadge: {
        display: 'inline-block',
        padding: '4px 14px',
        background: 'linear-gradient(135deg, #fa8c16, #ffa940)',
        color: '#fff',
        borderRadius: 50,
        fontSize: 12,
        fontWeight: 700,
    },
    promoName: { fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 4 },
    promoDesc: { fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 1.5 },
    promoDate: { fontSize: 12, color: '#aaa' },
    // Orders
    orderList: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
    orderCard: {
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        transition: 'box-shadow 0.2s',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap' as const,
        gap: 8,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: 800,
        color: '#23A7D3',
        marginRight: 10,
    },
    statusTag: {
        display: 'inline-block',
        padding: '3px 12px',
        borderRadius: 50,
        fontSize: 11,
        fontWeight: 700,
    },
    orderDate: { fontSize: 13, color: '#aaa' },
    orderItems: {
        borderTop: '1px solid #f5f5f5',
        borderBottom: '1px solid #f5f5f5',
        padding: '10px 0',
        marginBottom: 12,
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0',
        gap: 8,
    },
    itemName: { flex: 1, fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    itemQty: { fontSize: 12, color: '#999', minWidth: 30, textAlign: 'center' as const },
    itemPrice: { fontSize: 13, fontWeight: 600, color: '#333', minWidth: 80, textAlign: 'right' as const },
    orderFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: 12,
    },
    totalLabel: { fontSize: 14, color: '#888', marginRight: 6 },
    totalValue: { fontSize: 18, fontWeight: 800, color: '#23A7D3' },
    paidBadge: {
        display: 'inline-block',
        marginLeft: 10,
        padding: '2px 10px',
        background: '#f6ffed',
        color: '#52c41a',
        borderRadius: 50,
        fontSize: 11,
        fontWeight: 600,
    },
    orderActions: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap' as const,
    },
    outlineBtn: {
        padding: '6px 14px',
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 20,
        fontSize: 12,
        color: '#555',
        cursor: 'pointer',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
    },
    reorderBtn: {
        padding: '6px 14px',
        background: 'linear-gradient(135deg, #23A7D3, #1e8fb5)',
        border: 'none',
        borderRadius: 20,
        fontSize: 12,
        color: '#fff',
        cursor: 'pointer',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontWeight: 700,
    },
    // Tracking
    trackingSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px dashed #eee',
    },
    trackingTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: '#333',
        marginBottom: 16,
    },
    trackingTimeline: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    trackingStep: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        flex: 1,
        position: 'relative' as const,
    },
    trackingDot: {
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s',
        marginBottom: 6,
    },
    trackingLine: {
        position: 'absolute' as const,
        top: 18,
        left: '50%',
        width: '100%',
        height: 3,
        borderRadius: 2,
        zIndex: 0,
    },
    trackingLabel: {
        fontSize: 11,
        textAlign: 'center' as const,
        transition: 'color 0.3s',
    },
    // Support
    supportCard: {
        background: 'linear-gradient(135deg, #f0faff 0%, #e8f7fc 100%)',
        borderRadius: 20,
        padding: '32px 24px',
        textAlign: 'center' as const,
        border: '1px solid rgba(35,167,211,0.15)',
    },
    supportBtn: {
        padding: '10px 24px',
        borderRadius: 50,
        fontSize: 13,
        fontWeight: 700,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    // Empty & result
    emptyState: { textAlign: 'center' as const, padding: '48px 20px' },
    resultBox: {
        padding: '12px 20px',
        borderRadius: 12,
        border: '1px solid',
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtn: {
        padding: '12px 28px',
        background: 'linear-gradient(135deg, #23A7D3, #1e8fb5)',
        color: '#fff',
        border: 'none',
        borderRadius: 50,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    // Footer
    footer: {
        textAlign: 'center' as const,
        padding: '20px',
        color: '#aaa',
        fontSize: 12,
        borderTop: '1px solid #eee',
        background: '#fff',
    },
    // Promotion Modal
    modalOverlay: {
        position: 'fixed' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        maxWidth: 520,
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto' as const,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        position: 'relative' as const,
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalClose: {
        background: 'none',
        border: 'none',
        fontSize: 20,
        color: '#aaa',
        cursor: 'pointer',
        padding: '4px 8px',
    },
    productList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 10,
        maxHeight: 320,
        overflowY: 'auto' as const,
        marginBottom: 16,
    },
    productRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: '#f9fafb',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
    },
    qtyControl: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
    },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid #d9d9d9',
        background: '#fff',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    qtyInput: {
        width: 44,
        height: 30,
        borderRadius: 8,
        border: '1px solid #d9d9d9',
        textAlign: 'center' as const,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        outline: 'none',
    },
    promoSummary: {
        background: 'linear-gradient(135deg, #f0faff 0%, #e8f7fc 100%)',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid rgba(35,167,211,0.15)',
        fontSize: 14,
    },
};

export default PortalDashboardPage;
