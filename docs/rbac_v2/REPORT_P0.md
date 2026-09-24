# REPORT P0 — rbac_v2
Nhánh: rbac/p0 · Commit cuối: a8731de · Ngày: 2026-09-24

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
| P0.8 Frontend Axios Audit | `frontend/src/pages/*`, `frontend/src/components/*` (23 files) | Thay thế toàn bộ `axios` bằng `api` từ `utils/api` để tự động gửi JWT header; sửa endpoint bulk PO debt |
| P0.9 Frontend Auth Refresh & Catalog | `frontend/src/App.tsx`, `frontend/src/hooks/usePermission.ts`, `frontend/src/pages/UserGroupsPage.tsx` | Gọi `/auth/me` khi mount, lắng nghe sự kiện `hula:auth-updated`, render catalog động theo 3 nhóm |
| P0.10 Frontend RbacLogPage | `frontend/src/pages/RbacLogPage.tsx`, `frontend/src/App.tsx` | Giao diện quản trị RBAC: badge mode, chuyển mode, bảng lọc log 7 ngày, xuất ExcelJS, bảng route chưa phân hạng |

## 2. Lệch so với instruction
Không có

## 3. Kết quả kiểm tra
- npm run qa: Backend Nest build thành công (`exit 0`), TypeScript check `npx tsc --noEmit` đạt 0 lỗi (`exit 0`). Các cảnh báo lint tại subfolder cms/website là baseline cũ của repo; không phát sinh lỗi mới so với main.
- cd frontend && npm run build: OK (`exit 0`, built in 1m 4s).
- ACCEPTANCE: 17/17 PASS (P0-01 đến P0-17 đều PASS, 0 FAIL, 0 BLOCKED).

## 4. Câu hỏi còn treo
Không có

## 5. Việc ngoài phạm vi phát hiện được
- Các trang Portal khách hàng/nhà cung cấp (`/portal/*`) đang sử dụng axios riêng biệt và logic xác thực qua OTP/UUID riêng ngoài hệ thống JWT ERP. Đã giữ nguyên kiến trúc độc lập này theo đúng chỉ dẫn của P0.
- Thư mục con `hula-web/cms` và `hula-web/website` đang có các file TypeScript độc lập thiếu một số type declaration gốc của subpackage.
