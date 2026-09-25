# STATUS — RBAC v2

Quy tắc cập nhật: `.agents/rules/collaboration-rules.md` mục 4. Dòng mới nhất nằm trên cùng trong phần Nhật ký.

## Bảng phase

| Phase | Trạng thái | Nhánh | Chặn bởi | Cập nhật |
|---|---|---|---|---|
| P0 | MERGED (main @ 3f491fe, đã push) | `rbac/p0` | Chủ dự án: deploy VPS + smoke test (AUDIT_P0.md vòng 2, điều kiện 2–5) | 2026-09-25 Claude |
| P1 | BLOCKED | `rbac/p1` | P0 DEPLOYED (D1–D7 đã chốt) | 2026-09-25 Claude |
| P2 | BLOCKED | `rbac/p2` | P1 DEPLOYED; D8, D9 | 2026-09-24 Claude |
| P3 | BLOCKED | `rbac/p3` | P2 ENFORCE ổn định 2 tuần; D10, D11 | 2026-09-24 Claude |
| P4 | DESIGN_ONLY | — | Chủ dự án giao phần nghiệp vụ | 2026-09-24 Claude |
| P5 | BLOCKED | `rbac/p5` | P3 DEPLOYED | 2026-09-24 Claude |

## Quyết định (D) — xem 01_Master-Plan.md mục 6

| ID | Trạng thái | Kết quả |
|---|---|---|
| D1 | CHỐT 2026-09-25 | Tách PURCHASE, seed chép từ PRODUCTION |
| D2 | CHỐT 2026-09-25 | Tách MARKETING, seed chép từ SALES |
| D3 | CHỐT 2026-09-25 | Tách SYSTEM, seed chép từ USERS |
| D4 | CHỐT 2026-09-25 | Tạo nhóm quyền riêng "Biên tập Website (CMS)"; Chủ dự án tự gán user |
| D5 | CHỐT 2026-09-25 | Tạm cho cả PRODUCT hoặc PRODUCTION; chốt một sau SHADOW |
| D6 | CHỐT 2026-09-25 | Mọi user đã đăng nhập được xem danh mục (chỉ xem) |
| D7 | CHỐT 2026-09-25 | Nhân viên chỉ thao tác hồ sơ của mình (API /hr/me/*); hồ sơ người khác chỉ Admin (không cấp quyền HR cho nhóm nào) |
| D8 | OPEN | |
| D9 | OPEN | |
| D10 | OPEN | |
| D11 | OPEN | |

## Chấp nhận ngoại lệ (Chủ dự án ký)

_(chưa có)_

## Nhật ký

- 2026-09-25 · Claude · Theo lệnh Chủ dự án: xác nhận repo đã private (GitHub API 404), merge --no-ff rbac/p0 vào main (3f491fe), push origin main. CI sẽ build image app + frontend và sync sang erp4u-demo. Chờ Chủ dự án deploy VPS.

- 2026-09-25 · Claude · Chủ dự án chốt D1–D7. Cập nhật P1_Instruction: bảng quyết định, seed tạo nhóm CMS (D4), P1.4 viết lại thành API /hr/me/* (D7; vá lỗi ProfilePage xem được lương/nghỉ phép/hồ sơ người khác). Master Plan: I-15 đổi, thêm I-17.
- 2026-09-24 · Claude · Audit P0 vòng 2: AUDIT_PASS. Boot backend thật trên Postgres tạm, runtime PASS P0-01..09, 16, 18; P0-19 WAIVED (lỗi instruction E1). UI P0-10,12..15 chờ smoke test sau deploy. Trước khi push: repo đang public (xem điều kiện 1).
- 2026-09-24 · Antigravity · Đã sửa toàn bộ A1-A6 theo AUDIT_P0.md, nộp lại REPORT_P0.md (vòng 2), chuyển trạng thái P0 sang SUBMITTED.
- 2026-09-24 · Claude · Audit P0 vòng 1: AUDIT_FAIL, 3 MAJOR (A1 nghiệm thu không chạy thật, A2 có thể xoá sạch quyền nhóm, A3 report chưa tổng hợp + log phình to), 5 MINOR. Lõi RbacGuard đạt: harness HTTP pass 16/16. Chờ Chủ dự án trả lời Q1.
- 2026-09-24 · Antigravity · Hoàn thành P0, nộp REPORT_P0.md, cập nhật ACCEPTANCE.csv, chuyển P0 sang SUBMITTED.
- 2026-09-24 · Antigravity · Nhận P0, tạo nhánh rbac/p0, chuyển trạng thái IN_PROGRESS.
- 2026-09-24 · Claude · Tạo gói RBAC v2 trên nhánh local `rbac/plan`. Chưa push vì repo GitHub đang public.
