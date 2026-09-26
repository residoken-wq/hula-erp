# STATUS — Cừu Hula (chatbot)

Cập nhật theo collaboration-rules §4. Nhật ký: dòng mới nhất ở trên cùng.

## Bảng phase

| Phase | Trạng thái | Nhánh | Chặn bởi | Cập nhật |
|---|---|---|---|---|
| P0 | BLOCKED | `chatbot/p0` | Q-04, Q-05, Q-07 | 2026-09-26 Claude |
| P1 | BLOCKED | `chatbot/p1` | P0 AUDIT_PASS, Q-02 | 2026-09-26 Claude |
| P2 | BLOCKED | `chatbot/p2` | P1 AUDIT_PASS, Q-03, Q-06, Q-08 | 2026-09-26 Claude |
| P3 | BLOCKED | `chatbot/p3` | P2 AUDIT_PASS, Q-01 (chạy provider thật) | 2026-09-26 Claude |
| P4 | BLOCKED | `chatbot/p4` | P3 AUDIT_PASS, Q-09 | 2026-09-26 Claude |
| P5 | BLOCKED | `chatbot/p5` | P4 AUDIT_PASS, Q-01, Q-08, Q-10, Q-11, Q-12, sales duyệt nội dung | 2026-09-26 Claude |

Trạng thái: `BLOCKED → READY → IN_PROGRESS → SUBMITTED → AUDIT_FAIL|AUDIT_PASS → MERGED → DEPLOYED`. Chỉ Claude đặt AUDIT_*, chỉ Chủ dự án đặt MERGED/DEPLOYED. Trượt 3 vòng audit thì dừng, lập lại kế hoạch.

## Quyết định (Q) — xem 01_Master-Plan.md §7

| ID | Trạng thái | Kết quả |
|---|---|---|
| Q-01 | OPEN | |
| Q-02 | OPEN | |
| Q-03 | OPEN | |
| Q-04 | OPEN | |
| Q-05 | OPEN | |
| Q-06 | OPEN | |
| Q-07 | OPEN | |
| Q-08 | OPEN | |
| Q-09 | OPEN | |
| Q-10 | OPEN | |
| Q-11 | OPEN | |
| Q-12 | OPEN | |
| Q-13 | OPEN | |
| Q-14 | OPEN | Ngoài gói, khẩn: vá qua RBAC P2.0 |

## Chấp nhận ngoại lệ (Chủ dự án ký)

_(chưa có)_

## Nhật ký

- 2026-09-26 · Claude · Lập gói instruction chatbot trên nhánh `chatbot/plan` từ SPEC do Chủ dự án cung cấp. Khảo sát repo: website, CMS, backend, hạ tầng. Phát hiện lỗ hổng `/system/config/:key` public (Q-14). Chờ Chủ dự án chốt Q-04, Q-05, Q-07 để mở P0.
