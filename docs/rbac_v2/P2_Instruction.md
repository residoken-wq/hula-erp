# P2 — Chạy SHADOW, dọn quyền, bật ENFORCE

**Điều kiện bắt đầu:** P1 audit PASS và đã deploy production.
**Hành vi:** đây là phase **duy nhất bắt đầu chặn người dùng**. Bật khi chủ dự án ký.

## P2.1 Giai đoạn quan sát (SHADOW, ≥ 10 ngày làm việc, có một kỳ cuối tháng)

Người làm: Claude (phân tích) + chủ dự án (quyết).

1. Mỗi 2–3 ngày xuất report `/system/rbac` ra Excel.
2. Phân loại từng dòng `DENY_*`:

| Loại | Dấu hiệu | Xử lý |
|---|---|---|
| A. Thiếu quyền nhóm | User nội bộ, `DENY_NO_PERM`, đúng nghiệp vụ của họ | Chủ dự án cấp quyền cho nhóm |
| B. Mapping sai | Nhiều nhóm khác nhau đều bị `DENY_NO_PERM` ở cùng route, route này là tra cứu dùng chung | Antigravity sửa decorator (PR nhỏ `rbac/p2-fix-n`), cập nhật `route-matrix.csv` |
| C. Gọi ẩn danh hợp lệ | `DENY_NO_AUTH` từ website, portal, webhook, thiết bị | Thêm `@Public()` (hoặc tích hợp đó phải dùng token) |
| D. Gọi ẩn danh lạ | `DENY_NO_AUTH` từ IP lạ, route nhạy cảm | Không làm gì. ENFORCE sẽ chặn đúng |
| E. Frontend thiếu token | `DENY_NO_AUTH` từ IP nội bộ, user-agent trình duyệt, route nội bộ | Tìm file còn gọi `axios`/`fetch` không token, sửa sang `api` |

3. Tab "Route chưa phân hạng" phải trống.

## P2.2 Go-live checklist (chủ dự án ký)

- [ ] 3 ngày liên tiếp gần nhất không còn dòng loại A, B, C, E mới.
- [ ] Nhóm ACCEPTANCE `PUB-*` (website, 4 portal, webhook) PASS trên production.
- [ ] Đã báo trước cho nhân viên: thời điểm bật, số hotline nội bộ khi bị "không có quyền".
- [ ] Người có tài khoản `admin` trực trong 2 giờ sau khi bật.
- [ ] Bật vào đầu giờ sáng ngày làm việc, **không** bật vào ngày chốt lương/công nợ.

## P2.3 Code cho P2 (Antigravity)

1. `RbacModeService.setMode`: gỡ chặn ENFORCE. **Chỉ được gỡ trong PR P2, sau khi checklist đã ký.**
2. Trang `/system/rbac`: bật lựa chọn ENFORCE, có hộp xác nhận ghi rõ "Người không có quyền sẽ bị chặn ngay".
3. Frontend `utils/api.ts`: 403 hiện hiển thị `message.error`. Thêm vào nội dung dòng "Liên hệ admin để được cấp quyền (mã: MODULE:action)", lấy từ message backend.
4. CMS: bật lại chặn ở `useAuth.tsx`, **cùng ngày bật ENFORCE**.

## P2.4 Rollback

- Có sự cố: vào `/system/rbac` chuyển về **SHADOW**, hiệu lực ≤ 30 giây.
- Không vào được UI: chạy SQL `UPDATE system_configs SET value='SHADOW' WHERE key='RBAC_MODE';`. Chủ dự án giữ lệnh này.

## P2.5 Sau 2 tuần ENFORCE ổn định

Mở ticket P3.
