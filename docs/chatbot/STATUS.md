# STATUS — Cừu Hula (chatbot)

Cập nhật theo collaboration-rules §4. Nhật ký: dòng mới nhất ở trên cùng.

## Bảng phase

| Phase | Trạng thái | Nhánh | Chặn bởi | Cập nhật |
|---|---|---|---|---|
| P0 | **READY** | `chatbot/p0` (từ `main`) | — | 2026-09-26 Claude |
| P1 | BLOCKED | `chatbot/p1` | P0 AUDIT_PASS, Q-02 | 2026-09-26 Claude |
| P2 | BLOCKED | `chatbot/p2` | P1 AUDIT_PASS, Q-03 | 2026-09-26 Claude |
| P3 | BLOCKED | `chatbot/p3` | P2 AUDIT_PASS, Q-01 (chạy provider thật) | 2026-09-26 Claude |
| P4 | BLOCKED | `chatbot/p4` | P3 AUDIT_PASS, Q-09 | 2026-09-26 Claude |
| P5 | BLOCKED | `chatbot/p5` | P4 AUDIT_PASS, Q-01, Q-10, Q-11, Q-12, đã điền tab cấu hình (Q-08), sales duyệt nội dung, lỗ hổng /system/config (Q-14) đã vá | 2026-09-26 Claude |

Trạng thái: `BLOCKED → READY → IN_PROGRESS → SUBMITTED → AUDIT_FAIL|AUDIT_PASS → MERGED → DEPLOYED`. Chỉ Claude đặt AUDIT_*, chỉ Chủ dự án đặt MERGED/DEPLOYED. Trượt 3 vòng audit thì dừng, lập lại kế hoạch.

## Quyết định (Q) — xem 01_Master-Plan.md §7

| ID | Trạng thái | Kết quả |
|---|---|---|
| Q-01 | OPEN | |
| Q-02 | OPEN | |
| Q-03 | OPEN | |
| Q-04 | CHỐT 2026-09-26 | Route quản trị chatbot chặn thật ngay (cặp `@RequirePermission`+`@Perm`, `JwtAuthGuard`+`PermissionsGuard`) |
| Q-05 | CHỐT 2026-09-26 | `CHATBOT` seed chép từ `SALES`; `CHATBOT_KB` không seed, `delete` = duyệt/xuất bản |
| Q-06 | CHỐT 2026-09-26 | Request tạo/gắn LEAD trong CRM ERP (`lead_source='CHATBOT'`) để sales follow-up |
| Q-07 | CHỐT 2026-09-26 | File đính kèm lưu Postgres `bytea` |
| Q-08 | CHỐT 2026-09-26 | Email template gửi tới `phamhang.hula@gmail.com`. Hotline, giờ làm việc, người nhận email/in-app cấu hình trong Cấu hình hệ thống → tab "Trợ lý AI website" (P0.10, quyền SYSTEM). Địa chỉ email nhập khi cấu hình, không hard-code |
| Q-09 | OPEN | |
| Q-10 | OPEN | |
| Q-11 | OPEN | |
| Q-12 | OPEN | |
| Q-13 | CHỐT 2026-09-26 | Mặc định "Cừu Hula — Trợ lý AI" + ảnh cừu; tên (display_name, short_name), avatar, lời chào sửa được trong Cấu hình hệ thống → tab Trợ lý AI website (P0.4, P0.10) |
| Q-14 | NGOÀI GÓI | Agent codebase review đang xử lý lỗ hổng `/system/config`, `/system/smtp`. Gói chatbot không phụ thuộc: tự validate config khi đọc (P0.4). Vẫn là điều kiện trước go-live P5 |

## Chấp nhận ngoại lệ (Chủ dự án ký)

| Ngày | Ngoại lệ | Phạm vi | Lý do |
|---|---|---|---|
| 2026-09-26 | Q-04: route `chatbot/admin/*` dùng cặp `@RequirePermission` + `@Perm` với `JwtAuthGuard` + `PermissionsGuard` ở class (lệch luật 2 rbac_v2 và điều 3 RBAC v2 trong technical-rules) | Chỉ controller trong `src/chatbot/controllers/chatbot-admin-*` | Chứa PII khách; RBAC SHADOW tới 2026-10-26 không chặn ẩn danh |

## Nhật ký

- 2026-09-26 · Claude · Viết lại P0_Instruction thành bản code được ngay:
  - đặc tả 10 bảng, route CB-001..006;
  - tên trợ lý sửa được (`display_name`/`short_name`/avatar/lời chào), Q-13 chốt;
  - config tự validate khi đọc, không phụ thuộc bản vá /system/config;
  - tab Cấu hình hệ thống có khung xem trước.
  
  ACCEPTANCE thay bằng CB0-01..23. Rebase `chatbot/plan` lên main afad424. Ghi ngoại lệ Q-04. P0 READY.
- 2026-09-26 · Claude · Chốt Q-08: hotline, giờ làm việc và người nhận thông báo cấu hình trong Cấu hình hệ thống. Thêm P0.10; API config dùng quyền SYSTEM; thêm CB0-16, CB0-17. Chốt Q-14: E7 đưa vào RBAC P2.0. Q-01, Q-02, Q-03, Q-09 → Q-13: Chủ dự án trả lời khi tới phase tương ứng.
- 2026-09-26 · Claude · Chủ dự án chốt Q-04, Q-05, Q-06, Q-07 và một phần Q-08 (LEAD trong CRM + email template cho sales). Bổ sung P2.1 (map lead để follow-up) và P2.2 (email template). **P0 chuyển READY.**
- 2026-09-26 · Claude · Lập gói instruction chatbot trên nhánh `chatbot/plan` từ SPEC do Chủ dự án cung cấp. Khảo sát repo: website, CMS, backend, hạ tầng. Phát hiện lỗ hổng `/system/config/:key` public (Q-14). Chờ Chủ dự án chốt Q-04, Q-05, Q-07 để mở P0.
