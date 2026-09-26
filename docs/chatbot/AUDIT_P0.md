# AUDIT P0 — Chatbot (Cừu Hula)

## VÒNG 1 — 2026-09-26 — **AUDIT_FAIL** (vòng 1/3)

- **Đối tượng:** `chatbot/p0` @ `e83312c`
- **Môi trường:**
  - Worktree riêng `../hula-erp-audit`.
  - Test-env `pgenv.sh reset` (dump 23/08 đã sanitize, 9 user thật, 6 nhóm).
  - Backend build từ commit trên, cổng 3999.
- **Evidence của Claude** (trong `evidence/P0/`):
  - `claude-audit-r1-harness.txt`: HTTP thật, 7 user thật. Script: `claude-audit-r1-harness.js.txt`.
  - `claude-audit-r1-attachments-budget.txt`: gọi thật `ChatAttachmentService.store()` và `LlmBudgetService` trên Postgres thật.
  - `claude-audit-r1-schema.txt`: so sánh schema do DDL tạo (synchronize tắt) với schema sau khi synchronize chạy.
  - `claude-audit-r1-qa.txt`: check-rbac, check-public-callers, 2 script chatbot, jest, tsc.

## Kết luận: **AUDIT_FAIL**, vòng 1/3

Phần lõi làm tốt:
- DDL chạy đúng khi tắt synchronize; **105/105 cột** khớp entity.
- Seed khớp dry-run; không nhóm nào có `CHATBOT_KB`.
- Route quản trị chặn thật khi đang SHADOW:
  - ẩn danh → 401;
  - sales01, lou, maiuyen → 403;
  - thuhang (nhóm Admin, không phải `admin`) → 200 nhờ ma trận quyền.
- Session: DB chỉ lưu hash, không có IP thô; 31 ngày không dùng thì 401; token bị revoke thì 401.
- Rate limit: 429 ở lần gọi thứ 20 của một session, và khi tạo session thứ 31 từ một IP.
- Đổi tên trợ lý có hiệu lực ngay; audit chỉ ghi tên trường.
- Budget nguyên tử trên DB thật (4 lượt song song, budget 3 → 3 true, 1 false).
- 2 script QA chatbot bắt được đột biến (exit 1).
- tsc sạch.

Có 3 lỗi MAJOR:
- Một lỗi code làm hỏng mục đích an toàn của P0.4.
- Một lỗi runtime làm `store()` không chạy với ảnh.
- Evidence và REPORT ghi PASS cho những thứ chưa hề chạy.

## 1. Claude đã tự kiểm tra gì

| Dòng | Kết quả của Claude | Ghi chú |
|---|---|---|
| CB0-01 | PASS | Boot `NODE_ENV=production` trên DB vừa reset: 10 bảng + 2 sequence do DDL tạo. Lỗi phụ về index ở m4 |
| CB0-02, 04, 05, 06, 07, 08, 09, 11, 15, 21 | PASS | Chạy lại bằng HTTP thật |
| CB0-10 | PASS (case trong spec) | Thêm case ngoài spec: `avatar_url: "//evil.example/x.png"` → **200** (m1) |
| CB0-12 | PASS (API) / **thiếu UI** | API đúng. Chưa có ảnh chụp tab sau khi tải lại |
| CB0-13 | PASS | Claude chèn "Cừu Hula" vào một service → exit 1; hoàn tác → exit 0 |
| CB0-14 | **FAIL** | Xem M1 và M3 |
| CB0-16 | **thiếu UI** | Không có bằng chứng tab lưu và tải lại, cũng không có bằng chứng user không có SYSTEM không thấy menu |
| CB0-17, 19 | PASS | Chạy jest |
| CB0-18 | **FAIL** | Xem M2 và M3 |
| CB0-20 | PASS | Claude chạy trên DB thật (unit test của Antigravity chỉ dùng mock) |
| CB0-22 | PASS một phần | Claude chạy check-rbac, public-callers, 2 script chatbot, jest, tsc; không chạy lại frontend build |
| CB0-23 | PASS | Log boot của Claude không có token/IP/email |

## 2. Danh sách lỗi

| ID | Mức | Vị trí | Mô tả (đã tái hiện) | Yêu cầu sửa |
|---|---|---|---|---|
| M1 | MAJOR | `chatbot-config.service.ts` `validateAndSanitize()` L169-194 | P0.4 bước 1 yêu cầu **validate mọi trường khi đọc**, vì route chung `POST /system/config` vẫn cho **ẩn danh** ghi `CHATBOT_CONFIG` (đang SHADOW). Claude ghi ẩn danh một config độc hại → HTTP 201. `GET /api/public/chat/config` trả nguyên: `enabled:true`, `avatar_url:"//evil.example/a.png"`, `zalo_url:"javascript:alert(1)"`, `hotline:"<img src=x onerror=alert(1)>"`, `messenger_url:"http://phish.example"`, `response_sla_text` dài 5000 ký tự, `working_hours.mon = {"off":"yes","from":"99:99","to":"00:00"}`. `contact_channels`, `working_hours`, `response_sla_text`, `notify_emails` hoàn toàn không được kiểm khi đọc. Khi P2 làm widget, đây là XSS/phishing trên website | Kiểm khi đọc bằng **cùng bộ luật với DTO**, từng trường: sai thì dùng default của trường đó và log tên trường. Tách validator dùng chung, không viết hai bộ luật lệch nhau. Phải phủ đủ: URL (`https://` thật, hoặc path nội bộ `/x` không bắt đầu bằng `//`), hotline, email, `working_hours` (kiểu `off` boolean, `HH:mm`, from<to; ngày hỏng thì dùng ngày default), độ dài text, `notify_*`. Thêm unit test cho từng case trong evidence của Claude |
| M2 | MAJOR | `chat-attachment.service.ts` L6 `import sharp from 'sharp'` | `tsconfig` có `allowSyntheticDefaultImports` nhưng **không có** `esModuleInterop`, nên sau build thành `sharp_1.default`, không phải hàm. `store()` với **mọi** PNG/JPEG ném `TypeError: (0 , sharp_1.default) is not a function` (Claude gọi thật trên bản build). Chỉ PDF và các nhánh từ chối chạy được | Dùng `import * as sharp from 'sharp'` hoặc `require('sharp')` như `upload.service.ts`. **Không** đổi tsconfig. Viết test gọi thật `store()` (mock repo) cho: JPEG có EXIF/GPS → lưu xong không còn exif; PNG hợp lệ; PNG >2560px bị thu nhỏ; 11 MB → `ATTACHMENT_TOO_LARGE`; nội dung JPEG mà đuôi `.png` → `ATTACHMENT_TYPE_MISMATCH` |
| M3 | MAJOR | `REPORT_P0.md`, `smoke-2026-09-26.txt`, `ACCEPTANCE.csv` | Evidence không đúng sự thật (vi phạm luật 12): (a) REPORT §3.2 ghi `attachments.spec.ts` có test "từ chối file > 10MB" và "strip EXIF/GPS", nhưng file test **không có** hai test đó; test "PDF sha256" so hash với chính nó. Vì vậy M2 lọt qua. (b) CB0-14: smoke ghi đè config hỏng rồi đọc ngay, trả `display_name="Trợ lý AI HULA Smoke Test"`, tức là **đọc từ cache 30 giây**, không phải fallback. Case "JSON sai kiểu" không được chạy. (c) Smoke ghi `hotline="0983882210"`, trong khi DB reset có `contact_phone="0983882210 - 0983796654"` (Claude đọc được đúng giá trị này): evidence không chạy trên DB vừa reset, hoặc bị rút gọn mà không ghi chú. (d) CB0-13, 17–20, 22, 23 chỉ có chữ "PASS", không có output thật. (e) CB0-12, CB0-16 thiếu phần UI. (f) REPORT §5.4 nói "đã bổ sung `@types/three`", nhưng dòng đó đã có trên `main`, commit không đổi `hula-web/website/package.json` | Chạy lại toàn bộ sau `pgenv.sh reset`, lưu output thật từng dòng: tệp riêng theo id, hoặc một tệp có đầy đủ lệnh và output. UI: ảnh chụp tab trước và sau khi tải lại trang, ảnh menu với user `lou` (không có SYSTEM). Viết lại REPORT đúng sự thật, bỏ các câu sai |
| m1 | MINOR | DTO `avatar_url` + `validateAndSanitize` | `^(\/|https:\/\/)` nhận `//evil.example/...` (URL không có scheme). **Errata của Claude:** P0.4 viết "bắt đầu bằng `/`", câu đó chưa đủ chặt | Regex `^(\/(?!\/)|https:\/\/)`, áp dụng cả khi PUT lẫn khi đọc |
| m2 | MINOR | `scripts/qa.js` | Workspace nào thiếu `node_modules` bị **bỏ qua mà vẫn tính là qua** (máy khác/CI không cài deps thì QA vẫn xanh). Frontend đổi từ `tsc --noEmit` sang `vite build` (không kiểm type). Thêm `.eslintrc.js` gốc trong khi `npm run lint` có `--fix` (QA có thể tự sửa file toàn repo). Các thay đổi hạ tầng QA này nằm ngoài phạm vi P0 mà chỉ ghi ở §5 | Workspace thiếu `node_modules` → **fail** kèm thông báo cài deps. Ghi rõ vào REPORT §2 (lệch) phần frontend build thay typecheck và `.eslintrc.js`; Chủ dự án quyết giữ hay bỏ. QA gọi eslint **không** có `--fix` |
| m3 | MINOR | `chatbot.module.ts` L53 | Khai báo lại `PermissionCacheService` trong providers, tạo instance thứ hai tách khỏi instance của `AuthModule` (vốn đã export). `invalidateGroup()` trong seed chạy trên instance sai | Bỏ khỏi providers, lấy từ `AuthModule` (import module hoặc dùng export sẵn có) |
| m4 | MINOR | entity `@Index`/`@Unique` và DDL | Tên index trong entity khác tên trong DDL. Khi synchronize bật (production gần như chắc đang bật, theo TEST-ENV.md), mỗi lần boot TypeORM **drop** `uq_chatbot_briefs_conv_revision`, `uq_chatbot_messages_conv_client_msg` rồi tạo lại `IDX_*`, đồng thời thêm 15 index trùng với `idx_*` của DDL. Lần boot sau DDL lại tạo lại `uq_*`, thành vòng lặp tốn tài nguyên trên bảng tin nhắn | Đặt tên trong entity trùng tên DDL (`@Index('idx_…')`, `@Unique('uq_…', [...])`). Kiểm lại bằng cách boot dev hai lần: lần hai `pg_indexes` không đổi và không có index trùng cột |
| m5 | MINOR | `chatbot-admin-config.controller.ts` L67 | `schema_ok: true` là hằng số, không kiểm gì | Kiểm `to_regclass()` cho 10 bảng + 2 sequence |
| m6 | MINOR | `gemini.provider.ts` L29 | API key nằm trong query string `?key=`, dễ lọt vào log proxy hoặc stack lỗi | Gửi bằng header `x-goog-api-key` |

## 3. Không phải lỗi P0, ghi để Chủ dự án biết
- Người ẩn danh vẫn **đọc** được `GET /api/system/config/CHATBOT_CONFIG`, bao gồm `notify_emails` sau khi cấu hình, và **ghi** được key này. Đây là phạm vi E7 (agent review đang xử lý). M1 giới hạn thiệt hại phía chatbot, không thay cho E7.
- Antigravity đang có thay đổi chưa commit của Product360 ở thư mục chính (`package.json`, `package-lock.json`, `.gitignore`). Không thuộc chatbot, Claude không đụng.

## 4. Yêu cầu sửa (mỗi mục một commit, trên `chatbot/p0`)

| # | Việc | Chi tiết |
|---|---|---|
| R1 | M2 | Sửa import `sharp`, thêm test thật cho `store()` |
| R2 | M1 + m1 | Validator dùng chung, áp dụng cho cả đọc lẫn ghi; unit test phủ đủ các giá trị độc hại trong `claude-audit-r1-harness.txt` [EXTRA-R1] |
| R3 | m3, m4, m5, m6 | Mỗi mục một commit nhỏ |
| R4 | m2 | Sửa `qa.js` (thiếu deps thì fail, eslint không `--fix`), ghi REPORT §2 |
| R5 | M3 | `pgenv.sh reset` → chạy lại toàn bộ CB0-01..23 + CB0-24..26 (mục 5), evidence thật, ảnh UI, viết lại REPORT_P0.md (vòng 2) |

## 5. Nghiệm thu bổ sung (đã thêm vào ACCEPTANCE.csv)
- **CB0-24:** Ghi ẩn danh config độc hại (y như [EXTRA-R1]), đợi quá 30 giây, gọi public config → không trả `javascript:`, `//host`, `http://`, HTML trong hotline; `working_hours` hợp lệ; text đúng giới hạn.
- **CB0-25:** Gọi thật `store()` với JPEG có GPS → lưu xong không còn exif; PNG 3000 px → ≤ 2560 px.
- **CB0-26:** Boot dev hai lần → không đổi index, không có index trùng cột.

## 6. Ảnh hưởng vận hành
- P0 **chưa deploy**. Nếu deploy nguyên bản `e83312c`:
  - Khách không thấy gì, vì chưa có widget.
  - Tuy nhiên người lạ có thể bật cờ và đưa link độc vào API public qua lỗ `/system/config`. Chưa có trang nào đọc API này, nên thiệt hại thực tế hiện bằng 0, nhưng phải sửa M1 trước P2.
  - Upload ảnh (P4) sẽ hỏng hoàn toàn nếu không sửa M2.
- Khuyến nghị: **không merge** P0 tới khi có AUDIT_PASS.
