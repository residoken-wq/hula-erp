# P2 — Widget, hội thoại, gửi yêu cầu và hộp thư

**Điều kiện:** P1 AUDIT_PASS, đã chốt Q-03, Q-06, Q-08 (phần code), Q-13. Nhánh `chatbot/p2`.
**Sau deploy:** cờ vẫn tắt, khách không thấy gì. Bật cờ ở test-env/staging để nghiệm thu.
**Bot ở P2 chưa dùng LLM thật:** dùng `FakeProvider` + kịch bản nút bấm. Mục tiêu là luồng dữ liệu, UI và bàn giao chạy đúng; P3 thay phần "trí tuệ".

---

## P2.1 API public (tất cả `@Public()` + `ChatSessionGuard` + rate limit, trừ config/sessions)
| Method | Route | Việc |
|---|---|---|
| GET | `/public/chat/config` | `publicView()` |
| POST | `/public/chat/sessions` | P0.4 |
| GET | `/public/chat/conversation?after=<message_id>` | Tin mới sau cursor, `state`, `human_active`, brief hiện tại (revision), request/ticket đã tạo (code + trạng thái hiển thị) |
| POST | `/public/chat/messages` | `{client_msg_id (uuid), text}`. Trùng `client_msg_id` thì trả lại **đúng** kết quả cũ, không tạo tin mới. P2: phản hồi từ `ScriptedResponder` (P2.3) |
| POST | `/public/chat/actions` | `{client_msg_id, action, value}` cho nút nhanh: `start:parent\|school\|sample\|support`, `human`, `edit_brief` |
| PUT | `/public/chat/brief` | `{base_revision, patch}`. `base_revision` cũ hơn hiện tại → 409 kèm brief mới. Tạo revision mới, dự toán cũ `stale` |
| POST | `/public/chat/requests` | `{idempotency_key (uuid), type, brief_revision, contact:{name?, phone?, email?, zalo?, preferred_channel}, consent:{contact:true, marketing:boolean, notice_version}}` |

Quy tắc `POST /public/chat/requests`:
1. Validate: `brief_revision` phải là revision **hiện tại**, khác thì 409. Tối thiểu có hạng mục + số lượng dự kiến (với `quote`) và **một** kênh liên hệ. Email chỉ bắt buộc khi `preferred_channel='email'`. `consent.contact` phải `true`.
2. **Một transaction:** insert consent → (Q-06) tìm hoặc tạo LEAD → insert `chatbot_requests` (code từ sequence `YC-YYMMDD-NNNN`) → insert outbox `request.created` → cập nhật state `submitted` → audit.
3. Trùng `idempotency_key` thì trả lại request cũ, cùng code, HTTP 200 (T25).
4. DB lỗi thì rollback, trả 500 `{code:'SUBMIT_FAILED'}`, state `submission_failed`. Widget hiện "Chưa gửi được, thử lại" và **không** hiện mã (T26).
5. Thành công: trả `{code, status:'received'}`. Câu hiển thị: "Dạ em đã tiếp nhận yêu cầu **{code}**…". **Không** nói nhân viên đã nhận/đã đọc (T27).

LEAD (Q-06):
- Chuẩn hoá SĐT (bỏ khoảng trắng, `+84`→`0`). Tìm `customers` theo SĐT đã chuẩn hoá. Có thì gắn `customer_id` và thêm `history` `{action:'CHATBOT_REQUEST', code}`.
- Không có thì tạo `type='LEAD'`, `lead_status='NEW'`, `lead_source='CHATBOT'`, `history` `CREATED_FROM_CHATBOT`. Mã khách: dùng lại hàm sinh mã LEAD có sẵn nếu an toàn khi chạy đồng thời; nếu hàm đó là `count+1` thì bọc retry khi gặp unique violation (tối đa 3 lần). **Không** sửa `public.controller.ts`.
- **Không** trả thông tin khách cũ về widget. Widget không được biết SĐT đã tồn tại hay chưa.
- **Để sales follow-up trong CRM** (Chủ dự án chốt 2026-09-26):
  - Map các trường giống `POST /public/leads`: `contact_person`, `company_name` (tên trường/đơn vị nếu khách nêu), `phone`, `email`, `expected_quantity`.
  - `notes` = tóm tắt brief (hạng mục, số lượng, màu/logo, tỉnh, hạn mong muốn, kênh liên hệ ưu tiên) + mã `YC-…`.
  - Thêm một mục `history` có `request_code` và `conversation_public_code`, để từ màn khách hàng/lead trong ERP biết mở hội thoại nào.
  - Không đổi `assigned_to_id`, pipeline hay logic CRM hiện có. Lead nằm trong danh sách lead CRM như lead từ form liên hệ.
  - Màn `/chatbot/requests` có link sang lead/khách hàng tương ứng trong ERP.

## P2.2 Outbox và thông báo
- `@Cron('*/1 * * * *')` trong `ChatbotOutboxService`. Lấy tối đa 20 dòng `pending` có `next_attempt_at<=now` bằng `FOR UPDATE SKIP LOCKED`.
- `request.created` / `ticket.created` / `human.requested`:
  - `NotificationsService.create` cho từng user trong `notify_user_ids`. Nếu danh sách rỗng thì gửi cho mọi user thuộc nhóm có `CHATBOT` can_update.
  - `EmailService.sendMail` tới **mọi** địa chỉ trong `CHATBOT_CONFIG.notify_emails`, theo template ở dưới.
  - Địa chỉ nhận do Chủ dự án chốt (STATUS Q-08) và được **nhập qua `/chatbot/settings`** khi cấu hình. **Không** hard-code trong code, seed hay test (code sync sang repo public). Test-env dùng địa chỉ test; SMTP ở test-env đã bị sanitize xoá, nên kiểm bằng cách render template ra file evidence.
- **Email template** (`src/chatbot/templates/request-created.html` + bản text), tiếng Việt, HTML đơn giản, **escape** mọi giá trị khách nhập:
  - Subject: `[Cừu Hula] Yêu cầu mới {code} — {loại} — {hạng mục} x {số lượng}` (thiếu thì ghi "chưa xác định")
  - Thân email:
    - mã yêu cầu, thời điểm (giờ VN), loại (báo giá/mẫu/mua/đổi thiết kế), phân khúc;
    - tóm tắt brief theo từng dòng; hạn khách mong muốn (ghi rõ "khách mong muốn", không phải cam kết);
    - người liên hệ + SĐT/Zalo/email + kênh ưu tiên (Chủ dự án chọn gửi email để sales gọi lại, nên được chứa liên hệ);
    - lý do chuyển / câu hỏi còn treo;
    - 2 link: `/chatbot/requests/{id}` và lead trong CRM ERP;
    - dòng cuối: "Email tự động — vui lòng nhận xử lý trong ERP để khách không phải chờ".
  - Không đính kèm file của khách. Không chép toàn bộ hội thoại.
  - `ticket.created` và `human.requested` dùng template tương tự, subject `[Cừu Hula] Ticket {code} — {category}` / `[Cừu Hula] Khách cần gặp nhân viên — {public_code}`.
  - Base URL của link lấy từ env `ERP_PUBLIC_URL` nếu có, mặc định `https://erp.nemmamnon.com`.
- Lỗi thì `attempts+1`, backoff `1,2,5,10,30,60,120,240` phút, sau 8 lần thì `failed` và hiện cảnh báo trên hộp thư.
- Cảnh báo "request chưa có owner" sau `limits.unassigned_alert_min` (mặc định 30) trong giờ làm việc.

## P2.3 ScriptedResponder (chỉ P2, P3 thay bằng pipeline LLM)
- Nút nhanh mở luồng tương ứng SPEC §6.3/§6.4/§6.5/§6.6. Mỗi lượt hỏi **1–2** slot còn thiếu theo thứ tự SPEC §6.4.
- Slot lấy từ nút/chip và ô nhập có cấu trúc (số lượng, tỉnh). Text tự do thì gửi qua `FakeProvider` để trích slot.
- Đủ tối thiểu thì hiện **thẻ tóm tắt** (P2.5). Khách muốn gặp người (nút hoặc từ khoá) thì `request_human`.
- Câu chữ lấy từ knowledge `script.*`. Chưa có bản `published` thì dùng câu mặc định trong code, chép nguyên SPEC §6.7.

## P2.4 Nhân viên nhận chat
- `human_active=true` khi nhân viên bấm "Nhận xử lý": ghi `assigned_user_id`, audit, tin hệ thống "Nhân viên HULA đang hỗ trợ anh/chị". Từ lúc đó mọi tin khách chỉ được lưu, AI không trả lời.
- "Trả lại cho AI" thì `human_active=false`, có tin hệ thống.
- Ranh giới T35: trong transaction lưu tin AI, đọc lại `human_active` bằng `FOR UPDATE`. Nếu đã `true` thì huỷ tin AI và log `ai_reply_dropped_takeover`.

## P2.5 Widget website (`hula-web/website/src/components/chat/`)
**Mount:** `ChatWidget` trong `LayoutWrapper.tsx`. Gọi `GET /public/chat/config`, `enabled=false` thì **không render gì** và không tải thêm JS (dynamic import panel).

**Vị trí (Q-03, theo phương án đã chốt):**
- Launcher 56 px dùng ảnh cừu, `aria-label="Mở trợ lý AI Cừu Hula"`.
- Mở panel thì ẩn `FloatingActionWidgets` và bong bóng Zalo: thêm class `body.chat-open`, CSS ẩn `.zalo-chat-widget` và cột nút (sửa `globals.css` cạnh rule `tour-360-active` L388-399).
- Ẩn launcher khi: `body.tour-360-active`, route `/checkout`, CartDrawer đang mở.
- z-index: panel `z-[90]` (trên Header z-50 và drawer, dưới modal z-[100]).

**Avatar:** `scripts/chatbot/build-avatar.js` dùng `sharp` sinh `public/images/chatbot/cuu-hula-96.webp`, `-192.webp`, `-512.png` từ `docs/chatbot/source/cuu-hula-avatar.png`. Không chỉnh nhận diện ảnh. `avatar_url` trong config cho phép thay ảnh.

**Panel:**
- Desktop rộng `min(400px, 100vw-32px)`, cao `min(640px, 100dvh-120px)`. Mobile (<768px) toàn màn hình, dùng `100dvh`, `env(safe-area-inset-*)`. Composer dính đáy, xử lý bàn phím bằng `visualViewport` để tin cuối không bị che.
- Đầu panel: avatar, tên, nhãn **"AI"**, nút "Gặp nhân viên", thu nhỏ, đóng. Không có chấm "online".
- Bốn nút bắt đầu: "Chọn cho bé", "Đặt cho trường", "Xem mẫu", "Hỗ trợ đơn hàng". Ô nhập tự do luôn có.
- Tin nhắn render **text thuần** (`white-space: pre-wrap`). Cards render từ payload có cấu trúc: `product`, `compare` (mobile xem lần lượt), `summary` (sửa từng trường, nút "Gửi yêu cầu"), `contact_form` (checkbox đồng ý liên hệ **không** tick sẵn; checkbox marketing tách riêng, không bắt buộc), `status` (mã thật).
- Trạng thái: đang trả lời (typing), đang gửi, đã tiếp nhận + mã, đang chờ nhân viên, lỗi + nút thử lại. API lỗi hoặc 503/timeout thì hiện **form tiếp nhận dự phòng** + kênh liên hệ từ config (T37).
- Polling `GET /public/chat/conversation`: 4 s khi `human_active` hoặc đang chờ, 15 s khi panel mở và rảnh, dừng khi panel đóng hoặc tab ẩn.
- Lưu `session_token` trong `localStorage.hula_chat_session` (try/catch; lỗi thì chạy trong RAM). Mỗi tab dùng chung một session là chấp nhận được. Hai trình duyệt/thiết bị khác nhau không bao giờ dùng chung (T38).
- Truy cập: bẫy focus khi panel mở, `Esc` đóng, trả focus về launcher, `prefers-reduced-motion` tắt animation, tương phản AA.
- **Không** gửi nội dung chat vào GA4/Meta Pixel. Chỉ được bắn event không PII: `chat_open`, `chat_request_submitted`.

## P2.6 Hộp thư ERP (`frontend/src/pages/chatbot/`)
| Route | Nội dung | Quyền |
|---|---|---|
| `/chatbot/inbox` | Danh sách hội thoại (lọc state/intent/chưa owner/human_active), khung chat, brief + lịch sử revision, nút Nhận xử lý / Trả lại AI / Gửi tin thủ công, tạo request thay khách | `hasPerm('CHATBOT')` |
| `/chatbot/requests` | Bảng yêu cầu: phân công, trạng thái (`received → assigned → quoted/contacted → closed/cancelled`), ghi chú nội bộ, `promised_due_at` chỉ nhân viên nhập, lịch sử | `hasPerm('CHATBOT')` |

- Backend `chatbot/admin/conversations|requests` theo mẫu P0.8. Tin nhân viên gửi: `role='staff'`, lưu `sender_user_id`, widget hiển thị "Nhân viên HULA" (không hiển thị tên thật trừ khi cấu hình cho phép).
- Hiển thị SĐT/email khách chỉ trong khung chi tiết. Mỗi lần xem chi tiết ghi audit `view_contact`.

## Không làm ở P2
- Không gọi LLM thật. Không dự toán giá trên widget (`features.price_estimate=false`).
- Không upload file (P4). Không tra đơn.

## Tự kiểm
- Ảnh chụp widget 360×740, 390×844, 768×1024, 1366×768: đóng/mở, bàn phím mở (mobile), câu dài 2000 ký tự, ảnh sản phẩm lỗi, mất mạng, xoay ngang, phóng chữ 200%.
- Gửi request 2 lần cùng key → 1 bản ghi, 1 outbox (query DB làm evidence).
- Tắt DB giữa chừng hoặc ép lỗi → widget không hiện mã.
