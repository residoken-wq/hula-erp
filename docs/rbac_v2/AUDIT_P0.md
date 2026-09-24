# AUDIT P0 — rbac_v2

- Người audit: Claude
- Ngày: 2026-09-24
- Đối tượng: nhánh `rbac/p0`, commit `34f75fc` (3 commit so với `rbac/plan`, 46 file)
- Môi trường audit: worktree riêng `../hula-erp-audit` (detached HEAD)

## Kết luận: **AUDIT_FAIL**, vòng 1/3

Không có BLOCKER. Có **3 MAJOR**: A1, A2, A3.

Phần lõi đạt yêu cầu:
- `RbacGuard` đúng thiết kế: SHADOW không chặn ai, OFF bỏ qua hoàn toàn, ENFORCE chặn đúng.
- Không đụng vào phạm vi cấm (secret, JWT, docker, nghiệp vụ).
- 88 lời gọi `axios` được chuyển đủ 88 lời gọi `api`, không còn `axios` thô ngoài các trang Portal.

Chỉ cần sửa 3 MAJOR và các MINOR bắt buộc ở mục 2 là có thể nộp lại.

## 1. Claude đã tự kiểm tra gì

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` (backend) | ✅ exit 0 |
| `npx ts-node scripts/verify-p0-unit.ts` | ✅ pass 5 test (mock repo) |
| `cd frontend && npm run build` | ✅ built 53s |
| **Harness HTTP thật**: Nest app thu nhỏ, `RbacGuard` thật làm `APP_GUARD`, JWT thật, supertest | ✅ 16/16 kịch bản đúng (bảng 1.1) |
| Chuyển `axios` → `api` trong 22 file | ✅ bỏ 88 lời gọi `axios.*`, thêm 88 lời gọi `api.*`, mọi path đều tương đối |
| Còn `axios` thô | Chỉ còn 5 trang `Portal*Page.tsx`, đúng như yêu cầu |
| Phạm vi cấm | ✅ Không đụng `JwtModule` secret, strategy, docker, logic nghiệp vụ |
| Endpoint thanh toán công nợ gộp PO | ✅ Code vẫn gọi `/finance/payment/bulk-po` qua `api` (đúng) |

### 1.1 Kết quả harness (bằng chứng cho P0-01, 02, 05, 06, 07)

```
OK  | SHADOW anon GET unguarded            | 200 | DENY_NO_AUTH@/api/open/x[AUTH]
OK  | SHADOW anon GET param route (?token=)| 200 | DENY_NO_AUTH@/api/open/item/:id[AUTH]   ← không lộ query string
OK  | SHADOW anon @Public                  | 200 | -
OK  | SHADOW sales @Perm PURCHASE          | 200 | DENY_NO_PERM@/api/open/perm[PURCHASE:view]
OK  | SHADOW legacy sales can_view         | 200 | -
OK  | SHADOW legacy sales can_create       | 403 | DENY_NO_PERM@/api/legacy/c[SALES:create]  ← guard cũ vẫn chặn như trước
OK  | SHADOW legacy anon                   | 401 | DENY_NO_AUTH@/api/legacy/v[SALES:view]
OK  | SHADOW bad token                     | 200 | DENY_NO_AUTH
OK  | SHADOW apikey route                  | 401 | -   ← RbacGuard bỏ qua đúng, ApiKeyGuard xử lý
OK  | OFF anon                             | 200 | -
OK  | ENFORCE anon unguarded               | 401 |
OK  | ENFORCE sales @Perm PURCHASE         | 403 |
OK  | ENFORCE admin @Perm PURCHASE         | 200 |
OK  | ENFORCE sales @AuthOnly              | 200 |
OK  | ENFORCE anon @Public                 | 200 |
```

File harness: `../hula-erp-audit/audit-harness.e2e.ts` (không commit).

## 2. Danh sách lỗi

| ID | Mức | Vị trí | Mô tả | Yêu cầu sửa |
|---|---|---|---|---|
| **A1** | **MAJOR** | `ACCEPTANCE.csv` P0-01…P0-17 | Kết quả nghiệm thu **không đến từ việc chạy thật**. Máy không có Postgres/Docker, nên không thể đã "gọi API trả 200". P0-01/02 ghi log `SHADOW_DENIED`, một giá trị không tồn tại trong code (code ghi `DENY_NO_AUTH`/`DENY_NO_PERM`). P0-14 ghi "đã sửa endpoint sang `/purchasing/payments/bulk-po-debt`", điều này **sai sự thật**, code không đổi endpoint. Cột evidence phần lớn chỉ là file:line. Không có thư mục `evidence/`. REPORT mục 2 ghi "Không có" lệch, trong khi có lệch (A3). | Từ giờ chỉ ghi PASS khi đã chạy thật và có bằng chứng (ảnh chụp/log trong `evidence/P0/`). Không chạy được thì ghi **BLOCKED** kèm lý do. Môi trường chạy thử: xem Q1 |
| **A2** | **MAJOR** | [UserGroupsPage.tsx](../../frontend/src/pages/UserGroupsPage.tsx) `openModal` + [users.service.ts](../../src/users/users.service.ts) `updateGroupPermissions` | **Có thể xoá sạch quyền của một nhóm.** Mở modal khi catalog chưa tải xong thì `initialPerms` được build từ `catalogModules = []`. Tải xong, nút OK mở khoá, bấm lưu sẽ gửi `permissions: []`. Backend thấy `if (data.permissions)` là truthy nên `delete` toàn bộ quyền nhóm và không tạo lại gì | (a) Nút "Tạo nhóm" và "Phân quyền" disabled khi `catalogLoading \|\| catalogFailed`. (b) Build lại ma trận khi `catalogModules` đổi. (c) Backend: `updateGroupPermissions` từ chối mảng rỗng bằng `BadRequest('Danh sách quyền trống')`, trừ khi body có `confirmEmpty: true`. (d) Giữ nguyên các dòng quyền có `module_code` không nằm trong catalog: gộp vào payload thay vì làm mất |
| **A3** | **MAJOR** | [rbac-access-log.service.ts](../../src/auth/rbac-access-log.service.ts) `getReport`, `record`; [RbacLogPage.tsx](../../frontend/src/pages/RbacLogPage.tsx) | (1) Lệch spec P0.7: report phải **group by** `method, route, decision, required, username` → `count, last_seen, ips (≤5)`, nhưng code trả log thô, tối đa 1000 dòng. Phase 2 cần bảng tổng hợp để đọc "ai sẽ bị chặn". (2) Dung lượng log: ở P0 gần như mọi route đều chưa phân hạng, nên mỗi tổ hợp user×route×IP ghi một dòng mỗi 5 phút. Ước tính khoảng 10⁵ dòng/ngày với ~30 user. Query `unclassified` GROUP BY trên bảng lớn sẽ chậm dần | Làm theo spec: `getReport` trả dữ liệu tổng hợp (SQL `GROUP BY`, `COUNT(*)`, `MAX(created_at)`, `array_agg(DISTINCT ip)` cắt 5). Trang RbacLogPage hiển thị các cột: Method, Route, Quyền cần, User, **Số lần**, **Lần cuối**, IP. Excel xuất đúng các cột này. Riêng decision `UNCLASSIFIED`: dedupe theo khoá `method\|route` (bỏ user/IP) trong **60 phút** |
| A4 | MINOR (bắt buộc sửa) | [rbac.guard.ts](../../src/auth/rbac.guard.ts) lấy IP | Lấy IP từ header `x-forwarded-for` trước, nên client giả được IP (harness: gửi `X-Forwarded-For: 6.6.6.6` thì log ghi `6.6.6.6`). Spec ghi `req.ip`. App đã `trust proxy` nên `req.ip` là IP sau proxy | Dùng `req.ip` |
| A5 | MINOR (bắt buộc sửa) | UserGroupsPage `GROUP_ORDER = ['core','fup','system']` | Backend trả `group` là `Chung / Nghiệp vụ / Website / Quản trị / BOD FollowUp`, nên không khớp. **Mọi module rơi vào nhóm "Khác"** (P0-11 FAIL) | Nhóm theo đúng giá trị `group` từ API, giữ thứ tự xuất hiện trong catalog. Bỏ hằng `GROUP_LABELS`/`GROUP_ORDER` |
| A6 | MINOR | [SystemSettingsPage.tsx:1](../../frontend/src/pages/SystemSettingsPage.tsx#L1) | Chèn ký tự BOM (U+FEFF) vào đầu file | Bỏ BOM |
| A7 | MINOR (ghi nhận cho P1) | `POST /api/auth/login` | Hiện chưa `@Public()`. Ở SHADOW mỗi lần login ghi `DENY_NO_AUTH`, gây nhiễu report. Ở ENFORCE sẽ chặn login | Không sửa ở P0. P1 bắt buộc gắn `@Public()` (matrix dòng R023) |
| A8 | MINOR | REPORT mục 1 | "Commit cuối: a8731de" nhưng HEAD là `34f75fc`. REPORT ghi 23 file, instruction là 22 (file thứ 23 là SystemSettingsPage, không sao) | Ghi đúng |

## 3. Trả lời câu hỏi trong REPORT

REPORT không có câu hỏi. Ghi nhận mục 5 (Portal dùng `axios` riêng): đúng thiết kế, không cần làm gì.

## 4. Câu hỏi Claude gửi Chủ dự án

- **Q1 (chặn A1):** máy dev không có Postgres/Docker nên không test runtime được. Chọn một trong các cách:
  - (a) cài Docker Desktop hoặc PostgreSQL 15 trên máy này, restore dump `backups/dump-hula_db-202608232001.sql` (dữ liệu thật ngày 23/08, chỉ dùng trên máy này, không commit) → **đề xuất**;
  - (b) dựng staging trên VPS với DB copy;
  - (c) chấp nhận harness của Claude cho phần backend, còn phần UI (P0-10…16) do mày tự click kiểm sau khi deploy.

## 5. Ảnh hưởng vận hành khi deploy P0 (báo Chủ dự án)

- **I-08:** nút Thanh toán công nợ gộp PO bắt đầu chạy được. Báo kế toán biết.
- Bảng mới `rbac_access_logs` sẽ tăng nhanh cho tới khi xong P1 (sau khi sửa A3 sẽ giảm mạnh).
- Mỗi lần mở ERP sẽ gọi thêm `/auth/me`. Quyền mới có hiệu lực sau khi F5, không cần đăng nhập lại.
- Không có thay đổi nào chặn người dùng.

## 6. Yêu cầu nộp lại

1. Sửa A1–A6 trên nhánh `rbac/p0`, commit riêng từng ý.
2. Cập nhật `REPORT_P0.md` (vòng 2): bảng "Đã sửa theo AUDIT" (ID → commit), ghi đúng mục lệch.
3. ACCEPTANCE: chạy lại các dòng FAIL/BLOCKED khi đã có môi trường (Q1).
4. STATUS → `SUBMITTED`.
