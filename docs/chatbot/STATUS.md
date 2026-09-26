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
| P5 | BLOCKED | `chatbot/p5` | P4 AUDIT_PASS, Q-01, Q-10, Q-11, Q-12, đã điền tab cấu hình (Q-08), sales duyệt nội dung, RBAC E7 đã deploy | 2026-09-26 Claude |

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
| Q-13 | OPEN | |
| Q-14 | CHỐT 2026-09-26 | Vá bằng hotfix RBAC P2.0.1 (E7, D13) trên nhánh `rbac/e7` @ 2b92163. Điều kiện trước go-live chatbot |

## Chấp nhận ngoại lệ (Chủ dự án ký)

_(chưa có)_

## Nhật ký

- 2026-09-26 · Claude · Chốt Q-08: hotline, giờ làm việc và người nhận thông báo cấu hình trong Cấu hình hệ thống. Thêm P0.10; API config dùng quyền SYSTEM; thêm CB0-16, CB0-17. Chốt Q-14: E7 đưa vào RBAC P2.0. Q-01, Q-02, Q-03, Q-09 → Q-13: Chủ dự án trả lời khi tới phase tương ứng.
- 2026-09-26 · Claude · Chủ dự án chốt Q-04, Q-05, Q-06, Q-07 và một phần Q-08 (LEAD trong CRM + email template cho sales). Bổ sung P2.1 (map lead để follow-up) và P2.2 (email template). **P0 chuyển READY.**
- 2026-09-26 · Claude · Lập gói instruction chatbot trên nhánh `chatbot/plan` từ SPEC do Chủ dự án cung cấp. Khảo sát repo: website, CMS, backend, hạ tầng. Phát hiện lỗ hổng `/system/config/:key` public (Q-14). Chờ Chủ dự án chốt Q-04, Q-05, Q-07 để mở P0.
