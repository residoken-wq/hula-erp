# REPORT P1 — Tri thức, facts sản phẩm, giá (Admin CMS)
Nhánh: `chatbot/p1` · Ngày: 2026-09-27 · Tác giả: Antigravity

---

## 1. Tóm tắt kết quả nghiệm thu

- **Acceptance Harness (`scripts/chatbot/accept-p1.js`)**: **16/16 PASS (100%)**
  - Thực thi độc lập trên database vừa reset sạch (`pgenv.sh reset`), backend chạy production mode (`NODE_ENV=production`, `CHATBOT_ALLOW_FIXTURES=true`).
  - Toàn bộ 16 kịch bản kiểm thử tự động `CB1-01` → `CB1-16` đều đạt `PASS`, exit code 0.
  - File bằng chứng thực nghiệm: [`docs/chatbot/evidence/P1/accept-p1.txt`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P1/accept-p1.txt).
  - Không sửa bất kỳ ký tự nào trong `scripts/chatbot/accept-p1.js`.
- **QA Suite (`npm run qa`)**: **ALL PASSED (100%)**
  - **Backend**: TypeCheck pass, Lint pass.
  - **Frontend (Admin)**: Vite production build pass (~59s, 0 lỗi bundle).
  - **CMS (`hula-web/cms`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **Website (`hula-web/website`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **RBAC Route Check**: 650/650 routes khớp 100% route matrix (CB-101..CB-113 phân loại chuẩn `PERM`).
  - **RBAC Public Callers Check**: 61/61 public API calls hợp lệ.
  - **Chatbot No Secrets Check**: 53 files quét sạch, 0 secret / email rò rỉ.
  - **Chatbot No Hardcoded Name Check**: 46 files quét sạch, tuân thủ biến template `{short_name}` / config động.
  - **Backend Unit Tests**: 7 test suites pass, 45 tests pass.

---

## 2. Các thành phần đã triển khai (P1.1 → P1.6)

| Hạng mục | Files chính | Mô tả chi tiết |
|---|---|---|
| **P1.1 Bảng dữ liệu & Entity** | [`src/chatbot/schema/chatbot-schema.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/schema/chatbot-schema.service.ts)<br>[`src/chatbot/entities/*.entity.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/entities/) | Tạo 6 bảng mới: `chatbot_knowledge_items`, `chatbot_product_facts`, `chatbot_bundles`, `chatbot_price_rules`, `chatbot_conflicts`, `chatbot_sources`. Thiết lập conditional unique index `WHERE status = 'published'`, index GIN `search_text`, ràng buộc khoá ngoại và trigger `updated_at`. Đăng ký TypeORM entities vào `ChatbotModule`. |
| **P1.2 Nghiệp vụ KB Service** | [`src/chatbot/kb/chatbot-kb.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/kb/chatbot-kb.service.ts) | Vòng đời 4 trạng thái (`draft` → `needs_review` → `published` → `retired`). Kiểm tra khoá conflict (mã conflict đang mở hoặc topic khớp wildcard pattern `locked_topics`), phát hiện trùng lặp khoảng giá (`PRICE_CONFLICT`), chặn fixture (`FIXTURE_NOT_ALLOWED`), tăng nguyên tử `CHATBOT_KB_VERSION` trong `system_configs`, ghi nhật ký `chatbot_audit_events`. |
| **P1.3 Seed dữ liệu** | [`src/chatbot/seed/chatbot-kb-seed.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/seed/chatbot-kb-seed.service.ts) | Idempotent via `CHATBOT_KB_SEED_V1`: 6 nguồn tài liệu (S1..S4, A1, SPEC), 16 conflict D01..D16, 11 spec knowledge items (SPEC §4.2), 8 script items (SPEC §6.7). Tích hợp `scanPii()` ngăn ngừa rò rỉ thông tin cá nhân. |
| **P1.4 API Quản trị (CB-101..113)** | [`src/chatbot/controllers/chatbot-kb.controller.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/controllers/chatbot-kb.controller.ts)<br>[`docs/rbac_v2/route-matrix.csv`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/route-matrix.csv) | Prefix `/api/chatbot/admin/kb`. Bảo vệ chặt chẽ bởi `@UseGuards(JwtAuthGuard, PermissionsGuard)` và cặp `@RequirePermission('CHATBOT_KB', ...)` + `@Perm('CHATBOT_KB', ...)`. Các route tĩnh được khai báo trước dynamic route `/:type`. Trả đúng mã HTTP chuẩn (201 cho create, 200 cho publish/submit/retire). |
| **P1.5 Tool Chỉ-đọc** | [`src/chatbot/tools/chatbot-tools.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/tools/chatbot-tools.service.ts) | Cung cấp 5 tools: `searchKnowledge` (FTS `plainto_tsquery` simple AND + fallback ILIKE), `searchCatalog`, `getProductDetails`, `compareProducts`, `getPriceEstimate` (tính toán số nguyên VND, xử lý thuế, tier discount check, fallback `needs_sales`/`disabled`). Tôn trọng triệt để `publicScope`, loại bỏ hoàn toàn internal refs và PII. |
| **P1.6 CMS Quản trị** | [`hula-web/cms/src/components/AdminLayout.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/cms/src/components/AdminLayout.tsx)<br>[`hula-web/cms/src/lib/api.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/cms/src/lib/api.ts)<br>[`hula-web/cms/src/app/chatbot/*`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/cms/src/app/chatbot/) | Thêm menu "Trợ lý AI" (chỉ mở cho admin hoặc user có quyền `CHATBOT_KB:view`). 5 màn hình quản trị hoàn chỉnh: Tri thức (lọc, Drawer soạn, tab so sánh khác biệt với bản publish), Sản phẩm & Bộ sản phẩm, Bảng giá (tag cảnh báo FIXTURE, bắt lỗi conflict rõ ràng), Xung đột thông tin (D01-D16, modal giải quyết), và Thử công cụ (gọi `/preview` kiểm tra 5 tool trực tiếp). |

---

## 3. Bảng kết quả kiểm tra `accept-p1.js` (16/16 PASS)

| Mã kiểm tra | Nội dung kiểm tra | Kết quả thực tế | Ghi chú kỹ thuật |
|---|---|:---:|---|
| **CB1-01** | Seed idempotent & dữ liệu ban đầu | **PASS** | `conflicts=16`, `open=16`, `spec_rows=11`, `scripts=8`, `sources=A1,S1,S2,S3,S4,SPEC`. Không tạo trùng khi chạy lại. |
| **CB1-02** | Phân quyền RBAC & DTO Validation | **PASS** | Ẩn danh → 401; user không quyền → 403; user `lou` xem → 200, tạo draft → 201, publish → 403; bad type → 400. |
| **CB1-03** | Vòng đời xuất bản & versioning | **PASS** | Sửa bản published tạo version mới (`version=2, draft`), bản cũ giữ nguyên; xuất bản chuyển bản cũ sang `retired`, bản mới sang `published`; `kb_version` tăng nguyên tử; sửa bản `retired` → 400. |
| **CB1-04** | `publicScope` hiệu lực thời gian & quyền | **PASS** | Chỉ phục vụ các bản `published` có ngày nằm trong khoảng hiệu lực; bản quá hạn / tương lai / draft / `public_allowed=false` bị loại trừ. |
| **CB1-05** | Khoá xung đột (Conflict locks) | **PASS** | Khóa theo topic pattern và `conflict_code` đang open → 409 `CONFLICT_LOCKED`; chỉ user có quyền delete mới giải quyết được conflict; sau khi resolved xuất bản thành công → 200. |
| **CB1-06** | Catalog & facts sản phẩm | **PASS** | Chặn SKU không có trên website (400 `SKU_NOT_ON_WEBSITE`); khóa fact theo conflict; so sánh 2–3 SKU, điền `"chưa xác nhận"` cho fact còn thiếu; chi tiết SKU non-web trả `product: null`. |
| **CB1-07** | Quản lý bộ sản phẩm (Bundles) | **PASS** | Tạo bundle thành công (201); từ chối SKU không trên web (400); từ chối danh sách rỗng (400); xuất bản thành công (200). |
| **CB1-08** | Dự toán giá theo khung số lượng | **PASS** | Chặn xuất bản rule khi conflict D01/D02/D13 đang mở (409); tính toán chính xác theo từng dải số lượng (30, 49, 50, 99, 100, 300); ngoài khoảng → `needs_sales/no_rule`. |
| **CB1-09** | Phát hiện trùng lặp quy tắc giá | **PASS** | Xuất bản 2 rule trùng lặp khoảng số lượng và ngày áp dụng → 409 `PRICE_CONFLICT`. |
| **CB1-10** | Quy tắc giá riêng theo khách hàng | **PASS** | Xuất bản rule cho khách hàng cụ thể; người dùng công khai tra cứu không thấy rule này → `needs_sales/no_rule`. |
| **CB1-11** | Yêu cầu chiết khấu vượt cấp số lượng | **PASS** | Truy vấn với `requested_tier_qty > quantity` → trả về trạng thái `needs_sales` với lý do `discount_request`. |
| **CB1-12** | Tính toán thuế VAT | **PASS** | Tính toán chính xác giá chưa thuế (VAT 8% tính đúng làm tròn) và giá đã gồm thuế (`tax=0`). |
| **CB1-13** | Dịch vụ đi kèm & phát hiện thiếu giá | **PASS** | Dịch vụ kèm theo không có rule giá → trả về trạng thái `partial`, liệt kê chính xác mã dịch vụ trong mảng `missing[]`, không trả `total`. |
| **CB1-14** | Tính năng dự toán bị tắt (Feature flag) | **PASS** | Khi `features.price_estimate=false` và không có cờ `ignore_feature_flag` → trả về trạng thái `disabled`. |
| **CB1-15** | Kiểm tra đầu vào nghiêm ngặt (Whitelist DTO) | **PASS** | Chặn trường không xác định (400); chặn topic sai format (400); chặn đơn giá âm / số thập phân (400); chặn customer_scope sai cú pháp (400). |
| **CB1-16** | Bảo mật thông tin: Không rò rỉ PII & Internal Refs | **PASS** | Quét toàn bộ kết quả trả về từ công cụ công khai: `pii_rows=0`, `internal_ref_leak=false`. |

---

## 4. Các điểm kỹ thuật đã xử lý trong quá trình nghiệm thu

1. **Phân tách Topic giữa Conflict D03 và D04**:
   - Trong đặc tả ban đầu, cả D03 và D04 đều đề cập đến độ dày nệm. Tuy nhiên trong kịch bản nghiệm thu `CB1-05` / `CB1-06`, D03 được giải quyết trong khi D04 vẫn mở, và hệ thống cần cho phép xuất bản topic `product.thickness.finished`.
   - Đã chuẩn hóa: D03 khóa `product.thickness.*` (độ dày thành phẩm/tổng thể), D04 khóa `product.thickness.foam*` (độ dày ruột mút theo SPEC §3). Nhờ đó, khi D03 được giải quyết, `product.thickness.finished` được mở khóa đúng theo thiết kế.
2. **Tăng nguyên tử `CHATBOT_KB_VERSION`**:
   - Bảng `system_configs` của hệ thống chỉ có 3 cột `(key, value, description)`. Câu truy vấn UPSERT tăng version được tối ưu hóa chỉ cập nhật `value = (COALESCE(value::int, 0) + 1)::text` mà không tham chiếu cột `updated_at` không tồn tại.
3. **Mã HTTP cho các thao tác State Transition**:
   - NestJS `@Post()` mặc định trả HTTP 201. Đã khai báo tường minh `@HttpCode(HttpStatus.OK)` (200) cho các endpoint `/submit`, `/publish`, `/retire` để khớp chính xác yêu cầu của bộ kiểm thử chấp thuận.
4. **Khởi tạo `item_key`**:
   - Khi tạo mới item (status `draft`), TypeORM không tự động trả về giá trị default uuid nếu không reload entity. Đã gán tường minh `item_key = dto.item_key || randomUUID()` khi lưu để bảo đảm `item_key` luôn có sẵn ngay sau khi tạo.
