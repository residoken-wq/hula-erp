# P5 — UAT, vận hành và go-live có kiểm soát

**Điều kiện:** P4 AUDIT_PASS. Đã chốt Q-01, Q-08, Q-10, Q-11, Q-12. Sales đã duyệt nội dung tối thiểu (P5.3). Nhánh `chatbot/p5`.
**Go-live chỉ khi Chủ dự án ra lệnh bằng văn bản trong STATUS.md.** Antigravity không tự deploy, không tự bật cờ trên production.

---

## P5.1 Retention và purge
- `@Cron('0 30 3 * * *')`: xoá hoặc ẩn danh theo `retention_days`:
  - tin nhắn: xoá text, giữ khung thống kê;
  - file: xoá `content`;
  - session: xoá;
  - request/ticket: che liên hệ sau hạn.
- Ghi audit `purge` (số lượng, không chép nội dung).
- Knowledge/price bị thu hồi: tăng `kb_version` để vô hiệu cache (T33/T40).
- Admin có nút "Xoá dữ liệu hội thoại" theo mã, dành cho yêu cầu của khách (quyền `CHATBOT` delete, có audit).

## P5.2 Báo cáo `/chatbot/reports` (quyền `CHATBOT`)
Chỉ số theo SPEC §13:
- request gửi thành công / số lần bấm gửi;
- thời gian tạo → nhận → phản hồi đầu → đóng;
- tỷ lệ handoff và "không đủ nguồn";
- validator chặn, lỗi tool, request trùng (phải = 0);
- số lượt LLM/ngày so với budget.

Không báo doanh thu nếu chưa nối được với đơn thật.

## P5.3 UAT với sales
- Chạy `eval.js --provider=gemini --cases=all` trên staging. Xuất file cho sales chấm cột `human_review` trên 31 case + biến thể.
- **Cổng go-live:**
  - 100% dòng an toàn/quyền/không bịa trong ACCEPTANCE `PASS`;
  - chất lượng ≥ 90%;
  - không còn lỗi BLOCKER/MAJOR;
  - có ≥ 1 người nhận lead trong `notify_*`;
  - giờ làm việc và kênh liên hệ đã điền;
  - các mục `script.*` đã `published`.
- Tính năng chưa bật (dự toán, tra đơn) ghi `NOT_ENABLED` kèm bằng chứng fallback.

## P5.4 Runbook `docs/chatbot/RUNBOOK.md`
- Biến môi trường cần có, cách kiểm tra key hợp lệ không in key.
- Bật/tắt: `CHATBOT_CONFIG.enabled` trong Cấu hình hệ thống → tab "Trợ lý AI website". Tắt cờ là tắt ngay trên mọi trang, không cần deploy (**đây là rollback chính**).
- Backup: `pg_dump` trước deploy (ghi lệnh). Bảng `chatbot_*` độc lập, rollback code không cần xoá bảng.
- Rollback code: deploy lại image tag trước. Bảng mới không ảnh hưởng bản cũ.
- Sự cố thường gặp: LLM 429/timeout, budget hết, outbox `failed`, spam lead. Mỗi loại ghi cách xử lý.
- Tài liệu admin cho sales: nhận chat, trả lại AI, xử lý request/ticket, duyệt tri thức.

## P5.5 Kế hoạch go-live (Chủ dự án thực hiện)
1. Vá Q-14 xong trước.
2. Deploy backend + website + frontend cùng lúc, cờ tắt. Smoke test production với `enabled=false`: website không đổi.
3. Bật cờ trong giờ làm việc, sales trực. Theo dõi 2 giờ đầu: lỗi, latency, request.
4. Tuần đầu: xem Khoảng trống kiến thức mỗi ngày, duyệt bổ sung.
5. Bất thường thì tắt cờ.
