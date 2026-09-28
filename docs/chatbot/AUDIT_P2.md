# AUDIT P2 — Chatbot: hội thoại, yêu cầu, LEAD, hộp thư, widget

## VÒNG 2 — 2026-09-28 — **AUDIT_PASS**

- **Đối tượng:** `chatbot/p2` @ `cb5a9be` (7 commit, đã tách theo mục)
- **Môi trường:** `pgenv.sh reset`, cổng 4999, `NODE_ENV=production` + hook test
- **Script:** `accept-p2.js` không bị sửa

| Lỗi vòng 1 | Kết quả | Kiểm chứng |
|---|---|---|
| M1 thiếu UI | ĐẠT | Có `frontend/src/pages/chatbot/ChatbotInboxPage.tsx`, `ChatbotRequestsPage.tsx`, menu ERP; `hula-web/website/src/components/chat/*`, `Header.tsx`, `FloatingActionWidgets.tsx`. Đủ 6 ảnh: nút header có avatar, panel tự mở, teaser mobile khoảng 21% chiều cao, panel mobile, hộp thư đã nhận xử lý, drawer có link lead CRM |
| M2 chưa commit | ĐẠT | 7 commit theo mục; đã bỏ `tsbuildinfo` khỏi git và thêm vào `.gitignore` |
| M3 câu chữ bot | ĐẠT | Các câu mặc định giờ trung tính: không còn chính sách gửi mẫu, chống thấm, cao su non, "ngay", "giá tốt nhất"; xưng "em", gọi "anh/chị" |
| m1 xưng hô | ĐẠT | |
| m2 log email | ĐẠT | Log không còn địa chỉ |

Claude chạy lại: `accept-p2.js` **16/16 PASS**; check-rbac/public-callers exit 0; 2 script chatbot sạch; jest 47/47; tsc backend và website 0; frontend không có lỗi type trong `pages/chatbot` (`evidence/P2/claude-audit-r2-*`).

**MINOR, chuyển sang việc tồn P3 (không chặn, nhưng phải sửa trước go-live):**
- m3: widget đọc `config.welcome_message` (`ChatPanel.tsx` L216, `ChatTeaser.tsx` L61), trong khi API trả `greeting`. Hậu quả: lời chào chỉnh trong Cấu hình hệ thống **không bao giờ hiện**, lúc nào cũng dùng câu cứng có chữ "**đạt chuẩn**" (khẳng định chưa được duyệt). Sửa: dùng `config.greeting` và bỏ câu cứng.
- m4: nút header ở 1280px bị xuống dòng "Tư vấn / ngay", ép menu thành 2 dòng. Thêm `whitespace-nowrap`, avatar 20px.
- m5: phụ đề panel "Tư vấn nệm chăn ga mầm non" đang viết cứng. Nên lấy từ config hoặc bỏ.
- Q (hỏi Chủ dự án): nút "Tư Vấn Ngay" thứ hai ở banner hero (`HeroCarousel.tsx` L122) vẫn dẫn sang `/lien-he`. Có muốn nút này cũng mở chat không?

**Ảnh hưởng vận hành khi deploy P1+P2:**
- Khách: không đổi gì (cờ tắt, nút header vẫn dẫn `/lien-he`).
- **ERP:** các nhóm có quyền `CHATBOT` (seed từ SALES: Sales, Admin, Planning Manager, Accounting_manager chỉ xem) sẽ thấy ngay menu **"Trợ lý AI" → Hộp thư, Yêu cầu** (đang trống).
- `EmailService`: prod thiếu SMTP thì email khác của ERP báo lỗi thay vì giả vờ thành công (prod có SMTP nên không đổi).
- Không cần env mới. **Không đặt** `CHATBOT_TEST_HOOKS` / `CHATBOT_ALLOW_FIXTURES` trên VPS.


## VÒNG 1 — 2026-09-27 — **AUDIT_FAIL** (vòng 1/3)

- **Đối tượng:** working tree chưa commit trên `chatbot/p2`. HEAD vẫn là `6c5f0b5` do Claude mở phase, Antigravity **chưa có commit nào**.
- **Cách kiểm:** Claude chép nguyên working tree (diff + file mới) sang worktree audit, build, `pgenv.sh reset`, boot `NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true CHATBOT_TEST_HOOKS=true` ở cổng 4999.
- **Script:** `accept-p2.js` không bị sửa.

**Phần backend đạt:**
- `accept-p2.js` do Claude chạy lại: **16/16 PASS** (`evidence/P2/claude-audit-r1-accept-p2.txt`).
- check-rbac, public-callers exit 0; 15 dòng CB-2xx; 2 script chatbot sạch; jest 44/44; tsc 0 (`claude-audit-r1-qa.txt`).
- Idempotent, rollback khi DB lỗi, dedupe LEAD theo SĐT, chặn trả lời muộn khi nhân viên nhận chat (T35), không lộ ghi chú nội bộ, email lỗi vẫn thử lại: đều đúng.

## Danh sách lỗi

| ID | Mức | Vị trí | Mô tả | Yêu cầu sửa |
|---|---|---|---|---|
| M1 | MAJOR | P2.8, P2.9 | **Thiếu toàn bộ UI.** (a) Không có `frontend/src/pages/chatbot/` (hộp thư, yêu cầu), không có menu ERP. (b) Không có `hula-web/website/src/components/chat/`, `Header.tsx` không đổi: chưa có nút "Tư vấn ngay" mở chat, chưa tự mở 5 giây, chưa có teaser mobile, chưa có panel. REPORT §2 lại ghi "P2.8 Ảnh đại diện WebP", trong khi P2.8 trong instruction là hộp thư ERP; báo cáo như vậy làm người đọc tưởng phần UI đã xong | Làm đủ P2.8 + P2.9. Nộp 6 ảnh theo P2.10. REPORT ghi đúng số mục theo instruction |
| M2 | MAJOR | git | Chưa commit. Không có hash để audit, không rollback được | Commit theo mục (backend / ERP / website / docs). Không commit `dist`, `*.tsbuildinfo` |
| M3 | MAJOR | `src/chatbot/conversation/scripted-responder.service.ts` | Câu mặc định **tự bịa chính sách và tính năng sản phẩm**, vi phạm SPEC §12 và P2.3: L117 "HULA có **chính sách gửi mẫu**…" (chưa được duyệt), còn hỏi địa chỉ ngay lượt đầu; L204 "nệm mút bọc vải **chống thấm**, nệm **cao su non**" (SPEC cấm tự nói chống thấm; catalog không có cao su non); L146 "hỗ trợ anh/chị **ngay**… chờ trong **giây lát**" (hứa thời gian khi `response_sla_text` rỗng); L195 "chính sách **giá tốt nhất**" | Chỉ dùng câu chép **SPEC §6.7** hoặc câu trung tính, không nêu chính sách, tính năng, thời gian. Thêm unit test: không câu mặc định nào chứa `chống thấm\|kháng khuẩn\|cao su\|chính sách\|ngay\|giây lát\|tốt nhất\|miễn phí` |
| m1 | MINOR | L107 | "Dạ HULA chào **Trường** ạ! … cho Trường, Trường mình…": gọi khách là "Trường", nghe cứng. SPEC: xưng "em", gọi "anh/chị" | Ví dụ: "Dạ em chào anh/chị ạ. Trường mình đang cần nệm, gối hay cả bộ, và dự kiến khoảng bao nhiêu bộ ạ?" |
| m2 | MINOR | `src/common/services/email.service.ts` | Sửa service dùng chung ngoài phạm vi (không nằm trong REPORT §2 "lệch"). Hành vi mới đúng: prod thiếu SMTP thì trả `false` thay vì giả vờ gửi thành công. Nhưng log `Cannot send email to ${to}` in **địa chỉ email** ra log (vi phạm luật 5) | Giữ thay đổi. Bỏ `${to}` khỏi log. Ghi vào REPORT §2 là lệch có lý do |

## Ảnh hưởng vận hành
- Chưa deploy được, vì chưa có commit và chưa có UI.
- Thay đổi `EmailService` (m2) có tác động khi deploy: nếu prod **thiếu cấu hình SMTP**, các chức năng email khác của ERP sẽ báo lỗi thay vì âm thầm "thành công". Prod đang có SMTP nên không đổi gì. Ghi để Chủ dự án biết.

## Vòng 2 cần nộp
Commit đủ, sửa M1–M3 + m1–m2, `pgenv.sh reset` → `accept-p2.js` 16/16 → 6 ảnh. Claude sẽ chạy lại script và xem ảnh UI.
