# AUDIT P3 — Chatbot: AI tư vấn, kho tri thức v2

## VÒNG 2 — 2026-09-28 — **AUDIT_FAIL** (vòng 2/3), chỉ còn **1 lỗi nội dung M3**

- **Đối tượng:** `chatbot/p3` @ `4bca3a7f`. Đã có main `a58d4f49` (3 hotfix + QA mới).
- **Script:** `accept-p*.js` không bị sửa.
- **Không đổi entity/DDL**, nên theo quy trình gọn chỉ boot ở chế độ giống prod (`NODE_ENV=development`).

| Kiểm | Kết quả |
|---|---|
| `accept-p3.js` (22 bài), dev mode, provider fake | **22/22 PASS** |
| CB3-18: nhận chat giữa lượt (M1) | ĐẠT: cả nhánh LLM lẫn nhánh dự phòng đều `replies=0`, `human_active=true`, `assigned_user_id=1` |
| CB3-24: chỉ kịch bản | **26/31**, 0 lỗi an toàn (còn trượt: S3-01, 09, 22, 31 sai intent; S3-18 thiếu gợi ý ticket) |
| `accept-p2.js`, dev mode, `scripted` | 15/16 (CB2-14 lệch vì email giả lập, đã biết) |
| `npm run qa` (bản mới) | PASS, 54 giây. Frontend còn 45 lỗi cũ ở file khác |
| M2 chọn model | Có sắp theo phiên bản, bỏ `-lite/-exp/preview`, gặp 404 thì loại và thử model kế |
| m2 429/503 | `rate_limited` / `unavailable` + circuit breaker |
| m4 UI | Có ô `llm.mode`, `llm.model`, `widget.*` (kể cả `subtitle`) |
| m5 câu viết cứng trẻ < 18 tháng | Đã bỏ |

**Lỗi còn lại:**

| ID | Mức | Vị trí | Mô tả | Yêu cầu sửa |
|---|---|---|---|---|
| M3 | **MAJOR** (an toàn nội dung) | `src/chatbot/seed/chatbot-kb-seed.service.ts` L228–L377 (seed `CHATBOT_KB_SEED_V1`, **có từ P1, đã chạy trên prod**) | 11 mục `product.spec.*` **không lấy từ SPEC §4.2 / S1–S3 mà tự bịa**: "cotton 100% **Thắng Lợi**", gối "30x45 / 35x50", chăn "110x140", nệm lưới "khung inox… **kháng khuẩn**", túi "PU/PVC **chống thấm**", đồng phục "cá sấu co giãn 4 chiều", và **chứng nhận "không chứa formaldehyde… QCVN 01:2017/BCT"**. 8 kịch bản `script.*` có câu hứa: "khung giá tốt nhất", "báo giá chiết khấu", "phản hồi sớm nhất", "ưu tiên chuyển ngay". Hiện ở `needs_review`/`draft`, nhưng nút **Duyệt hàng loạt** (P3) có thể xuất bản chúng chỉ bằng một cú bấm. SPEC §4.2 và §12 cấm khẳng định vật liệu/chứng nhận chưa có hồ sơ. Lỗi lọt từ audit P1 vì `accept-p1` chỉ đếm số dòng | (1) Bỏ hẳn nội dung bịa khỏi seed V1: seed V1 chỉ còn `sources` + 16 conflict; tri thức thật nhập bằng `kb-v2.json`. (2) Migration idempotent `CHATBOT_KB_SEED_V1_CLEANUP`: chuyển sang `retired` mọi mục của seed V1 (19 topic đang có trong code) **đang ở `draft`/`needs_review`**; **không đụng** mục đã `published` (đã có người duyệt), chỉ log cảnh báo. Chạy trong transaction, bắt lỗi, không chặn khởi động. (3) Thêm kiểm vào `check-no-hardcoded-name.js` hoặc script mới: seed không được chứa `kháng khuẩn|chống thấm|chứng nhận|QCVN|đạt chuẩn|an toàn tuyệt đối` |

**Ảnh hưởng vận hành:**
- Trên prod đang có 19 mục seed V1 chờ duyệt. **Trước khi M3 được sửa: trong CMS → Tri thức, KHÔNG duyệt các mục `product.spec.mattress_*`, `pillow_*`, `blanket_cotton`, `bag_*`, `sheet_mesh`, `uniform_*`, `fabric_safety` và `script.greeting/ask_*/logo_support/lead_contact/outside_hours/fallback_busy`.**
- Tri thức đúng nằm trong `kb-v2.json`, nhập bằng nút "Nhập JSON".

**Vòng 3 cần nộp:**
- Sửa M3.
- Chạy `accept-p3.js` ở dev mode trên DB vừa reset.
- Chạy thêm 1 lần `NODE_ENV=production` vì có migration dữ liệu.
- `npm run qa`.

**Smoke test prod cho Chủ dự án** (sau khi P3 deploy, thay cho ảnh):
1. Cấu hình hệ thống → tab Trợ lý AI: đổi "Chế độ trả lời", lưu, rồi F5.
2. CMS → Tri thức → Nhập JSON `kb-v2.json` → Duyệt hàng loạt các mục `faq.*`, `script.*` (bản kb2).
3. Bật cờ trên staging hoặc giờ vắng khách, hỏi "Nệm dày bao nhiêu cm?". Bot phải trả lời không nêu số cm, và tab trạng thái không tăng lượt gọi AI.

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

## Bổ sung vòng 1: chạy Gemini thật bằng key dev (Claude, 2026-09-28)

Chủ dự án cấp key dev (free tier). Claude chạy `eval.js` 3 lần trên build `76850354`, sau khi nhập `kb-v2.json` và xuất bản 69 mục không bị khoá.

| Lần | Cấu hình | Kết quả Gemini |
|---|---|---|
| 1 | model tự chọn | 60/60 lượt gọi lỗi **404**: model tự chọn là `models/gemini-2.5-flash`, Google trả *"no longer available to new users… use models/gemini-3.8-flash"* |
| 2 | `CHATBOT_LLM_MODEL=models/gemini-3.8-flash` | 1 lượt thành công, còn lại 54 lỗi 429 + 5 lỗi 503 (quá tải) |
| 3 | như lần 2, giãn nhịp 13 giây/lượt | 60/60 lỗi 429 `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, **quotaValue 20** (20 request/ngày/model) |

Bot luôn lùi về kịch bản khi lỗi, đúng thiết kế: khách không thấy lỗi, không bịa giá, 0 lần bị validator chặn. Chế độ dự phòng đạt 14/31 tiêu chí tự động. Các bài hỏng chủ yếu cần AI mới làm được (nhận diện intent, gợi ý ticket).

**Yêu cầu sửa thêm (vòng 2):**

| ID | Mức | Việc |
|---|---|---|
| M2 | MAJOR | **Chọn model:** không chọn "model flash đầu tiên trong danh sách". Ưu tiên `CHATBOT_LLM_MODEL`, sau đó là model đặt trong Cấu hình hệ thống (thêm ô `llm.model`, validator chung), cuối cùng là tự chọn: lọc model có `generateContent`, tên chứa `flash`, bỏ `-lite`/`-exp`/`preview` nếu có bản thường, lấy **version cao nhất**. Gọi thử bị 404 "no longer available" thì loại model đó khỏi cache và chọn model kế tiếp (tối đa 3 lần). `GET status` trả `llm_model` đang dùng thật |
| m2 | MINOR | 429 phải ghi `fallback:'rate_limited'`, 503 ghi `'unavailable'` (hiện đều ghi `'error'`). Ghi thêm `retry_after_s` lấy từ `retryDelay` nếu có. Trong thời gian đó không gọi lại Gemini (circuit breaker trong RAM), bot trả lời bằng kịch bản ngay |
| m3 | MINOR | `eval.js`: thêm `--pace-ms` (mặc định 0) và `--cases=S3-01,S3-02` để chạy từng phần khi quota thấp |
| m4 | MINOR | **Khối "Nút & tự mở"** của P2.1 chưa có trong tab Cấu hình hệ thống: thêm ô `widget.cta_label`, `auto_open`, `auto_open_delay_s`, `auto_open_mobile`, `snooze_hours`, `subtitle`. Lưu phải chạy được khi chưa mở khung Nâng cao (bài học hotfix `acafbe08`) |
| R0 | bắt buộc | Merge `origin/main` (đã có hotfix `2bcd53ca` lỗi khởi động, `3dc66bfa` avatar, `acafbe08` lưu cấu hình) vào `chatbot/p3`, **giữ** `Form.Item noStyle` của avatar và `onFinish` dùng `getFieldsValue(true)` |
| m5 | MINOR | Câu trả lời trẻ dưới 18 tháng đang viết cứng trong code: "HULA có dòng sản phẩm thiết kế riêng phù hợp với từng giai đoạn…" (khẳng định chưa duyệt, SPEC T12). Dùng `script.infant` / `faq.infant` trong kho. Rà hết câu viết cứng trong `turn-orchestrator.service.ts` và `scripted-responder.service.ts`: câu nào không phải câu an toàn chung thì chuyển sang lấy từ kho |
| m6 | MINOR | "Bé 4 tuổi…" bị trích thành `quantity=4` (CB3-05 cho thấy brief có `quantity:4`). Số đi với `tuổi`/`tháng` không bao giờ là số lượng |

**Ảnh hưởng vận hành (báo Chủ dự án):** nếu key trên prod cũng là free tier thì chatbot và trợ lý nội bộ **dùng chung khoảng 20 request/ngày cho mỗi model**, tức chỉ khoảng 10 lượt chat khách/ngày, sau đó bot chạy bằng kịch bản. Muốn chạy thật cần bật billing (gói trả theo lượng) cho project của key prod. Đây là quyết định chi phí của Chủ dự án.

## Vòng 2 cần nộp
- **P3.10 kịch bản trước, AI sau** (Chủ dự án chốt 2026-09-28): làm theo `P3_Instruction.md` P3.10. `accept-p3.js` đã thêm CB3-21..24, trong đó CB3-24 yêu cầu chế độ chỉ kịch bản đạt ≥ 25/31 case và 0 lỗi an toàn. Các bài CB3-05..18 tự chạy ở `llm_first`.
- Sửa M1.
- Trên DB vừa reset, chạy `accept-p3.js` (18 bài) ở `NODE_ENV=production` và `development`.
- Chạy thêm `accept-p2.js` với `CHATBOT_LLM_PROVIDER=scripted` ở dev mode (CB2-14 được phép lệch vì email giả lập).
- **Không cần ảnh chụp** (Chủ dự án yêu cầu 2026-09-28): UI được kiểm bằng CB3-17 và smoke test của Chủ dự án.

## Ảnh hưởng vận hành
- Cờ đang tắt nên prod chưa bị ảnh hưởng.
- Nếu bật cờ với lỗi M1: sales bấm "Nhận xử lý" có thể bị hệ thống âm thầm huỷ, bot vẫn trả lời chen ngang khi nhân viên đang chat với khách. **Không bật cờ trước khi M1 được sửa.**
