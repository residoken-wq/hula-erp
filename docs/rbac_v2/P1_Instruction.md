# P1 — Phân hạng toàn bộ endpoint + mã quyền mới + seed

**Điều kiện bắt đầu:** P0 đã audit PASS, **và** chủ dự án đã chốt D1–D7. Kết quả ghi vào bảng dưới; bảng còn trống thì **không được làm**.
**Nhánh:** `rbac/p1`, tạo từ `main`. P0 đã merge ở `3f491fe`.
**Hành vi sau deploy:** vẫn SHADOW, chưa chặn ai. Menu frontend có thể đổi chỗ gate (I-02, I-03, I-04), nhưng nhờ seed nên không ai mất menu.
**Môi trường test (bắt buộc):** `docs/rbac_v2/test-env/TEST-ENV.md`. Postgres 15 local với bản copy DB thật đã làm sạch. Mọi dòng ACCEPTANCE P1 phải chạy trên môi trường này, lưu evidence dạng `.txt`.

## Quyết định đã chốt (Claude điền sau khi chủ dự án trả lời)

| ID | Kết quả | Ảnh hưởng tới instruction này |
|---|---|---|
| D1 PURCHASE | ✅ **Tách PURCHASE** (2026-09-25) | purchasing dùng `PURCHASE`, seed chép từ `PRODUCTION` |
| D2 MARKETING | ✅ **Tách MARKETING** (2026-09-25) | marketing/social/tiktok dùng `MARKETING`, seed chép từ `SALES` |
| D3 SYSTEM | ✅ **Tách SYSTEM** (2026-09-25) | cấu hình tích hợp dùng `SYSTEM`, seed chép từ `USERS` |
| D4 CMS | ✅ **Tạo nhóm quyền CMS riêng; Chủ dự án tự gán user** (2026-09-25) | Seed **không** cấp CMS cho nhóm có sẵn. Seed tạo mới nhóm `Biên tập Website (CMS)` có CMS đủ 4 quyền, chưa có user nào (P1.3) |
| D5 Designs | ✅ **Tạm cả hai** (2026-09-25) | `AnyPerm(['PRODUCT',a],['PRODUCTION',a])` cho `designs/*`; menu `hasPerm('PRODUCT') \|\| hasPerm('PRODUCTION')` |
| D6 Tra cứu danh mục | ✅ **Mọi user đã đăng nhập xem** (2026-09-25) | Giữ các dòng `AUTH` cho `GET` products/materials/categories/processes/suppliers. Ghi/sửa vẫn cần quyền module |
| D7 HR | ✅ **Nhân viên chỉ thao tác hồ sơ của chính mình; hồ sơ người khác chỉ Admin** (2026-09-25) | Làm theo P1.4 (bản mới): thêm API `/hr/me/*`, route HR cũ cần quyền `HR`. "Chỉ Admin" thực hiện bằng cách **không cấp quyền HR cho nhóm nào**; Chủ dự án tự bỏ quyền HR ở các nhóm đang có (không seed xoá tự động) |

---

## P1.1 Gắn decorator theo `route-matrix.csv`

Với mỗi dòng trong `route-matrix.csv`:

| `proposed_tier` | Làm gì |
|---|---|
| `PUBLIC` | Gắn `@Public()` ở method (kể cả khi route đã mở sẵn). Route đang có guard mà matrix ghi PUBLIC (`change = OPEN!`) → **dừng, hỏi**. Hiện có 0 dòng loại này |
| `AUTH` | Gắn `@AuthOnly()` |
| `AUTH` + `proposed_perm = SELF_OR:USERS:update` | Gắn `@AuthOnly()` và xử lý self-check trong code (P3). Ở P1 chỉ gắn `@AuthOnly()` |
| `PERM`, một quyền (`SALES:update`) | `@Perm('SALES','update')` |
| `PERM`, nhiều quyền (`SALES:update \| INVENTORY:update`) | `@AnyPerm(['SALES','update'],['INVENTORY','update'])` |
| `PERM` + `current` đã là `PERM ...` + `change = NO_CHANGE` | **Giữ nguyên** `@RequirePermission` cũ, không thêm gì |
| `APIKEY` | Không đổi |

Quy tắc:
- Gắn ở **method**, không gắn ở class. Như vậy review theo từng dòng dễ hơn.
- **Không** thêm `@UseGuards` mới, **không** dùng `@RequirePermission` cho route mới (xem 00_START-HERE luật 2).
- Dòng `review=Y`: áp giá trị đề xuất, trừ khi bảng quyết định ở trên nói khác, và liệt kê lại trong `REPORT_P1.md` mục "Review rows".
- `R022 GET /api/test` (app.controller): gắn `@Public()` và ghi chú trong REPORT là health check.
- `POST /api/hr/review-questions-seed` hiện có `@Public()`: **bỏ `@Public()`**, gắn `@Perm('HR','create')`. Đây là ngoại lệ duy nhất được phép thu hẹp ngay ở P1. Controller hr có `JwtAuthGuard` cấp class nên route này sẽ bắt đăng nhập ngay. Không ảnh hưởng vận hành vì chỉ dùng lúc seed.

## P1.2 Script kiểm tra `scripts/check-rbac.js`

- Quét `src/**/*.controller.ts`. Mỗi route phải có đúng một trong các decorator: `@Public`, `@AuthOnly`, `@Perm`, `@AnyPerm`, `@RequirePermission`, hoặc thuộc controller có `ApiKeyGuard`.
- In bảng tổng kết theo hạng. Exit code 1 nếu còn route chưa phân hạng hoặc một route có hơn một hạng.
- So với `docs/rbac_v2/route-matrix.csv` (khớp theo `method + route`): in các route lệch hạng/quyền so với matrix, dạng cảnh báo (không fail).
- Thêm bước này vào `scripts/qa.js`.
- **Nghiệm thu:** 0 route chưa phân hạng; mọi chỗ lệch so với matrix đều được giải thích trong REPORT.

## P1.3 Danh mục + seed dữ liệu quyền

1. Thêm `{ code: 'MARKETING', name: 'Marketing & Kênh bán (Social/TikTok)', group: 'Nghiệp vụ' }` vào `PERMISSION_MODULES` (nếu D2 = Có).
2. Tạo `src/auth/rbac-seed.service.ts`, chạy trong `onModuleInit`, **idempotent**, đánh dấu bằng key `RBAC_SEED_V1` trong `system_configs`:
   ```
   if getValue('RBAC_SEED_V1') tồn tại → return
   for each group in user_groups:
     copyIfMissing(group, from='PRODUCTION', to='PURCHASE')   // D1
     copyIfMissing(group, from='SALES',      to='MARKETING')  // D2
     copyIfMissing(group, from='USERS',      to='SYSTEM')     // D3
   // D4: tạo nhóm CMS riêng nếu chưa có nhóm trùng tên
   if !exists user_groups.name = 'Biên tập Website (CMS)':
     insert group { name: 'Biên tập Website (CMS)', description: 'Quyền sửa nội dung website qua cms.nemmamnon.com' }
     insert group_permissions { module_code:'CMS', can_view, can_create, can_update, can_delete = true, view_cost_price=false }
   setValue('RBAC_SEED_V1', JSON.stringify({ at, changes:[{group_id, group_name, to, from, flags}], created_groups:[...] }))
   ```
   - Bảng dry-run trong REPORT phải có thêm **danh sách nhóm đang có quyền HR** (tên nhóm, số user, các cờ). Chủ dự án dùng danh sách này để tự bỏ quyền HR theo D7. Seed **không** xoá quyền HR.
   - `copyIfMissing`: chỉ tạo khi nhóm **chưa có dòng** mã đích. Chép 5 cờ `can_view, can_create, can_update, can_delete, view_cost_price`. Nhóm không có dòng nguồn thì bỏ qua.
   - Chạy trong **một transaction** (`dataSource.transaction`).
   - Không động vào dòng quyền đã có.
3. `REPORT_P1.md` phải có bảng "Seed dry-run" chạy trên môi trường test: `pgenv.sh reset`, boot backend, xem `RBAC_SEED_V1`. Bảng ghi nhóm nào nhận mã nào, chép từ mã nào. **Không** chạy thẳng lên prod. Kết quả phải khớp **Phụ lục A**, lệch thì giải thích.

## P1.4 HR tự phục vụ: API `/hr/me/*` (D7)

**Vấn đề hiện tại** (lỗ hổng riêng tư đang tồn tại): [ProfilePage.tsx](../../frontend/src/pages/ProfilePage.tsx), trang mọi nhân viên đều mở được, đang gọi:
- `GET /hr/employees/by-user/:userId`: đổi `userId` là xem hồ sơ người khác.
- `GET /hr/attendances?employee_id=`, `GET /hr/payslips?employee_id=`, `GET /hr/assets?employee_id=`: đổi số là xem chấm công/**lương**/tài sản người khác.
- `GET /hr/leaves`: tải **toàn bộ** đơn nghỉ của công ty rồi lọc ở trình duyệt.
- `POST /hr/check-in|check-out|leaves` với `employee_id` từ body: chấm công/xin nghỉ **hộ** người khác được.

**Làm (thêm mới, không sửa route cũ):**

1. Controller mới `src/hr/hr-me.controller.ts`, prefix `hr/me`, gắn `@UseGuards(JwtAuthGuard)` ở class (controller mới nên được phép, và chỉ bắt đăng nhập). Mọi method gắn `@AuthOnly()`.
2. Helper `resolveMyEmployee(req)`: tìm `Employee` theo `user_id = req.user.id`. Không có thì trả **404** "Tài khoản chưa được liên kết hồ sơ nhân viên". **Không bao giờ** đọc `employee_id` từ query hay body.
3. Endpoint, mỗi cái gọi **service có sẵn** với `employee_id` đã resolve. Không viết logic nghiệp vụ mới:

   | Mới | Thay cho (ProfilePage đang gọi) |
   |---|---|
   | `GET /hr/me` | `GET /hr/employees/by-user/:userId` |
   | `GET /hr/me/attendances` | `GET /hr/attendances?employee_id=` |
   | `GET /hr/me/leaves` | `GET /hr/leaves` (lọc ở server theo employee của mình) |
   | `GET /hr/me/payslips` | `GET /hr/payslips?employee_id=` |
   | `GET /hr/me/assets` | `GET /hr/assets?employee_id=` |
   | `POST /hr/me/check-in` | `POST /hr/check-in` |
   | `POST /hr/me/check-out` | `POST /hr/check-out` |
   | `POST /hr/me/leaves` | `POST /hr/leaves` (ép `employee_id` = của mình; bỏ qua `status` trong body, luôn tạo trạng thái chờ duyệt như service hiện làm) |

   Nếu service hiện tại không có hàm lọc theo `employee_id` cho một mục nào đó: **dừng mục đó**, ghi vào REPORT, không tự viết query mới.
4. `ProfilePage.tsx`: đổi sang gọi `/hr/me/*`. Giao diện và dữ liệu hiển thị giữ nguyên.
5. Route HR cũ trong `hr.controller.ts`: gắn `@Perm('HR', action)` theo matrix. Riêng `check-in`, `check-out`, `POST leaves`: `@Perm('HR','create')`. Sau P1 không trang nào của nhân viên thường gọi các route này nữa.
6. Thêm vào `route-matrix.csv` các dòng `/api/hr/me/*` (tier `AUTH`, change `NEW`).

**Ảnh hưởng vận hành (đã báo Chủ dự án):**
- Nhân viên thường: không đổi gì trên trang Hồ sơ.
- Từ ENFORCE (P2), chỉ tài khoản có quyền `HR` (theo D7 là chỉ Admin) mới xem/sửa hồ sơ, chấm công, lương, nghỉ phép **của người khác**, và mới duyệt đơn nghỉ.
- **Nếu hiện có nhân sự không phải admin đang làm lương/duyệt phép, họ sẽ mất quyền này** (I-17).

## P1.5 Frontend: menu và route theo mã mới

Trong `App.tsx`, **menu và `<Route>` phải dùng cùng một điều kiện**:

| Mục | Điều kiện cũ | Điều kiện mới |
|---|---|---|
| `/purchasing` | `hasPerm('PRODUCTION')` | `hasPerm('PURCHASE')` (D1) |
| `/marketing`, `/social/channels`, `/social/orders` | `hasPerm('SALES')` | `hasPerm('MARKETING')` (D2) |
| `/system/settings` | `hasPerm('USERS')` | `hasPerm('SYSTEM')` (D3) |
| `/designs`, `/print-production` | `hasPerm('PRODUCTION')` | `hasPerm('PRODUCT') \|\| hasPerm('PRODUCTION')` (D5) |
| `/website-products` | route PRODUCT, menu PRODUCT hoặc SALES | Cả hai: `hasPerm('PRODUCT')` |
| `/docs`, `/ai-dashboard` | menu gate, route không gate | route gate giống menu |

**Backend và frontend P1 phải deploy cùng lúc** (seed chạy khi backend khởi động, trước khi user mở frontend mới).

## P1.6 CMS (hula-web/cms)

- `hooks/useAuth.tsx:69-73`: **chưa bật lại chặn** ở P1. Chỉ đổi `console.warn` thành một banner cảnh báo trong dashboard CMS: "Tài khoản chưa được cấp quyền CMS — sẽ bị chặn từ ngày …".
- `checkCmsPermission` đọc mã `CMS` với `can_view`.

## Không làm ở P1

- Không bật ENFORCE.
- Không xoá `PermissionsGuard` hay `@RequirePermission` cũ.
- Không sửa logic trong service.

---

## Phụ lục A — Kết quả seed dự kiến trên dữ liệu thật (dump 23/08, Claude đã truy vấn)

Ma trận hiện tại của các mã liên quan (`V C U D $` = view, create, update, delete, xem giá vốn; `-` = tắt). Mọi nhóm **đã có dòng** cho các mã trong bảng, vì màn hình phân quyền lưu cả ma trận:

| Nhóm (id, số user) | PRODUCTION | PURCHASE | SALES | USERS | CMS | HR | FINANCE |
|---|---|---|---|---|---|---|---|
| 1 Sales (2) | ----- | ----- | VCU-- | ----- | ----- | ----- | ----- |
| 2 Admin (2) | VCUD$ | VCUD$ | VCUD$ | VCUD$ | VCUD$ | VCUD$ | VCUD$ |
| 3 Planning Manager (1) | VCUD- | VCUD- | VCUD- | ----- | VCUD- | ----- | V---- |
| 4 Accounting_manager (1) | ----- | ----- | V---- | ----- | ----- | ----- | V---- |
| 5 Marketing_Design (1) | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 6 Partime theo giờ (2) | ----- | ----- | ----- | ----- | ----- | ----- | ----- |

**Seed V1 phải cho ra đúng như sau:**

| Bước | Kết quả dự kiến |
|---|---|
| D1 PRODUCTION → PURCHASE | **0 dòng tạo mới.** Cả 6 nhóm đã có dòng PURCHASE và giá trị trùng PRODUCTION |
| D2 SALES → MARKETING | **6 dòng tạo mới:** 1=VCU--, 2=VCUD$, 3=VCUD-, 4=V----, 5=-----, 6=----- |
| D3 USERS → SYSTEM | **6 dòng tạo mới:** 2=VCUD$, các nhóm còn lại ----- |
| D4 CMS | **1 nhóm mới** "Biên tập Website (CMS)", CMS=VCUD-, 0 user. Admin và Planning Manager giữ nguyên CMS đang có |
| Danh sách nhóm có HR (D7) | Chỉ **2 Admin** (2 user) |

## Phụ lục B — Ảnh hưởng vận hành rút ra từ dữ liệu thật (Claude báo Chủ dự án)

- **I-18 (CAO, xảy ra khi ENFORCE):** nhóm **Accounting_manager** chỉ có FINANCE=V và PURCHASE=-----. Hiện họ vẫn ghi được thanh toán vì route thanh toán chỉ kiểm đăng nhập. Sau P1, các route này cần `FINANCE:create` và `PURCHASE:view`. Chủ dự án cần tick thêm các quyền đó trước khi bật ENFORCE, nếu không kế toán mất quy trình thanh toán công nợ NCC.
- **Nhóm Sales** không có FINANCE. Nếu sales đang ghi nhận thanh toán đơn hàng từ màn hình đơn (`POST /finance/payment`), khi ENFORCE sẽ bị chặn. Log SHADOW sẽ cho biết.
- **Marketing_Design** không có SALES, nên cũng không nhận MARKETING. Hiện họ vốn đã không thấy menu Marketing, nên không đổi. Muốn giao marketing cho nhóm này thì tick MARKETING.
- **Partime theo giờ** không có quyền nào. Họ chỉ dùng Tổng quan, Công việc và trang Hồ sơ (chấm công), nên **bắt buộc** phải làm P1.4 (`/hr/me/*`) trước ENFORCE.
- Nhóm **Admin** có 2 user. Ngoài `admin`, người thứ hai có mọi quyền nhờ ma trận quyền (không phải nhờ bypass).
