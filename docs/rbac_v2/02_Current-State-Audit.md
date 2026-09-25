# RBAC v2 — Audit hiện trạng phân quyền (2026-09-24)

Số liệu lấy bằng script quét toàn bộ `src/**/*.controller.ts`. Chi tiết từng endpoint xem `route-matrix.csv`.

## A. Tổng quan

| Hạng hiện tại | Số endpoint | % |
|---|---|---|
| Không có guard nào (ai cũng gọi được) | 277 | 48% |
| Chỉ cần đăng nhập (JWT, không check quyền) | 196 | 34% |
| Đăng nhập + `@RequirePermission` | 89 | 16% |
| `@Public()` | 5 | 1% |
| API key | 5 | 1% |
| **Tổng** | **572** | |

Không có `APP_GUARD` toàn cục ([app.module.ts:277-286](../../src/app.module.ts#L277-L286) chỉ đăng ký interceptor), nên controller nào không tự gắn `@UseGuards` thì mở hoàn toàn.

### Controller không có guard

analytics, app, auth, blogs, categories, discussions, inventory/samples, marketing, materials, planning, processes, production, public, public/portal, purchasing, qc, shipping, social, suppliers, system (22/26 route), system/dashboard, tasks, tiktok (4 controller), upload (20/23), website-projects (2/5).

### Controller chỉ có JWT, không check quyền

ai, announcements, finance/cash-flow, notifications, projects, users (**bất kỳ user nào cũng quản lý được user và nhóm quyền**), hr (46/64), inventory (22/29), products (17/22), sales (37/57), customers (11/12), finance (8/13).

## B. Lỗi cơ chế phân quyền

| # | Vấn đề | Vị trí |
|---|---|---|
| B1 | Admin nhận diện bằng `username === 'admin'` ở cả backend và frontend | [permissions.guard.ts:40](../../src/auth/permissions.guard.ts#L40), [App.tsx:143](../../frontend/src/App.tsx#L143), [usePermission.ts](../../frontend/src/hooks/usePermission.ts) |
| B2 | Route không có `@RequirePermission` thì `PermissionsGuard` cho qua ("backwards compatible") | [permissions.guard.ts:27-29](../../src/auth/permissions.guard.ts#L27-L29) |
| B3 | Danh mục module khai báo cứng ở frontend, lệch với backend: UI có `PURCHASE`, `CMS`, `DASHBOARD` nhưng backend không check; backend dùng `SYSTEM` (ZNS) nhưng UI không có, nên chỉ admin dùng được ZNS | [UserGroupsPage.tsx:7-24](../../frontend/src/pages/UserGroupsPage.tsx#L7-L24) |
| B4 | Menu `/designs` gate bằng PRODUCTION, backend designs check PRODUCT | [App.tsx](../../frontend/src/App.tsx), [designs.controller.ts](../../src/designs/designs.controller.ts) |
| B5 | Mua hàng gate menu bằng PRODUCTION, trong khi đã có mã PURCHASE | [App.tsx](../../frontend/src/App.tsx) |
| B6 | Quyền frontend chỉ đọc từ `localStorage.user` lúc login, không làm mới; `usePermission` memo theo `moduleCode` | [usePermission.ts](../../frontend/src/hooks/usePermission.ts) |
| B7 | `PUT /users/:id` gán thẳng body (`update(id, data)`): đổi được `group_id`, `password` (plaintext, login vẫn chấp nhận) | [users.service.ts:32-35](../../src/users/users.service.ts#L32-L35) |
| B8 | `change-password` đổi được mật khẩu bất kỳ ai, chỉ cần đăng nhập | [users.controller.ts:36](../../src/users/users.controller.ts#L36) |
| B9 | User bị khoá (`is_active=false`) vẫn dùng token cũ đến khi hết hạn; login không check `is_active` | [jwt.strategy.ts:16-24](../../src/auth/jwt.strategy.ts#L16-L24), [auth.service.ts](../../src/auth/auth.service.ts) |
| B10 | `updateGroupPermissions` xoá rồi tạo lại toàn bộ quyền, không transaction, không lưu lịch sử ai đổi | [users.service.ts:83-101](../../src/users/users.service.ts#L83-L101) |
| B11 | CMS bỏ qua check quyền CMS "for debugging" | [cms/src/hooks/useAuth.tsx:69-73](../../hula-web/cms/src/hooks/useAuth.tsx#L69-L73) |
| B12 | `view_cost_price` chỉ ẩn ở UI, API vẫn trả giá vốn | toàn bộ products/materials/bom |
| B13 | Công cụ AI agent đọc tài chính/khách hàng không check quyền người hỏi; `approvedPermission` do client gửi | [ai.service.ts:1506-1514](../../src/ai/ai.service.ts#L1506-L1514) |
| B14 | `markAsRead` notification không check chủ sở hữu | notifications.service.ts |
| B15 | `@Public()` trên `POST /hr/review-questions-seed` cho phép ai cũng seed lại câu hỏi (tạo trùng) | [hr.controller.ts:399](../../src/hr/hr.controller.ts#L399) |

### Frontend gọi API không kèm token (gọi `axios` trực tiếp thay vì instance `api`)

Nội bộ ERP, cần chuyển sang `api` ở P0:
`components/common/AttachmentUpload.tsx`, `components/planning/{GanttChartTab, MaterialDemandDashboard, MrpSummaryDashboardTab, PlanDashboardTab, ProductDemandDashboard, ProductionStatusTab, VersionHistoryModal}.tsx`, `components/sales/SalesComments.tsx`, `pages/{CategoriesPage, MarketingPage, MaterialsPage, PlanningPage, ProcessesPage, ProductionDashboardPage, ProductionRoutePage, ProductsPage, SocialChannelsPage, SocialOrdersPage, SuppliersPage, TikTokCommentsPage, TikTokInboxPage}.tsx`.

**Lỗi đang xảy ra**: [SuppliersPage.tsx:333](../../frontend/src/pages/SuppliersPage.tsx#L333) gọi `POST /finance/payment/bulk-po` (controller có JwtAuthGuard) bằng `axios` không token, nên luôn nhận 401.

Portal, **giữ nguyên** (dùng token portal riêng hoặc public):
`pages/{PortalDashboardPage, PortalLoginPage, PortalPurchasePage, PortalQuotePage, PortalSupplierDashboard}.tsx`, `components/b2b/{PortalB2BCustomizer, PortalB2BOrderModal}.tsx`.

Đã tự gắn token bằng `fetch`: `AiChatWidget.tsx`, `HelpAiAssistant.tsx`. Có thể để nguyên.

Ghi chú: `SystemSettingsPage.tsx:16` import `axios` nhưng thực chất là `../utils/api` (đặt tên gây hiểu nhầm), có token.

## C. Rủi ro bảo mật ngoài phạm vi (không làm ở hula-erp; ghi lại cho erp4u)

| # | Rủi ro | Vị trí |
|---|---|---|
| C1 | JWT ký bằng hằng `'HULA_SECRET_KEY'`; strategy đọc `JWT_SECRET` nhưng module ký luôn dùng hằng, nên set env sẽ làm gãy login | [auth.module.ts:18](../../src/auth/auth.module.ts#L18), [jwt.strategy.ts:12](../../src/auth/jwt.strategy.ts#L12) |
| C2 | Login chấp nhận mật khẩu plaintext (`pass === user.password`) | [auth.service.ts:19](../../src/auth/auth.service.ts#L19) |
| C3 | Port 5432 (Postgres) và 3000 (API) publish ra host, mật khẩu DB mặc định | [docker-compose.yml:13,30](../../docker-compose.yml) |
| C4 | Webhook GHTK/Lalamove/TikTok không kiểm chữ ký | shipping, tiktok |
| C5 | OTP portal 6 số, `Math.random`, không giới hạn số lần thử | [portal.controller.ts:101](../../src/public/portal.controller.ts#L101) |
| C6 | Upload không giới hạn loại file, file phục vụ tĩnh trên cùng domain API | [upload.controller.ts](../../src/upload/upload.controller.ts), [main.ts:32](../../src/main.ts#L32) |
| C7 | `GET /public/proxy-image` fetch URL bất kỳ (SSRF) | [public.controller.ts:979](../../src/public/public.controller.ts#L979) |
| C8 | `marketing.service.ts:126` nối chuỗi vào SQL | [marketing.service.ts:126](../../src/marketing/marketing.service.ts#L126) |

C6–C8 trở nên khó khai thác hơn nhiều sau P2, vì endpoint không còn public. Riêng C7 nằm trong P5.
