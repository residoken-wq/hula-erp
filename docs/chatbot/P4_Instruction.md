# P4 — CSKH: ticket, mẫu/thiết kế, đính kèm

**Điều kiện:** P3 AUDIT_PASS, đã chốt Q-09. Nhánh `chatbot/p4`.
**Sau deploy:** cờ tắt.

---

## P4.1 Ticket
- Loại: `complaint_quality`, `delivery`, `invoice`, `payment_evidence`, `order_status_check`, `design_change`, `stop_production_request`, `other`. Mức ưu tiên: `complaint_quality` và `stop_production_request` = `high`.
- `POST /public/chat/tickets` `{idempotency_key, category, description, order_ref?, contact?, attachment_ids[]}`:
  - Transaction: ticket (code `TK-YYMMDD-NNNN`) + outbox `ticket.created` + audit. Idempotent như request.
  - `contact` tuỳ chọn. Không có liên hệ thì ticket vẫn tạo được, khách xem tiến độ qua cùng session.
- Câu trả lời sau khi tạo ticket chỉ nói "đã tiếp nhận yêu cầu {code}, bộ phận phụ trách sẽ kiểm tra". Với `stop_production_request` **không** được nói đã dừng (T17).
- `payment_evidence`: sau khi lưu file thì trả "đã tiếp nhận chứng từ", kèm câu "cần kế toán đối chiếu trước khi xác nhận" (T18). Không có trạng thái "đã nhận tiền" nào phía khách.
- Admin `/chatbot/tickets` (quyền `CHATBOT`): phân công, trạng thái `received → in_progress → waiting_customer → resolved/closed`, ghi chú nội bộ, cập nhật hiển thị cho khách. Khách chỉ thấy câu "cập nhật cho khách" do nhân viên soạn, không thấy ghi chú nội bộ.

## P4.2 Mẫu và thiết kế
- `POST /public/chat/requests` với `type='sample'`: phương thức (gửi mẫu / đến xem / video / qua ảnh, lấy danh sách từ config), khu vực, thời gian mong muốn. Trạng thái luôn là `pending_confirmation`. Không có "lịch đã đặt" nếu nhân viên chưa xác nhận (T15).
- `type='design_change'` và lựa chọn mockup: lưu `mockup_version` + lựa chọn ("mẫu 2"). Câu trả lời: "đã ghi nhận lựa chọn, bộ phận thiết kế sẽ xác nhận". Không phát lệnh sản xuất (T16).

## P4.3 Đính kèm
- `POST /public/chat/attachments` (multipart, `@Public` + session + rate limit): gọi `ChatAttachmentService` (P0.7). Tối đa 3 file/request hoặc ticket, 10 MB/file.
  - Từ chối trước khi xử lý: sai MIME, đổi đuôi, quá cỡ, SVG/HTML (T30).
  - Không bao giờ gửi file tới LLM ở MVP.
- Nhận upload và **URL**: không nhận URL từ khách để tải về (chặn SSRF từ gốc).
- Tải file trong admin: `GET chatbot/admin/attachments/:id` kiểm quyền mỗi lần. Không có link công khai, không có link ký tồn tại lâu. Thu quyền nhân viên thì lần tải sau bị 403 ngay (T39).
- Khách chỉ xem được danh sách file của chính session mình (tên, cỡ), không tải lại nội dung.

## P4.4 Tra đơn (Q-09 = NOT_ENABLED)
- `features.order_lookup=false`. Không có route tra đơn public.
- Intent `order_status`/`invoice`/`payment` → đề nghị tạo ticket `order_status_check`. Mã đơn + tên trường chỉ ghi vào ticket, không dùng để tra (T19, T20, T21).
- Các dòng T19–T21 trong ACCEPTANCE ghi `NOT_ENABLED` + evidence fallback.

## Không làm ở P4
- Không phát hành hoá đơn, không xác nhận thanh toán, không tạo QR, không huỷ/đổi đơn, không tạo group Zalo.
