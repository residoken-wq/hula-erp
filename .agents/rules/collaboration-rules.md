---
description: Quy tắc phối hợp giữa Chủ dự án, Claude (BA/Planning/Audit) và Antigravity (thợ code) — áp dụng cho mọi gói công việc trong docs/<topic>/
---

# Quy tắc phối hợp: Chủ dự án · Claude · Antigravity

> Bản 1.0 — 2026-09-24. Chỉ Chủ dự án được đổi file này; Claude soạn thay đổi, Chủ dự án duyệt.

## 1. Vai trò

| Việc | Chủ dự án | Claude | Antigravity |
|---|---|---|---|
| Chốt phạm vi, quyết định nghiệp vụ (D1, D2…) | **Quyết** | Đề xuất | Hỏi khi thiếu |
| Viết plan, instruction, acceptance | Duyệt | **Viết** | Đọc, không sửa |
| Viết code, test, điền acceptance, viết REPORT | — | — | **Làm** |
| Audit code theo acceptance, viết AUDIT | Đọc kết luận | **Làm** | Sửa theo AUDIT |
| Merge vào `main` | **Duy nhất** | Không | Không |
| Push lên GitHub | **Cho phép từng lần** | Chỉ khi được cho phép | Chỉ khi được cho phép |
| Deploy VPS, bật/tắt cờ vận hành (vd `RBAC_MODE`) | **Duy nhất** | Soạn runbook | Không |

Claude và Antigravity **không trao đổi trực tiếp**. Kênh duy nhất là file trong repo. Chủ dự án chuyển lượt bằng các câu lệnh mẫu ở mục 9.

## 2. Gói công việc

Mỗi chủ đề là một thư mục `docs/<topic>/`, ví dụ `docs/rbac_v2/`.

| File | Ai viết | Ai được sửa |
|---|---|---|
| `00_START-HERE.md`, `01_Master-Plan.md`, `P*_Instruction.md`, `route-matrix.csv`… | Claude | Chỉ Claude (Chủ dự án duyệt nếu đổi phạm vi) |
| `ACCEPTANCE.csv` | Claude tạo dòng | Antigravity chỉ điền 3 cột `status, actualResult, evidence`. Claude ghi đè `status` khi audit |
| `STATUS.md` | Cả ba | Mỗi bên chỉ sửa trạng thái thuộc lượt của mình (mục 4) |
| `REPORT_P<n>.md` | Antigravity | Antigravity |
| `AUDIT_P<n>.md` | Claude | Claude |
| `evidence/P<n>/…` (ảnh chụp, log, file xuất) | Antigravity | Antigravity |

Instruction bị đổi sau khi đã giao thì Claude ghi **Changelog** ở đầu file (ngày, nội dung, lý do), và Antigravity phải đọc lại.

## 3. Git

1. **Không ai commit hay push trực tiếp lên `main`.** Mọi thay đổi vào `main` đi qua merge do Chủ dự án thực hiện.
2. Lý do: mỗi push lên `main` sẽ build lại image trên ghcr (lưu ý: cơ chế tự đồng bộ sang repo `erp4u-demo` đã ngưng 2026-11).
3. Nhánh:
   - `<topic>/plan` là nhánh tài liệu của Claude, ví dụ `rbac/plan`.
   - `<topic>/p<n>` là nhánh code của Antigravity, tạo từ `<topic>/plan` (hoặc từ `main` nếu plan đã merge). Ví dụ `rbac/p0`.
   - `<topic>/p<n>-fix-<k>` là nhánh sửa sau audit fail, hoặc commit thêm vào `<topic>/p<n>`.
4. **Repo `hula-erp` trên GitHub đang PUBLIC.** Không push nhánh chứa `docs/*/02_Current-State-Audit.md` hay tài liệu mô tả lỗ hổng khi chưa có lệnh của Chủ dự án. Mặc định chỉ làm ở local.
5. Không `push --force`, không rebase/xoá nhánh của bên khác, không sửa lịch sử đã commit.
6. **Thư mục làm việc:**
   - Antigravity dùng thư mục chính `hula-erp/`.
   - Claude audit trong git worktree riêng `../hula-erp-audit` và **không đổi nhánh của thư mục chính**.
   - Hai bên không làm việc cùng lúc trên cùng một thư mục.
7. Commit message tiếng Anh, prefix theo topic: `feat(rbac): …`, `fix(rbac): …`, `docs(rbac): …`. Commit nhỏ, mỗi commit một ý.
8. Không commit: `.env`, key, token, mật khẩu, dump DB, dữ liệu khách hàng thật, IP thật.

## 4. Vòng đời một phase (ghi trong `STATUS.md`)

```
READY ──(Antigravity nhận)──▶ IN_PROGRESS ──(nộp REPORT)──▶ SUBMITTED
   ▲                                                          │
   │                                                    (Claude audit)
   │                                          ┌───────────────┴───────────────┐
   │                                     AUDIT_FAIL                       AUDIT_PASS
   │                                          │                               │
   │                      (Antigravity sửa, nộp lại) ──▶ SUBMITTED   (Chủ dự án merge)
   │                                                                          ▼
   └──────────── phase sau chuyển READY ◀── DEPLOYED ◀── (Chủ dự án deploy) MERGED
```

- Chỉ Claude được đặt `AUDIT_PASS` / `AUDIT_FAIL`. Chỉ Chủ dự án được đặt `MERGED` / `DEPLOYED`.
- Phase sau chỉ được `READY` khi phase trước `DEPLOYED`, **và** các quyết định chặn phase đó đã chốt.
- Audit fail quá **3 vòng** cho cùng một phase: dừng lại. Claude báo Chủ dự án để chia nhỏ phase hoặc đổi cách làm.

## 5. Antigravity nộp bài

`REPORT_P<n>.md` phải có đủ các mục sau, thiếu mục nào Claude trả về ngay, không audit:

```
# REPORT P<n> — <topic>
Nhánh: <tên> · Commit cuối: <hash> · Ngày: <yyyy-mm-dd>

## 1. Đã làm
| Mục instruction | File đổi | Ghi chú 1 dòng |

## 2. Lệch so với instruction
(mục nào, làm khác thế nào, vì sao — "Không có" nếu không lệch)

## 3. Kết quả kiểm tra
- npm run qa: <dán phần tóm tắt>
- cd frontend && npm run build: <OK/lỗi>
- ACCEPTANCE: <số PASS>/<tổng> — các dòng FAIL/BLOCKED và lý do

## 4. Câu hỏi còn treo
(Q1, Q2… — ghi rõ phần nào đang dừng vì câu hỏi này)

## 5. Việc ngoài phạm vi phát hiện được
(lỗi/rủi ro thấy trong lúc làm nhưng KHÔNG sửa)
```

Khi gặp chỗ mơ hồ: **dừng phần đó**, ghi vào mục 4, làm tiếp phần khác không phụ thuộc. Không tự quyết nghiệp vụ, không tự mở rộng phạm vi.

## 6. Claude audit

Claude đọc diff, chạy lại các test trong `ACCEPTANCE.csv` (khi test được ở local), rồi viết `AUDIT_P<n>.md`:

| Mức | Định nghĩa | Hệ quả |
|---|---|---|
| BLOCKER | Vi phạm phạm vi cấm; chặn người dùng trước phase cho phép; có thể mất/sai dữ liệu; lộ secret; `qa`/build fail | FAIL |
| MAJOR | Sai instruction, thiếu mục bắt buộc, acceptance quan trọng FAIL, không có cách rollback | FAIL, trừ khi Chủ dự án chấp nhận bằng văn bản trong `STATUS.md` |
| MINOR | Code style, đặt tên, thiếu test phụ, tài liệu | PASS kèm việc cần làm ở phase sau |

`AUDIT_P<n>.md` gồm: kết luận PASS/FAIL, bảng lỗi (ID, mức, file:line, mô tả, yêu cầu sửa), trả lời các câu hỏi kỹ thuật trong REPORT, và **danh sách ảnh hưởng vận hành cần báo Chủ dự án trước khi deploy**.

## 7. Câu hỏi và thay đổi phạm vi

- Câu hỏi kỹ thuật (cách làm, file nào, pattern nào): Claude trả lời trong `AUDIT_P<n>.md`, hoặc cập nhật instruction kèm Changelog.
- Câu hỏi nghiệp vụ, hoặc bất cứ gì làm đổi quy trình vận hành: Claude đưa lên Chủ dự án dưới dạng mục `D<n>` có đề xuất. Chưa chốt thì phần liên quan ở trạng thái BLOCKED.
- Mọi thay đổi ảnh hưởng người dùng đang làm việc hằng ngày đều phải nằm trong "Đăng ký ảnh hưởng vận hành" của Master Plan trước khi code.

## 8. Phạm vi cấm mặc định (trừ khi gói công việc ghi rõ khác)

- Cấu hình bảo mật: `JWT_SECRET`, secret trong `JwtModule`, thời hạn token, cách so mật khẩu, `NODE_ENV`/`synchronize`, `docker-compose*.yml`, `Dockerfile`, port, secret webhook.
- Logic nghiệp vụ: giá, tồn kho, trạng thái đơn, sản xuất, tài chính.
- Workflow CI (`.github/workflows/*`), script sync demo.
- Dữ liệu production. Mọi thử nghiệm dùng DB local hoặc bản copy.

## 9. Câu lệnh mẫu cho Chủ dự án

| Mục đích | Gửi cho | Câu lệnh |
|---|---|---|
| Giao phase | Antigravity | `Làm P<n> theo docs/<topic>/00_START-HERE.md và P<n>_Instruction.md. Tuân thủ .agents/rules/collaboration-rules.md. Xong thì nộp REPORT_P<n>.md và đặt STATUS = SUBMITTED.` |
| Yêu cầu audit | Claude | `Audit P<n> <topic>.` |
| Sửa sau audit | Antigravity | `Sửa P<n> theo docs/<topic>/AUDIT_P<n>.md, nộp lại REPORT.` |
| Trả lời quyết định | Claude | `Chốt D<n>: …` → Claude cập nhật instruction + STATUS |
| Hỏi tiến độ | Claude | `/status <topic>` → Claude đọc STATUS.md và tóm tắt |
