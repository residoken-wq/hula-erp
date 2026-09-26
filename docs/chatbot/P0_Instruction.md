# P0 — Nền backend chatbot (cờ tắt, không ai thấy thay đổi)

**Điều kiện bắt đầu:** Chủ dự án đã chốt Q-04, Q-05, Q-07. `STATUS.md` ghi P0 = `READY`.
**Nhánh:** `chatbot/p0` từ `main` mới nhất.
**Sau deploy:** không có thay đổi với khách và nhân viên (I-01). Màn Phân quyền thêm 2 mã (I-02).
**Phạm vi:** chỉ backend `src/chatbot/**`, `src/auth/permission-catalog.ts` (thêm mã), `src/app.module.ts` (đăng ký), `route-matrix.csv`, `activity.subscriber.ts` (loại trừ log), script trong `scripts/chatbot/`.

---

## P0.1 Module và bảng

1. Tạo `src/chatbot/chatbot.module.ts`, import vào `AppModule`. Không import `AiModule`.
2. Entity cho các bảng P0 trong `01_Master-Plan.md` §3.2: `chatbot_sessions`, `chatbot_conversations`, `chatbot_messages`, `chatbot_briefs`, `chatbot_consents`, `chatbot_attachments`, `chatbot_requests`, `chatbot_tickets`, `chatbot_outbox`, `chatbot_audit_events`.
   - Đăng ký trong `entities[]` của `app.module.ts` **và** `TypeOrmModule.forFeature`.
   - `ChatbotSchemaService.onModuleInit` chạy DDL `CREATE TABLE IF NOT EXISTS …`, index, và 2 sequence `chatbot_request_seq`, `chatbot_ticket_seq`, bọc try/catch và log lỗi (không có PII).
3. Ràng buộc bắt buộc:
   - `chatbot_messages`: `UNIQUE(conversation_id, client_msg_id)` (idempotency tin khách)
   - `chatbot_requests.idempotency_key UNIQUE`, `chatbot_requests.code UNIQUE`, `chatbot_tickets.code UNIQUE`
   - `chatbot_sessions.token_hash UNIQUE`
   - Index `chatbot_conversations(last_message_at desc)`, `chatbot_outbox(status, next_attempt_at)`
4. `chatbot_attachments.content` là `bytea` (Q-07). **Không** ghi file ra `uploads/` vì thư mục này public.
5. Thêm các entity chatbot vào danh sách loại trừ trong `shouldLog()` (`src/system/subscribers/activity.subscriber.ts`), để `activity_logs` không chép nội dung chat.

## P0.2 Mã quyền và seed

1. Thêm vào `PERMISSION_MODULES` (`src/auth/permission-catalog.ts`), group `'Website'`, đặt sau `CMS`:
   - `{ code: 'CHATBOT', name: 'Trợ lý AI website — Hộp thư, Yêu cầu, CSKH', group: 'Website' }`
   - `{ code: 'CHATBOT_KB', name: 'Trợ lý AI website — Tri thức & Giá (xoá = Duyệt)', group: 'Website' }`
2. `src/chatbot/chatbot-seed.service.ts` theo mẫu `src/auth/rbac-seed.service.ts`:
   - Có key `CHATBOT_SEED_V1` trong `system_configs` thì bỏ qua (idempotent).
   - Chạy trong một transaction. Với mỗi `user_groups`: nếu nhóm chưa có dòng `CHATBOT` và có dòng `SALES` thì chép 5 cờ từ `SALES` (Q-05). Không tạo dòng `CHATBOT_KB`.
   - Ghi kết quả vào `CHATBOT_SEED_V1` dạng `{at, changes:[{group_id, group_name, flags}]}`.
3. REPORT có bảng seed dry-run chạy trên test-env (`pgenv.sh reset` → boot → đọc key). Dự kiến theo ma trận thật: Sales=VCU--, Admin=VCUD$, Planning Manager=VCUD-, Accounting_manager=V----, 2 nhóm còn lại -----. Kết quả lệch thì giải thích.

## P0.3 Cấu hình

1. `ChatbotConfigService`:
   - Đọc/ghi `system_configs.CHATBOT_CONFIG` (JSON, schema ở 01 §3.4), cache 30 s.
   - Mặc định khi chưa có key: `enabled=false`, mọi `features.*=false`, `display_name='Cừu Hula — Trợ lý AI'`, `limits` theo P0.5, `retention_days={chat:365, attachment:365, request:730, ticket:730, audit:730}`, `llm={daily_call_budget:2000, timeout_ms:20000}`.
   - Validate khi ghi (class-validator). Từ chối nếu phát hiện chuỗi giống bí mật: key có chữ `key`/`secret`/`token`/`pass`, hoặc giá trị dạng `AIza…`/`sk-…`.
2. `publicView()` chỉ trả tập whitelist: `enabled, display_name, avatar_url, greeting, working_hours, contact_channels, response_sla_text, features`. Không trả `notify_*`, `limits`, `llm`.
3. Env đọc qua `ConfigService`: `CHATBOT_LLM_PROVIDER` (mặc định `fake` khi `NODE_ENV!=='production'`, `gemini` khi production), `CHATBOT_LLM_API_KEY`, `CHATBOT_LLM_MODEL`. Chỉ log key **có hay không**, không log độ dài hay tiền tố.

## P0.4 Chat session cho khách (không dùng JWT)

1. `POST /public/chat/sessions` `@Public()`:
   - Sinh token 32 byte ngẫu nhiên (`crypto.randomBytes`, base64url), lưu **sha256** vào `chatbot_sessions`.
   - Tạo `chatbot_conversations` state `new`, `public_code` 8 ký tự không nhập nhằng (bỏ 0/O/1/I).
   - Trả `{session_token, conversation: {public_code, state}}`. Token chỉ trả **một lần**.
   - Body tùy chọn `analytics_session_id` (≤64 ký tự, chỉ lưu).
2. `ChatSessionGuard` (dùng trong module, gắn ở method public chat, không đăng ký toàn cục): đọc header `X-Chat-Session`, hash rồi tra DB. Không có, sai hoặc revoked thì trả 401 `{code:'CHAT_SESSION_INVALID'}`. Gắn `req.chatSession = {session_id, conversation_id}`. Mọi service public chat lấy conversation **chỉ** từ đây.
3. Khi `CHATBOT_CONFIG.enabled=false`: mọi `public/chat/*` trừ `GET /public/chat/config` trả **503** `{code:'CHATBOT_DISABLED'}`. `GET /public/chat/config` trả `{enabled:false}`.
4. Hết hạn: session không hoạt động 30 ngày thì coi như hết hạn (401). Widget tự tạo session mới.

## P0.5 Rate limit và giới hạn

`ChatRateLimiter` trong RAM (Map + cửa sổ trượt, dọn rác mỗi 5 phút), trả **429** `{code:'RATE_LIMITED', retry_after_s}`. Mặc định lấy từ `CHATBOT_CONFIG.limits`:

| Khoá | Giới hạn |
|---|---|
| tạo session / IP | 30 / giờ |
| tin nhắn / session | 20 / 5 phút |
| tin nhắn / IP | 150 / 5 phút (cao để một trường chung mạng không bị chặn nhau, T38) |
| gửi request+ticket / session | 5 / giờ |
| upload / session | 10 / giờ |
| LLM đồng thời toàn hệ thống | 8 (vượt thì xếp chờ tối đa 10 s, rồi trả câu dự phòng) |

- IP lấy từ `req.ip`, vì `trust proxy` đã bật. Chỉ lưu `ip_hash` (sha256 + salt ngẫu nhiên sinh lúc khởi động) vào DB, không lưu IP thô.
- Độ dài: tin nhắn ≤ 2000 ký tự, brief patch ≤ 8 KB. Controller chatbot tự kiểm `content-length`, không sửa body-parser toàn cục.

## P0.6 Adapter LLM

1. Interface `LlmProvider { generateJson<T>(req: {system: string; messages: {role, text}[]; schemaName: string; jsonSchema: object; timeoutMs: number}): Promise<{data: T; raw: string; model: string; usage?: {...}; latencyMs: number}> }`.
2. `GeminiProvider`: gọi REST `generativelanguage.googleapis.com` bằng `fetch`, `responseMimeType: 'application/json'` + `responseSchema`, có timeout (`AbortController`), retry tối đa 1 lần khi gặp 429/5xx. Không đọc `GEMINI_API_KEY` ở production. Chỉ ở dev, khi thiếu `CHATBOT_LLM_API_KEY`, mới được dùng `GEMINI_API_KEY` làm dự phòng.
3. `FakeProvider`: deterministic, dùng luật từ khoá, trả JSON hợp lệ theo schema. Dùng cho mọi test tự động và cho P2. Có chế độ `fake:timeout`, `fake:invalid_json`, `fake:inject` (trả reply chứa giá bịa và cụm "đã gửi") để test validator ở P3.
4. `LlmBudget`: đếm số lần gọi trong ngày (theo giờ VN, lưu `system_configs.CHATBOT_LLM_USAGE_<YYYYMMDD>`). Vượt `daily_call_budget` thì `LlmUnavailableError`.
5. P0 chưa nối vào hội thoại. Có unit test cho cả hai provider (Gemini thì mock `fetch`).

## P0.7 Kho file riêng tư

`ChatAttachmentService` (P0 làm service và test; route upload public làm ở P4):
- Nhận buffer ≤ 10 MB. Nhận diện MIME **bằng magic bytes**: PNG `89 50 4E 47`, JPEG `FF D8 FF`, PDF `25 50 44 46`. Tự viết, không thêm lib.
- Chỉ nhận PNG/JPEG/PDF. Đuôi file không khớp nội dung thì từ chối `ATTACHMENT_TYPE_MISMATCH`. Từ chối SVG/HTML/ZIP.
- Ảnh được re-encode qua `sharp` (bỏ EXIF/GPS, giới hạn 2560 px). PDF lưu nguyên và **không** render trong admin.
- Lưu `sha256`, `size`, `detected_mime`, `purge_at`.
- Chỉ đọc qua route quản trị (P2/P4), có kiểm quyền mỗi lần tải. Header `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`. **Không** có URL tĩnh.

## P0.8 Audit và phân quyền route quản trị

1. `ChatbotAuditService.record(actor, op, objectType, objectId, beforeRef?, afterRef?)` ghi vào `chatbot_audit_events`, chạy **trong cùng transaction** với thao tác. Không chép nội dung tin nhắn, SĐT hay email vào audit.
2. Mẫu controller quản trị (Q-04):
   ```ts
   @Controller('chatbot/admin/config')
   @UseGuards(JwtAuthGuard, PermissionsGuard)
   export class ChatbotAdminConfigController {
     @RequirePermission('CHATBOT', 'can_view') @Perm('CHATBOT', 'view')
     @Get() get() {...}
     @RequirePermission('CHATBOT', 'can_update') @Perm('CHATBOT', 'update')
     @Put() save(@Body() dto: ChatbotConfigDto, @Req() req) {...}
   }
   ```
   P0 chỉ làm controller config (`GET/PUT chatbot/admin/config`) để kiểm chứng mẫu. Ghi config cũng ghi audit.
3. `route-matrix.csv`: thêm dòng `CB-001…` cho mọi route mới. Tier `PUBLIC` cho `public/chat/*`, tier `PERM` + quyền tương ứng cho `chatbot/admin/*`. Cột `change=NEW`.

## P0.9 Script kiểm tra

`scripts/chatbot/smoke.js` (Node thuần, gọi HTTP localhost), ghi output vào `evidence/P0/`:
- cờ tắt → 503; bật cờ (qua admin API bằng tài khoản admin test) → tạo session → gọi endpoint kiểm tra;
- vượt rate limit → 429;
- route admin: không token → 401, user không quyền → 403, dù `RBAC_MODE=SHADOW`.

Thêm bước `node scripts/chatbot/check-no-secrets.js` vào `scripts/qa.js`: quét `src/chatbot/**`, `hula-web/website/src/components/chat/**` tìm pattern `AIza[0-9A-Za-z_-]{20,}`, `sk-[A-Za-z0-9]{20,}`, `CHATBOT_LLM_API_KEY=`. Có kết quả thì fail.

## Không làm ở P0
- Không UI website, không UI ERP.
- Không gọi LLM trong hội thoại.
- Không sửa `src/ai`, `src/public/public.controller.ts`, `src/upload/**`, `main.ts`, body-parser, docker.
- Không vá `/system/config/:key` (Q-14 làm ở RBAC).

## Tự kiểm trước khi nộp
1. `pgenv.sh reset`, boot 2 lần liên tiếp: lần 2 không lỗi DDL, seed không chạy lại.
2. `npm run qa` xanh (gồm check-rbac, check-no-secrets).
3. Chạy lại các dòng CB0-* trong `ACCEPTANCE.csv` bằng HTTP thật, lưu evidence.
4. `grep` log khởi động: không có token, key, IP thô.
