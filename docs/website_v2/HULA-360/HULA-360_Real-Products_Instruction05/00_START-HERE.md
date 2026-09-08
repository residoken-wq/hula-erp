# HULA 360 — Sản phẩm thật & gỡ chặn 3D · Instruction 05

Ngày 08/09/2026. Bàn giao dữ liệu và instruction; không chứa code ứng dụng hoặc GLB đã hoàn thiện.

## Kết quả

Đã kiểm toàn bộ 56 trang JPEG trong sale kit, đọc kỹ các trang thông số cho 15 dòng sản phẩm chính phục vụ tour: 4 bộ nệm, 2 nệm foam, 4 túi ngủ và 5 túi bảo quản. Các dòng phụ kiện còn lại được phân nhóm trong báo cáo; chưa biến thành SKU riêng. `source-index.json` map đủ tên gốc sang tên file trong gói; JPEG được giữ nguyên nội dung.

## Quyết định triển khai

- Cảnh khám phá chính: bộ nệm Cotton Cara chăn tiêu chuẩn, màu xanh dương theo mẫu catalogue; nệm 120 × 63 cm, gối 40 × 25 cm, chăn 130 × 70 cm.
- Cảnh nhận túi: túi bảo quản quai xách size S, thông số catalogue 48 × 40 cm; mặt trước xanh, chọn phương án mặt sau xám theo ảnh; quai xám, dây kéo mặt sau, nhãn tên/lớp phía trước.
- Nhận diện đồ của bé bằng nhãn hư cấu **“Mây — Lớp Mầm”**; bỏ yêu cầu túi kem và biểu tượng chiếc lá. Kẹp lá trên tóc Mây vẫn thuộc tạo hình nhân vật.
- Đây là lựa chọn dựng demo từ các dòng thật, chưa phải một combo thương mại/SKU đã xác nhận. Chưa có số đo túi khi chứa đồ nên không khẳng định bộ nệm cụ thể chắc chắn vừa túi S.

## AI IDE chạy theo thứ tự

1. Dán Context và Prompt A trong `03_AI-IDE_Instruction05.md`: thêm dữ liệu/ảnh tham chiếu thật và sửa kịch bản ngay.
2. Prompt B: dựng túi/nệm bằng công cụ 3D có sẵn, ghi rõ những kích thước ước lượng. Không chờ nhân vật để hoàn thiện sản phẩm.
3. Dùng `02_3D-Asset-Pipeline.md` để tạo ba nhân vật, rig và chuyển động. Gói có lại 12 ảnh nhân vật trong `characters/`.
4. Prompt C–D: nhập asset, bàn giao túi và kiểm tra. Tiếp tục tiêu chí UI/POV của Instruction 04; Instruction 05 ưu tiên khi khác về sản phẩm/túi/nhãn.

## Tệp chính

| Tệp | Dùng làm gì |
|---|---|
| `01_Sale-Kit_Analysis.md` | Danh mục thật, thông số, nguồn và những gì còn thiếu |
| `02_3D-Asset-Pipeline.md` | Xử lý từng blocker; prompt dựng túi, nhân vật và animation |
| `03_AI-IDE_Instruction05.md` | Các prompt đưa vào IDE theo lượt |
| `product-reference-registry.json` | 15 record dữ liệu tham chiếu; không phải import SKU production |
| `source-index.json` | 56 file nguồn, tên gốc và kích thước ảnh |
| `sale-kit/` | 56 JPEG nguồn không chỉnh sửa |
| `characters/` | 12 PNG nhân vật đã tạo ở Instruction 04 |

## Trạng thái thật

| Hạng mục | Trạng thái sau bàn giao này |
|---|---|
| Dữ liệu và ảnh catalogue | Có, đủ để thêm nội dung/thẻ sản phẩm trong bản draft |
| Hình dáng túi và các mặt tham chiếu | Có; kích thước chiều sâu/quai chưa được catalogue định lượng |
| File GLB túi/nệm/nhân vật | Chưa được tạo trong gói này |
| Skeleton và clip bàn giao | Chưa được tạo; quy trình và tiêu chí đã cụ thể hóa |
| Code/tích hợp vào website | AI IDE thực hiện trong repo của anh |

Sale kit bổ sung được bằng chứng sản phẩm, không chứa mesh/rig. Không đánh dấu cả dự án BLOCKED: dữ liệu, UI sản phẩm, đổi nội dung nhận diện và dựng sản phẩm tĩnh là các phần có thể tiến hành độc lập. Phiên này chưa có công cụ tạo 3D chuyên dụng được kết nối để xuất ba nhân vật rigged đúng chuẩn.
