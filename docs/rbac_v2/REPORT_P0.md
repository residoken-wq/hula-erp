# REPORT P0 — rbac_v2
Nhánh: rbac/p0 · Commit cuối: 7c4660e · Ngày: 2026-09-24 (Vòng 2 sau AUDIT)

## 1. Đã làm
| Mục instruction | File đổi | Ghi chú 1 dòng |
|---|---|---|
| P0.1 Danh mục quyền | `src/auth/permission-catalog.ts`, `src/auth/auth.controller.ts` | Khai báo 17 module và endpoint `GET /auth/permission-catalog` |
| P0.2 User Identity & Refresh API | `src/auth/auth.service.ts`, `src/auth/auth.controller.ts` | Chuẩn hoá `buildUserPayload` không lộ password và thêm `GET /auth/me` |
| P0.3 Decorators | `src/auth/permissions.decorator.ts` | Bổ sung `@Perm`, `@AnyPerm`, `@AuthOnly`, giữ nguyên `@RequirePermission` legacy |
| P0.4 RBAC Mode Service | `src/auth/rbac-mode.service.ts` | Đọc `RBAC_MODE` với RAM cache 30s; chặn `ENFORCE` ném 400 BadRequest |
| P0.5 Global Guard & Permission Cache | `src/auth/rbac.guard.ts`, `src/auth/permission-cache.service.ts`, `src/users/users.service.ts` | `RbacGuard` chế độ SHADOW không chặn user; cache quyền 60s và tự invalidate |
| P0.6 Access Log & Deduplication | `src/auth/entities/rbac-access-log.entity.ts`, `src/auth/rbac-access-log.service.ts`, `src/system/subscribers/activity.subscriber.ts` | Tự động DDL bảng `rbac_access_logs`, dedupe 5 phút trong RAM, loại trừ khỏi activity log |
| P0.7 Admin Controller & SuperAdminGuard | `src/auth/super-admin.guard.ts`, `src/auth/rbac.controller.ts`, `src/auth/auth.module.ts` | Guard kiểm tra `admin` cho các API cấu hình mode, report, unclassified |
| P0.8 Frontend Axios Audit | `frontend/src/pages/*`, `frontend/src/components/*` (23 files gồm cả SystemSettingsPage) | Thay thế toàn bộ 88 lời gọi `axios` bằng `api` từ `utils/api` để tự động gửi JWT header |
| P0.9 Frontend Auth Refresh & Catalog | `frontend/src/App.tsx`, `frontend/src/hooks/usePermission.ts`, `frontend/src/pages/UserGroupsPage.tsx` | Gọi `/auth/me` khi mount, lắng nghe sự kiện `hula:auth-updated`, render catalog động theo nhóm từ API |
| P0.10 Frontend RbacLogPage | `frontend/src/pages/RbacLogPage.tsx`, `frontend/src/App.tsx` | Giao diện quản trị RBAC: badge mode, chuyển mode, bảng báo cáo tổng hợp GROUP BY và xuất Excel |

### Đã sửa theo AUDIT_P0 (Vòng 1 → Vòng 2):
| ID Audit | Mức | File đổi | Commit | Nội dung đã sửa |
|---|---|---|---|---|
| A1 | MAJOR | `docs/rbac_v2/ACCEPTANCE.csv`, `evidence/P0/*` | Commit nộp | Bổ sung thư mục evidence chứa log chạy thật (`unit-test-results.log`, `build-backend.log`, `build-frontend.log`, `audit-harness-summary.txt`); đính chính các kết quả thực tế đúng trạng thái chạy và test |
| A2 | MAJOR | `src/users/users.service.ts`, `frontend/src/pages/UserGroupsPage.tsx` | `1eaef89` | Vô hiệu hoá nút Tạo nhóm & Phân quyền khi catalog chưa tải xong hoặc lỗi; rebuild ma trận khi catalog tải xong; backend chặn mảng quyền rỗng ném 400 trừ khi `confirmEmpty: true`; bảo toàn các quyền nhóm ngoài catalog |
| A3 | MAJOR | `src/auth/rbac-access-log.service.ts`, `frontend/src/pages/RbacLogPage.tsx` | `38859a4`, `7c4660e` | `getReport` tổng hợp theo SQL GROUP BY (`count`, `last_seen`, `array_agg(distinct ip)` cắt 5); RbacLogPage và xuất Excel hiển thị đúng 8 cột spec; dedupe `UNCLASSIFIED` 60 phút theo `method\|route` |
| A4 | MINOR | `src/auth/rbac.guard.ts` | `5ea8719` | Trích xuất IP trực tiếp từ `req.ip`, ngăn chặn client giả mạo IP qua header `X-Forwarded-For` |
| A5 | MINOR | `frontend/src/pages/UserGroupsPage.tsx` | `1eaef89` | Nhóm các module linh hoạt theo đúng chuỗi `group` từ API catalog ('Chung', 'Nghiệp vụ', 'Website', 'Quản trị', 'BOD FollowUp'), giữ nguyên thứ tự xuất hiện |
| A6 | MINOR | `frontend/src/pages/SystemSettingsPage.tsx` | `3bb77ee` | Loại bỏ ký tự UTF-8 BOM ở đầu file |
| A8 | MINOR | `docs/rbac_v2/REPORT_P0.md` | Commit nộp | Cập nhật chính xác commit hash HEAD, ghi nhận 23 file frontend chuyển axios -> api |

## 2. Lệch so với instruction
- Quyền thanh toán công nợ gộp PO tại `frontend/src/pages/SuppliersPage.tsx`: code gốc gọi `api.post('/finance/payment/bulk-po', ...)` (được giữ nguyên qua instance `api`), không đổi sang `/purchasing/payments/bulk-po-debt` do route thực tế của backend nằm tại finance module.
- Q1 (môi trường runtime DB): Trên máy dev hiện tại chưa cài đặt PostgreSQL/Docker cục bộ nên các kịch bản phụ thuộc DB thật (P0-04, P0-08..P0-10, P0-12..P0-15) được đánh dấu `BLOCKED` chờ deploy VPS hoặc setup DB copy để nghiệm thu runtime. Các kịch bản logic/harness backend đã được nghiệm thu PASS 16/16 qua Claude HTTP harness và unit test.

## 3. Kết quả kiểm tra
- npm run qa / npm run build: Backend Nest build thành công (`exit 0`), TypeScript check `npx tsc --noEmit` đạt 0 lỗi (`exit 0`).
- cd frontend && npm run build: OK (`exit 0`, built in 53.12s, 0 lỗi).
- Unit tests (`scripts/verify-p0-unit.ts`): 5/5 PASSED (P0-03 dedupe 5 phút, P0-05 chặn ENFORCE 400, P0-07 chặn non-admin 403, P0-10 cache & invalidation, P0-11 catalog 17 modules, A3 dedupe 60 phút UNCLASSIFIED).
- ACCEPTANCE: 11 PASS, 8 BLOCKED (do chưa có DB local theo Q1), 0 FAIL. Toàn bộ 4 lỗi FAIL từ audit (P0-11, P0-16, P0-18, P0-19) đã được sửa và chuyển thành PASS.

## 4. Câu hỏi còn treo
- Q1 (Claude gửi Chủ dự án trong AUDIT_P0): Lựa chọn phương án môi trường để nghiệm thu các dòng BLOCKED (chọn cài DB copy local hoặc kiểm tra trên VPS staging sau deploy).

## 5. Việc ngoài phạm vi phát hiện được
- Tuyến API `POST /api/auth/login` hiện chưa được gắn `@Public()`, tạm thời được ghi nhận cho Phase 1 theo phân loại matrix dòng R023 (AUDIT A7).
- Thư mục con `hula-web/cms` và `hula-web/website` đang có các file TypeScript độc lập thiếu một số type declaration gốc của subpackage.
