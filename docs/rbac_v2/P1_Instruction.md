# P1 — Phân hạng toàn bộ endpoint + mã quyền mới + seed

**Điều kiện bắt đầu:** P0 đã audit PASS, **và** chủ dự án đã chốt D1–D7. Kết quả ghi vào bảng dưới; bảng còn trống thì **không được làm**.
**Nhánh:** `rbac/p1`
**Hành vi sau deploy:** vẫn SHADOW, chưa chặn ai. Menu frontend có thể đổi chỗ gate (I-02, I-03, I-04), nhưng nhờ seed nên không ai mất menu.

## Quyết định đã chốt (Claude điền sau khi chủ dự án trả lời)

| ID | Kết quả | Ảnh hưởng tới instruction này |
|---|---|---|
| D1 PURCHASE | _chưa chốt_ | Có → purchasing dùng PURCHASE, seed từ PRODUCTION. Không → thay mọi `PURCHASE` trong matrix bằng `PRODUCTION` |
| D2 MARKETING | _chưa chốt_ | Có → seed từ SALES. Không → thay bằng `SALES` |
| D3 SYSTEM | _chưa chốt_ | Có → seed từ USERS. Không → thay bằng `USERS` |
| D4 Nhóm dùng CMS | _chưa chốt_ | Danh sách `group_id` được seed CMS full quyền |
| D5 Designs | _chưa chốt_ | Mặc định `AnyPerm(['PRODUCT',a],['PRODUCTION',a])` |
| D6 Tra cứu danh mục | _chưa chốt_ | Có → giữ các dòng AUTH cho GET products/materials/categories/processes/suppliers |
| D7 HR tự phục vụ | _chưa chốt_ | Có → xem mục P1.4 |

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
     if group.id in D4 list → upsert CMS {view,create,update,delete = true}
   setValue('RBAC_SEED_V1', JSON.stringify({ at, changes:[{group_id, group_name, to, from, flags}] }))
   ```
   - `copyIfMissing`: chỉ tạo khi nhóm **chưa có dòng** mã đích. Chép 5 cờ `can_view, can_create, can_update, can_delete, view_cost_price`. Nhóm không có dòng nguồn thì bỏ qua.
   - Chạy trong **một transaction** (`dataSource.transaction`).
   - Không động vào dòng quyền đã có.
3. `REPORT_P1.md` phải có bảng "Seed dry-run" chạy trên bản copy DB production. Mày xin chủ dự án dump, **không** chạy thẳng lên prod: nhóm nào nhận mã nào, từ mã nào.

## P1.4 HR tự phục vụ (nếu D7 = Có)

Trong `hr.controller.ts`, các route có `review=Y` với ghi chú "tự phục vụ" (chấm công, nghỉ phép, phiếu lương của mình):
- Liệt kê từng route trong REPORT với đề xuất: `@AuthOnly()` cho route thao tác trên hồ sơ **của chính mình**, `@Perm('HR', …)` cho route thao tác trên người khác.
- **Không sửa logic**. Nếu một route dùng chung cho cả hai (nhận `employee_id` tuỳ ý) thì gắn `@Perm('HR', …)` và ghi vào REPORT mục "Cần tách route ở P3".
- Chờ Claude audit rồi mới chốt.

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
