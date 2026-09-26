# P2 — Chạy SHADOW, dọn quyền, bật ENFORCE

**Điều kiện bắt đầu:** P1 audit PASS và đã deploy production.
**Hành vi:** đây là phase **duy nhất bắt đầu chặn người dùng**. Bật khi chủ dự án ký.

> **Changelog 2026-09-26:** thêm P2.0 (việc code bắt buộc trước ENFORCE, rút ra từ AUDIT_P1 vòng 2: E5, E6, I-18).

## P2.0 Việc code bắt buộc trước khi được bật ENFORCE (Antigravity, nhánh `rbac/p2`)

| # | Việc | Chi tiết | Nghiệm thu |
|---|---|---|---|
| P2.0-a | E5: watermark B2B | `GET /upload/watermark/b2b/config`: bỏ `@Perm('CMS','view')`, gắn `@Public()`. Chỉ route GET này; các route POST watermark giữ `CMS` | Không token → 200; `rbac_access_logs` không còn `DENY_NO_AUTH` cho route này |
| P2.0-b | E6: NPL trên portal NCC | Thêm `GET /purchasing/supplier-portal/:uuid/outsourcing-materials/:poId` (`@Public()`). Tìm NCC theo `uuid` như route `supplier-portal/:uuid` hiện có; **PO `poId` phải thuộc NCC đó**, không thì 404. Gọi service `outsourcing-materials` có sẵn. `PortalSupplierDashboard.tsx` đổi sang route mới. Route cũ `:id/outsourcing-materials` giữ `PURCHASE:view` | Portal NCC A xem NPL PO của mình → 200; đổi `poId` sang PO của NCC B → 404; route cũ không token → vẫn ghi `DENY_NO_AUTH` (chặn khi ENFORCE) |
| P2.0-c | Quét bề mặt ẩn danh | Thêm `scripts/rbac/check-public-callers.js`: quét lời gọi API trong `hula-web/website/src`, `frontend/src/pages/Portal*.tsx`, `frontend/src/components/b2b`, đối chiếu với hạng route (đọc metadata sau build). Exit 1 nếu có lời gọi tới route không `PUBLIC`. Nhớ xử lý `baseURL = /public` của `hula-web/website/src/lib/api.ts`. Đưa vào `scripts/qa.js` | 0 lời gọi lệch |

Chủ dự án (không cần code), **trước ngày bật ENFORCE**:
- **I-18:** tick `FINANCE: create` + `PURCHASE: view` cho nhóm **Accounting_manager**, nếu kế toán tiếp tục ghi nhận thanh toán.
- Gán user vào nhóm **"Biên tập Website (CMS)"** cho ai sửa website. Sau ENFORCE, CMS chặn người không có quyền CMS.
- Trả lời **D8** (thời gian SHADOW) và **D9** (thiết bị/script gọi API không đăng nhập).

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
