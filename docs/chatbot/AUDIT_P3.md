# AUDIT P3 — Chatbot: AI tư vấn, kho tri thức v2

## VÒNG 1 — 2026-09-28 — **AUDIT_FAIL** (vòng 1/3)

- **Đối tượng:** `chatbot/p3` @ `76850354`. Đã merge 2 hotfix của main (`2bcd53ca` lỗi khởi động, `3dc66bfa` lỗi avatar).
- **Môi trường:** `pgenv.sh reset`, cổng 4999. Cổng 3999 vẫn có backend của Antigravity đang chạy (PID 26836), cần tắt.
- **Script:** `accept-p3.js` gốc không bị sửa. Claude **thêm CB3-18** (xem dưới).

| Kiểm | Kết quả |
|---|---|
| `accept-p3.js` (17 bài gốc), `NODE_ENV=production` (synchronize tắt) | **17/17 PASS** |
| `accept-p3.js` (17 bài gốc), `NODE_ENV=development` (synchronize bật, giống prod) | **17/17 PASS** |
| Hồi quy `accept-p1`, dev mode | 16/16 PASS |
| Hồi quy `accept-p2`, dev mode, `CHATBOT_LLM_PROVIDER=scripted` | 14/16: **CB2-12 FAIL (hồi quy thật)**; CB2-14 là khác biệt đã biết của môi trường (EmailService giả lập gửi ở dev mode) |
| check-rbac / public-callers / 2 script chatbot / jest / tsc | 0 / 0 / sạch / 47/47 / 0 |
| Eval Gemini thật | `BLOCKED` (test-env không có key). Chấp nhận, chạy lại khi có key dev |

## Lỗi

| ID | Mức | Vị trí | Mô tả (Claude đã tái hiện) | Yêu cầu sửa |
|---|---|---|---|---|
| M1 | **MAJOR** | `turn-orchestrator.service.ts` L281, L345–351, L394–470 (`runScriptedFallback`) | **Nhân viên nhận chat trong lúc bot đang xử lý thì bị huỷ ngược (T35).** Orchestrator đọc `currentConv` ở đầu lượt, chạy chậm (LLM/delay), rồi `save(currentConv)` bằng **bản ghi cũ** (L281 nhánh "gặp nhân viên", L436 nhánh dự phòng). TypeORM ghi đè `human_active=false`, `assigned_user_id=null` lên thay đổi của nhân viên. Sau đó bước kiểm lại L345 đọc thấy `false` nên vẫn lưu câu trả lời của bot. Nhánh dự phòng (`scripted`, hết budget, timeout, lỗi Gemini) **không có** bước kiểm lại nào. Tái hiện bằng CB3-18: cả 2 nhánh đều `replies=1`, `aiAfter=1`, `human=false`. Hồi quy của P2 (CB2-12 đạt ở P2) | (1) **Không bao giờ** `save()` nguyên entity đọc từ trước khi chờ. Chỉ `update()` đúng cột cần đổi, kèm điều kiện, ví dụ `UPDATE … SET state='waiting_sales' WHERE id=$1 AND human_active=false`. (2) Bước cuối của **mọi** nhánh (LLM và `runScriptedFallback`): trong **một transaction** `SELECT … FOR UPDATE` lại conversation; nếu `human_active=true` thì bỏ reply và không đổi state; ngược lại mới lưu tin AI + đổi state + outbox. (3) Nhánh dự phòng gom brief/outbox/tin AI vào cùng transaction đó. (4) Phải xanh CB3-18 và CB2-12 (chạy `accept-p2` với `CHATBOT_LLM_PROVIDER=scripted`) ở **cả hai** chế độ |
| m1 | MINOR | cổng 3999 | Backend test để chạy sau khi nộp (lần thứ 3) | Tắt backend khi xong (luật 4 quy trình nhanh) |

**CB3-18 (Claude thêm vào `scripts/chatbot/accept-p3.js`, là hợp đồng):**
- Khách gửi "…gặp nhân viên [[delay:3000]]".
- Sau 800 ms thì sales nhận chat.
- Bắt buộc: không còn reply của bot, không có tin `ai` nào lưu sau tin khách, `human_active=true`, `assigned_user_id` còn nguyên.
- Chạy 2 lần: nhánh LLM (fake) và nhánh dự phòng (hết budget).
- Kết quả trên `76850354`: **FAIL** ở cả hai.

## Vòng 2 cần nộp
- Sửa M1.
- Trên DB vừa reset, chạy `accept-p3.js` (18 bài) ở `NODE_ENV=production` và `development`.
- Chạy thêm `accept-p2.js` với `CHATBOT_LLM_PROVIDER=scripted` ở dev mode (CB2-14 được phép lệch vì email giả lập).
- **Không cần ảnh chụp** (Chủ dự án yêu cầu 2026-09-28): UI được kiểm bằng CB3-17 và smoke test của Chủ dự án.

## Ảnh hưởng vận hành
- Cờ đang tắt nên prod chưa bị ảnh hưởng.
- Nếu bật cờ với lỗi M1: sales bấm "Nhận xử lý" có thể bị hệ thống âm thầm huỷ, bot vẫn trả lời chen ngang khi nhân viên đang chat với khách. **Không bật cờ trước khi M1 được sửa.**
