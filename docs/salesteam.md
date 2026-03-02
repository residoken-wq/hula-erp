# Sales Team Documentation

> Tài liệu tổng hợp cho đội Sales: CRM, Quy trình bán hàng, và Báo cáo.  
> Cập nhật: 02/03/2026

---

## 1. Module CRM (`/crm`)

### 1.1 Mục đích
Quản lý **cơ hội bán hàng (Lead)** từ tiếp cận → báo giá → chốt đơn. Trang CRM gồm 2 tab chính: **Leads** và **Báo Giá**.

### 1.2 Lead Pipeline

| Trạng thái | Mô tả |
|---|---|
| `NEW` – Mới | Khách hàng mới tiếp cận, chưa liên lạc |
| `CONTACTED` – Đã liên hệ | Đã gọi/gặp khách lần đầu |
| `QUALIFIED` – Tiềm năng | Xác nhận nhu cầu thực, có khả năng mua |
| `NEGOTIATION` – Đàm phán | Đang thương lượng giá/điều khoản |
| `WON` – Thành công | Chốt deal, chuyển sang Đơn Hàng |
| `LOST` – Thất bại | Khách từ chối hoặc chọn đối thủ |

### 1.3 Tạo Lead
- **Từ KH có sẵn**: Chọn từ danh sách khách hàng → gắn type `LEAD`
- **KH mới**: Nhập Tên + SĐT → tự tạo mã `LEAD-YYMMDD-XXX`
- **Từ Website**: Khách đăng ký từ website → hệ thống tự tạo Lead với `action: CREATED_FROM_WEBSITE`

### 1.4 Thông tin Lead
- **Mã Lead** (auto-generate)
- **Giá trị dự kiến** (`potential_value`) – ước lượng giá trị đơn hàng
- **Nhân viên phụ trách** (`assigned_to`) – sales chịu trách nhiệm
- **Ngày tạo** – cho phép chọn ngày retroactive

### 1.5 Chăm sóc Lead (Drawer)
Khi click vào tên khách → mở **Drawer "Chăm sóc"**:
- Hiển thị thông tin KH (SĐT, email, địa chỉ)
- **Ghi chú tương tác**: Nhập nội dung trao đổi → Lưu vào `history[]`
- **Lịch sử tương tác**: Timeline hiển thị các lần chăm sóc kèm timestamp
- **Tạo Báo Giá nhanh** từ drawer

### 1.6 Lead Care Panel (AI)
Component `LeadCarePanel` hỗ trợ:
- Chat/comment trực tiếp với khách (styled rich text – ReactQuill)
- **AI Suggest**: Gợi ý nội dung trả lời tự động dựa trên sản phẩm & lịch sử

### 1.7 Tiến độ Lead
Cột "Tiến Độ" trên bảng Lead hiển thị progress bar tự động:
- `10%` – Mới tiếp cận (chưa có báo giá)
- `50%` – Đang có báo giá
- `70%` – Đã chốt đơn (`SO_PENDING`)
- `90%` – Đang sản xuất (`DEPOSITED`)

### 1.8 KPI Dashboard (CRM)
3 thẻ thống kê real-time, lọc theo tháng/năm/khoảng ngày:
- **Leads**: Tổng số Lead trong kỳ
- **Báo Giá**: Tổng số Quotation
- **Tỷ lệ chuyển đổi**: `(Số đơn hàng / Số Lead) × 100%`

---

## 2. Tab Báo Giá (Quotation)

### 2.1 Tạo Báo Giá
- Mở `SalesOrderDetail` ở chế độ Quotation (`status = QUOTATION`)
- Chọn khách hàng → hệ thống gợi ý **copy từ BG cũ** nếu KH đã có
- Thêm sản phẩm (chọn từ catalog, nhập SL + đơn giá)
- Tính tổng: Tổng tiền hàng → Giảm giá (% hoặc VNĐ) → VAT → Phí vận chuyển → **Tổng cộng**
- Cấu hình **đặt cọc**: % hoặc VNĐ

### 2.2 Portal Link
Mỗi báo giá có `uuid` → tạo link portal (`/portal/quote/{uuid}`) để gửi cho khách xem online.

### 2.3 Chốt báo giá
- Click ✅ "Xác nhận chốt đơn" → API `POST /sales/{id}/convert` → đổi status từ `QUOTATION` → `SO_PENDING`
- Hệ thống tự sinh mã đơn mới (SO-YYMMDD-XXX)

### 2.4 Version History
- Tạo Version mới (revision) cho BG khi cần chỉnh sửa lại
- Lịch sử revision lưu snapshot data + timestamp + người tạo

---

## 3. Module Sales / Đơn Hàng (`/sales`)

### 3.1 Quy trình đơn hàng (Order Workflow)

```
QUOTATION → SO_PENDING → DEPOSITED → SAMPLE_APPROVED → IN_PRODUCTION → DELIVERED/PARTIAL_DELIVERY → COMPLETED
                                                                                                    ↘ CANCELLED
```

| Trạng thái | Label hiển thị | Ý nghĩa |
|---|---|---|
| `QUOTATION` | Báo Giá | Draft, chưa chốt |
| `SO_PENDING` | Chờ Duyệt / Mới | Đã chốt BG, đang xử lý |
| `DEPOSITED` | Đã Đặt Cọc | Khách đã thanh toán cọc |
| `SAMPLE_APPROVED` | Đã Duyệt Mẫu SX | Mẫu sản xuất thử được OK |
| `IN_PRODUCTION` | Đang Sản Xuất | Đã giao sang nhà máy |
| `PARTIAL_DELIVERY` | Giao 1 phần | Giao chưa hết |
| `DELIVERED` | Đã Giao Hàng | Giao toàn bộ |
| `COMPLETED` | Hoàn Thành | Xong mọi thứ |
| `CANCELLED` | Đã Hủy | Hủy (kèm lý do) |

### 3.2 Nguồn đơn hàng (`order_source`)
- `ERP` – Tạo thủ công bởi Sales
- `WEBSITE` – Từ checkout trên website (đơn lẻ tab "🛒 Đơn hàng lẻ")
- `POS` – Bán lẻ tại quầy (Point of Sale)
- Đơn **Nhập Kho Nội Bộ** (Make to Stock): `customer_id = -1`

### 3.3 Chi tiết Đơn Hàng (`SalesOrderDetail`)
Modal chi tiết đơn hàng có **8 tab**:

| Tab | Nội dung |
|---|---|
| 1. Thông tin & SP | Form chính: KH, trạng thái, sản phẩm, tổng tiền, giảm giá, VAT, phí ship, đặt cọc |
| 2. Hợp đồng & HĐ | Soạn hợp đồng từ mẫu, thông tin xuất hóa đơn (tên, MST, địa chỉ, link PDF) |
| 3. Thanh toán | Lịch sử thanh toán, tạo phiếu thu/chi liên kết với Finance |
| 4. Giao hàng | Tạo đợt giao, chọn SP + SL giao, theo dõi tracking |
| 5. Trao đổi | Chat nội bộ (INTERNAL) và chat với khách (CUSTOMER), hỗ trợ @mention |
| 6. Checklist | Danh sách task cần làm theo từng giai đoạn (auto-generate từ template) |
| 7. Mẫu SX | Upload hình ảnh mẫu SX (Google Drive links), nút "Duyệt mẫu" |
| 8. LS Báo giá | Xem các phiên bản báo giá trước đó (revision history) |

### 3.4 Bảng giá (Price List)
- Quản lý tại `/sales/pricelist`
- Entity `PriceList` + `PriceListRule`: Đặt rule giá theo SKU
- API validate giá: `GET /sales/validate-price?sku=...&unitPrice=...&userId=...`

### 3.5 Sales Checklist (Auto-generated)
Hệ thống tự sinh checklist theo trạng thái đơn:

**QUOTATION:**
- Liên hệ khách xác nhận yêu cầu
- Gửi báo giá (Link portal / PDF)

**SO_PENDING → DELIVERED:**
- Xác nhận đơn hàng / Gửi hợp đồng
- Thu cọc (30-50%)
- Xác nhận mẫu sản xuất
- Lên kế hoạch sản xuất
- Theo dõi tiến độ SX
- Thông báo hàng sẵn sàng
- Xác nhận lịch giao hàng
- Giao hàng + biên bản bàn giao
- Thu công nợ còn lại (50-70%)
- Gửi hóa đơn VAT

**COMPLETED:**
- Gửi thư cảm ơn (sau 3 ngày)
- Khảo sát hài lòng (sau 7 ngày)
- Đề xuất up-sell
- Nhắc đặt hàng lại (cross-sell, 30 ngày)

---

## 4. Báo cáo Doanh số (Sales Report)

### 4.1 Dashboard KPI (trên SalesPage)
5 thẻ thống kê, lọc theo **tháng / năm / khoảng ngày tùy chọn**:

| Thẻ | Ý nghĩa | Tính toán |
|---|---|---|
| **Tổng GT** (Giá trị) | Tổng doanh thu đơn hàng | `SUM(total_amount)` của đơn chưa hủy |
| **Thực Thu** | Số tiền đã thu thực tế | `SUM(paid_amount)` – tính từ Finance Transactions |
| **Công Nợ** | Số tiền khách còn nợ | `Tổng GT − Thực Thu` |
| **Số Đơn** | Tổng số đơn hàng | Count đơn chưa hủy |
| **Đang XL** | Đơn đang xử lý | Count đơn `SO_PENDING`, `SAMPLE_APPROVED`, `DEPOSITED`, `QUOTATION` |

### 4.2 Bộ lọc thời gian
- **Chọn năm** (dropdown)
- **12 nút tháng** (T1→T12) + nút "All" – click để lọc nhanh
- **Date Range Picker** – chọn khoảng ngày tùy ý
- Khi chọn tháng → tự fill range picker theo tháng đó

### 4.3 Thanh toán trên bảng đơn hàng
Cột "Thanh Toán" hiển thị **progress bar 5 bước** + phần trăm:
- `paid_amount / total_amount × 100%`
- Xanh lá khi >= 100%, xanh dương khi < 100%

### 4.4 Tabs lọc nhanh trên SalesPage

| Tab | Lọc |
|---|---|
| Tất cả | Không lọc |
| 🛒 Đơn hàng lẻ | `order_source = WEBSITE` |
| Chờ Duyệt | `status = SO_PENDING` |
| Đã Đặt Cọc | `status = DEPOSITED` |
| Đã Duyệt Mẫu SX | `status = SAMPLE_APPROVED` |
| Đang Sản Xuất | `status = IN_PRODUCTION` |
| Hoàn Thành SX | `status = MANUFACTURING_COMPLETED` |
| Đã Giao | `status = DELIVERED` hoặc `PARTIAL_DELIVERY` |
| Hoàn Thành | `status = COMPLETED` |
| Báo Giá (Draft) | `status = QUOTATION` |

---

## 5. Cấu trúc dữ liệu chính

### 5.1 Customer Entity
```
customers
├── id, code (unique), name, type (LEAD | CUSTOMER)
├── CRM: lead_status, potential_value, assigned_to_id
├── Pháp nhân: legal_name, legal_address, legal_representative, einvoice_email
├── Giao hàng: delivery_addresses (jsonb array)
├── Liên hệ: contacts (1:N → CustomerContact)
├── Lịch sử: history (jsonb array)
├── Quan hệ: parent_id (công ty mẹ/con)
└── Tài chính: credit_limit, current_debt, tax_code
```

### 5.2 SalesOrder Entity
```
sales_orders
├── id, uuid, order_code (unique), version
├── customer_id → Customer
├── assigned_to_id → User
├── Status: status (enum 10 giá trị), payment_status (UNPAID|PARTIAL_PAID|PAID)
├── Tài chính: total_amount, total_cost, paid_amount, discount_rate, discount_amount
├── VAT: vat_company_name, vat_tax_code, vat_address, vat_rate, vat_invoice_link, vat_email
├── Giao hàng: delivery_date, shipping_address, receiver_name, receiver_phone, shipping_carrier, tracking_code, shipping_fee
├── Đặt cọc: deposit_percent, deposit_amount
├── Mẫu SX: sample_image_url, sample_note, is_production_sample_approved, approved_sample_images
├── Hợp đồng: terms_content
├── Ghi chú: note, cancel_reason, payment_note
├── Nguồn: order_source (ERP | WEBSITE | POS)
└── Relations: items (1:N), comments (1:N), deliveries (1:N), production_plan
```

### 5.3 SalesOrderItem Entity
```
sales_order_items
├── id, position (thứ tự sắp xếp)
├── sku, product_id → Product
├── quantity, unit_price, subtotal, total_price
├── image_url, variant_color
├── Mẫu SX: is_sample_approved, sample_image, sample_note
└── vat_content (nội dung xuất HĐ)
```

---

## 6. API Endpoints chính

### Sales APIs (`/sales`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/sales` | Lấy tất cả đơn hàng |
| `GET` | `/sales/:idOrCode` | Lấy chi tiết (theo ID hoặc Mã đơn) |
| `POST` | `/sales` | Tạo đơn hàng / báo giá mới |
| `PUT` | `/sales/:id` | Cập nhật đơn hàng |
| `DELETE` | `/sales/:id` | Xóa đơn (chỉ status `SO_PENDING`) |
| `POST` | `/sales/:id/convert` | Chốt báo giá → Đơn hàng |
| `POST` | `/sales/:id/complete` | Hoàn tất đơn hàng |
| `POST` | `/sales/:id/cancel` | Hủy đơn hàng (kèm lý do) |
| `POST` | `/sales/:id/revision` | Tạo version mới |
| `POST` | `/sales/:id/approve-samples` | Duyệt mẫu SX |

### Sub-resources
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET/POST` | `/sales/:id/comments` | Chat / Comment |
| `GET/POST` | `/sales/:id/deliveries` | Giao hàng |
| `GET` | `/sales/:code/payments` | Lịch sử thanh toán |
| `GET/POST` | `/sales/:id/checklist/*` | Checklist quản lý task |
| `GET` | `/sales/portal/:uuid` | Portal cho khách xem BG |
| `GET` | `/sales/price-lists` | Bảng giá |
| `GET` | `/sales/validate-price` | Validate giá |

### Customer APIs (`/customers`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/customers` | Danh sách KH (kèm thống kê đơn, doanh thu) |
| `GET` | `/customers/:id` | Chi tiết KH |
| `POST` | `/customers` | Tạo KH mới |
| `PUT` | `/customers/:id` | Cập nhật KH |
| `POST` | `/customers/:id/follow` | Thêm ghi chú chăm sóc |

---

## 7. Thao tác nhanh cho Sales

### Trên bảng Lead:
- 🕐 **Chăm sóc** → Mở drawer ghi chú
- 🔔 **Tạo nhắc nhở** → Tạo Task tự động (liên kết CRM)
- ✏️ **Sửa** → Mở form sửa Lead
- 🗑️ **Xóa** → Xóa Lead

### Trên bảng Đơn hàng:
- ✏️ **Xem/Sửa** → Mở chi tiết đơn (8 tabs)
- 🔔 **Nhắc nhở** → Tạo Task liên kết SALES
- 🔗 **Copy Link KH** → Copy link portal cho khách
- ✅ **Hoàn tất** → Đánh dấu complete
- ❌ **Hủy đơn** → Modal nhập lý do hủy

---

## 8. Lưu ý quan trọng

> [!IMPORTANT]
> - `paid_amount` được tính **từ Finance Transactions** (không nhập tay), đảm bảo chính xác.
> - Khi status chuyển sang `IN_PRODUCTION`, **bắt buộc** phải tick "Đã duyệt mẫu SX".
> - Đơn chỉ có thể **xóa cứng** khi status = `SO_PENDING`.
> - Hệ thống hỗ trợ **mobile responsive** (List view thay Table trên mobile).

> [!TIP]
> - Dùng **Checklist** (tab 6) để theo dõi từng bước workflow – hệ thống tự sinh theo giai đoạn.
> - Tận dụng **Portal Link** để gửi báo giá online – khách có thể xem, comment, chấp nhận.
> - **Copy BG cũ** khi tạo báo giá cho khách quen → tiết kiệm thời gian.
