# P5 — Siết các ngoại lệ public

**Điều kiện bắt đầu:** P3 audit PASS.
**Nhánh:** `rbac/p5`.
**Nguyên tắc:** link đã gửi cho khách/NCC/ứng viên (UUID/token) **phải giữ chạy**.

| # | Route | Hiện trạng | Việc cần làm | Kiểm tra |
|---|---|---|---|---|
| 5.1 | `GET /system/config/:key` | Đọc được mọi key, kể cả SMTP_PASS | Allowlist key public: `SITE_MODE` và các key website cần (Antigravity grep `hula-web/website` để lập danh sách, ghi vào REPORT). Key ngoài danh sách → yêu cầu `SYSTEM:view` | Website + middleware SITE_MODE vẫn chạy |
| 5.2 | `GET /system/company` | Trả toàn bộ config công ty | Chỉ trả trường cần để in phiếu trên portal NCC: tên, địa chỉ, MST, điện thoại, logo, con dấu | Portal PO in đúng |
| 5.3 | `POST /public/portal/quote/:orderId/comment` | Theo id số tăng dần, người gửi lấy từ body | Đổi sang `:uuid`. **Giữ route cũ** 30 ngày, trả 410 sau đó. Người gửi cố định là khách hàng của báo giá | Comment từ PortalQuotePage |
| 5.4 | `DELETE /public/portal/quote/comment/:commentId` | Ai cũng xoá được | Cần `uuid` báo giá trong route; chỉ xoá comment do khách tạo | |
| 5.5 | `GET /public/proxy-image` | Fetch URL bất kỳ | Allowlist host (Antigravity grep nơi gọi để lập danh sách), chặn IP nội bộ, chỉ trả `image/*` | Ảnh trên website/B2B |
| 5.6 | `GET /public/analytics/stats\|visitors` | Public | Đã chuyển sang CMS:view ở P1; kiểm CMS dashboard vẫn hiển thị | |
| 5.7 | Helper super admin | Còn fallback theo tên | Xoá fallback `username === 'admin'` | Tài khoản admin vẫn có cờ |

Không nằm trong P5 (ngoài phạm vi, để erp4u): chữ ký webhook, rate limit OTP/login, upload allowlist.
