# P3 — AI tư vấn thật (Gemini dùng chung key), kho tri thức v2, sửa UI tồn

**Điều kiện:** P1+P2 đã merge (main @ `eaa07f2`). Đã chốt:
- **Q-01 (2026-09-28):** dùng **key Google đang dùng cho trợ lý nội bộ** (`GEMINI_API_KEY`).
- **Hero:** nút "Tư Vấn Ngay" ở banner trang chủ **thay bằng nút avatar chatbot**.

**Nhánh:** `chatbot/p3` (Claude đã tạo từ main). Có sẵn:
- `docs/chatbot/knowledge/kb-v2.json`: 52 mục tri thức + 18 kịch bản + conflict D17;
- `docs/chatbot/knowledge/eval-cases.json`: 31 tình huống ẩn danh;
- `scripts/chatbot/accept-p3.js`: hợp đồng, **không sửa**.

**Quy trình:** nhanh, theo `00_START-HERE.md`. Script kiểm cả backend **và** sự tồn tại của các thay đổi UI (bài học P2).
**Sau deploy:**
- Cờ `enabled` vẫn tắt.
- Nếu `GEMINI_API_KEY` có trên VPS thì AI sẵn sàng khi bật cờ; không có thì bot chạy kịch bản như P2.
- Menu CMS "Trợ lý AI" có thêm nút **Nhập JSON**, **Duyệt hàng loạt** và trang **Khoảng trống kiến thức**.

---

## P3.0 Sửa UI tồn từ P2 (AUDIT_P2 m3–m5) + nút hero

1. **Lời chào:** `ChatPanel.tsx`, `ChatTeaser.tsx`, `ChatWidgetContext.tsx` đọc `config.greeting` (không dùng `welcome_message`). Xoá câu viết cứng, kể cả chữ "đạt chuẩn". Nếu thiếu `greeting` thì để trống, không thêm câu dự phòng khác.
2. **Nút header:** thêm `whitespace-nowrap`, avatar 20 px. Ở 1280 px menu không được xuống dòng.
3. **Phụ đề panel:** thêm `widget.subtitle` vào `CHATBOT_CONFIG` (mặc định `'Tư vấn nệm mầm non'`, 0–40 ký tự, không có `<>{}`, dùng validator chung, có trong tab Cấu hình hệ thống, có trong `publicView`). Panel và teaser đọc từ đây.
4. **Nút hero** (`HeroCarousel.tsx` L118-123):
   - Khi `enabled=true`: thay `<Link href="/lien-he">` bằng `<button>` mở chat (qua `useChatWidget`/`ChatWidgetContext`). Nội dung: avatar cừu 28 px + chữ `heroButton2 || widget.cta_label`, giữ style viền trắng hiện có, thêm animation pulse như nút header (tắt khi `prefers-reduced-motion`).
   - Khi `enabled=false` hoặc lỗi: giữ nguyên link cũ.

## P3.1 LLM: key dùng chung, model, hạn mức (Q-01)

1. **Key:** `GeminiProvider` lấy key theo thứ tự `CHATBOT_LLM_API_KEY` → `GEMINI_API_KEY`, **ở mọi môi trường** (bỏ luật "không đọc `GEMINI_API_KEY` ở production" của P0.7). Không có key nào thì chạy kịch bản (P2 `ScriptedResponder`).
2. **Provider:** env `CHATBOT_LLM_PROVIDER` = `gemini` (mặc định khi có key) | `fake` (test) | `scripted` (tắt AI).
3. **Model:** `CHATBOT_LLM_MODEL` nếu có. Nếu không, tự chọn như `src/ai/ai.service.ts getBestModel()`: gọi list models, lấy model đầu tiên có `generateContent` và tên chứa `flash`, cache 24 giờ, lỗi thì dùng `models/gemini-1.5-flash`. **Chép logic sang, không import** `src/ai`. Key gửi bằng header `x-goog-api-key`.
4. **Hạn mức:** mọi lần gọi provider (kể cả `fake`) đều trừ `LlmBudgetService`. Mặc định `llm.daily_call_budget` đổi thành **600** (mỗi lượt chat tối đa 2 lần gọi, khoảng 300 lượt/ngày), để chatbot không ăn hết hạn mức của trợ lý nội bộ. Hết budget, gặp 429 hoặc timeout thì trả lời bằng kịch bản và ghi `llm_meta.fallback = 'budget'|'rate_limited'|'timeout'|'error'`.
5. **`GET /api/chatbot/admin/status`** thêm `llm_key_source: 'CHATBOT_LLM_API_KEY'|'GEMINI_API_KEY'|'none'`, `llm_model`. Tab Cấu hình hiển thị: "Khoá LLM: dùng chung với trợ lý nội bộ" khi nguồn là `GEMINI_API_KEY`.

## P3.2 Nhập tri thức từ file JSON (CMS)

1. **Cột mới:** `chatbot_knowledge_items.seed_key varchar(80) null`, unique index có điều kiện `WHERE seed_key IS NOT NULL` (DDL + entity cùng tên index).
2. **`POST /api/chatbot/admin/kb/import`** (CB-120, cặp `CHATBOT_KB can_create`; khai báo **trước** route `POST /:type`, không thì bị hiểu thành type "import"), body là nội dung file có định dạng `kb-v2.json`:
   - Validate cả file trước, sai một mục thì 400 và **không ghi gì**:
     - `format === 'hula-chatbot-kb'`;
     - mỗi mục có `seed_key`, `topic` khớp `^[a-z0-9_.]+$`, `answer`;
     - `status` chỉ được `draft` hoặc `needs_review` (có `published` → 400 `IMPORT_STATUS_NOT_ALLOWED`);
     - trường lạ → 400.
   - Một transaction:
     - `conflicts[]`: thêm conflict nếu `code` chưa có (`status='open'`), không sửa conflict đã có;
     - `knowledge[]` và `scripts[]` (scripts: `public_allowed=true`, `status='draft'`, `intent=null`): nếu đã có mục cùng `seed_key` thì **bỏ qua**, không thì tạo version 1;
     - `review_note` lưu thành một phần tử `{note}` trong `source_refs`.
   - Trả `{inserted, skipped, conflicts_inserted}`, audit `kb.import`.
   - Import lại cùng file → `inserted=0` (idempotent).
3. **CMS `/chatbot/knowledge`:**
   - Nút **"Nhập JSON"**: chọn file, xem trước số mục, gửi, hiện kết quả.
   - Hiện `review_note` trong Drawer (khung vàng "Ghi chú cho người duyệt").
   - **"Duyệt hàng loạt"**: chọn nhiều dòng, gọi publish lần lượt, hiện kết quả từng dòng (thành công / `CONFLICT_LOCKED` + mã conflict). Chỉ hiện khi có quyền `CHATBOT_KB delete` hoặc là `admin`.
4. Không seed tự động file này khi boot. **Người duyệt nhập tay trong CMS.** File nằm trong `docs/` (repo private, không sync sang erp4u-demo).

## P3.3 Placeholder trong câu trả lời
Khi trả tri thức cho khách (tool, pipeline, bot kịch bản), render `{short_name}`, `{hotline}`, `{email_public}`, `{zalo_url}`, `{working_hours_text}` từ `publicView()` (đã áp giá trị dự phòng). Dùng hàm `renderTemplate` có escape. `working_hours_text` ví dụ: `T2–T6 08:00–17:30, T7 08:00–12:00`. Placeholder không có giá trị thì thay bằng chuỗi rỗng.

## P3.4 Truy xuất cho hội thoại (`retrieveForTurn`, khác `searchKnowledge` của P1)
`searchKnowledge` (AND, dùng cho `/preview`) **giữ nguyên**, để `accept-p1` vẫn xanh. Thêm `ChatbotToolsService.retrieveForTurn(text, {intent, topic_hint})`:
1. Chỉ lấy tri thức `publicScope`, **bỏ** `script.*`.
2. Tokens = `normalizeVi(text)` tách từ, bỏ số, bỏ từ ≤ 1 ký tự, bỏ stopword:
   `a, a, o, oi, nhe, nha, thi, la, co, khong, cho, em, anh, chi, minh, ben, cua, va, hay, duoc, voi, cac, nhung, nay, do, bao, nhieu, gi, nao, the, ra, vao, muon, can, toi, ah, u, vay, roi, luon, giup, xin`
   (dạng đã bỏ dấu). **Không** có `ban` trong danh sách, vì "bán" và "bạn" trùng nhau sau khi bỏ dấu.
3. Điểm từng mục = `ts_rank(to_tsvector('simple', search_text), to_tsquery OR của tokens)` + **1.0** nếu `topic` chứa `topic_hint` + **0.5** nếu `intent` trùng.
4. Mục được chọn khi: có khớp `topic_hint`, **hoặc** chứa ≥ 50% số tokens. Trả tối đa 3 mục, xếp theo điểm.
5. Không có mục nào → ghi **knowledge gap** (P3.7).

**`topic_hint`** (LLM "hiểu" trả về; `FakeProvider` dùng từ khoá):
| hint | từ khoá (không dấu) |
|---|---|
| `price` | `gia`, `bao nhieu tien`, `bao gia` |
| `thickness` | `day` (kèm `cm` hoặc `nem`) |
| `care` | `giat`, `phoi`, `ve sinh`, `phai mau` |
| `sample` | `xem mau`, `gui mau` |
| `leadtime` | `bao lau`, `khi nao co hang`, `may mat`, `gap` |
| `shipping` | `ship`, `giao hang`, `van chuyen`, `phi giao` |
| `invoice` | `hoa don`, `hop dong`, `vat`, `thue` |
| `payment` | `chuyen khoan`, `thanh toan`, `tam ung`, `unc` |
| `logo` | `logo`, `theu`, `in ten` |
| `material` | `cotton`, `vai`, `satin`, `cara`, `chat lieu` |
| `size` | `kich thuoc`, `size`, `dai`, `rong` |
| `return` | `doi tra`, `bao hanh`, `loi` |
| `order` | `don hang`, `giao chua`, `khi nao giao` |
| `infant` | `thang tuoi`, `so sinh`, `y te` |

## P3.5 Pipeline một lượt (`TurnOrchestrator`) — thay `ScriptedResponder` khi provider là `gemini` hoặc `fake`

Làm đúng `01_Master-Plan.md` §3.1, cụ thể như sau:
1. Khoá conversation (`FOR UPDATE`). `human_active` thì chỉ lưu tin khách, **không gọi LLM** (không tăng budget).
2. **Che PII** trong text trước khi gửi LLM: SĐT → `[SĐT]`, email → `[EMAIL]`, dãy 9–14 chữ số → `[SỐ]`.
3. **LLM #1 "hiểu"**: schema `understand.v1`:
   `{intent, segment_hint, topic_hint, slots:{quantity, colors, age_years, age_months, surface, care, items[], region, need_by}, wants_human, is_complaint}`.
   Merge slots vào brief (revision mới khi đổi, như P2).
4. **Luật code** (không phó mặc prompt):
   - `is_complaint` → không card sản phẩm/giá, thêm payload `{type:'suggest_ticket', category:'complaint_quality'}`, dùng `script.complaint`.
   - `age_months < 18` hoặc `topic_hint=infant` → không gọi catalog, thêm payload `{type:'handoff_suggest', reason:'infant'}`.
   - `wants_human` → xử lý như P2 (`waiting_sales`, outbox).
   - Không hỏi lại slot đã có.
5. **Tool đọc:** `retrieveForTurn`. `searchCatalog` chỉ khi `intent=product_advice` và không có cờ chặn. Dự toán giá **chỉ khi** `features.price_estimate=true` (hiện tắt).
6. **LLM #2 "diễn đạt"**: schema `compose.v1` `{reply_text, questions:[≤2]}`.
   - System prompt mở đầu `Bạn là {display_name}, trợ lý AI của HULA…`, dựa trên SPEC §12.
   - Khối `<facts>` chỉ chứa câu trả lời tri thức **đã render placeholder**.
   - Nội dung khách đặt trong `<customer_message>` và dặn đó là dữ liệu.
   - Gửi kèm 10 tin gần nhất và brief.
7. **`ReplyValidator`** (code) chặn nếu:
   - (a) có số tiền/`%` không nằm trong facts/brief;
   - (b) có cụm cam kết (`đã gửi`, `đã tiếp nhận` (trừ tin hệ thống của request), `đã nhận tiền`, `đã chuyển khoản`, `đã dừng`, `đã đặt lịch`, `đã giao`, `cam kết`, `chắc chắn`, `an toàn tuyệt đối`, `kháng khuẩn`, `chống thấm`, `đạt chuẩn`) mà facts của lượt không chứa đúng cụm đó;
   - (c) có URL;
   - (d) quá 2 dấu `?`;
   - (e) có SĐT/email.

   Bị chặn → thay bằng câu an toàn: câu trả lời tri thức đầu tiên, không có thì `script.price_pending` / `script.no_erp` theo intent, cuối cùng là câu chung "Dạ em ghi nhận câu hỏi của anh/chị, em sẽ nhờ nhân viên HULA kiểm tra thêm ạ.".
   Ghi `llm_meta.validator = {blocked:true, rules:[…]}`.
8. **Trước khi lưu tin AI:** đọc lại `human_active` (T35 như P2).
9. **`llm_meta`** của tin `ai`: `{provider, model, prompt_version, kb_version, latency_ms:{understand,tools,compose}, tokens?, fallback?, validator?, input_preview}`. `input_preview` = 200 ký tự **đã che PII** của tin khách.
10. **Timeout toàn lượt** = `llm.timeout_ms`, mặc định 20000. Quá hạn → fallback kịch bản; tin khách vẫn lưu.

**`FakeProvider` (deterministic, cho test):**
- `understand`: dùng regex P2 cho quantity/colors/segment/wants_human, thêm:
  - `(\d{1,2})\s*tuổi` → `age_years`; `(\d{1,2})\s*tháng` → `age_months`;
  - `giường lưới|sàn|giường gỗ|khung giường` → `surface`;
  - `thấm|lỗi|hỏng|rách|kém|phàn nàn|khiếu nại|bực` → `is_complaint`;
  - `topic_hint` theo bảng P3.4;
  - `intent`: `price` / `order_status` / `invoice` / `payment` / `sample` theo hint, còn lại `product_advice`.
- `compose`: `reply_text` = câu trả lời tri thức đầu tiên (hoặc câu chung) + tối đa 1 câu hỏi slot còn thiếu, theo thứ tự `components → quantity → region`.
- **Hook test** (chỉ khi `CHATBOT_TEST_HOOKS='true'`):
  - `[[fake:inject]]` → compose trả `"Dạ em đã gửi báo giá 350.000đ/bộ cho anh/chị, xem tại http://evil.example ạ?? ??"`;
  - `[[fake:timeout]]` → treo quá `timeout_ms`;
  - `[[fake:error]]` → ném lỗi.

## P3.6 Không cần thêm route public
Pipeline chạy trong `POST /public/chat/messages` sẵn có. Shape response giữ như P2; `replies[].payload` có thể là `summary` / `suggest_ticket` / `handoff_suggest` / `product` (card sản phẩm: `{type:'product', sku, name, image_url}`).

## P3.7 Khoảng trống kiến thức
- Bảng `chatbot_knowledge_gaps`: `id uuid`, `question_norm text UNIQUE`, `sample_text text` (đã che PII, ≤ 300), `intent varchar(32)`, `count int default 1`, `status varchar(12) default 'open'` (`open|answered|ignored`), `first_seen_at`, `last_seen_at`. Trùng `question_norm` thì `count+1`.
- API (cặp `CHATBOT_KB`):
  - `GET /api/chatbot/admin/kb/gaps?status=` (CB-121, view);
  - `PUT /api/chatbot/admin/kb/gaps/:id {status}` (CB-122, update).
- CMS `/chatbot/gaps`: bảng xếp theo `count`, nút **"Soạn trả lời"** mở Drawer tạo knowledge `draft` (điền sẵn câu hỏi), lưu xong thì gap → `answered`.

## P3.8 Eval với Gemini thật (không chặn P3, làm evidence)
`scripts/chatbot/eval.js --provider=gemini|fake --file=docs/chatbot/knowledge/eval-cases.json`:
- Chạy từng case qua API public, chấm tự động theo các mã trong file, xuất `docs/chatbot/evidence/P3/eval-<provider>.txt` + `.csv` (kèm cột `human_review` để sales chấm ở P5).
- Chạy `gemini` khi test-env có key: set `GEMINI_API_KEY` bằng **key dev**, không dùng key prod trong máy dev nếu Chủ dự án không cho.
- Không có key thì ghi `BLOCKED`.

## P3.9 Chạy nghiệm thu
```bash
bash docs/rbac_v2/test-env/pgenv.sh reset && npx nest build
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=hula_user DB_PASSWORD=hula_password DB_DATABASE=hula_db PORT=3999 \
  NODE_ENV=production CHATBOT_LLM_PROVIDER=fake CHATBOT_TEST_HOOKS=true CHATBOT_ALLOW_FIXTURES=true node dist/main.js &
node scripts/chatbot/accept-p3.js > docs/chatbot/evidence/P3/accept-p3.txt
npm run qa   # tắt backend sau khi xong
```

**Ảnh (4):**
1. Nút hero có avatar.
2. Panel dùng lời chào + phụ đề từ config (đổi thử trong tab rồi chụp).
3. CMS "Nhập JSON" với kết quả `inserted`.
4. CMS "Khoảng trống kiến thức".

## P3.10 Kịch bản trước, AI sau (Chủ dự án chốt 2026-09-28, làm trong vòng 2)

Lý do: key Gemini free tier chỉ có khoảng 20 request/ngày/model (AUDIT_P3, phần bổ sung). Chủ dự án muốn câu trả lời đi theo kịch bản và tri thức đã duyệt là chính, **chỉ gọi Gemini khi kho chưa có câu trả lời**.

1. **Config `llm.mode`** (validator chung; tab Cấu hình hệ thống thêm ô chọn "Chế độ trả lời", đặt ngoài khung Nâng cao):
   - `script_first` (**mặc định**): kịch bản và tri thức trước, AI khi không có.
   - `llm_first`: như P3.5 hiện tại.
   - `script_only`: không bao giờ gọi AI.
2. **`RuleUnderstander`** (code, không LLM): nâng logic `understand` của `FakeProvider` thành service thật, dùng chung cho `script_first`, `script_only` và fallback. Bổ sung tối thiểu:
   - `quantity`: đơn vị `bộ|cái|chiếc|set|bé|bạn|túi|tấm|chăn|gối`. Nếu một câu có nhiều số, lấy số đi với hạng mục nệm/chăn/gối/túi. **Không** lấy số đi với `đồng phục|áo|tạp dề` (S3-25).
   - `segment=business`: `đồng phục|thương mại|hợp tác|đại lý|phân phối|khách của em|bên em làm`.
   - `intent`:
     - `price`: `báo giá|giá|bao nhiêu tiền`
     - `reorder`: `như đợt trước|đặt lại|như cũ|mẫu cũ`
     - `invoice`: `hóa đơn|hợp đồng|biên bản|MST|mã số thuế|xuất hóa đơn|pháp nhân`
     - `order_status`: `khi nào giao|giao chưa|đơn hàng|lâu không|chưa giao|giao qua|địa chỉ cũ`
     - `sample`: `xem mẫu|gửi mẫu|mẫu vải|chỉ xem`
     - `payment`: `chuyển khoản|thanh toán|tạm ứng|UNC`
     - `complaint`: theo luật complaint.
     - Khi trùng nhiều intent, ưu tiên theo thứ tự `complaint > invoice > payment > order_status > sample > reorder > price > product_advice`.
   - `suggest_ticket`:
     - `complaint_quality`: `thấm|lỗi|hỏng|rách|kém|thô|phàn nàn|khiếu nại`;
     - `design_change`: `dừng in|dừng thêu|bỏ nền|sửa mockup|bỏ vòng|đổi logo`;
     - `delivery`: `giao .* (giờ nghỉ|trễ|bất tiện)|giao sai`.
3. **Luồng một lượt ở `script_first`:**
   1. `RuleUnderstander` → brief, luật code P3.5 bước 4 (complaint, infant, human).
   2. Có luật đặc biệt (complaint / infant / human / order_status / invoice / payment) → trả lời bằng `script.*` hoặc `faq.*.process` tương ứng. `route='script'`, **không gọi AI**.
   3. `retrieveForTurn` có kết quả **chắc chắn** (khớp `topic_hint` hoặc phủ ≥ 70% tokens) → trả lời = câu tri thức đã render placeholder + tối đa 1 câu hỏi slot còn thiếu (template). `route='knowledge'`, **không gọi AI**.
   4. Còn lại → ghi knowledge gap, rồi nếu còn budget và không đang bị chặn 429 thì gọi AI như P3.5 (validator giữ nguyên, `route='llm'`). **Gộp "hiểu" và "diễn đạt" thành 1 lần gọi** (schema `turn.v1` = understand + reply), để mỗi lượt chỉ tốn 1 request.
   5. AI không gọi được → câu an toàn chung + đề nghị gặp nhân viên, `route='fallback'`.
4. `script_only`: như trên nhưng bước 4 luôn đi thẳng sang bước 5.
5. `llm_meta.route` bắt buộc có ở **mọi** tin `ai`: `script` | `knowledge` | `llm` | `fallback`. Tin không gọi AI thì không trừ budget.
6. **Cổng chất lượng (CB3-24):** ở `script_only`, 31 case của `eval-cases.json` phải đạt **≥ 25/31**, và **0** lỗi an toàn (`no_money`, `no_commit`, `no_pii_leak`, `no_product_cards`).
7. **Không** hard-code câu trả lời theo từng case eval. Câu chữ lấy từ `script.*` / `faq.*` trong kho. Luật chỉ quyết định intent, slot, route.

## Không làm ở P3
- Không upload file, không ticket thật (P4), không dự toán giá cho khách.
- Không sửa `src/ai/**`.
- Không đặt `CHATBOT_TEST_HOOKS`/`CHATBOT_ALLOW_FIXTURES` trên VPS.
- Không tự xuất bản tri thức (người duyệt làm trong CMS).
