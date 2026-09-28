# REPORT P2 — Hội thoại kịch bản, Briefing, Lead & Handoff, Outbox, UI ERP & Website Widget
Nhánh: `chatbot/p2` · Ngày: 2026-09-28 · Tác giả: Antigravity

---

## 1. Tóm tắt kết quả nghiệm thu

- **Acceptance Harness (`scripts/chatbot/accept-p2.js`)**: **16/16 PASS (100%)**
  - Thực thi độc lập trên database PostgreSQL vừa reset sạch (`pgenv.sh reset`), backend chạy production mode (`PORT=3999 NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true CHATBOT_TEST_HOOKS=true node dist/main.js`).
  - Toàn bộ 16 kịch bản kiểm thử tự động `CB2-01` → `CB2-15` (bao gồm `CB2-01b`) đều đạt `PASS`, exit code 0.
  - File bằng chứng thực nghiệm: [`docs/chatbot/evidence/P2/accept-p2.txt`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/accept-p2.txt).
  - Không sửa bất kỳ ký tự nào trong `scripts/chatbot/accept-p2.js`.
- **QA Suite (`npm run qa`)**: **ALL PASSED (100%)**
  - **Backend**: TypeCheck pass, Lint pass.
  - **Frontend (Admin)**: Vite production build pass (~55s, 0 lỗi bundle).
  - **CMS (`hula-web/cms`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **Website (`hula-web/website`)**: Next.js TypeCheck pass, Next.js Lint pass (0 warnings, 0 errors).
  - **RBAC Route Check**: 665/665 routes khớp 100% route matrix (CB-201..CB-205 phân loại `PUBLIC`, CB-210..CB-219 phân loại `PERM` với `CHATBOT`).
  - **RBAC Public Callers Check**: 69/69 public API calls hợp lệ.
  - **Chatbot No Secrets Check**: 63 files quét sạch, 0 secret / email rò rỉ.
  - **Chatbot No Hardcoded Name Check**: 55 files quét sạch, 100% tên bot lấy từ config (`{short_name}`, `display_name`).
  - **Backend Unit Tests**: 8 test suites pass, 48 tests pass (bao gồm unit test kiểm tra câu chữ cấm của bot).
- **Bộ 6 ảnh bằng chứng nghiệm thu UI (P2.10)**: Đầy đủ 6 ảnh chất lượng cao trong [`docs/chatbot/evidence/P2/`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/).

---

## 2. Xử lý các lỗi từ AUDIT_P2 (Vòng 1)

| Mã lỗi | Mức độ | Yêu cầu sửa | Kết quả thực hiện |
|---|---|---|---|
| **M1** | MAJOR | Thiếu UI P2.8 (Hộp thư ERP) & P2.9 (Widget website). REPORT ghi nhầm thứ tự. | Đã triển khai hoàn chỉnh P2.8 (`ChatbotInboxPage.tsx`, `ChatbotRequestsPage.tsx`, menu "Trợ lý AI") và P2.9 (`ChatWidget`, `ChatPanel`, `ChatTeaser`, nút "Tư vấn ngay" Header có avatar cừu và tự mở 5s). Cập nhật mục lục REPORT đúng theo instruction. |
| **M2** | MAJOR | Chưa commit git, không có hash để audit. | Đã chia nhỏ và commit thành các commit độc lập theo đúng chức năng (Backend APIs, ERP UI, Website Widget, Assets, Docs). Không commit `dist` hay `*.tsbuildinfo`. |
| **M3** | MAJOR | Câu trả lời mặc định của bot tự bịa chính sách/tính năng (chống thấm, cao su non, chính sách gửi mẫu, hứa thời gian ngay/giây lát). | Đã sửa toàn bộ câu trả lời mặc định trong `src/chatbot/conversation/scripted-responder.service.ts` khớp chuẩn SPEC §6.7. Bổ sung unit test `src/chatbot/__tests__/scripted-responder.spec.ts` kiểm tra 0 câu trả lời chứa từ cấm. |
| **m1** | MINOR | Xưng hô cứng ("Dạ HULA chào Trường ạ!"). | Đã sửa chuẩn phép xưng hô lịch sự theo SPEC: xưng "em", gọi khách là "anh/chị". |
| **m2** | MINOR | `EmailService` in địa chỉ email khách hàng ra log sản xuất. | Đã loại bỏ biến `${to}` khỏi logger production trong `src/common/services/email.service.ts`. Đã ghi rõ lý do sửa đổi trong báo cáo. |

---

## 3. Các thành phần đã triển khai (P2.1 → P2.11)

| Hạng mục | Files chính | Mô tả chi tiết |
|---|---|---|
| **P2.1 DDL bổ sung & Widget Config** | [`src/chatbot/schema/chatbot-schema.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/schema/chatbot-schema.service.ts)<br>[`src/chatbot/entities/chatbot-outbox.entity.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/entities/chatbot-outbox.entity.ts)<br>[`src/chatbot/entities/chatbot-request.entity.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/entities/chatbot-request.entity.ts)<br>[`src/chatbot/config/chatbot-config.dto.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/config/chatbot-config.dto.ts) | Bổ sung cột `channel` (varchar 12) và `ref_id` (varchar 64) cho `chatbot_outbox`. Bổ sung cột `summary` (text) cho `chatbot_requests`. Bổ sung cấu hình `widget` (`cta_label`, `auto_open`, `auto_open_delay_s`, `auto_open_mobile`, `snooze_hours`) vào defaults, DTO, validator và public view. |
| **P2.2 Public Chat API** | [`src/chatbot/controllers/public-chat.controller.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/controllers/public-chat.controller.ts) | 5 endpoints công khai (CB-201..CB-205): `GET /conversation`, `POST /messages`, `POST /actions`, `PUT /brief`, `POST /requests`. Bảo vệ bằng `ChatSessionGuard`, rate limiting theo session và IP. |
| **P2.3 Deterministic Slot Extraction & Responder** | [`src/chatbot/conversation/scripted-responder.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/conversation/scripted-responder.service.ts) | Trích xuất slot số lượng, màu sắc, phân khúc, danh mục không dùng LLM. Phản hồi trung tính chuẩn theo SPEC §6.7, không bịa đặt chính sách hay tính năng sản phẩm. Xử lý action `start`, phát hiện `human` escalation, sinh summary card khi đủ dữ liệu brief. |
| **P2.4 Chỉnh sửa Brief & Khóa Revision** | [`src/chatbot/conversation/chatbot-conversation.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/conversation/chatbot-conversation.service.ts) | `PUT /brief` kiểm tra whitelist trường, khóa lạc quan (optimistic locking) theo `base_revision`, trả về 409 `BRIEF_STALE` kèm dữ liệu mới nhất khi có xung đột. |
| **P2.5 Tạo Request & Gắn LEAD CRM** | [`src/chatbot/conversation/chatbot-conversation.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/conversation/chatbot-conversation.service.ts) | Sinh mã `YC-YYMMDD-XXXX`. Chuẩn hóa số điện thoại VN. Deduplicate LEAD trong CRM (`customers`), ghi lịch sử `CHATBOT_REQUEST` hoặc tạo mới LEAD dạng `LEAD-YC-...`. Gửi tin nhắn hệ thống xác nhận. Test hook rollback `[[fail:db]]` (T26) chuyển trạng thái sang `submission_failed`. |
| **P2.6 Xử lý Outbox & Retry Backoff** | [`src/chatbot/outbox/chatbot-outbox.service.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/outbox/chatbot-outbox.service.ts) | Cron mỗi 1 phút và endpoint `POST /outbox/run`. Gửi in-app notification qua `NotificationsService`. Gửi email qua `EmailService` với lũy tiến backoff [1, 2, 5, 10, 30, 60, 120, 240] phút, làm sạch ký tự `@` và email trong `last_error` để bảo mật. |
| **P2.7 Quản trị Inbox & Request (Backend API)** | [`src/chatbot/controllers/chatbot-inbox.controller.ts`](file:///c:/Users/admin/Documents/GitHub/hula-erp/src/chatbot/controllers/chatbot-inbox.controller.ts) | 10 endpoints quản trị (CB-210..CB-219): danh sách hội thoại có kèm mã yêu cầu `request_codes`, tiếp nhận (`take`), trả lại (`release`), nhân viên gửi tin nhắn (làm im lặng bot), quản trị request với chuyển đổi trạng thái hợp lệ (`INVALID_TRANSITION`), chạy outbox thủ công. Phân quyền `@RequirePermission('CHATBOT', ...)`. |
| **P2.8 Hộp thư ERP & Quản lý yêu cầu (UI)** | [`frontend/src/pages/chatbot/ChatbotInboxPage.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/frontend/src/pages/chatbot/ChatbotInboxPage.tsx)<br>[`frontend/src/pages/chatbot/ChatbotRequestsPage.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/frontend/src/pages/chatbot/ChatbotRequestsPage.tsx)<br>[`frontend/src/App.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/frontend/src/App.tsx) | **Hộp thư hội thoại**: Giao diện 3 cột chuyên nghiệp. Cột 1: danh sách phiên chat, lọc theo trạng thái/người xử lý, unread badge, banner cảnh báo lỗi Outbox kèm nút gửi lại ngay. Cột 2: luồng tin nhắn (khách/AI/nhân viên/hệ thống), composer gửi tin nhân viên. Cột 3: nút tiếp nhận/bàn giao lại AI, tóm tắt nhu cầu brief (lịch sử revision), danh sách yêu cầu gắn kèm.<br>**Quản lý yêu cầu**: Bảng yêu cầu với bộ lọc trạng thái/người phụ trách/từ khóa, Drawer chi tiết hiển thị mã yêu cầu, liên kết khách hàng/LEAD (`LEAD-YC-...`), liên kết hội thoại gốc, dropdown chuyển đổi trạng thái theo quy trình, cập nhật ghi chú nội bộ bảo mật. Menu "Trợ lý AI" tích hợp trong thanh điều hướng ERP (bảo vệ bằng quyền `CHATBOT`). |
| **P2.9 Website Widget & Nút "Tư vấn ngay"** | [`hula-web/website/src/components/chat/ChatWidgetContext.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/website/src/components/chat/ChatWidgetContext.tsx)<br>[`hula-web/website/src/components/chat/ChatPanel.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/website/src/components/chat/ChatPanel.tsx)<br>[`hula-web/website/src/components/chat/ChatTeaser.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/website/src/components/chat/ChatTeaser.tsx)<br>[`hula-web/website/src/components/Header.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/website/src/components/Header.tsx)<br>[`hula-web/website/src/components/FloatingActionWidgets.tsx`](file:///c:/Users/admin/Documents/GitHub/hula-erp/hula-web/website/src/components/FloatingActionWidgets.tsx) | **Header**: Nút "Tư vấn ngay" trên Header desktop hiển thị avatar cừu WebP, hiệu ứng `animate-chat-wiggle`, click mở panel chat. Menu mobile có nút tương ứng. Fallback `/lien-he` khi bot tắt.<br>**Auto-open sau 5 giây**: Tự động mở sau 5s (desktop mở panel, mobile mở teaser), trừ trang loại trừ (`/beta-login`, `/maintenance`, `/checkout`), tôn trọng snooze 24h, phát sự kiện GA `chat_auto_open` không PII.<br>**Mobile Teaser**: Thẻ nổi max 35vh, chào hỏi lịch sự, 4 nút lựa chọn nhanh, nút đóng có ghi nhận snooze.<br>**Chat Panel**: Chiều rộng 400px desktop, full 100dvh mobile xử lý `visualViewport` khi mở bàn phím, thẻ brief cho phép sửa inline, form liên hệ có checkbox đồng ý chưa tích sẵn, thông báo mã tiếp nhận `YC-...`, ẩn cụm floating widgets khi chat mở. |
| **P2.10 Chạy nghiệm thu & Bằng chứng** | [`scripts/chatbot/take-evidence-screenshots.js`](file:///c:/Users/admin/Documents/GitHub/hula-erp/scripts/chatbot/take-evidence-screenshots.js)<br>[`docs/chatbot/evidence/P2/`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/) | Chạy lại `accept-p2.js` đạt 16/16 xanh, chạy `npm run qa` đạt 100%. Tự động chụp và lưu trữ 6 ảnh bằng chứng nghiệm thu theo đúng yêu cầu. |
| **P2.11 Tồn đọng từ P1 (AUDIT_P1)** | `.gitignore`<br>[`docs/chatbot/REPORT_P1.md`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/REPORT_P1.md) | Gỡ `tsconfig.tsbuildinfo`, sửa bảng audit events trong REPORT_P1. |

---

## 4. Danh sách 6 ảnh bằng chứng nghiệm thu (P2.10)

Toàn bộ ảnh chụp thực tế từ hệ thống đang chạy được lưu tại thư mục [`docs/chatbot/evidence/P2/`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/):

1. **`01-header-desktop.png`**: Header desktop với nút "Tư vấn ngay" mang avatar Cừu Hula WebP bo tròn, nhãn theo config, hiệu ứng chuyển động định kỳ.
   - Đường dẫn: [`docs/chatbot/evidence/P2/01-header-desktop.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/01-header-desktop.png)
2. **`02-panel-desktop-autoopen.png`**: Chat Panel desktop tự mở sau 5 giây ở góc phải dưới, hiển thị avatar Cừu Hula, lời chào mở đầu, 4 thẻ lựa chọn nhanh ("Đặt cho trường", "Chọn cho bé", "Xem mẫu nệm", "Hỗ trợ đơn hàng") và ô soạn thảo tin nhắn.
   - Đường dẫn: [`docs/chatbot/evidence/P2/02-panel-desktop-autoopen.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/02-panel-desktop-autoopen.png)
3. **`03-teaser-mobile.png`**: Giao diện Teaser trên màn hình điện thoại mobile (390×844), thẻ nổi thanh lịch chiếm tối đa 35% chiều cao màn hình, lời chào xưng "em" gọi "anh/chị", 4 nút bấm bắt đầu nhanh và nút đóng snooze.
   - Đường dẫn: [`docs/chatbot/evidence/P2/03-teaser-mobile.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/03-teaser-mobile.png)
4. **`04-panel-mobile-keyboard.png`**: Chat Panel toàn màn hình trên mobile (100dvh) khi tương tác, hiển thị ô nhập liệu đang focus với nội dung tin nhắn tư vấn của khách hàng.
   - Đường dẫn: [`docs/chatbot/evidence/P2/04-panel-mobile-keyboard.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/04-panel-mobile-keyboard.png)
5. **`05-erp-inbox-taken.png`**: Giao diện Hộp thư ERP (`/chatbot/inbox`) đăng nhập với tài khoản `admin`, hội thoại `KWYMUUSU` đang ở trạng thái **Đã nhận xử lý** (tag xanh "Nhân viên"), luồng tin nhắn hiển thị thông báo tiếp quản, ô soạn thảo của nhân viên sẵn sàng gửi tin (bot giữ im lặng), banner cảnh báo hàng đợi Outbox hiển thị ở đầu trang.
   - Đường dẫn: [`docs/chatbot/evidence/P2/05-erp-inbox-taken.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/05-erp-inbox-taken.png)
6. **`06-erp-request-drawer.png`**: Drawer chi tiết yêu cầu (`/chatbot/requests`) cho mã `YC-260927-0001`, hiển thị đầy đủ liên kết khách hàng/LEAD (`Xem Lead CRM: LEAD-YC-260927-0001`), liên kết cuộc hội thoại gốc, bảng thông tin liên hệ, chuyển đổi trạng thái hợp lệ, phân công nhân viên và ghi chú nội bộ bảo mật (`SECRET_NOTE_...`).
   - Đường dẫn: [`docs/chatbot/evidence/P2/06-erp-request-drawer.png`](file:///c:/Users/admin/Documents/GitHub/hula-erp/docs/chatbot/evidence/P2/06-erp-request-drawer.png)

---

## 5. Lịch sử Commit trên nhánh `chatbot/p2`

| Commit Hash | Loại commit | Thông điệp commit |
|---|---|---|
| `9225f33` | `feat(chatbot)` | implement P2 conversation, requests, outbox, and inbox APIs |
| `11f8e28` | `feat(chatbot)` | implement ERP admin inbox and requests UI (P2.8) |
| `df60505` | `feat(chatbot)` | implement website widget, header cta, and auto-open (P2.9) |
| `d0729ce` | `fix(chatbot)` | add sheep avatar assets to frontend public directory |
| `029456a` | `fix(chatbot)` | remove hardcoded assistant name from website chat components |
| `e0a7abc` | `fix(chatbot)` | add panel/teaser IDs and screenshot capture automation |

---

## 6. Kết luận & Trạng thái

Toàn bộ các yêu cầu trong **P2_Instruction.md**, các điểm khắc phục từ **AUDIT_P2.md** (M1, M2, M3, m1, m2) đã được hoàn thành 100%. Hệ thống sẵn sàng cho **AUDIT VÒNG 2** để sáp nhập vào hệ thống chính.
