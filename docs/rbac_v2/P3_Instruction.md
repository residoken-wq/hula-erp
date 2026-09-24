# P3 — Quản trị tài khoản & admin

**Điều kiện bắt đầu:** P2 đã ENFORCE ổn định 2 tuần. Chủ dự án đã chốt D10, D11.
**Nhánh:** `rbac/p3`. Ảnh hưởng vận hành: I-10, I-11, I-12 (Master Plan mục 5).

## P3.1 Cờ super admin

- `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;` (trong `onModuleInit`), rồi `UPDATE users SET is_super_admin = true WHERE username = 'admin';` cộng danh sách D10.
- Entity `User`: thêm cột. `buildUserPayload` trả thêm `is_super_admin`.
- Thay mọi chỗ check `username === 'admin'` bằng helper:
  - Backend: `isSuperAdmin(user)` trong `src/auth/rbac.util.ts`.
  - Frontend: `isSuperAdmin(currentUser)` trong `frontend/src/utils/auth.ts`.
  - Vị trí cần thay: [permissions.guard.ts:40](../../src/auth/permissions.guard.ts#L40), `RbacGuard`, `SuperAdminGuard`, [App.tsx:143,229](../../frontend/src/App.tsx#L143), [usePermission.ts](../../frontend/src/hooks/usePermission.ts). Grep thêm `'admin'` trong `src/` và `frontend/src/` để không sót.
- Trong P3, helper **vẫn chấp nhận fallback** `username === 'admin'`. Xoá fallback ở P5.
- JWT payload **không** thêm cờ này. Guard đọc từ DB/cache, vì token cũ không có trường mới.

## P3.2 Chặn tài khoản bị khoá

- `RbacGuard` (ENFORCE): sau khi verify token, đọc `users.is_active` theo `id` (cache 60 giây). `false` → 401 "Tài khoản đã bị khoá".
- `AuthController.login`: user `is_active = false` → 401, cùng message. **Không** đổi logic so mật khẩu.
- `UsersService`: khi đổi `is_active` hoặc `group_id` thì gọi `invalidateUser(id)`.

## P3.3 Siết `/users`

| Route | Quyền mới | Logic |
|---|---|---|
| `GET /users`, `GET /users/online` | `@AuthOnly()` | Chỉ trả `id, username, full_name, email, group{id,name}, is_active, last_activity_at` |
| `POST /users` | `USERS:create` | Như cũ |
| `PUT /users/:id` | `USERS:update` | **Whitelist** `full_name, email, is_active, group_id`. Bỏ qua `password` và mọi trường khác |
| `DELETE /users/:id` | `USERS:delete` | **Đổi thành khoá** (`is_active = false`), không xoá cứng. Không cho tự khoá mình, không cho khoá super admin cuối cùng |
| `POST /users/:id/change-password` | `@AuthOnly()` + self-check | `req.user.id === id` → được. Khác → cần `USERS:update`. Mật khẩu ≥ 8 ký tự |
| `PUT /auth/me` (mới) | `@AuthOnly()` | Chỉ sửa `full_name, email` của chính mình |
| Group APIs | `USERS:view/create/update` | Không cho xoá nhóm còn user |

Frontend `UsersPage`: bỏ ô mật khẩu khỏi form sửa, thêm nút "Đặt lại mật khẩu" gọi `change-password`. Nút "Xoá" đổi thành "Khoá / Mở khoá".

## P3.4 Lịch sử thay đổi quyền

- Bảng `permission_change_logs(id, created_at, actor_id, actor_username, group_id, group_name, before jsonb, after jsonb)`, DDL trong `onModuleInit`. Thêm entity vào `shouldLog()` exclusion.
- `updateGroupPermissions`: bọc transaction. Đọc `before`, ghi quyền mới, ghi log `after`, gọi `invalidateGroup`.
- Frontend `UserGroupsPage`: tab "Lịch sử" hiển thị diff dạng `MODULE: +create −delete`.

## P3.5 Agent API (theo D11)

- Không dùng → thêm `@Perm('SYSTEM','update')` chặn luôn (thay ApiKeyGuard bằng JWT). Có dùng → giữ, ghi tên hệ thống gọi vào REPORT.
