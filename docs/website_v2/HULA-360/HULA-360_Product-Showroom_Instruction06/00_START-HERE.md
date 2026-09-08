# HULA — Instruction 06: Phối màu lớp học
Ngày: 08/09/2026. Handoff thiết kế và instruction cho AI IDE; không chứa code website.

## Quyết định của bản này
Màn mở đầu tập trung vào sản phẩm trong lớp học không có người. Cho phép chọn 6 màu Cotton Cara và áp dụng lên một bộ hoặc toàn bộ các bộ cùng dòng. Giao diện có vùng xem rộng và bảng chọn màu rõ ràng; bỏ avatar nổi, bàn tay giả và thẻ nhiệm vụ trong chế độ này.

Chế độ nhập vai Cô An / Mẹ Linh / Bé Mây vẫn thuộc dự án, giữ dữ liệu để phát triển sau; không bắt người dùng chọn nhân vật để phối màu. GLB/rig nhân vật không phải điều kiện chặn chức năng mới.

## Đưa gì cho AI IDE?
1. Mở `design/desktop.png` và `design/mobile.png`: mẫu bố cục cần triển khai, không phải ảnh chụp website đã sửa.
2. Dán nguyên `02_AI-IDE_Instruction06.md` và gửi cả thư mục này. IDE thực hiện các chặng liên tiếp, báo bằng ảnh/video thật.
3. Đọc `03_Color-and-Asset-Contract.md` trước khi xử lý màu. `color-preview-config.json` là cấu hình tham chiếu, không phải SKU/giá/mã màu vải chính thức.
4. Đối chiếu sản phẩm với JPEG gốc trong `references/`. Hai trang này đủ xác định dòng Cara tiêu chuẩn và sáu phối màu; không chứa asset sản phẩm 3D hoàn thiện.

## Phân loại ảnh — phải dùng đúng
- `assets/classroom-products-concept.png`: ảnh dựng AI tham khảo không gian với sáu bộ nệm. Không có người. Đây không phải ảnh chụp sản phẩm thật, không bảo đảm kích thước/quy cách may tuyệt đối, không chứng minh đổi màu đã hoạt động.
- `assets/classroom-empty.png`: nền phòng trống dựng AI, dùng làm tham chiếu dựng phòng hoặc nền cho một camera cố định sau khi hiệu chỉnh. Không phải panorama 360 hoặc môi trường 3D.
- Hai ảnh AI không phải cặp layer đã đăng ký khớp pixel; không trừ ảnh để suy ra mask sản phẩm.
- `references/NEM_MN_-_01.jpg` và `NEM_MN_-_03.jpg`: ảnh catalogue thật do chủ dự án cung cấp; căn cứ kiểu dáng, chất liệu, kích thước và bảng màu. Không tự nhận ảnh AI là packshot thật.

Chưa có source code website trong lượt làm việc này nên chưa sửa hoặc kiểm thử beta.nemmamnon.com. Chưa bàn giao model nệm, mask đổi màu hoặc sáu bản render chuẩn cùng camera. IDE phải báo chính xác phần đã chạy và phần tài nguyên còn thiếu; không dùng ảnh tĩnh để giả chứng nhận chức năng hoàn tất.
