# P0 — Nền backend chatbot + tab cấu hình (cờ tắt, khách không thấy gì)

**Điều kiện:** đã chốt Q-04, Q-05, Q-07, Q-08. `STATUS.md` ghi P0 = `READY`.
**Nhánh:** `chatbot/p0`, tạo từ `origin/main` mới nhất (≥ `afad424`). Đọc SPEC chỉ để hiểu bối cảnh; P0 **không** có logic tư vấn.

**Sau deploy:**
- Khách: không đổi gì. Cờ `enabled=false`, website chưa có widget.
- Admin: trang Cấu hình hệ thống thêm tab **"Trợ lý AI website"**; màn Phân quyền thêm 2 mã `CHATBOT`, `CHATBOT_KB`.
- Nhóm đang có `SALES` được chép quyền sang `CHATBOT`.

## Phạm vi file

```
src/chatbot/
  chatbot.module.ts
  chatbot.defaults.ts          # MỌI giá trị mặc định (tên, lời chào, limits…) — nơi DUY NHẤT được viết chữ "Cừu Hula"
  entities/*.entity.ts         # 10 entity (P0.2)
  schema/chatbot-schema.service.ts   # DDL onModuleInit
  seed/chatbot-seed.service.ts       # CHATBOT_SEED_V1
  config/chatbot-config.service.ts   # đọc/ghi/validate CHATBOT_CONFIG
  config/chatbot-config.dto.ts
  config/working-hours.ts            # isWithinWorkingHours()
  session/chat-session.service.ts
  session/chat-session.guard.ts
  security/chat-rate-limiter.ts
  security/pii.ts                    # hashIp(), normalizePhone() (dùng ở P2)
  llm/llm-provider.ts                # interface + token DI
  llm/gemini.provider.ts
  llm/fake.provider.ts
  llm/llm-budget.service.ts
  attachments/chat-attachment.service.ts
  audit/chatbot-audit.service.ts
  controllers/public-chat.controller.ts        # route public P0
  controllers/chatbot-admin-config.controller.ts
  __tests__/*.spec.ts
frontend/src/components/system/ChatbotConfigTab.tsx
frontend/src/pages/SystemSettingsPage.tsx      # CHỈ thêm 1 item vào Tabs
src/auth/permission-catalog.ts                 # thêm 2 mã
src/app.module.ts                              # import module + entities[]
src/system/subscribers/activity.subscriber.ts  # loại trừ entity chatbot khỏi shouldLog()
docs/rbac_v2/route-matrix.csv                  # thêm dòng CB-001…CB-006 ở CUỐI file
scripts/chatbot/smoke.js, scripts/chatbot/check-no-secrets.js, scripts/chatbot/check-no-hardcoded-name.js
scripts/qa.js                                  # thêm 2 script check
```

**Không đụng:** `src/ai/**`, `src/public/**`, `src/upload/**`, `src/system/system.controller.ts`, `src/system/system.service.ts`, `main.ts`, body-parser, docker, workflow, `JWT_SECRET`.

---

## P0.1 Ngoại lệ quyền đã ký (Q-04)

Luật `technical-rules.md` mục RBAC v2 điều 3 cấm `@RequirePermission` cho route mới. Chủ dự án chốt **Q-04 (2026-09-26)**: route quản trị chatbot được làm ngoại lệ, vì chúng chứa PII khách mà RBAC đang SHADOW tới 2026-10-26. Cách làm giống D12:

```ts
@Controller('chatbot/admin/config')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatbotAdminConfigController {
  @RequirePermission('SYSTEM', 'can_view') @Perm('SYSTEM', 'view')
  @Get() get() {}
}
```

- Chỉ áp cho controller `chatbot/admin/*`. Route `public/chat/*` dùng `@Public()` + `ChatSessionGuard` (P0.5).
- Mỗi method phải có **cặp** cùng module. `check-rbac.js` coi đây là cặp chuyển tiếp hợp lệ. Matrix ghi tier `PERM`, quyền `SYSTEM:view` (giống các dòng HR của D12).
- Ghi vào REPORT mục 2: "Lệch luật 3 theo Q-04".

## P0.2 Bảng dữ liệu

Tên bảng và cột dùng snake_case. PK `id` là `uuid` (`gen_random_uuid()` có sẵn ở PG13+), trừ chỗ ghi khác. Mọi bảng có `created_at timestamptz default now()`.

| Bảng | Cột (kiểu) | Ràng buộc / index |
|---|---|---|
| `chatbot_conversations` | `public_code varchar(8)`, `state varchar(24) default 'new'`, `intent varchar(32) null`, `segment varchar(24) null`, `human_active boolean default false`, `assigned_user_id int null`, `customer_id int null`, `unread_staff int default 0`, `last_message_at timestamptz null`, `updated_at timestamptz` | UNIQUE `public_code`; INDEX `last_message_at desc` |
| `chatbot_sessions` | `token_hash char(64)`, `conversation_id uuid`, `ip_hash char(64)`, `user_agent varchar(300)`, `analytics_session_id varchar(64) null`, `last_seen_at timestamptz`, `revoked_at timestamptz null` | UNIQUE `token_hash`; FK `conversation_id` |
| `chatbot_messages` | `conversation_id uuid`, `role varchar(12)` (`customer/ai/staff/system`), `text text`, `payload jsonb null`, `source_refs jsonb null`, `llm_meta jsonb null`, `client_msg_id uuid null`, `sender_user_id int null` | UNIQUE `(conversation_id, client_msg_id)`; INDEX `(conversation_id, created_at)` |
| `chatbot_briefs` | `conversation_id uuid`, `revision int`, `data jsonb`, `changed_by varchar(24)` | UNIQUE `(conversation_id, revision)` |
| `chatbot_consents` | `conversation_id uuid`, `purpose varchar(16)` (`contact/marketing`), `channel varchar(16)`, `notice_version varchar(16)`, `granted_at timestamptz`, `withdrawn_at timestamptz null` | INDEX `conversation_id` |
| `chatbot_attachments` | `conversation_id uuid`, `request_id uuid null`, `ticket_id uuid null`, `original_name varchar(200)`, `detected_mime varchar(40)`, `size_bytes int`, `sha256 char(64)`, `content bytea`, `status varchar(16) default 'stored'`, `purge_at timestamptz` | INDEX `conversation_id` |
| `chatbot_requests` | `code varchar(20)`, `type varchar(20)`, `conversation_id uuid`, `brief_revision int`, `contact jsonb`, `consent_id uuid null`, `status varchar(20) default 'received'`, `owner_user_id int null`, `customer_id int null`, `idempotency_key uuid`, `customer_requested_due_at date null`, `promised_due_at date null`, `internal_note text null`, `updated_at timestamptz` | UNIQUE `code`, UNIQUE `idempotency_key` |
| `chatbot_tickets` | `code varchar(20)`, `category varchar(32)`, `priority varchar(8) default 'normal'`, `status varchar(20) default 'received'`, `conversation_id uuid`, `request_id uuid null`, `description text`, `contact jsonb null`, `owner_user_id int null`, `customer_update text null`, `internal_note text null`, `idempotency_key uuid`, `updated_at timestamptz` | UNIQUE `code`, UNIQUE `idempotency_key` |
| `chatbot_outbox` | `id bigserial`, `event varchar(40)`, `payload jsonb`, `status varchar(12) default 'pending'`, `attempts int default 0`, `next_attempt_at timestamptz default now()`, `last_error varchar(300) null` | INDEX `(status, next_attempt_at)` |
| `chatbot_audit_events` | `id bigserial`, `actor_type varchar(12)` (`user/customer/system`), `actor_user_id int null`, `op varchar(40)`, `object_type varchar(32)`, `object_id varchar(64)`, `before_ref jsonb null`, `after_ref jsonb null` | INDEX `(object_type, object_id)` |

Sequence: `chatbot_request_seq`, `chatbot_ticket_seq` (P2/P4 dùng để sinh `YC-YYMMDD-NNNN`, `TK-YYMMDD-NNNN`).

Quy tắc:
1. `ChatbotSchemaService.onModuleInit`:
   - Chạy `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE SEQUENCE IF NOT EXISTS` theo thứ tự FK, mỗi câu bọc try/catch riêng.
   - Log `chatbot schema: <bảng> ok|fail <mã lỗi>`, không log dữ liệu.
   - Entity TypeORM khai báo khớp DDL (không dựa vào `synchronize`).
2. Đăng ký 10 entity trong `entities[]` của `app.module.ts` **và** `forFeature` của `ChatbotModule`.
3. Thêm 10 tên entity vào danh sách loại trừ của `shouldLog()`.
4. `chatbot_audit_events.before_ref/after_ref` chỉ chứa id, trạng thái, tên trường đổi. **Không** chép text tin nhắn, SĐT, email.

## P0.3 Mã quyền và seed

1. `PERMISSION_MODULES`, thêm ngay sau `CMS`:
   ```ts
   { code: 'CHATBOT', name: 'Trợ lý AI website — Hộp thư, Yêu cầu, CSKH', group: 'Website' },
   { code: 'CHATBOT_KB', name: 'Trợ lý AI website — Tri thức & Giá (Xoá = Duyệt/Xuất bản)', group: 'Website' },
   ```
2. `ChatbotSeedService.onModuleInit` chạy **sau** schema, theo mẫu `src/auth/rbac-seed.service.ts`:
   - Có `system_configs.CHATBOT_SEED_V1` thì return.
   - Trong `dataSource.transaction`: với mỗi `user_groups`, nếu chưa có dòng `group_permissions.module_code='CHATBOT'` **và** có dòng `SALES`, thì chép 5 cờ `can_view, can_create, can_update, can_delete, view_cost_price` từ `SALES`.
   - Không tạo dòng `CHATBOT_KB`. Không sửa dòng đã có.
   - Ghi `CHATBOT_SEED_V1 = {at, changes:[{group_id, group_name, flags:"VCUD$"}]}`.
   - Xong thì gọi hàm làm mới cache quyền nếu `PermissionCacheService` có (xem cách `rbac-seed` làm).
3. Dry-run trên test-env, dự kiến theo ma trận thật (RBAC P1 Phụ lục A): Sales=`VCU--`, Admin=`VCUD$`, Planning Manager=`VCUD-`, Accounting_manager=`V----`, Marketing_Design và Partime **không có dòng** SALES nên bỏ qua, hoặc `-----` nếu có dòng. Kết quả thật ghi vào REPORT, lệch thì giải thích.

## P0.4 Cấu hình `CHATBOT_CONFIG` — tên trợ lý sửa được

Lưu JSON trong `system_configs.CHATBOT_CONFIG`. Mặc định đặt trong `chatbot.defaults.ts`:

```ts
export const CHATBOT_DEFAULTS = {
  enabled: false,
  display_name: 'Cừu Hula — Trợ lý AI',   // tiêu đề widget, tên trong email, tên trong prompt
  short_name: 'Cừu Hula',                // dùng trong câu chào, subject email, aria-label
  avatar_url: '/images/chatbot/cuu-hula-192.webp',
  greeting: 'Dạ em là {short_name}, trợ lý AI của HULA. Anh/chị đang chọn sản phẩm cho bé, đặt cho trường hay cần hỗ trợ đơn đã mua ạ?',
  contact_channels: { hotline: '', zalo_url: '', email_public: '', messenger_url: '' },
  working_hours: { tz: 'Asia/Ho_Chi_Minh',
    days: { mon:{off:false,from:'08:00',to:'17:30'}, tue:{…}, wed:{…}, thu:{…}, fri:{…},
            sat:{off:false,from:'08:00',to:'12:00'}, sun:{off:true} },
    holiday_note: '' },
  response_sla_text: '',
  notify_emails: [], notify_user_ids: [],
  features: { price_estimate:false, order_lookup:false, attachments:false, sample_request:false },
  limits: { session_per_ip_hour:30, msg_per_session_5m:20, msg_per_ip_5m:150, submit_per_session_hour:5,
            upload_per_session_hour:10, llm_concurrency:8, unassigned_alert_min:30, max_message_chars:2000 },
  retention_days: { chat:365, attachment:365, request:730, ticket:730, audit:730 },
  llm: { daily_call_budget:2000, timeout_ms:20000 },
};
```

**Tên trợ lý (yêu cầu Chủ dự án 2026-09-26):** "Cừu Hula" là giá trị mặc định, **sửa được** trong Cấu hình hệ thống (P0.10).
- Mọi nơi hiển thị tên (widget, câu chào, email, system prompt P3, tin hệ thống) **phải** đọc từ config qua `ChatbotConfigService.get()`. Placeholder dùng `{short_name}` / `{display_name}`, thay bằng hàm `renderTemplate()` có escape.
- Chữ "Cừu Hula" chỉ được xuất hiện trong `src/chatbot/chatbot.defaults.ts`. Script `check-no-hardcoded-name.js` quét `src/chatbot/**`, `frontend/src/components/system/ChatbotConfigTab.tsx`, `hula-web/website/src/components/chat/**` (khi có). Tìm chuỗi `Cừu Hula` / `Cuu Hula` ngoài file defaults thì fail. Riêng test và docs được phép.
- Đổi tên có hiệu lực không cần deploy (cache ≤ 30 s).

**`ChatbotConfigService`:**
1. `get()`: đọc key, `JSON.parse` trong try/catch, **deep-merge lên `CHATBOT_DEFAULTS`**, rồi validate. JSON hỏng hoặc sai kiểu thì dùng defaults cho trường đó và log `chatbot config invalid field <tên>` (không log giá trị). Cache 30 s. Lý do: route chung `POST /system/config` vẫn có thể ghi đè key này. Gói chatbot **không** phụ thuộc bản vá RBAC để an toàn.
2. `save(dto, userId)`: validate bằng class-validator rồi ghi, trong transaction có ghi audit `config.update` (after_ref chỉ chứa **danh sách tên trường đổi**). Luật validate:
   - `display_name` 2–60 ký tự, `short_name` 2–30, không chứa `<>{}`.
   - `greeting` ≤ 300 ký tự, chỉ cho phép placeholder `{short_name}`/`{display_name}`.
   - `avatar_url`: đường dẫn bắt đầu bằng `/` hoặc `https://`.
   - `hotline`: chữ số, khoảng trắng, `+`, 8–15 chữ số. `zalo_url`/`messenger_url`: `https://`. `email_public`/`notify_emails`: email hợp lệ, tối đa 10.
   - `working_hours`: `from < to`, định dạng `HH:mm`, bước 15 phút.
   - `notify_user_ids`: phải là user tồn tại và đang hoạt động.
   - `limits`/`retention_days`/`llm` có min/max hợp lý (ghi rõ trong DTO).
   - Từ chối bất kỳ trường **không có trong schema**. Từ chối giá trị có dạng bí mật (`AIza…`, `sk-…`, chuỗi ≥ 32 ký tự base64 ngẫu nhiên trong trường text).
   - `features.*` ở P0 **luôn bị ép false** khi lưu (bật theo phase).
3. `publicView()`: trả **chỉ** `enabled, display_name, short_name, avatar_url, greeting (đã render), contact_channels (đã áp fallback), working_hours, is_open_now, response_sla_text, features`.
   - Fallback liên hệ: trường trống thì lấy `contact_phone`, `zalo_url`, `facebook_url` từ settings website hiện có. Đọc bằng repository/service, **không** gọi HTTP nội bộ và không sửa `public.controller.ts`.
4. `isWithinWorkingHours(date)` trong `working-hours.ts`: tính theo `Asia/Ho_Chi_Minh` bằng `Intl.DateTimeFormat('en-GB', {timeZone, weekday, hour, minute, hourCycle:'h23'})` có sẵn của Node, đúng cả khi server chạy UTC. **Không** dùng `dayjs` ở backend: `package.json` gốc không khai báo `dayjs`, các chỗ đang import chỉ chạy nhờ phụ thuộc bắc cầu. Cũng không thêm lib mới.

Env (đọc qua `ConfigService`, Chủ dự án thêm vào `.env` VPS ở P3):
- `CHATBOT_LLM_PROVIDER`: `fake` | `gemini`. Mặc định `fake` nếu không đặt.
- `CHATBOT_LLM_API_KEY`, `CHATBOT_LLM_MODEL`.
- Chỉ log "LLM key: configured / not configured".

## P0.5 Chat session cho khách (không dùng JWT)

1. `POST /public/chat/sessions` (`@Public()`):
   - `enabled=false` thì 503 `{code:'CHATBOT_DISABLED'}`.
   - Có thì sinh token `crypto.randomBytes(32).toString('base64url')`, lưu `sha256(token)`.
   - Tạo conversation `state='new'`, `public_code` 8 ký tự từ bảng `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; trùng thì sinh lại.
   - Trả `{session_token, conversation:{public_code, state}}`. Token chỉ trả một lần.
   - Body tuỳ chọn `{analytics_session_id}` (≤ 64 ký tự, `[A-Za-z0-9_-]`).
2. `ChatSessionGuard` (không đăng ký toàn cục; gắn bằng `@UseGuards(ChatSessionGuard)` ở method public cần session):
   - Đọc header `X-Chat-Session`, hash rồi tra DB. Thiếu, sai, revoked, hoặc `last_seen_at` cũ hơn 30 ngày thì 401 `{code:'CHAT_SESSION_INVALID'}`.
   - `enabled=false` thì 503.
   - Cập nhật `last_seen_at` tối đa 1 lần/phút.
   - Gắn `req.chatSession = {sessionId, conversationId}`. Service public **chỉ** lấy conversation từ đây. Không có tham số conversation nào từ client.
3. CORS: dùng whitelist hiện có trong `main.ts` (đã có `nemmamnon.com`). **Không sửa `main.ts`**. Nếu header `X-Chat-Session` bị chặn preflight thì ghi REPORT mục 4 để Claude/Chủ dự án quyết.

## P0.6 Rate limit

`ChatRateLimiter` (singleton trong module; Map + cửa sổ trượt; dọn key hết hạn mỗi 5 phút; giới hạn bộ nhớ 50.000 key):
- `consume(bucket, key, limit, windowMs)`. Vượt thì ném `HttpException(429, {code:'RATE_LIMITED', retry_after_s})`.
- Bucket và giới hạn lấy từ `config.limits`: `session:create` theo `ip_hash`, `msg` theo session **và** theo ip_hash, `submit`, `upload`.
- `LlmConcurrency`: semaphore `llm_concurrency`, chờ tối đa 10 s rồi ném `LlmUnavailableError`.
- IP: `req.ip` (trust proxy đã bật). `hashIp = sha256(ip + salt)`, salt sinh ngẫu nhiên lúc khởi động (không lưu). **Không** lưu IP thô vào DB hay log.

## P0.7 Adapter LLM (chưa nối hội thoại)

```ts
export interface LlmProvider {
  readonly name: 'gemini' | 'fake';
  generateJson<T>(req: { system: string; messages: {role:'user'|'model'; text:string}[];
    schemaName: string; jsonSchema: object; timeoutMs: number }): Promise<{
    data: T; model: string; latencyMs: number; usage?: {input?: number; output?: number} }>;
}
```

- `GeminiProvider`: REST `generativelanguage.googleapis.com` bằng `fetch`, `generationConfig.responseMimeType='application/json'` + `responseSchema`, `AbortController` timeout, retry 1 lần khi 429/5xx (backoff 1 s). Parse JSON lỗi thì ném `LlmInvalidOutputError`. Không log prompt, response hay key. Xem cách gọi ở `src/ai/ai.service.ts` L102-160 để tham khảo, **không import** từ đó.
- `FakeProvider`: deterministic. Chế độ đọc từ biến `CHATBOT_FAKE_MODE` (`ok` | `timeout` | `invalid_json` | `inject`). `ok` trả object hợp lệ tối thiểu theo schemaName; `inject` trả reply chứa "đã gửi" và "350.000đ" (dùng ở P3).
- Chọn provider bằng factory theo `CHATBOT_LLM_PROVIDER`. `gemini` mà thiếu key thì fallback `fake` + log cảnh báo (không crash).
- `LlmBudgetService.tryConsume()`: đếm theo ngày giờ VN trong `system_configs.CHATBOT_LLM_USAGE_YYYYMMDD` (UPSERT tăng nguyên tử bằng SQL). Vượt `llm.daily_call_budget` thì false.

## P0.8 Kho file riêng tư (service, chưa có route)

`ChatAttachmentService.store({conversationId, originalName, buffer})`:
1. `buffer.length` ≤ 10 MB, không thì `ATTACHMENT_TOO_LARGE`.
2. Magic bytes: PNG `89 50 4E 47 0D 0A 1A 0A`, JPEG `FF D8 FF`, PDF `25 50 44 46 2D`. Không khớp thì `ATTACHMENT_TYPE_NOT_ALLOWED`. Đuôi tên file khác loại thật thì `ATTACHMENT_TYPE_MISMATCH`.
3. PNG/JPEG: `sharp(buffer).rotate().resize({width:2560,height:2560,fit:'inside',withoutEnlargement:true})`, xuất lại cùng định dạng, **không** giữ metadata (EXIF/GPS mất). PDF: lưu nguyên.
4. Lưu `bytea`, `sha256`, `size_bytes`, `purge_at = now + retention_days.attachment`. Tên gốc được làm sạch (bỏ path, ≤ 200 ký tự).
5. `read(id)` trả buffer + mime, **chỉ** được gọi từ controller có kiểm quyền (P2/P4). Không có URL tĩnh, không ghi file ra đĩa.

## P0.9 Route P0 và matrix

| id | Method | Route | Tier matrix | Decorator | Mục đích |
|---|---|---|---|---|---|
| CB-001 | GET | `/api/public/chat/config` | PUBLIC | `@Public()` | `publicView()`; `enabled=false` vẫn trả 200 `{enabled:false}` |
| CB-002 | POST | `/api/public/chat/sessions` | PUBLIC | `@Public()` + rate limit | P0.5 |
| CB-003 | GET | `/api/public/chat/ping` | PUBLIC | `@Public()` + `ChatSessionGuard` + rate limit bucket `msg` | Trả `{ok:true, public_code}`; dùng để kiểm session/rate limit, giữ lại làm health cho widget |
| CB-004 | GET | `/api/chatbot/admin/config` | PERM `SYSTEM:view` | cặp `SYSTEM can_view` | Config đầy đủ (không có bí mật) |
| CB-005 | PUT | `/api/chatbot/admin/config` | PERM `SYSTEM:update` | cặp `SYSTEM can_update` | Lưu config |
| CB-006 | GET | `/api/chatbot/admin/status` | PERM `SYSTEM:view` | cặp `SYSTEM can_view` | `{llm_provider, llm_key_configured:boolean, llm_calls_today, seed_v1_at, schema_ok}` |

- Dòng matrix ghi theo đúng format hiện có: `id,method,route,source,handler,current,proposed_tier,proposed_perm,change,ops_risk,review,note`. Ví dụ `CB-004,GET,/api/chatbot/admin/config,src/chatbot/controllers/chatbot-admin-config.controller.ts:<dòng>,get,NEW,PERM,SYSTEM:view,NEW_CHATBOT_P0,THẤP,,Q-04 cặp RequirePermission+Perm`.
- Thêm route và dòng matrix **trong cùng commit**. `node scripts/check-rbac.js` và `node scripts/rbac/check-public-callers.js` phải exit 0.

## P0.10 Tab "Trợ lý AI website" trong Cấu hình hệ thống (Q-08)

`SystemSettingsPage.tsx`: thêm **một** item vào `Tabs`, đặt trước `api_keys`:
```tsx
{ key: 'chatbot', label: (<div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0'}}><RobotOutlined style={{fontSize:16}}/><span>Trợ lý AI website</span></div>),
  children: <div style={{ padding: '24px 32px' }}><ChatbotConfigTab /></div> }
```

`ChatbotConfigTab.tsx` (antd `Form`, gọi `utils/api`, không axios thô):

| Khối | Trường | Ghi chú UI |
|---|---|---|
| **Nhận diện** | `display_name`, `short_name`, `avatar_url`, `greeting` | Có **khung xem trước** bên phải: avatar tròn 56 px + tiêu đề `display_name` + nhãn "AI" + bong bóng lời chào đã thay `{short_name}`, cập nhật ngay khi gõ. Avatar: nút Tải ảnh dùng API upload ảnh **đang có** của ERP (ảnh avatar là ảnh công khai), hoặc nhập URL. Nút "Khôi phục mặc định" cho từng trường. Gợi ý dưới ô tên: "Tên hiển thị trên website, email thông báo và lời chào" |
| **Trạng thái** | `enabled` | Switch + Popconfirm "Bật trợ lý cho khách trên website?". P0 hiển thị cảnh báo vàng: "Widget website chưa được triển khai. Bật lúc này chỉ mở API." |
| **Liên hệ** | `hotline`, `zalo_url`, `email_public`, `messenger_url` | Placeholder hiện giá trị dự phòng từ cài đặt website ("Để trống = dùng 0983…") |
| **Giờ làm việc** | 7 dòng Thứ 2–CN: checkbox Nghỉ + TimePicker `from`/`to` (bước 15'); `holiday_note`; `response_sla_text` | Dòng tóm tắt "Hiện tại: đang trong giờ / ngoài giờ" lấy từ `/status` hoặc tính ở client theo giờ VN |
| **Thông báo** | `notify_emails` (Select tags), `notify_user_ids` (Select nhiều user từ `GET /users`), `limits.unassigned_alert_min` | Ghi chú: "Để trống người nhận trong ERP = gửi cho nhóm có quyền CHATBOT (cập nhật)" |
| **Nâng cao** (Collapse đóng) | `limits.*`, `retention_days.*`, `llm.daily_call_budget`, `llm.timeout_ms`; `features.*` chỉ đọc | Thẻ trạng thái: provider LLM, "Khoá LLM: đã/chưa cấu hình", số lượt gọi hôm nay (từ CB-006) |

- Tab chỉ hiện với người vào được `/system/settings` (đã gate `hasPerm('SYSTEM')`).
- Lỗi 400 thì hiển thị lỗi đúng trường. Lưu thành công thì `message.success`.
- **Không** có ô nhập API key. **Không** hiển thị giá trị key.
- Không sửa các tab khác, không đổi layout trang.

## P0.11 Script và QA

1. `scripts/chatbot/check-no-secrets.js`: quét `src/chatbot`, `frontend/src/components/system/ChatbotConfigTab.tsx`, `hula-web/website/src/components/chat` tìm `AIza[0-9A-Za-z_-]{20,}`, `sk-[A-Za-z0-9]{20,}`, email thật dạng `@gmail.com` trong code (không phải test fixture `@example.com`). Có kết quả thì exit 1.
2. `scripts/chatbot/check-no-hardcoded-name.js`: như P0.4.
3. Đưa 2 script vào `scripts/qa.js`.
4. `scripts/chatbot/smoke.js`:
   - Đăng nhập test-env bằng tài khoản test (mật khẩu `test-local`), chạy chuỗi CB0-*.
   - In HTTP status + body rút gọn. Token và key in dạng `***`.
   - Ghi `docs/chatbot/evidence/P0/smoke-<ngày>.txt`.
5. Unit test (`__tests__`): config merge/validate, working hours (có case server UTC), rate limiter, magic bytes, FakeProvider, GeminiProvider (mock `fetch`: 200, 429→200, timeout, JSON sai), budget.

## Không làm ở P0
- Không widget website, không trang chatbot riêng trong ERP (chỉ tab P0.10).
- Không gọi LLM trong hội thoại, không lưu tin nhắn khách (bảng có nhưng chưa có route ghi).
- Không route upload/tải file.
- Không sửa route `system/config` hay RBAC E7. Việc đó agent khác đang làm; gói chatbot tự an toàn nhờ P0.4 bước 1.

## Tự kiểm trước khi nộp
1. `pgenv.sh reset` → boot → boot lại: lần 2 không lỗi schema, seed không chạy lại (log + query).
2. `npm run qa` xanh, `cd frontend && npm run build` xanh.
3. Chạy `smoke.js`, điền **mọi** dòng `CB0-*` trong `ACCEPTANCE.csv`, mỗi dòng có evidence.
4. Ảnh chụp tab P0.10: đổi tên thành "Cừu Hula Test" → lưu → tải lại trang → `GET /api/public/chat/config` trả tên mới.
5. Log khởi động và log smoke không có token, key, IP thô, email.
6. REPORT_P0.md theo template, có bảng seed dry-run và mục "Lệch luật 3 theo Q-04".
