# P0 — Chuẩn bị nền tảng (không chặn ai)

**Mục tiêu:** có guard toàn cục ở chế độ SHADOW (chỉ ghi nhật ký), danh mục quyền một nguồn, `/auth/me`, và frontend nội bộ luôn gửi token.
**Nhánh:** `rbac/p0`
**Sau khi deploy P0, hành vi người dùng không đổi**, trừ nút thanh toán công nợ gộp PO (I-08) bắt đầu chạy được.

---

## P0.1 Danh mục quyền (backend)

Tạo `src/auth/permission-catalog.ts`:

```ts
export type PermAction = 'view' | 'create' | 'update' | 'delete';

export const ACTION_COLUMN = {
  view: 'can_view', create: 'can_create', update: 'can_update', delete: 'can_delete',
} as const;

export interface PermissionModule { code: string; name: string; group: string; }

// Thứ tự = thứ tự hiển thị trên màn hình phân quyền.
// P0 = đúng các mã UI đang có (kể cả PURCHASE, CMS dù backend chưa check) + SYSTEM (backend ZNS đã dùng).
// MARKETING chỉ được thêm ở P1, cùng lúc với seed dữ liệu.
export const PERMISSION_MODULES: PermissionModule[] = [
  { code: 'DASHBOARD', name: 'Tổng quan', group: 'Chung' },
  { code: 'PRODUCT', name: 'Quản lý Sản phẩm', group: 'Nghiệp vụ' },
  { code: 'SALES', name: 'Bán hàng (Sales/CRM)', group: 'Nghiệp vụ' },
  { code: 'INVENTORY', name: 'Kho & Tồn kho', group: 'Nghiệp vụ' },
  { code: 'PURCHASE', name: 'Mua hàng (PO)', group: 'Nghiệp vụ' },
  { code: 'PRODUCTION', name: 'Sản xuất (MRP)', group: 'Nghiệp vụ' },
  { code: 'FINANCE', name: 'Tài chính (Thu/Chi)', group: 'Nghiệp vụ' },
  { code: 'HR', name: 'Nhân sự (HR)', group: 'Nghiệp vụ' },
  { code: 'CMS', name: 'CMS Website', group: 'Website' },
  { code: 'USERS', name: 'Hệ thống & User', group: 'Quản trị' },
  { code: 'SYSTEM', name: 'Cấu hình tích hợp (SMTP, Hoá đơn, Vận chuyển, ZNS)', group: 'Quản trị' },
  // 6 mã FUP_* copy nguyên tên từ frontend/src/pages/UserGroupsPage.tsx:18-23 (FUP_SALES … FUP_OTHER), group: 'BOD FollowUp'
];
```

Thêm vào `auth.controller.ts` (có `@UseGuards(JwtAuthGuard)` ở cấp method):

```ts
@Get('permission-catalog') catalog() { return { modules: PERMISSION_MODULES, actions: Object.keys(ACTION_COLUMN) }; }
```

## P0.2 `GET /auth/me`

- `@UseGuards(JwtAuthGuard)`. Đọc user từ DB theo `req.user.id` (dùng `findOneByUsernameForAuth`, bỏ trường `password` khỏi kết quả).
- Trả về **đúng shape** `user` của `AuthService.login()`: `id, username, full_name, group_id, role_name, permissions`.
- Tách phần build object này thành method `buildUserPayload(user)` trong `AuthService`, dùng chung cho `login()` và `me()`.

## P0.3 Decorator mới

Sửa `src/auth/permissions.decorator.ts` nhưng **giữ nguyên** `RequirePermission` và `PERMISSION_KEY`. Thêm:

```ts
export const RBAC_KEY = 'rbac_rule';
export type RbacRule =
  | { tier: 'AUTH'; selfOr?: { module: string; action: PermAction } }
  | { tier: 'PERM'; any: { module: string; action: PermAction }[] };

export const AuthOnly = () => SetMetadata(RBAC_KEY, { tier: 'AUTH' } as RbacRule);
export const Perm = (module: string, action: PermAction) =>
  SetMetadata(RBAC_KEY, { tier: 'PERM', any: [{ module, action }] } as RbacRule);
export const AnyPerm = (...pairs: [string, PermAction][]) =>
  SetMetadata(RBAC_KEY, { tier: 'PERM', any: pairs.map(([module, action]) => ({ module, action })) } as RbacRule);
```

Ở P0 **chưa gắn** decorator mới lên controller nào. Việc đó làm ở P1.

## P0.4 Chế độ RBAC

Tạo `src/auth/rbac-mode.service.ts`:
- Đọc key `RBAC_MODE` trong `system_configs` (repo `SystemConfig`), cache 30 giây.
- Giá trị hợp lệ: `OFF | SHADOW | ENFORCE`. **Thiếu hoặc sai thì coi là `SHADOW`.**
- `setMode(mode, username)`: ghi DB, xoá cache, ghi `console.warn('[RBAC] mode changed', mode, 'by', username)`.
- **Ở P0, `setMode` phải từ chối `ENFORCE`** (BadRequest "ENFORCE chỉ bật từ Phase 2"). Phase 2 mới gỡ chặn này.

## P0.5 `RbacGuard` toàn cục

Tạo `src/auth/rbac.guard.ts`, đăng ký trong `AuthModule`:

```ts
providers: [..., RbacModeService, RbacAccessLogService, { provide: APP_GUARD, useClass: RbacGuard }]
```

`APP_GUARD` import từ `@nestjs/core`. `AuthModule` import thêm `TypeOrmModule.forFeature([SystemConfig, RbacAccessLog])`.

Thuật toán `canActivate`:

```
mode = await rbacMode.get()
if mode === 'OFF' → return true
if handler/class có IS_PUBLIC_KEY → return true
if handler/class có guard ApiKeyGuard (đọc metadata '__guards__' của Nest) → return true

rule = reflector.getAllAndOverride(RBAC_KEY, [handler, class])
legacy = reflector.getAllAndOverride(PERMISSION_KEY, [handler, class])   // {moduleCode, action:'can_view'...}
if !rule && legacy → rule = { tier:'PERM', any:[{module: legacy.moduleCode, action: legacy.action.replace('can_','')}] }
classified = !!rule
if !rule → rule = { tier:'AUTH' }

user = verifyBearer(req)          // jwtService.verify(token) dùng JwtService có sẵn của AuthModule; lỗi → null
                                  // KHÔNG đổi secret, KHÔNG tự tạo JwtService mới
decision = 'ALLOW'
if !user → decision = 'DENY_NO_AUTH'
else if user.username === 'admin' → ALLOW
else if rule.tier === 'PERM' && !hasAny(user.groupId, rule.any) → 'DENY_NO_PERM'
// selfOr: P0 chưa dùng, bỏ qua

if decision !== 'ALLOW' || !classified → accessLog.record({...})   // fire-and-forget, không await
if mode === 'SHADOW' → return true        // KHÔNG throw, KHÔNG gán req.user
// ENFORCE (chỉ từ P2):
if decision === 'DENY_NO_AUTH' → throw UnauthorizedException
if decision === 'DENY_NO_PERM' → throw ForbiddenException(`Bạn không có quyền "${action}" trong module "${module}".`)
return true
```

- `hasAny`: đọc `group_permissions` theo `group_id`, **cache theo group 60 giây**, và có hàm `invalidateGroup(groupId)`. Gọi hàm này ở cuối `UsersService.updateGroupPermissions` và `createGroup`. Tránh vòng import: đặt cache ở một service nhỏ `PermissionCacheService` export từ `AuthModule`.
- Guard phải an toàn: mọi exception nội bộ (DB lỗi…) trong mode SHADOW phải bị nuốt và trả `true`.
- Thứ tự: APP_GUARD chạy trước guard cấp controller. Guard cũ (`JwtAuthGuard`, `PermissionsGuard`) giữ nguyên, không xoá.

## P0.6 Nhật ký truy cập

Entity `src/auth/entities/rbac-access-log.entity.ts`, bảng `rbac_access_logs`:

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | bigserial PK | |
| created_at | timestamp default now() | index |
| mode | varchar(10) | SHADOW/ENFORCE |
| decision | varchar(20) | DENY_NO_AUTH / DENY_NO_PERM / UNCLASSIFIED |
| method | varchar(8) | |
| route | varchar(255) | **pattern**, lấy `req.route?.path` (vd `/api/sales/:id`), không phải URL thật |
| required | varchar(255) | vd `SALES:update | INVENTORY:update` |
| user_id | int null | |
| username | varchar(100) null | |
| group_id | int null | |
| ip | varchar(64) null | `req.ip` |
| user_agent | varchar(200) null | cắt 200 ký tự |

- DDL trong `RbacAccessLogService.onModuleInit` (CREATE TABLE IF NOT EXISTS + index `(created_at)`, `(route, decision)`).
- Đăng ký entity trong `app.module.ts` và thêm `'RbacAccessLog'` vào `shouldLog()` của `ActivitySubscriber`.
- **Chống ngập log:** bỏ trùng trong RAM theo khoá `method|route|user_id|decision|ip` trong 5 phút.
- Xoá log cũ hơn 90 ngày: cron `@Cron('0 3 * * *')` trong `RbacAccessLogService` (`ScheduleModule.forRoot()` đã được gọi ở `src/tasks/tasks.module.ts:14`, không gọi lại lần nữa).

## P0.7 API báo cáo + chế độ (chỉ super admin)

Controller `src/auth/rbac.controller.ts`, prefix `auth/rbac`, `@UseGuards(JwtAuthGuard, SuperAdminGuard)`:
- `SuperAdminGuard`: P0 kiểm `req.user.username === 'admin'`. **Luôn enforce, không phụ thuộc RBAC_MODE.**
- `GET /auth/rbac/mode` → `{ mode }`
- `PUT /auth/rbac/mode` body `{ mode }` (P0 từ chối ENFORCE)
- `GET /auth/rbac/report?from=&to=&decision=` → group by `method, route, decision, required, username` → `count, last_seen, ips (tối đa 5 IP khác nhau)`, order by `count desc`, limit 1000.
- `GET /auth/rbac/unclassified` → danh sách route distinct có decision `UNCLASSIFIED`.

## P0.8 Frontend: dùng chung `api`

Đổi `axios.<method>(\`${API_URL}/...\`)` thành `api.<method>('/...')` (vì `api.baseURL = API_URL`) trong **đúng 22 file** sau, rồi xoá import `axios`/`API_URL` nếu không còn dùng:

```
components/common/AttachmentUpload.tsx
components/planning/GanttChartTab.tsx
components/planning/MaterialDemandDashboard.tsx
components/planning/MrpSummaryDashboardTab.tsx
components/planning/PlanDashboardTab.tsx
components/planning/ProductDemandDashboard.tsx
components/planning/ProductionStatusTab.tsx
components/planning/VersionHistoryModal.tsx
components/sales/SalesComments.tsx
pages/CategoriesPage.tsx
pages/MarketingPage.tsx
pages/MaterialsPage.tsx
pages/PlanningPage.tsx
pages/ProcessesPage.tsx
pages/ProductionDashboardPage.tsx
pages/ProductionRoutePage.tsx
pages/ProductsPage.tsx
pages/SocialChannelsPage.tsx
pages/SocialOrdersPage.tsx
pages/SuppliersPage.tsx
pages/TikTokCommentsPage.tsx
pages/TikTokInboxPage.tsx
```

Lưu ý:
- **KHÔNG đụng** các trang `Portal*Page.tsx` và `components/b2b/*`: chúng chạy không có token ERP.
- URL dựng từ `API_URL.replace('/api','')` để hiển thị file/ảnh thì giữ nguyên, đó không phải lời gọi API.
- Header `Content-Type: multipart/form-data` có sẵn thì giữ.
- `SystemSettingsPage.tsx:16` đổi `import axios from '../utils/api'` thành `import api from '../utils/api'` rồi đổi tên biến trong file. Chỉ đổi tên, không đổi logic.

## P0.9 Frontend: làm mới quyền

- `App.tsx`: khi đã có token, gọi `api.get('/auth/me')` một lần lúc mount. Thành công thì ghi `localStorage.user`, cập nhật state `currentUser` / `permissions`, và `window.dispatchEvent(new Event('hula:auth-updated'))`. Lỗi mạng thì im lặng giữ dữ liệu cũ; 401 để interceptor xử lý.
- `hooks/usePermission.ts`: bỏ `useMemo([moduleCode])`, đọc qua `useState` + `useEffect` lắng nghe `hula:auth-updated` (và `storage` event). Giữ nguyên chữ ký hàm và kiểu trả về.
- `UserGroupsPage.tsx`: thay hằng `SYSTEM_MODULES` bằng dữ liệu `GET /auth/permission-catalog`, hiển thị theo `group`. Lỗi tải thì báo `message.error` và **không cho lưu** (tránh lưu thiếu mã rồi xoá mất quyền cũ, vì `updateGroupPermissions` xoá hết rồi tạo lại).

## P0.10 Trang "Nhật ký phân quyền"

- Route `/system/rbac`, menu trong nhóm Hệ thống, chỉ hiện khi `currentUser.username === 'admin'`.
- Thẻ chế độ: hiển thị mode + Segmented OFF/SHADOW (ENFORCE disabled, tooltip "Mở ở Phase 2").
- Bảng report (P0.7): lọc theo khoảng ngày (mặc định 7 ngày) và decision. Cột: Method, Route, Quyền cần, User, Số lần, Lần cuối, IP. Nút xuất Excel (ExcelJS có sẵn).
- Tab "Route chưa phân hạng": dữ liệu từ `/auth/rbac/unclassified`.

## Không làm ở P0

- Không gắn decorator lên controller nghiệp vụ.
- Không thêm mã PURCHASE/MARKETING vào menu (App.tsx).
- Không seed dữ liệu quyền.
- Không đổi `PermissionsGuard`, `JwtAuthGuard`, `JwtStrategy`.

## Tự kiểm trước khi nộp

Chạy trên máy dev, DB local:
1. Không đăng nhập, gọi `GET /api/planning/pfo`: vẫn 200 như cũ, và bảng `rbac_access_logs` có dòng `DENY_NO_AUTH`.
2. Đăng nhập user không phải admin, gọi `GET /api/finance/summary` khi nhóm không có FINANCE: vẫn 403 (guard cũ), log có `DENY_NO_PERM`.
3. `PUT /api/auth/rbac/mode {mode:'ENFORCE'}` → 400.
4. Đổi mode sang OFF, gọi lại bước 1: không có log mới (đợi cache 30 giây).
5. Mở trang Kế hoạch, NCC, Vật tư, TikTok: DevTools Network thấy header `Authorization`.
6. Admin sửa quyền nhóm X; user thuộc X bấm F5 là menu đổi theo, không cần đăng nhập lại.
