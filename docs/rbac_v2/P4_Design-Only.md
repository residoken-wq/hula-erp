# P4 — Quyền chi tiết (CHỈ THIẾT KẾ — Antigravity KHÔNG CODE)

Các hạng mục dưới đây đụng tới nghiệp vụ. Theo chỉ đạo của chủ dự án, phần nghiệp vụ chưa làm. Ở đây chỉ ghi đề xuất và câu hỏi để chốt sau.

| # | Hạng mục | Đề xuất | Câu hỏi cho chủ dự án | Ảnh hưởng |
|---|---|---|---|---|
| 4.1 | Giá vốn ở API | Interceptor lọc bỏ `cost_price, cost_per_unit, profit_margin`, chi phí BOM/routing khỏi response khi user không có `view_cost_price` ở module tương ứng | Những màn nào nhân viên không có quyền giá vốn vẫn cần thấy giá vốn (vd lập PO)? | I-14, CAO |
| 4.2 | Phạm vi dữ liệu | Thêm cột `data_scope` (ALL / DEPARTMENT / OWN) vào `group_permissions` cho SALES, CRM | Sales có được xem đơn/khách của người khác không? Trưởng nhóm xem theo phòng ban? | CAO |
| 4.3 | Hành động đặc biệt | Thêm `can_approve`, `can_export` | Những thao tác nào cần "duyệt" riêng: duyệt booking, duyệt PO, xác nhận PXK/PNK, huỷ đơn? | TB |
| 4.4 | Cột BOD FollowUp | Backend kiểm `FUP_*:update` khi ghi từng cột | Có ai hiện đang sửa cột không thuộc mình không? | TB |
| 4.5 | Công cụ AI agent | Mỗi tool AI khai báo quyền cần (vd `FINANCE:view`), agent chỉ gọi tool user có quyền; bỏ `approvedPermission` do client gửi | Chấp nhận AI trả lời "không có quyền" cho nhân viên thường? | TB |
| 4.6 | Thông báo | `markAsRead` chỉ cho chủ thông báo | — | THẤP |
