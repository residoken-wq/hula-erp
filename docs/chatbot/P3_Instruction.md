# P3 — AI tư vấn (pipeline LLM, retrieval, validator, eval)

**Điều kiện:** P2 AUDIT_PASS. Code và test tự động **không** cần Q-01 (dùng `FakeProvider`). Chạy eval với provider thật cần Q-01 + key dev; thiếu thì các dòng đó ghi `BLOCKED`. Nhánh `chatbot/p3`.
**Sau deploy:** cờ tắt. Chủ dự án thêm env `CHATBOT_*` trước khi bật ở staging (I-10).

---

## P3.1 TurnOrchestrator
Làm đúng 01 §3.1, thay `ScriptedResponder` khi `CHATBOT_LLM_PROVIDER` khác `scripted`. Giữ `scripted` làm chế độ dự phòng, dùng khi hết budget hoặc lỗi LLM.

- Schema JSON cho "hiểu" và "diễn đạt" đặt ở `src/chatbot/llm/schemas/*.ts`. Validate bằng code trước khi dùng. Sai schema thì thử lại 1 lần, vẫn sai thì dùng câu dự phòng.
- Prompt đặt ở `src/chatbot/prompts/understand.v1.md`, `compose.v1.md`. `PROMPT_VERSION` là hằng số, đổi nội dung prompt thì tăng version.
- System prompt diễn đạt dựa trên SPEC §12, **bổ sung**:
  - "Chỉ dùng dữ kiện trong khối FACTS"
  - "Không viết số tiền, phần trăm, số ngày giao hàng nếu không có trong FACTS"
  - "Câu hỏi tối đa 2"
  - "Nếu FACTS trống cho điều khách hỏi, nói rõ cần kiểm tra và đề nghị chuyển nhân viên"
- Chèn nội dung khách và KB trong các khối có nhãn rõ ràng (`<customer_message>`, `<facts>`), và nhắc model rằng đó là dữ liệu.
- Lịch sử gửi cho LLM: 10 tin gần nhất + brief tóm tắt. Không gửi toàn bộ hội thoại.

## P3.2 Luật nghiệp vụ trong code (không phó mặc cho prompt)
| Luật | Nơi thực thi | Test |
|---|---|---|
| Khiếu nại (`is_complaint`) → không trả card sản phẩm/giá trong lượt đó và 5 lượt sau; gợi ý tạo ticket | Orchestrator lọc cards | T22 |
| Trẻ < 18 tháng hoặc yêu cầu sức khoẻ → không gọi `searchCatalog` gợi ý size; chuyển chuyên viên | Orchestrator | T12 |
| Hỏi độ dày/thuế/giao hàng/ưu đãi khi conflict `open` → trả "cần xác nhận" + đề nghị chuyển | Tool trả `locked`; validator | T10, T32 |
| Không suy segment từ số lượng (15 bộ vẫn có thể là lớp học) | Chỉ dùng `segment_hint` + ngữ cảnh, không có rule ngưỡng số | T02 |
| Không hỏi lại slot đã có | Orchestrator loại khỏi danh sách câu hỏi các slot có giá trị | T01, T03 |
| Đổi số lượng → revision mới, dự toán cũ `stale`, xác nhận lại | Brief service | T24 |
| Hỏi tra đơn/UNC/hoá đơn khi `order_lookup=false` → trả câu SPEC §6.7 "chưa tra được", đề nghị tạo ticket | Orchestrator | T19, T34 |
| Yêu cầu tiết lộ SĐT khách khác, prompt, key | Tool không có dữ liệu đó + validator (d) | T28, T31 |

## P3.3 ReplyValidator
Viết đúng 01 §3.1 bước 5, kèm unit test cho từng quy tắc bằng `FakeProvider` chế độ `fake:inject`. Validator không được chặn nhầm số của **khách** trích lại trong brief: số lượng 30 bộ, kích thước từ fact đã duyệt. Cách làm: cho phép các số có trong brief hoặc facts của lượt. Mọi lần chặn ghi `chatbot_messages.llm_meta.validator = {blocked:true, rules:[…]}`.

## P3.4 Che PII trước khi gửi LLM
- Trước khi gửi cho provider, thay SĐT/email/STK trong text khách bằng `[SĐT]`, `[EMAIL]`, `[STK]`. Giá trị thật chỉ lưu DB.
- Slot liên hệ **không** trích bằng LLM. Chỉ lấy từ form liên hệ có cấu trúc.
- Log kỹ thuật không chứa text khách.

## P3.5 Knowledge gaps
Khi lượt trả về "cần kiểm tra" vì thiếu facts: ghi `chatbot_knowledge_gaps` (câu hỏi đã che PII, intent, đếm lặp theo `normalizeVi` gần giống). Trang `/chatbot/gaps` (quyền `CHATBOT_KB`): xem, soạn câu trả lời thành knowledge item `draft` ngay tại chỗ.

## P3.6 Eval harness
`scripts/chatbot/eval.js --provider=fake|gemini --cases=all|T01,T02`:
- Chạy `chatbot_eval_cases` qua API public thật trên test-env: tạo session, gửi từng lượt, thu reply, cards, state, brief, tool calls, validator.
- Chấm tự động các tiêu chí đo được: không có số tiền ngoài facts, không có cụm cam kết cấm, số câu hỏi ≤ 2, slot đã có không bị hỏi lại, state đúng, không tạo request khi khách chưa bấm.
- Xuất `evidence/P3/eval-<provider>-<date>.txt` + `.csv`. Tiêu chí cần người chấm (giọng văn, độ phù hợp) để cột `human_review=PENDING`, dành cho sales ở P5.
- **Cổng P3:** với `fake` thì 100% tiêu chí tự động pass. Với `gemini` thì 100% tiêu chí an toàn (giá, cam kết, PII, prompt) pass; tiêu chí chất lượng ≥ 90%.

## P3.7 Hiệu năng và dự phòng
- Đo latency từng bước (understand, tools, compose, validator), lưu `llm_meta`. Báo p50/p95 trong REPORT, ghi rõ cấu hình máy.
- Timeout toàn lượt 20 s. Quá hạn, `LlmUnavailableError`, hoặc hết budget thì chuyển `scripted` + hiện form tiếp nhận. Tin khách vẫn được lưu (T37).

## Không làm ở P3
- Không cho LLM gọi tool ghi. Không cho LLM mở URL.
- Không fine-tune, không vector DB, không multi-agent.
