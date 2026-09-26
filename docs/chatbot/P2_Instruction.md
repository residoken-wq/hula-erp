# P2 — Hội thoại, gửi yêu cầu, LEAD + email, hộp thư ERP, widget website

**Điều kiện:** P1 AUDIT_PASS. Đã chốt:
- **Q-03 (2026-09-26):** nút **"Tư vấn ngay"** trên header website mở chatbot (có animation). Sau **5 giây** tự hiện cửa sổ tư vấn.
- **Hộp thư và yêu cầu:** đặt trong **ERP** (Chủ dự án chốt 2026-09-26).
- **Q-06:** tạo LEAD trong CRM.
- **Q-08:** email template, cấu hình trong Cấu hình hệ thống.

**Nhánh:** `chatbot/p2`, Claude tạo từ nhánh P1 đã pass, kèm `scripts/chatbot/accept-p2.js` (hợp đồng, **không sửa**). Quy trình nhanh theo `00_START-HERE.md`.
**Sau deploy:** cờ `enabled` vẫn tắt nên khách không thấy gì. Khi tắt cờ, nút "Tư vấn ngay" vẫn là link `/lien-he` như cũ.
**Bot ở P2 là bot kịch bản** (không gọi LLM). P3 thay phần trả lời bằng AI.

---

## P2.1 Bảng + cấu hình bổ sung

1. Không thêm bảng mới. Dùng các bảng P0: `chatbot_messages`, `chatbot_briefs`, `chatbot_consents`, `chatbot_requests`, `chatbot_outbox`, `chatbot_audit_events`. Thêm cột (DDL `ADD COLUMN IF NOT EXISTS`):
   - `chatbot_outbox.channel varchar(12)` (`inapp` | `email`)
   - `chatbot_outbox.ref_id varchar(64)` (id request/conversation)
   - `chatbot_requests.summary text`
2. `CHATBOT_CONFIG` thêm khối `widget` (defaults trong `chatbot.defaults.ts`, validator dùng chung khi đọc và ghi, tab Cấu hình hệ thống thêm khối **"Nút & tự mở"**, `publicView()` trả thêm `widget`):
   ```ts
   widget: { cta_label: 'Tư vấn ngay', auto_open: true, auto_open_delay_s: 5, auto_open_mobile: 'teaser', snooze_hours: 24 }
   ```
   - `cta_label`: 2–30 ký tự, không có `<>{}`.
   - `auto_open_delay_s`: 3–60.
   - `auto_open_mobile`: `teaser` | `panel` | `off`.
   - `snooze_hours`: 1–168.

## P2.2 API công khai (`@Public()` + `ChatSessionGuard` + rate limit theo P0.6)

| id | Method | Route | Body / query | Trả về |
|---|---|---|---|---|
| CB-201 | GET | `/api/public/chat/conversation` | `?after=<message_id>` | `{conversation:{public_code,state,intent,segment,human_active}, messages:[Msg], brief:{revision,data}\|null, requests:[{code,type,status}], poll_ms}` |
| CB-202 | POST | `/api/public/chat/messages` | `{client_msg_id:uuid, text}` | `{message:Msg, replies:[Msg], conversation:{state,human_active}}` |
| CB-203 | POST | `/api/public/chat/actions` | `{client_msg_id:uuid, action:'start'\|'human'\|'set_slot', value}` | giống CB-202 |
| CB-204 | PUT | `/api/public/chat/brief` | `{base_revision:int, patch:{…}}` | `{brief:{revision,data}}`, hoặc 409 `{code:'BRIEF_STALE', brief}` |
| CB-205 | POST | `/api/public/chat/requests` | xem P2.4 | 201 `{code, status:'received'}`; trùng key → 200 cùng `code` |

- `Msg = {id, role:'customer'|'ai'|'staff'|'system', text, payload|null, created_at, sender_label}`.
  - `sender_label`: `ai` = `short_name` từ config; `staff` = **"Nhân viên HULA"**, **không** trả tên thật, **không** trả `sender_user_id`.
- `poll_ms`: 4000 khi `human_active` hoặc đang chờ sales, còn lại 15000.
- **Idempotent:** trùng `(conversation, client_msg_id)` thì trả **đúng** response lần đầu, cùng các id, không tạo tin mới. `text` dài hơn `limits.max_message_chars` → 400 `MESSAGE_TOO_LONG`. `text` rỗng → 400.
- `patch` của brief chỉ nhận các key: `segment` (`parent|school|business|after_sale`), `items` (mảng string), `quantity` (int 1–100000), `colors`, `logo`, `surface`, `care`, `storage`, `budget`, `region`, `need_by` (YYYY-MM-DD), `school_name`, `notes` (≤ 1000). Key lạ → 400. Mỗi lần đổi tạo revision mới (append-only).
- `action set_slot` có `value:{key, value}`, dùng cùng whitelist và cùng validate như `patch`.
- Chưa có brief thì revision hiện tại = 0 (`base_revision: 0` hợp lệ cho lần PUT đầu).
- Conversation lấy **chỉ** từ session. Không route nào nhận `conversation_id` từ client.
- **Không trả** `internal_note`, `owner_user_id`, `customer_id`, `contact` của request ra phía khách.

## P2.3 Bot kịch bản (`ScriptedResponder`, không LLM)

- `action start` với `value`:
  - `parent` / `school` / `sample` / `support` thì đặt `segment` (`sample` → `school`, `support` → `after_sale`) và `intent` tương ứng.
  - Bot trả **1 tin** hỏi **tối đa 2** thông tin còn thiếu theo thứ tự SPEC §6.4 / §6.3.
  - Câu chữ lấy từ knowledge `script.*` đang `published`; nếu không có thì dùng câu mặc định chép SPEC §6.7.
- **Trích slot từ text** (regex, không LLM):
  - `(\d{1,6})\s*(bộ|cái|chiếc|set|bé)` → `quantity`
  - `màu\s+([\p{L} ]{2,20})` → `colors`
  - `mầm non|mẫu giáo|lớp|trường` → `segment=school`
  - `cho bé|con tôi|con mình` → `segment=parent`

  Có slot mới thì tạo brief revision mới. Bot **không hỏi lại** slot đã có.
- **Muốn gặp người:** `action human`, hoặc text khớp `/nhân viên|gặp người|người thật|tư vấn viên|sales/i`. Khi đó:
  - state → `waiting_sales`;
  - outbox `human.requested` (kênh `inapp`, thêm `email` nếu có `notify_emails`);
  - bot trả 1 tin: "Dạ em đã chuyển để nhân viên HULA hỗ trợ…". Ngoài giờ làm việc thêm câu giờ làm việc lấy từ config. **Không** hứa thời gian cụ thể nếu `response_sla_text` rỗng.
- Brief đủ tối thiểu (`items` khác rỗng hoặc `segment=school`, **và** có `quantity`) thì bot trả thêm `payload:{type:'summary', brief_revision, fields:{…}}` để widget hiện thẻ tóm tắt, và state → `request_review`.
- **`human_active=true` thì không có reply của bot** (`replies: []`), tin khách vẫn lưu, `unread_staff+1`.
- **Ranh giới T35:**
  - Responder chạy xong mới lưu reply, trong transaction `SELECT … FOR UPDATE` trên conversation.
  - Nếu lúc đó `human_active=true` thì **bỏ** reply, log `ai_reply_dropped_takeover`, trả `replies: []`.
- **Hook test** (chỉ khi env `CHATBOT_TEST_HOOKS='true'`, **không bao giờ** đặt trên VPS): text chứa `[[delay:NNNN]]` (tối đa 10000) làm responder chờ NNNN ms trước khi lưu reply.
- Mọi text bot trả **không** chứa số tiền, và không chứa "đã gửi", "đã nhận tiền", "đã giao".

## P2.4 Gửi yêu cầu (`POST /api/public/chat/requests`)

Body: `{idempotency_key:uuid, type:'quote'|'sample'|'purchase', brief_revision:int, contact:{name?, phone?, email?, zalo?, preferred_channel:'phone'|'zalo'|'email'}, consent:{contact:boolean, marketing:boolean, notice_version:string}}`

1. **Kiểm tra theo thứ tự:**
   1. Trùng `idempotency_key` → trả request cũ (200, cùng `code`).
   2. `consent.contact !== true` → 400 `CONSENT_REQUIRED`.
   3. Không có kênh nào (phone/zalo/email), hoặc `preferred_channel` trỏ vào kênh bị bỏ trống → 400 `CONTACT_REQUIRED`.
   4. `phone` có mà không phải SĐT VN (sau chuẩn hoá: `0` + 9 số) → 400 `PHONE_INVALID`.
   5. `brief_revision` khác revision hiện tại → 409 `BRIEF_STALE`.
   6. `type='quote'` mà brief thiếu `quantity`, hoặc (`items` rỗng và `segment≠school`) → 400 `BRIEF_INCOMPLETE`.
2. **Một transaction:**
   1. consent (`contact`; `marketing` thành dòng riêng nếu true);
   2. `code = 'YC-' + YYMMDD(giờ VN) + '-' + lpad(nextval(chatbot_request_seq),4,'0')`;
   3. `chatbot_requests` (`summary` = tóm tắt brief 1 dòng);
   4. LEAD (P2.5);
   5. outbox `request.created`: 1 dòng `channel='inapp'`, thêm 1 dòng `channel='email'` nếu `notify_emails` không rỗng;
   6. state → `submitted`;
   7. tin `system`: "Dạ em đã tiếp nhận yêu cầu {code}. Nhân viên HULA sẽ liên hệ qua {kênh} trong giờ làm việc." (**không** nói "nhân viên đã nhận");
   8. audit `request.create`.
3. **Hook test** (`CHATBOT_TEST_HOOKS='true'`): `contact.name === '[[fail:db]]'` thì ném lỗi **sau** khi đã insert request, trong transaction. Kết quả phải là 500 `{code:'SUBMIT_FAILED'}` và **không còn** request / LEAD / outbox / consent nào của key đó (rollback). Sau rollback mới ghi state `submission_failed`.

## P2.5 LEAD trong CRM (Q-06)

- Chuẩn hoá SĐT: bỏ khoảng trắng, dấu chấm, gạch; `+84`/`84` đầu → `0`.
- Tìm `customers` có `phone` chuẩn hoá bằng (chuẩn hoá cột trong câu SQL, **không** sửa dữ liệu cũ).
  - **Có:** gắn `customer_id`, append `history {action:'CHATBOT_REQUEST', timestamp, data:{request_code, conversation_public_code, summary}}`.
  - **Không có:** tạo mới:
    - `code = 'LEAD-' + request_code` (duy nhất, không dùng `count+1`);
    - `name` = `school_name` trong brief, không có thì `contact.name`, không có nữa thì `'Khách chat ' + public_code`;
    - `type='LEAD'`, `lead_status='NEW'`, `lead_source='CHATBOT'`, `phone` (đã chuẩn hoá), `email`;
    - `history [{action:'CREATED_FROM_CHATBOT', timestamp, data:{request_code, conversation_public_code, contact_person, summary, preferred_channel}}]`.
- Không đổi `assigned_to_id`, `lead_status` của khách cũ. **Không** sửa `public.controller.ts`.
- Widget **không** được biết SĐT đã tồn tại hay chưa: response giống hệt nhau.

## P2.6 Outbox + thông báo

- `@Cron('*/1 * * * *')` gọi `ChatbotOutboxService.run()`: lấy tối đa 20 dòng `status='pending' AND next_attempt_at<=now()` bằng `FOR UPDATE SKIP LOCKED`, xử lý theo `channel`:
  - `inapp`: `NotificationsService.create` cho từng user trong `notify_user_ids`. Danh sách rỗng thì gửi cho mọi user active thuộc nhóm có `CHATBOT.can_update`. `link='/chatbot/requests/<id>'` hoặc `'/chatbot/inbox/<conversation_id>'`. Thành công → `status='sent'`.
  - `email`: `EmailService.sendMail(to, subject, html)` theo template (subject `[{short_name}] Yêu cầu mới {code} — {loại} — {hạng mục} x {số lượng}`; thân email như P2.2 bản cũ: tóm tắt, liên hệ, hạn **khách mong muốn**, 2 link ERP theo env `ERP_PUBLIC_URL`, mặc định `https://erp.nemmamnon.com`). Mọi giá trị khách nhập được escape.
- `sendMail` trả `false` hoặc ném lỗi → `attempts+1`, `last_error` (≤ 300 ký tự, **không** chứa địa chỉ email), `next_attempt_at` theo backoff `1,2,5,10,30,60,120,240` phút. Sau 8 lần → `failed`.
- `POST /api/chatbot/admin/inbox/outbox/run` gọi cùng `run()` (dùng cho nút "Gửi lại" trên ERP và cho script test).

## P2.7 API hộp thư ERP (prefix `/api/chatbot/admin/inbox`, cặp quyền `CHATBOT` như P0)

| id | Method | Route | Quyền | Việc |
|---|---|---|---|---|
| CB-210 | GET | `/conversations?state=&unassigned=&human_active=&q=&page=&limit=` | view | `{items:[{id,public_code,state,intent,segment,human_active,assigned_user_id,unread_staff,last_message_at,request_codes}], total}`. `q` tìm theo `public_code` hoặc mã YC |
| CB-211 | GET | `/conversations/:id` | view | `{conversation, messages (đủ, có sender_user_id), briefs:[{revision,data,changed_by,created_at}], requests:[… đủ trường, có contact]}`. Ghi audit `view_contact` |
| CB-212 | POST | `/conversations/:id/take` | update | `human_active=true`, `assigned_user_id=me`, `unread_staff=0`, tin system "Nhân viên HULA đang hỗ trợ anh/chị", audit |
| CB-213 | POST | `/conversations/:id/release` | update | `human_active=false`, tin system, audit |
| CB-214 | POST | `/conversations/:id/messages` | update | `{text}` → tin `staff` (`sender_user_id=me`). Chưa `take` → 409 `NOT_TAKEN` |
| CB-215 | GET | `/requests?status=&owner=&q=&page=&limit=` | view | `{items:[{id,code,type,status,owner_user_id,customer_id,summary,created_at}], total}` |
| CB-216 | GET | `/requests/:id` | view | đủ trường + `customer:{id,code,name}` + `conversation_id` |
| CB-217 | PUT | `/requests/:id` | update | `{status?, owner_user_id?, internal_note?, promised_due_at?}`. Status chỉ đi tới theo `received→assigned→contacted→quoted→closed`; `cancelled` từ mọi trạng thái; đi lùi → 400 `INVALID_TRANSITION`. Audit |
| CB-218 | GET | `/outbox?status=` | view | `{items:[{id,event,channel,status,attempts,last_error,created_at}], failed_count}` |
| CB-219 | POST | `/outbox/run` | update | `{processed, sent, failed}` (P2.6) |

Mọi route vào `route-matrix.csv` (CB-201..205, CB-210..219) trong cùng commit.

## P2.8 Hộp thư ERP (`frontend/src/pages/chatbot/`, menu "Trợ lý AI" gate `hasPerm('CHATBOT')`, menu và `<Route>` cùng điều kiện)

- `/chatbot/inbox`:
  - Cột trái: danh sách hội thoại, lọc theo trạng thái, chưa có người nhận, đang do người xử lý, tìm mã. Badge `unread_staff`. Cảnh báo đỏ khi `failed_count>0`.
  - Giữa: khung chat, text thuần. Tin khách, bot, nhân viên, hệ thống có màu khác nhau.
  - Phải: brief hiện tại + lịch sử revision, yêu cầu đã tạo, nút **Nhận xử lý / Trả lại bot**, ô gửi tin khi đã nhận.
  - Polling 5 giây khi tab đang mở.
- `/chatbot/requests`: bảng yêu cầu, Drawer chi tiết (liên hệ, tóm tắt, link lead CRM theo route khách hàng ERP đang có, link hội thoại), đổi trạng thái, người phụ trách (chọn user), ghi chú nội bộ, ngày hẹn.
- Link trong thông báo in-app mở đúng trang.

## P2.9 Widget website (`hula-web/website/src/components/chat/`)

**Nút "Tư vấn ngay" (Q-03):**
- `Header.tsx`: nút desktop (hiện là `<Link href="/lien-he">` L176-182) và nút trong menu mobile (L260-270):
  - `enabled=true`: thành `<button>` mở chat. Nhãn = `widget.cta_label`. Thêm icon avatar cừu 20 px bên trái và **animation**: vòng sáng lan (pulse ring) + avatar lắc nhẹ mỗi 4 giây. Tắt animation khi `prefers-reduced-motion`.
  - `enabled=false` hoặc lỗi API: giữ nguyên `<Link href="/lien-he">` như hiện tại.
- Vì nút desktop bị ẩn dưới 640 px, **trên mobile** thêm nút cừu tròn 56 px ở **vị trí dưới cùng** của cột `FloatingActionWidgets` (cùng animation), để khách mở lại chat sau khi đóng. Chỉ hiện khi `enabled=true` và màn hình < 640 px.
- Trạng thái chat mở/đóng chia sẻ qua React context `ChatWidgetContext`, đặt trong `LayoutWrapper`.

**Tự mở sau 5 giây:**
- Chỉ khi `widget.auto_open=true` và đủ các điều kiện:
  - chưa tự mở trong phiên này (`sessionStorage.hula_chat_autoopened`);
  - khách chưa đóng chat trong `snooze_hours` giờ qua (`localStorage.hula_chat_snooze_until`);
  - không ở `/checkout`, `/lien-he`, `/dat-hang-si`, `/beta-login`;
  - không có `body.tour-360-active`, CartDrawer không mở, không có modal nào đang mở;
  - tab đang hiển thị (`document.visibilityState`).
- Desktop: mở panel.
- Mobile (<768 px) theo `auto_open_mobile`:
  - `teaser` (mặc định): một **thẻ nhỏ** phía trên cột nút nổi (avatar, lời chào 1–2 dòng, 4 nút bắt đầu, nút ×). **Không** che quá 35% chiều cao màn hình. Chạm vào thì mở panel.
  - `panel`: mở full.
  - `off`: không tự mở.
- Khách đóng panel/teaser → ghi `snooze_until = now + snooze_hours`.
- Gửi event GA `chat_auto_open` (không có PII).
- Lý do có `teaser` trên mobile: panel full-screen tự bật sẽ che nội dung và dễ làm khách thoát trang (SPEC §7). Chủ dự án có thể đổi sang `panel` trong Cấu hình hệ thống.

**Panel:**
- Kích thước: desktop 400 px (tối đa `100vw-32px`); mobile toàn màn hình, dùng `100dvh`, safe-area, `visualViewport` để bàn phím không che tin cuối.
- Bố cục: header có avatar, `display_name`, nhãn "AI", nút "Gặp nhân viên", nút đóng; 4 nút bắt đầu; tin nhắn text thuần (`white-space: pre-wrap`, cấm `dangerouslySetInnerHTML`); thẻ tóm tắt sửa từng trường và nút "Gửi yêu cầu".
- Form liên hệ: checkbox đồng ý liên hệ **không tick sẵn**, marketing tách riêng và không bắt buộc.
- Trạng thái: đang gửi, đã tiếp nhận kèm mã thật, lỗi kèm thử lại. Form dự phòng + kênh liên hệ khi 503/timeout.
- Kỹ thuật:
  - polling theo `poll_ms`, dừng khi panel đóng hoặc tab ẩn;
  - `localStorage.hula_chat_session` (try/catch);
  - mở panel thì ẩn cột nút nổi và bong bóng Zalo (`body.chat-open`, sửa `globals.css` cạnh rule `tour-360-active`);
  - z-index `z-[90]`;
  - tắt khi Tour360.
- Nội dung: không chép nội dung chat sang GA/Pixel; không có chữ "Cừu Hula" cứng (tên lấy từ config).
- Avatar: `scripts/chatbot/build-avatar.js` dùng `sharp` sinh `public/images/chatbot/cuu-hula-{96,192}.webp` từ `docs/chatbot/source/cuu-hula-avatar.png`.
- Tính năng chưa bật: **chưa** upload file, **chưa** hiện giá.

## P2.10 Chạy nghiệm thu

```bash
bash docs/rbac_v2/test-env/pgenv.sh reset && npx nest build
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=hula_user DB_PASSWORD=hula_password DB_DATABASE=hula_db \
  PORT=3999 NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true CHATBOT_TEST_HOOKS=true node dist/main.js &
node scripts/chatbot/accept-p2.js > docs/chatbot/evidence/P2/accept-p2.txt
npm run qa   # tắt backend sau khi xong
```

**Ảnh evidence (6):**
1. Header desktop: nút "Tư vấn ngay" có avatar.
2. Panel desktop tự mở sau 5 giây.
3. Teaser trên mobile ở 390×844.
4. Panel mobile khi mở bàn phím.
5. Hộp thư ERP đang ở trạng thái đã nhận xử lý.
6. Drawer yêu cầu có link lead.

## Không làm ở P2
- Không LLM, không dự toán giá, không upload, không tra đơn.
- Không sửa `public.controller.ts`, `src/ai/**`.
- Không đổi luồng `/lien-he` khi cờ tắt.
