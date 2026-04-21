1. Kiến trúc Giao diện (Front-end Components)
Header (Global Navigation):

Identity: Logo HULA (Link to www.nemmamnon.com).

Auth Context: Lời chào cá nhân hóa dựa trên JWT/Session (e.g., "Xin chào, {{school_name}}").

Navigation: Quick Order, Order History, B2B Support.

Hero Section (Conversion Focus):

Headline: CỔNG ĐỐI TÁC ĐỘC QUYỀN – ĐẶT HÀNG SỚM, TỐI ƯU CHI PHÍ.

Promotion Logic: Hiển thị dynamic date {{early_bird_deadline}} và campaign {{discount_rate}}.

CTA: Redirect to History hoặc Product Listing.

Order History & 1-Click Reorder:

Data Table: Fetch dữ liệu từ API /api/v1/orders/history.

Action: Trigger handleReorder(order_id) -> Mở Modal điều chỉnh số lượng.

Product Showcase (New Arrival):

Price Engine: Hiển thị original_price và b2b_discounted_price dựa trên phân hạng đối tác.

Order Tracking Timeline:

Visual Progress: Created -> In Production -> Shipping -> Completed.

2. Luồng Logic Xử lý (Business Logic Workflow)
Để hệ thống vận hành trơn tru giữa Portal và ERP core, chúng ta áp dụng workflow xử lý dữ liệu như sau:

Đoạn mã
graph TD
    A[Partner Logs in] --> B{Check Session}
    B -->|Valid| C[Fetch History & Profile]
    C --> D[Render Dashboard]
    D --> E[Click 1-Click Reorder]
    E --> F[API: Get Order Details]
    F --> G[Populate Reorder Modal]
    G --> H[User Updates Quantity]
    H --> I[Apply B2B Discount 10%]
    I --> J[Generate New Order/Quotation]
    J --> K[Update ERP Production Queue]