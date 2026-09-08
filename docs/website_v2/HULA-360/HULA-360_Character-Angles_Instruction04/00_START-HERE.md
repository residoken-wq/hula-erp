# HULA 360 — Bộ tạo hình riêng & Instruction 04

Ngày 08/09/2026 · Tài liệu bàn giao cho AI IDE, không chứa code sản phẩm.

## Dùng ngay

1. Giải nén toàn bộ gói vào thư mục tài liệu của repo Hula. Giữ cấu trúc thư mục để AI IDE đọc đúng ảnh.
2. Mở `02_AI-IDE_Prompts.md`. Dán **Context chung + Prompt 01** vào AI IDE trước.
3. Chạy lần lượt Prompt 02 → 06. Mỗi lượt phải có bằng chứng đạt tiêu chí của lượt đó. Nếu thiếu model, tiếp tục các sửa đổi UI độc lập và báo rõ phần 3D bị chặn.
4. Đối chiếu `04_Acceptance.md`. Không lấy câu “đã hoàn thành” của IDE làm bằng chứng thay cho bản chạy và ảnh/video thực tế.

## Trong gói

| Tệp/thư mục | Mục đích |
|---|---|
| `01_Character-Spec.md` | Khóa nhận diện, các góc, model/rig/tay cần có |
| `02_AI-IDE_Prompts.md` | Context chung và sáu nhiệm vụ triển khai có đầu ra cụ thể |
| `03_Image-Prompts.md` | Prompt đã dùng tạo 12 ảnh và chuỗi ảnh tham chiếu |
| `04_Acceptance.md` | Điều kiện nghiệm thu hình ảnh, hành động, UI và runtime |
| `references/CoAn/` | Bốn PNG riêng của cô An |
| `references/MeLinh/` | Bốn PNG riêng của mẹ Linh |
| `references/BeMay/` | Bốn PNG riêng của bé Mây |
| `references/Identity-Original.png` | Sheet nhận diện ban đầu, dùng làm đầu vào tạo ảnh chính diện |
| `evidence/Current-UI.png` | Ảnh bản hiện tại do chủ dự án cung cấp |

Mỗi nhân vật có chính diện, góc 3/4, nghiêng và phía sau; mỗi góc là một file PNG 1024 × 1536. Đây là hình tham chiếu tạo model, **chưa phải model GLB, rig, animation hay texture UV**. Ảnh không phải bộ đo đa góc được hiệu chuẩn. Nếu các góc có sai khác nhỏ, ưu tiên ảnh chính diện về nhận diện và dựng một model thống nhất, sau đó render các góc từ model đó để kiểm tra.

## Những điểm cần sửa từ screenshot

| Quan sát được | Yêu cầu thay đổi |
|---|---|
| Emoji và nhãn chiều cao đang thay vị trí NPC | Hiển thị nhân vật đúng tạo hình khi có asset 3D; chiều cao để ở cấu hình kỹ thuật |
| Hai hình vàng ở đáy ảnh gợi bàn tay nhưng thiếu cấu trúc bàn tay | Tay có ngón, cổ tay, màu da và chuyển động khớp vai được chọn |
| Nhãn “Giờ đón cuối tuần” nhưng lớp có nhiều trẻ đang ngủ | Tách trạng thái ngủ trưa và đón trẻ; cảnh đón có trẻ thức, nệm đã thu dọn |
| Thẻ nhiệm vụ che vùng trung tâm phía dưới | Thu gọn mặc định; đặt hành động chính trong vùng nhìn không bị UI che |
| Có CTA nhận túi nhưng ảnh tĩnh chưa cho thấy bàn giao | Kiểm tra bản chạy để xác minh; nghiệm thu bằng hành động và vật thể đổi chủ thật |

Screenshot không đủ để xác định engine, source code hay FPS. Các lỗi runtime phải được IDE tái hiện, không suy đoán thành kết luận.

## Thứ tự ưu tiên

Instruction 04 bổ sung yêu cầu hình ảnh và mẫu cảnh đón cuối tuần vào Instruction 03. Giữ các sửa CMS/API/config/loading/accessibility của Instruction 03. Khi tài liệu cũ cho phép placeholder, chỉ hiểu là bản thử nội bộ; placeholder không đạt nghiệm thu nhập vai hoàn chỉnh. Tiếp tục sửa trong repo Hula hiện có, không tạo website khác để né tích hợp.

Mục tiêu trước mắt: hoàn thiện **một cảnh mẹ Linh nhận túi** từ đầu đến cuối rồi mới nhân rộng sang cô An và bé Mây. Sản xuất bằng AI vẫn cần các đầu ra riêng: ảnh → model/rig → animation → tích hợp → kiểm tra. AI IDE chỉ có khả năng xử lý phần nào khi được cung cấp công cụ và tài nguyên tương ứng; prompt không tự biến PNG thành GLB chất lượng.
