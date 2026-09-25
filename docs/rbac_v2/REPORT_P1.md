# REPORT P1 — rbac_v2
Nhánh: `rbac/p1` · Ngày: 2026-09-25 · Môi trường test: PostgreSQL 15.18 local (`hula_db` dump 23/08 đã sanitize)

---

## 1. Đã làm

| Mục instruction | File thay đổi | Ghi chú ngắn |
|---|---|---|
| **P1.1 Phân hạng toàn bộ endpoint** | 46 controllers trong `src/**/*.controller.ts` | Gắn `@Public()`, `@AuthOnly()`, `@Perm()`, `@AnyPerm()`. Giữ nguyên `@RequirePermission` cho các route cũ không đổi. Chuyển designs sang `@AnyPerm(['PRODUCT', a], ['PRODUCTION', a])` theo D5. Gắn `@Public()` cho health check `GET /api/test` (R022). Bỏ `@Public()`, gắn `@Perm('HR', 'create')` cho `POST /api/hr/review-questions-seed`. |
| **P1.2 Script kiểm tra RBAC** | `scripts/check-rbac.js`, `scripts/qa.js` | Quét 628 routes; phát hiện 0 route unclassified, 0 route multi-tier. In cảnh báo đối chiếu matrix; tích hợp vào `npm run qa`. |
| **P1.3 Danh mục & Seed Idempotent** | `src/auth/permission-catalog.ts`, `src/auth/rbac-seed.service.ts`, `src/auth/auth.module.ts` | Thêm module `MARKETING` (D2). Chạy seed `RBAC_SEED_V1`: sao chép 12 dòng quyền (MARKETING từ SALES, SYSTEM từ USERS, PURCHASE đã có đủ); tạo mới nhóm "Biên tập Website (CMS)" (D4). Tự động bỏ qua khi khởi động lần 2. |
| **P1.4 HR Tự phục vụ `/hr/me/*` (D7)** | `src/hr/hr-me.controller.ts`, `src/hr/hr.module.ts`, `frontend/src/pages/ProfilePage.tsx`, `docs/rbac_v2/route-matrix.csv` | Thêm controller `hr/me` với 9 endpoint tự phục vụ (profile, attendances, leaves, payslips, assets, balance, check-in, check-out, xin nghỉ); định danh nghiêm ngặt theo `req.user.id`. Đổi `ProfilePage.tsx` sang gọi `/hr/me/*`. Thu hẹp route HR cũ trong `hr.controller.ts` cần quyền `HR`. |
| **P1.5 Frontend Menu & Route Gating** | `frontend/src/App.tsx` | Đồng bộ 100% điều kiện giữa menu và `<Route>`: `/purchasing` (`PURCHASE`), `/marketing`, `/social/*` (`MARKETING`), `/system/settings` (`SYSTEM`), `/designs`, `/print-production` (`PRODUCT || PRODUCTION`), `/website-products` (`PRODUCT`), `/docs` (`admin`), `/ai-dashboard` (`USERS`). |
| **P1.6 CMS Warning Banner** | `hula-web/cms/src/hooks/useAuth.tsx`, `hula-web/cms/src/components/AdminLayout.tsx` | Kiểm tra cờ `can_view` của module `CMS`. Không hard-block; hiển thị `<Alert severity="warning">` cảnh báo tài khoản chưa được phân quyền CMS. |

---

## 2. Review rows (Các dòng `review=Y` trong `route-matrix.csv`)

Theo instruction P1.1 và các quyết định D1–D7 đã chốt, toàn bộ các dòng `review=Y` đã được xử lý như sau:

| Mã | Method + Route | Đề xuất matrix | Giá trị áp dụng thực tế | Ghi chú & Căn cứ quyết định |
|---|---|---|---|---|
| **R022** | `GET /api/test` | AUTH | **PUBLIC** (`@Public()`) | Health check ping hệ thống, không yêu cầu token theo chỉ đạo P1.1 (dòng 40). |
| **R104** | `POST /api/hr/check-in` | PERM (HR:view) | **PERM (HR:create)** (`@Perm('HR','create')`) | Route HR cũ, chỉ Admin/quản lý HR chấm hộ người khác (D7). Nhân viên tự chấm công qua `/api/hr/me/check-in`. |
| **R105** | `POST /api/hr/check-out` | PERM (HR:view) | **PERM (HR:create)** (`@Perm('HR','create')`) | Route HR cũ, chỉ Admin/quản lý HR chấm hộ người khác (D7). Nhân viên tự chấm công qua `/api/hr/me/check-out`. |
| **R109** | `GET /api/hr/leaves` | PERM (HR:view) | **PERM (HR:view)** (`@Perm('HR','view')`) | Danh sách đơn nghỉ công ty cho Admin/HR. Nhân viên xem đơn của mình qua `/api/hr/me/leaves`. |
| **R110** | `POST /api/hr/leaves` | PERM (HR:create) | **PERM (HR:create)** (`@Perm('HR','create')`) | Tạo đơn nghỉ cho nhân viên khác. Nhân viên tự xin nghỉ qua `/api/hr/me/leaves`. |
| **R111** | `PUT /api/hr/leaves/:id/approve` | PERM (HR:update) | **PERM (HR:update)** (`@Perm('HR','update')`) | Duyệt đơn nghỉ phép chỉ dành cho Admin/HR (D7). |
| **R112** | `DELETE /api/hr/leaves/:id` | PERM (HR:delete) | **PERM (HR:delete)** (`@Perm('HR','delete')`) | Xoá đơn nghỉ phép chỉ dành cho Admin/HR (D7). |
| **R121** | `GET /api/hr/payslips` | PERM (HR:view) | **PERM (HR:view)** (`@Perm('HR','view')`) | Bảng lương toàn công ty. Nhân viên xem phiếu lương của mình qua `/api/hr/me/payslips`. |
| **R122** | `POST /api/hr/payslips` | PERM (HR:create) | **PERM (HR:create)** (`@Perm('HR','create')`) | Tạo bảng lương (Admin/HR). |
| **R123** | `PUT /api/hr/payslips/:id` | PERM (HR:update) | **PERM (HR:update)** (`@Perm('HR','update')`) | Chỉnh sửa phiếu lương (Admin/HR). |
| **R124** | `DELETE /api/hr/payslips/:id` | PERM (HR:delete) | **PERM (HR:delete)** (`@Perm('HR','delete')`) | Xoá phiếu lương (Admin/HR). |
| **R156** | `POST /api/hr/review-questions-seed` | PUBLIC | **PERM (HR:create)** (`@Perm('HR','create')`) | Gỡ `@Public()`, bắt buộc quyền HR để tránh lộ endpoint seed dữ liệu câu hỏi đánh giá (P1.1 dòng 41). |
| **R203** | `POST /api/marketing/segments/:id/calculate` | PERM (MARKETING:view) | **PERM (MARKETING:view)** | POST nhưng bản chất là tính toán dữ liệu phân khúc marketing. |
| **R232** | `POST /api/planning/pfo/:id/calculate-bom` | PERM (PRODUCTION:view) | **PERM (PRODUCTION:view)** | POST nhưng bản chất là tính toán định mức BOM kế hoạch sản xuất. |
| **R278** | `POST /api/products/calculate-all-costs` | PERM (PRODUCT:view) | **PERM (PRODUCT:view)** | POST nhưng bản chất là tính toán giá vốn sản phẩm. |
| **R328** | `POST /api/public/portal/quote/:orderId/comment` | PUBLIC | **PUBLIC** (`@Public()`) | Khách hàng bình luận trên portal báo giá không cần tài khoản ERP. |
| **R329** | `DELETE /api/public/portal/quote/comment/:commentId` | PUBLIC | **PUBLIC** (`@Public()`) | Khách hàng xoá bình luận của mình trên portal báo giá. |
| **R330** | `GET /api/public/proxy-image` | PUBLIC | **PUBLIC** (`@Public()`) | Proxy hình ảnh công khai cho website/portal. |
| **R406–R411** | `POST /api/sales/:id/checklist/*` | PERM (SALES:view) | **PERM (SALES:view)** | Các thao tác đọc/tính toán/sync checklist đơn bán hàng. |
| **R421, R434** | `POST /api/shipping/*-connection` | PERM (SYSTEM:view) | **PERM (SYSTEM:view)** | Kiểm tra kết nối cấu hình vận chuyển GHTK / Lalamove (D3). |
| **R422, R424, R436–R438** | `POST /api/shipping/*` (parse, estimate, quote) | PERM (SALES:view \| INVENTORY:view) | **PERM (SALES:view \| INVENTORY:view)** | Tính phí và tra cứu địa chỉ vận chuyển cho Sales & Kho. |
| **R471** | `POST /api/suppliers/check-price` | PERM (INVENTORY:view \| PURCHASE:view) | **PERM (INVENTORY:view \| PURCHASE:view)** | Tra cứu giá vật tư nhà cung cấp (D1). |
| **R481, R490** | `GET /api/system/company`, `GET /api/system/config/:key` | PUBLIC | **PUBLIC** (`@Public()`) | Cấu hình công ty và public settings phục vụ website/portal. |

---

## 3. Seed dry-run & Kết quả trên dữ liệu thật (Dump 23/08)

Đã chạy kiểm chứng thực tế trên PostgreSQL 15.18 local sau khi nạp bản sao DB production và chạy `sanitize.sql`. Kết quả khớp **100%** với dự kiến tại **Phụ lục A** của `P1_Instruction.md`:

```json
{
  "at": "2026-09-25T15:17:20.360Z",
  "changes_count": 12,
  "created_groups_count": 1
}
```

### 3.1. Bảng đối chiếu kết quả Seed V1:

| Bước | Kết quả dự kiến (Phụ lục A) | Kết quả thực tế runtime trên test-env | Đánh giá |
|---|---|---|---|
| **D1: PRODUCTION → PURCHASE** | **0 dòng tạo mới.** Cả 6 nhóm đã có dòng `PURCHASE` với giá trị trùng `PRODUCTION` | **0 dòng tạo mới.** Cả 6 nhóm đã có mã `PURCHASE` từ trước. | **KHỚP 100%** |
| **D2: SALES → MARKETING** | **6 dòng tạo mới:**<br>• Group 1 (Sales): VCU--<br>• Group 2 (Admin): VCUD$<br>• Group 3 (Planning Manager): VCUD-<br>• Group 4 (Accounting_manager): V----<br>• Group 5 (Marketing_Design): -----<br>• Group 6 (Partime theo giờ): ----- | **6 dòng tạo mới:**<br>• 1 (Sales): `can_view=true, can_create=true, can_update=true, can_delete=false, view_cost_price=false`<br>• 2 (Admin): `V=true, C=true, U=true, D=true, Cost=true`<br>• 3 (Planning): `V=true, C=true, U=true, D=true, Cost=false`<br>• 4 (Accounting): `V=true, C=false, U=false, D=false, Cost=false`<br>• 5 (Marketing_Design): `-----`<br>• 6 (Partime): `-----` | **KHỚP 100%** |
| **D3: USERS → SYSTEM** | **6 dòng tạo mới:**<br>• Group 2 (Admin): VCUD$<br>• Các nhóm còn lại: ----- | **6 dòng tạo mới:**<br>• 2 (Admin): `V=true, C=true, U=true, D=true, Cost=true`<br>• Nhóm 1, 3, 4, 5, 6: toàn bộ cờ đều `false` | **KHỚP 100%** |
| **D4: CMS** | **1 nhóm mới:** "Biên tập Website (CMS)", CMS=VCUD-, 0 user. Admin và Planning Manager giữ nguyên CMS đang có. | Tạo mới nhóm ID `7`, name `"Biên tập Website (CMS)"`, 0 user, quyền CMS: `V=true, C=true, U=true, D=true, Cost=false`. Admin (ID 2) và Planning (ID 3) giữ nguyên quyền CMS sẵn có. | **KHỚP 100%** |

### 3.2. Danh sách các nhóm có quyền HR (D7) để Chủ dự án rà soát:
Dữ liệu thực tế cho thấy hiện tại **chỉ duy nhất nhóm Admin** có cờ quyền HR được bật:
- **Group 2 (Admin):** 2 users (`admin` và 1 user quản trị). Cờ quyền: `can_view=true`, `can_create=true`, `can_update=true`, `can_delete=true`, `view_cost_price=true`.
- **Tất cả các nhóm còn lại (1, 3, 4, 5, 6):** đều có cờ HR là `false` (`-----`).
- **Kết luận:** Quyết định D7 ("Hồ sơ người khác chỉ Admin") hoàn toàn trùng khớp với hiện trạng phân quyền DB. Không có nhóm nhân sự nào bị mất quyền đột ngột khi chuyển sang P2.

---

## 4. Giải trình độ lệch giữa Code và `route-matrix.csv`

Script `scripts/check-rbac.js` quét toàn bộ codebase và đối chiếu với `route-matrix.csv`:
- **Tổng số endpoint quét được trong code:** `628 routes`
- **Số dòng trong `route-matrix.csv` ban đầu:** `581 rows` (gồm 572 rows gốc + 9 rows `/api/hr/me/*` thêm ở P1.4)
- **Số endpoint trong code chưa có trong matrix:** `47 routes`
- **Kết quả nghiệm thu phân hạng trong code:**
  - `PUBLIC`: 54 routes
  - `AUTH`: 70 routes
  - `PERM`: 499 routes
  - `APIKEY`: 5 routes (các webhooks Zalo/TikTok/Shipping có `ApiKeyGuard`)
  - **`UNCLASSIFIED`: 0 routes (100% routes được gắn decorator tường minh)**
  - **`MULTI-TIER`: 0 routes (Mỗi route chỉ có duy nhất 1 decorator)**

### Lý do của 47 endpoint lệch:
1. **6 route mới của Phase 0:**
   - `GET /api/auth/permission-catalog`, `GET /api/auth/me` (tier `AUTH`)
   - `GET|PUT /api/auth/rbac/mode`, `GET /api/auth/rbac/report`, `GET /api/auth/rbac/unclassified` (tier `PERM` `SYSTEM:view` / `SYSTEM:update`)
2. **41 route controller được khai báo inline trên 1 dòng hoặc định dạng nhiều dòng:**
   - Script sinh matrix ban đầu (trước P0) dùng biểu thức regex đơn giản nên đã bỏ sót các method viết inline trên 1 dòng như:
     - `categories`: `GET /api/categories/:id` (`AUTH`), `POST /api/categories` (`PRODUCT:create`), `POST /api/categories/:id/sync-size` (`PRODUCT:update`), `PUT` (`PRODUCT:update`), `DELETE` (`PRODUCT:delete`)
     - `customers`: `GET /api/customers` (`SALES:view`), `PUT` (`SALES:update`), `DELETE` (`SALES:delete`)
     - `finance`: `categories` (4 route `FINANCE:*`), `transactions/:id` (`PUT/DELETE` `FINANCE:*`)
     - `planning`: `suggestion`, `booking-stats`, `bookings`, `bookings/:sku`, `gantt` (5 route `PRODUCTION:view`), `sync-booking-stock` (`PRODUCTION:create`), `confirm-bookings`, `revert` (`PRODUCTION:update`)
     - `processes`: `create`, `update`, `remove` (3 route `PRODUCTION:*`)
     - `products`: `GET /api/products/:id` (`AUTH`), `update`, `remove`, `routings`, `logistics`, `pattern`, `website-config`, `boms`, `combo/*` (9 route `PRODUCT:*`)
     - `purchasing`: `DELETE /api/purchasing/pooled/all`, `POST /api/purchasing/create-pooled`, `GET /api/purchasing/pooled/:id/aggregate` (3 route `PURCHASE:*`)
     - `sales`: `POST /api/sales/portal/:uuid/action` (`SALES:update`)
     - `tasks`: `PUT /api/tasks/:id`, `DELETE /api/tasks/:id` (`AUTH`)
   - **Tất cả 47 endpoint trên đã được gắn decorator chuẩn xác 100% trong code** và kiểm tra qua `scripts/check-rbac.js`.

---

## 5. Kết quả nghiệm thu ACCEPTANCE (Môi trường test local)

Toàn bộ các dòng kiểm thử P1 và PUB trên môi trường PostgreSQL local đã chạy thành công, log kết quả lưu tại `docs/rbac_v2/evidence/P1/*.txt`:

| Mã | Mục tiêu | Kết quả | File bằng chứng (Evidence) |
|---|---|---|---|
| **P1-01** | `check-rbac` quét toàn bộ codebase | **PASS** (628 routes, 0 unclassified, 0 multi-tier, exit 0) | [P1-01_check-rbac.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-01_check-rbac.txt) |
| **P1-02** | Không chặn sớm (SHADOW mode) | **PASS** (20/20 routes ADD_PERM không bị 403, ghi nhận đầy đủ log `DENY_NO_PERM`) | [P1-02_shadow-no-block.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-02_shadow-no-block.txt) |
| **P1-03** | Chạy Seed V1 trên bản copy DB prod | **PASS** (Tạo 12 quyền, 1 nhóm CMS, bảo toàn 100% quyền cũ, khớp Phụ lục A) | [P1-03_seed-dry-run.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-03_seed-dry-run.txt) |
| **P1-04** | Khởi động lại backend lần 2 | **PASS** (Khởi động lại tự động bỏ qua, không nhân bản quyền) | [P1-04_seed-idempotent.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-04_seed-idempotent.txt) |
| **P1-05** | User có PRODUCTION giữ menu Mua hàng | **PASS** (`planning_manager` đăng nhập có quyền `PURCHASE`) | [P1-05_menu-purchasing.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-05_menu-purchasing.txt) |
| **P1-06** | User SALES giữ menu Marketing & Social | **PASS** (`sales1` đăng nhập có quyền `MARKETING`) | [P1-06_menu-marketing.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-06_menu-marketing.txt) |
| **P1-07** | Menu và Route gating đồng bộ 100% | **PASS** (Kiểm tra mã nguồn `frontend/src/App.tsx`, mọi `<Route>` khớp điều kiện menu) | [P1-07_menu-equals-route.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-07_menu-equals-route.txt) |
| **P1-08** | CMS cảnh báo tài khoản thiếu quyền | **PASS** (Đăng nhập CMS không bị chặn, hiển thị `<Alert>` cảnh báo quyền) | [P1-08_cms-warning-banner.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-08_cms-warning-banner.txt) |
| **PUB-01..09** | Public endpoints, portals, upload, webhook | **PASS** (Hoạt động bình thường, không bị chặn hay phát sinh log DENY sai) | [PUB-01-to-09_public-endpoints.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/PUB-01-to-09_public-endpoints.txt) |
| **P1.4 (D7)** | HR Tự phục vụ `/api/hr/me/*` | **PASS** (9 endpoint tự phục vụ chỉ đọc dữ liệu của chính mình, chặn ẩn danh bằng 401) | [P1-HR-ME_self-service.txt](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/rbac_v2/evidence/P1/P1-HR-ME_self-service.txt) |

---

## 6. Ảnh hưởng vận hành và Lưu ý cho Chủ dự án (Phụ lục B)

1. **I-18 (Kế toán thanh toán công nợ NCC):** Nhóm **Accounting_manager** hiện chỉ có `FINANCE=V` và `PURCHASE=-----`. Trong chế độ SHADOW (P1), kế toán vẫn ghi nhận thanh toán bình thường. Nhưng khi bật **ENFORCE (Phase 2)**, họ sẽ cần `FINANCE:create` và `PURCHASE:view`. Chủ dự án cần cấp thêm các quyền này cho nhóm Kế toán trước khi bật ENFORCE.
2. **Ghi nhận thanh toán từ đơn bán:** Nhóm Sales hiện không có `FINANCE`. Nếu nhân viên sales ghi nhận thanh toán trực tiếp từ màn hình đơn bán (`POST /api/finance/payment`), khi ENFORCE sẽ bị chặn. Nhật ký truy cập SHADOW (`/system/rbac`) sẽ thống kê cụ thể tần suất phát sinh để xử lý trước P2.
3. **Nhân viên Part-time & Chấm công:** Nhóm Partime theo giờ không có quyền module nào. Sau P1, toàn bộ tính năng xem chấm công, xem lương, xin nghỉ phép của họ đã chuyển sang `/api/hr/me/*` an toàn và thông suốt, không bị ảnh hưởng khi ENFORCE.
