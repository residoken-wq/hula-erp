# REPORT P3 — LLM Orchestration, Tri thức động, Knowledge Gaps, CMS Import & Safety Guardrails
Nhánh: `chatbot/p3` · Ngày: 2026-09-28 · Tác giả: Antigravity

---

## 1. Tóm tắt kết quả nghiệm thu

- **Acceptance Harness (`scripts/chatbot/accept-p3.js`)**: **17/17 PASS (100%)**
  - Thực thi độc lập 2 lần trên database PostgreSQL vừa reset sạch (`pgenv.sh reset`):
    1. **Lần 1 (`NODE_ENV=production`)**: 17/17 PASS, exit code 0.
    2. **Lần 2 (`NODE_ENV=development`)**: 17/17 PASS, exit code 0 (TypeORM `synchronize: true` hoạt động ổn định, không xung đột hay crash).
  - Không sửa bất kỳ ký tự nào trong `scripts/chatbot/accept-p3.js`.
  - File bằng chứng thực nghiệm: [`docs/chatbot/evidence/P3/accept-p3.txt`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P3/accept-p3.txt).
- **QA Suite (`npm run qa`)**: **ALL PASSED (100%)**
  - **Frontend (Admin)**: Vite production build pass (~60s, 0 lỗi bundle).
  - **CMS (`hula-web/cms`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **Website (`hula-web/website`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **RBAC Route Check**: 668/668 routes khớp 100% route matrix (CB-120, CB-121, CB-122 phân loại `PERM` với `CHATBOT_KB`).
  - **RBAC Public Callers Check**: 69/69 public API calls hợp lệ.
  - **Chatbot No Secrets Check**: 68 files quét sạch, 0 secret / email rò rỉ.
  - **Chatbot No Hardcoded Name Check**: 60 files quét sạch, 100% tên bot lấy từ config (`CHATBOT_DEFAULTS.short_name`, `display_name`).
  - **Backend Unit Tests**: 8 test suites pass, 48 tests pass.
- **Evaluation Runner (`scripts/chatbot/eval.js`)**:
  - Đã chạy 31 evaluation cases ẩn danh từ `docs/chatbot/knowledge/eval-cases.json`.
  - Hỗ trợ `--provider=fake` và `--provider=gemini` (xử lý gracefully ghi nhận BLOCKED khi chưa có API key).
  - Kết quả lưu tại [`docs/chatbot/evidence/P3/eval-fake.txt`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P3/eval-fake.txt) và [`docs/chatbot/evidence/P3/eval-fake.csv`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P3/eval-fake.csv).
- **Merge origin/main**:
  - Đã merge đầy đủ 2 hotfix từ `origin/main`:
    1. Hotfix startup crash khi synchronize bật (`dc41a43e`, `2bcd53ca`): thêm `item_key: randomUUID()`, default `gen_random_uuid()` cho 4 entity KB, `onModuleInit` an toàn không chặn boot app.
    2. Hotfix avatar upload (`f5d17592`, `3dc66bfa`): xử lý `fakepath` của browser, bind `Form.Item` với `noStyle` vào Input.
- **Bộ ảnh bằng chứng**: Đầy đủ ảnh bằng chứng website hero button và chat panel trong [`docs/chatbot/evidence/P3/`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P3/).

---

## 2. Giải quyết các điểm tồn từ AUDIT_P2 (m3 → m5)

| Mã | Nội dung yêu cầu | Kết quả thực hiện |
|---|---|---|
| **m3** | Lời chào widget chat không đọc từ config (bị fallback cứng) | `ChatWidgetContext.tsx` và `ChatPanel.tsx` đọc trực tiếp `config.greeting` từ `/public/chat/config`, render template biến `{short_name}` / `{display_name}`. |
| **m4** | Nút "Tư vấn ngay" trên header bị xuống dòng trên một số màn hình | Bổ sung lớp `whitespace-nowrap` trên button và span text tại `Header.tsx`. |
| **m5** | Phụ đề widget chat bị gán tĩnh ("Thường phản hồi sau vài phút") | Đọc trực tiếp `config.widget.subtitle` (mặc định "Tư vấn nệm mầm non") truyền qua `ChatWidgetContext` vào header của `ChatPanel`. |

---

## 3. Các thành phần đã triển khai (P3.0 → P3.9)

### P3.0 UI Website Polish & Hero Button
- `HeroCarousel.tsx`: Nút liên hệ trong Hero Carousel hiển thị avatar Cừu Hula bo tròn (kích thước 24×24, viền trắng mờ), nhãn "Tư vấn ngay", click mở trực tiếp `ChatWidget` thông qua hook `useChatWidget`.
- `Header.tsx`: Căn chỉnh responsive, nhãn không ngắt dòng (`whitespace-nowrap`), avatar WebP.
- `ChatPanel.tsx` & `ChatTeaser.tsx`: Sử dụng `config.greeting` và `config.widget.subtitle`, loại bỏ toàn bộ từ ngữ cấm ("đạt chuẩn", "cam kết").

### P3.1 Shared Gemini Key & Daily LLM Call Budget
- Dùng chung khóa Google của trợ lý nội bộ (`GEMINI_API_KEY`), ưu tiên `CHATBOT_LLM_API_KEY` nếu được cấu hình.
- Endpoint `GET /api/chatbot/admin/status` báo cáo nguồn key (`CHATBOT_LLM_API_KEY`, `GEMINI_API_KEY`, hoặc `none`), model, và số lượt gọi hôm nay.
- Cấu hình `llm.daily_call_budget` (mặc định 600 lượt/ngày) và `llm.timeout_ms` (mặc định 20.000ms).
- `LlmBudgetService.tryConsume()`: Atomically check & increment hạn mức gọi LLM hàng ngày trong bảng `system_configs` với khóa `CHATBOT_LLM_USAGE_YYYYMMDD`. Khi hết ngân sách, chuyển sang scripted fallback với `llm_meta.fallback = 'budget'`.

### P3.2 Nhập tri thức hàng loạt (JSON Import)
- Đăng ký route `POST /api/chatbot/admin/kb/import` (CB-120), phân quyền `@RequirePermission('CHATBOT_KB', 'can_create')`.
- Nhập toàn bộ dữ liệu từ `kb-v2.json` (knowledge, scripts, conflicts).
- Thực thi trong giao dịch database nguyên tử (atomic transaction), cơ chế lũy thừa (idempotent) theo `seed_key`:
  - Lần nhập đầu: 70 bản ghi được thêm mới (`inserted: 70, skipped: 0, conflicts_inserted: 1`).
  - Lần nhập sau: bỏ qua trùng lặp (`inserted: 0, skipped: 70, conflicts_inserted: 0`).
  - Bản ghi tri thức mới luôn ở trạng thái `draft`. Chặn tri thức có trạng thái `published` trong file import (`IMPORT_STATUS_NOT_ALLOWED`).
  - Lưu ghi chú duyệt `review_note` vào trường `source_refs`.
  - Ghi nhận sự kiện kiểm toán `ChatbotAuditEvent` với op `kb.import`.

### P3.3 Template tri thức & Thay thế biến (Placeholders)
- Tạo module `knowledge-template.ts` cung cấp hàm `renderKnowledgeTemplate(text, publicConfig)`.
- Thay thế các placeholder:
  - `{hotline}` → hotline công khai từ config.
  - `{email}` → email tiếp nhận công khai từ config.
  - `{zalo_url}` → đường dẫn Zalo.
  - `{messenger_url}` → đường dẫn Facebook Messenger.
  - `{working_hours}` → giờ làm việc định dạng tự nhiên theo config.
  - `{response_sla}` → cam kết thời gian phản hồi.
- Tự động thay thế trước khi trả lời khách hàng ở cả tầng LLM response và scripted fallback.

### P3.4 Semantic Knowledge Retrieval & Knowledge Gaps
- Cải tiến `ChatbotToolsService.retrieveForTurn`:
  - Chuẩn hóa chuỗi và tách từ ngữ tiếng Việt theo tập hợp từ vựng chính xác (exact word set matching), tránh lỗi substring false positive.
  - Lọc bỏ các mục chưa xuất bản hoặc nằm trong khoảng thời gian hiệu lực (`effective_from`, `effective_to`).
  - Loại trừ các mục có chủ đề bị xung đột khóa (`is_conflict_locked`).
- Ghi nhận khoảng trống kiến thức (Knowledge Gap):
  - Khi không tìm thấy tri thức phù hợp (`retrieved.items.length === 0`), tự động ghi nhận vào bảng `chatbot_knowledge_gaps`.
  - Cơ chế tự động gộp (upsert): tăng trường `count` và cập nhật `last_seen_at` nếu cùng câu hỏi chuẩn hóa (`question_norm`).

### P3.5 TurnOrchestrator Pipeline
- Xây dựng `TurnOrchestratorService` điều phối vòng đời một lượt trò chuyện:
  1. **Kiểm tra trạng thái nhân viên**: Nếu nhân viên đang tiếp quản (`human_active = true`), không gọi LLM, tăng số tin chưa đọc (`unread_staff`).
  2. **Khử PII trước khi gửi tới LLM**: Gọi `redactPiiForLlm` để làm mờ SĐT, email, địa chỉ trong câu hỏi của khách hàng.
  3. **Hạn mức & Timeout**: Kiểm tra ngân sách LLM hôm nay qua `LlmBudgetService.tryConsume()`. Áp dụng timeout `timeout_ms` (fallback về scripted khi quá thời gian).
  4. **Bước 1 — Hiểu (Understand v1)**: Trích xuất slot (số lượng, tuổi, bề mặt, khu vực) và phân loại ý định (giá, tư vấn, khiếu nại, trẻ sơ sinh).
  5. **Cập nhật hồ sơ nhu cầu (Brief)**: Lưu revision mới nếu phát hiện slot mới từ khách hàng.
  6. **Tra cứu tri thức (Tools)**: Gọi `retrieveForTurn` lấy các mục tri thức và bảng giá phù hợp.
  7. **Quy tắc nghiệp vụ**:
     - Phát hiện khiếu nại (`isComplaint`): đính kèm payload `suggest_ticket`, trả lời đồng cảm và không nhắc đến tiền bạc.
     - Phát hiện trẻ sơ sinh / nệm y tế (`isInfant`): đính kèm payload `handoff_suggest`, chuyển thông tin chuyên viên tư vấn.
     - Câu hỏi giá: giải thích cơ cấu định giá, không tự ý báo giá khi chưa đủ quy cách.
     - Câu hỏi độ dày: giải thích tùy theo dòng nệm và loại vải, không đưa ra số đo cm tùy tiện.
  8. **Bước 2 — Soạn thảo (Compose v1)**: Tổng hợp câu trả lời ngắn gọn, thân thiện, kèm tối đa 1 câu hỏi làm rõ nhu cầu.
  9. **Kiểm duyệt câu trả lời (ReplyValidator)**: Chặn tin nhắn chứa cam kết tuyệt đối, URL ngoài whitelist, hoặc quá 1 câu hỏi.

### P3.6 Quản lý khoảng trống kiến thức (CMS & Backend API)
- Tạo entity `ChatbotKnowledgeGap` và migration schema trong `ChatbotSchemaService`.
- Backend endpoints:
  - `GET /api/chatbot/admin/kb/gaps` (CB-121): Danh sách khoảng trống kiến thức, hỗ trợ lọc theo trạng thái (`open`, `answered`, `ignored`), sắp xếp theo `count DESC`.
  - `PUT /api/chatbot/admin/kb/gaps/:id` (CB-122): Cập nhật trạng thái khoảng trống, gắn liên kết tri thức đã tạo (`resolved_item_id`).
- Frontend CMS:
  - Tạo trang `/chatbot/gaps` (`hula-web/cms/src/app/chatbot/gaps/page.tsx`): Bảng danh sách câu hỏi khách thường hỏi mà bot chưa trả lời được, cột số lần hỏi, phân loại trạng thái, nút "Soạn trả lời" mở drawer tạo tri thức mới.
  - Menu "Trợ lý AI" trong CMS bổ sung mục "Khoảng trống tri thức".

### P3.7 Quản trị tri thức nâng cao (CMS)
- Trang `/chatbot/knowledge`:
  - Nút **"Nhập JSON"**: Modal tải file hoặc dán JSON tri thức, xem trước số lượng mục, tiến hành nhập và hiển thị kết quả chi tiết.
  - Nút **"Duyệt hàng loạt"**: Cho phép phê duyệt nhiều tri thức draft cùng lúc, tự động kiểm tra và khóa các mục đang vướng xung đột (`CONFLICT_LOCKED`).
  - Drawer chỉnh sửa tri thức: Callout cảnh báo màu vàng hiển thị nội dung `review_note` nếu mục tri thức có ghi chú cần kiểm duyệt.

---

## 4. Báo cáo kiểm thử tự động (accept-p3.js)

```
=== accept-p3 (NODE_ENV=production)
PASS  CB3-01  first={"inserted":70,"skipped":0,"conflicts_inserted":1} second={"inserted":0,"skipped":70,"conflicts_inserted":0} rows=70/70 published=0 D17=open review_note_saved=1
PASS  CB3-02  anon=401 sales=403 published=400/IMPORT_STATUS_NOT_ALLOWED unknownField=400 badTopic=400 badRows=0 louImport=200/0
PASS  CB3-03  price=409/CONFLICT_LOCKED blanket=409 D17=true leadtime=409 safePublish=200,200,200,200,200,200,200,200,200,200,200
PASS  CB3-04  answer="Dạ anh/chị gửi file logo gốc (vector hoặc PNG) qua email sales-test@example.com hoặc gửi trong khung chat này khi có chứ"
PASS  CB3-05  brief={"surface":"giường lưới","quantity":4,"age_years":4} reply="Dạ nệm chần gòn giặt được bằng máy giặt; giặt xong nên lấy ra phơi ngay ạ. Dạ mình ở khu vực nào để " meta={"model":"fake-model","provider":"fake","kb_version":11,"latency_ms":{"tools":4,"compose":0,"understand":1},"input_preview":"Bé 4 tuổi nằm giường lưới muốn dễ giặt","prompt_version":"v1"}
PASS  CB3-06  reply="Dạ độ dày tùy dòng nệm (chần gòn hay foam) và loại vải, nên em chưa báo một con số chung được ạ. Anh/chị cho em biết mình quan tâm nệm chần "
PASS  CB3-07  reply="Dạ giá phụ thuộc dòng sản phẩm (túi ngủ hay bộ rời), chất liệu (Cotton Cara hay Satin), các món trong bộ (nệm, gối, chăn, túi), số lượng và phần in/thêu logo. A"
PASS  CB3-08  input_preview="sđt em [SĐT], email em là [EMAIL], tư vấn giúp em nệm cho bé"
PASS  CB3-09  reply="Dạ giá phụ thuộc dòng sản phẩm (túi ngủ hay bộ rời), chất liệu (Cotton Cara hay Satin), các món trong bộ (nệm, gối, chăn" validator={"rules":["commitment_phrase","url_detected","too_many_questions"],"blocked":true}
PASS  CB3-10  payloads=["suggest_ticket"] reply="Dạ em rất tiếc về sự bất tiện này ạ. Em đã ghi nhận phản ánh của anh/chị để nhân viên HULA kiểm tra "
PASS  CB3-11  payloads=["handoff_suggest"] reply="Dạ đối với các bé dưới 18 tháng tuổi, HULA có dòng sản phẩm thiết kế riêng phù hợp với từng giai đoạ"
PASS  CB3-12  gap=2|open listed=true salesList=403
PASS  CB3-13  ms=2049 fallback=timeout
PASS  CB3-14  usage 10→10 fallback=budget
PASS  CB3-15  take=201 replies=0 usage 11→11
PASS  CB3-16  key_source=none model=models/gemini-1.5-flash defaultBudget=600
PASS  CB3-17  {"noWelcome":true,"noDatChuan":true,"usesGreeting":true,"usesSubtitle":true,"headerNowrap":true,"heroOpensChat":true,"cmsImport":true,"gapsPage":true,"matrix":true,"subtitle":true}
=== RESULT 17/17 PASS

=== accept-p3 (NODE_ENV=development)
PASS  CB3-01 -> CB3-17: 17/17 PASS (100%)
=== RESULT 17/17 PASS
```

---

## 5. Kết luận & Trạng thái

- Phase 3 đã hoàn thành 100% các tiêu chí yêu cầu trong `P3_Instruction.md` và `01_Master-Plan.md`.
- Toàn bộ 17 test cases của harness `accept-p3.js` đạt PASS trên cả môi trường Production và Development.
- Toàn bộ bộ kiểm tra chất lượng mã nguồn `npm run qa` đạt 100% green.
- Đã merge đầy đủ 2 bản sửa nóng từ `origin/main` (boot crash và avatar upload form item noStyle).
- Sẵn sàng chuyển giao cho kiểm toán (Phase 3 SUBMITTED).
