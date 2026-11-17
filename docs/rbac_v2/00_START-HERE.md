# RBAC v2 — Gói instruction cho Antigravity

Gói này dùng để chuyển HULA ERP từ "mặc định mở" sang "mặc định đóng, phân quyền theo module". Làm tuần tự, **mỗi lần một phase**, và không được chặn người dùng trước Phase 2.

## Đọc theo thứ tự

0. `.agents/rules/collaboration-rules.md` (quy tắc phối hợp, git, mẫu REPORT) và `STATUS.md` (phase nào đang READY).
1. `01_Master-Plan.md`: mục tiêu, lộ trình, **đăng ký ảnh hưởng vận hành (mục 5)**, quyết định của chủ dự án (mục 6).
2. `02_Current-State-Audit.md`: hiện trạng, có file:line.
3. `route-matrix.csv`: 572 endpoint với hạng/quyền đề xuất. **Đây là spec của Phase 1.**
4. `P0_Instruction.md` … `P5_Instruction.md` (P4 là `P4_Design-Only.md`): chỉ mở file của phase đang được giao.
5. `ACCEPTANCE.csv`: danh sách nghiệm thu. Điền `status` (PASS/FAIL/BLOCKED), `actualResult`, `evidence`.
6. Tuân thủ `.agents/rules/technical-rules.md`: đăng ký entity trong `app.module.ts`, DDL trong `onModuleInit` vì production tắt `synchronize`, dùng `dayjs`, dùng `api` thay `axios`.

## Luật bắt buộc

1. **Không đụng**: `JWT_SECRET`, `JwtModule.register({ secret })`, thời hạn token, logic so mật khẩu trong `auth.service.ts`, `NODE_ENV`, `synchronize`, `docker-compose*.yml`, `Dockerfile`, port, secret webhook. Không sửa logic nghiệp vụ (tính giá, tồn kho, trạng thái đơn…).
2. **Trước P2 không được làm ai bị chặn.** Cụ thể:
   - Không thêm `@UseGuards(JwtAuthGuard)` hay `@UseGuards(PermissionsGuard)` vào controller đang không có guard.
   - Không thêm `@RequirePermission` (decorator cũ) vào route mới. Controller nào có `PermissionsGuard` sẽ chặn ngay lập tức. Route mới dùng `@Perm` / `@AnyPerm` / `@AuthOnly`, chỉ guard mới đọc các decorator này.
   - Không gắn `@Public()` lên route đang có guard (sẽ mở toang route đó).
3. Mọi bảng/cột mới phải có DDL `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS` trong `onModuleInit`, bọc `try/catch`.
4. Entity mới dạng log phải được thêm vào danh sách loại trừ trong `shouldLog()` ([activity.subscriber.ts:45](../../src/system/subscribers/activity.subscriber.ts#L45)), nếu không mỗi dòng log sẽ sinh thêm một activity log.
5. Không in token, mật khẩu, query string ra log.
6. Chạy `npm run qa` (tsc + lint) trước khi báo xong. Build frontend: `cd frontend && npm run build`.
7. Commit bằng tiếng Anh, prefix `feat(rbac):` / `fix(rbac):`. Mỗi phase một nhánh `rbac/p0`, `rbac/p1`…, tạo từ `rbac/plan`. **Không commit/merge vào `main`, không push** khi chưa có lệnh của Chủ dự án.
8. Không commit dữ liệu thật hay IP thật vào seed (lưu ý: cơ chế tự đồng bộ sang repo `erp4u-demo` đã ngưng 2026-11).

## Kết thúc mỗi phase phải nộp

- `docs/rbac_v2/REPORT_P{n}.md` theo đúng mẫu ở `collaboration-rules.md` mục 5. Ảnh chụp và log để trong `docs/rbac_v2/evidence/P{n}/`.
- `STATUS.md`: đặt phase = `SUBMITTED`, ghi một dòng vào Nhật ký.
- `ACCEPTANCE.csv`: đã điền xong mọi dòng của phase đó.
- Khi có chỗ mơ hồ: **dừng và ghi câu hỏi vào REPORT**, không tự quyết. Đặc biệt với các dòng `review=Y` trong `route-matrix.csv`.

## Trạng thái phase

Xem `STATUS.md`. Đó là nguồn duy nhất; chỉ làm phase đang ở trạng thái `READY`.
