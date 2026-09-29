# Sơ đồ kịch bản (Flow builder) — Chatbot Cừu Hula

CMS → **Trợ lý AI → Sơ đồ kịch bản**. Người soạn kéo thả các bước thành một luồng hội thoại. Bot chạy **thật** theo sơ đồ đã xuất bản.

## Cách bot dùng sơ đồ

Mỗi lượt khách nhắn, bot xét theo thứ tự sau:

1. **Luật an toàn luôn thắng**: khiếu nại, trẻ sơ sinh, khách đòi gặp nhân viên, handoff. Khi gặp các trường hợp này, bot dừng kịch bản đang chạy và trả lời theo luật cũ.
2. **Khách đang ở giữa kịch bản** (đang chờ khách chọn nút):
   - Khách bấm nút, hoặc gõ đúng chữ trên nút (không phân biệt dấu) → đi theo nhánh của nút đó.
   - Không khớp chữ trên nút thì khớp theo **từ khoá** của nút (nguyên từ, không phân biệt dấu).
   - Vẫn không khớp → đi nhánh **Khác** nếu có. Nếu không có nhánh Khác, khách **rời kịch bản** và bot trả lời bằng Tri thức/AI như bình thường.
3. **Khách chưa ở trong kịch bản nào**:
   - Nút mở đầu trên widget (Đặt cho trường / Cho bé / Xem mẫu / Hỗ trợ đơn) thuộc kịch bản nào thì chạy kịch bản đó.
   - Câu gõ có từ khoá của bước Bắt đầu cũng làm kịch bản khởi động. Nhiều kịch bản cùng khớp thì kịch bản có độ ưu tiên cao hơn chạy.
4. Không có kịch bản nào khớp → chạy luồng cũ: script, rồi Tri thức, rồi AI.

Khi nhân viên đã nhận chat, bot không trả lời theo kịch bản nữa.

## Các loại bước

| Bước | Tác dụng |
|---|---|
| ▶ Bắt đầu | Chọn nút mở đầu và/hoặc từ khoá khởi động. Mỗi nút mở đầu chỉ thuộc 1 kịch bản đang chạy. |
| 💬 Tin nhắn | Bot nói, kèm tối đa 6 nút. Có nút thì bot chờ khách chọn. Không có nút thì bot đi tiếp ngay sang bước được nối (nếu không nối gì thì hết kịch bản). |
| 📚 Tri thức | Đọc câu trả lời **đã duyệt** mới nhất theo topic. Sửa ở trang Tri thức là sơ đồ tự cập nhật. Có ô câu dự phòng khi topic chưa được duyệt. |
| 🙋 Chuyển nhân viên | Bot nói rồi hiện nút “Gặp nhân viên tư vấn”. Kịch bản kết thúc tại đây. |
| 🏁 Kết thúc | Lời chào (có thể để trống). Hết kịch bản. |

Có thể dùng các biến `{short_name}`, `{hotline}`, `{email_public}`, `{zalo_url}`, `{working_hours_text}` trong nội dung.

## Quy trình

**Soạn → Lưu nháp → Chạy thử → Xuất bản.**

- **Lưu nháp**: kiểm tra sơ đồ, liệt kê lỗi và cảnh báo. Bấm vào một mục trong danh sách để nhảy tới bước bị lỗi.
- **Chạy thử**: đóng vai khách ngay trong editor. Bước đang chạy được tô sáng trên sơ đồ.
- **Xuất bản**: bị chặn nếu còn lỗi. Khách trên website dùng bản mới trong tối đa 30 giây. Khách đang ở giữa kịch bản vẫn đi tiếp nếu bước họ đang đứng còn tồn tại trong bản mới.
- **Bật/tắt, xoá**: tắt thì bot quay về trả lời như cũ.

## Quyền (`CHATBOT_KB`)

| Thao tác | Quyền cần có |
|---|---|
| Xem | view |
| Tạo | create |
| Sửa / lưu nháp | update |
| Xuất bản, bật/tắt, xoá | delete (quy ước "delete = duyệt", giống Tri thức) |

## Kỹ thuật

- **Bảng dữ liệu**:
  - `chatbot_flows` gồm `draft_graph`, `published_graph` và `published_version`.
  - `chatbot_flow_states` lưu vị trí của từng hội thoại trong kịch bản.
  - DDL nằm trong `chatbot-schema.service.ts`. Entity khai báo cùng default với DDL, vì prod đang bật synchronize.
- **Backend**:
  - `src/chatbot/flow/flow-graph.ts` là phần lõi thuần: validate, walk, match. Có unit test ở `__tests__/flow-graph.spec.ts`.
  - `chatbot-flow.service.ts` lo admin CRUD và runtime, cache 30 giây.
  - Móc vào runtime tại `TurnOrchestratorService.handleTurn` (trước script/KB/AI) và `postAction('start')`.
  - Câu trả lời theo kịch bản được lưu cùng transaction với `commitTurn`, có kiểm tra `human_active`. `llm_meta.route = 'flow'`.
- **API**: `/api/chatbot/admin/flows*`, từ CB-130 đến CB-137 trong `route-matrix.csv`.
- **Widget**: payload `quick_replies` hiện các nút dưới tin nhắn mới nhất. Payload `handoff_suggest` hiện nút “Gặp nhân viên tư vấn”.
- **CMS**: dùng `@xyflow/react` (MIT, miễn phí). Engine chạy thử ở `src/components/chatbot-flow/engine.ts`, là bản sao phía client của logic backend.
- **Contract**: `scripts/chatbot/accept-flow.js`, 19 check, chạy với `NODE_ENV=development`.
