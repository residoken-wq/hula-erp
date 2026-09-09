# Phiếu nghiệm thu hình ảnh

Mỗi mục phải có ảnh/video từ bản chạy thật. Các mục dưới là mục tiêu chưa kiểm trên beta hiện tại.

| Mục | Đạt khi | Chưa đạt khi |
|---|---|---|
| Sàn | Vân rõ vừa phải, đúng tỷ lệ, không seam lặp nổi bật, có bóng tiếp xúc | Mảng nâu/texture kéo giãn/đường ghép chồng nhau |
| Cửa và rèm | Khung rõ, rèm tách tường, ánh sáng bên ngoài hợp lý | Ô đen với chấm sáng hoặc toàn tường xanh |
| Tủ/kệ | Có độ dày, hộc sâu, cạnh bo, pastel/gỗ nhất quán | Hộp thô hoặc ảnh kệ gắn lên plane |
| Gối/chăn/nệm | Silhouette mềm, gối có khối, viền theo mép, chần đúng loại | Plane mỏng, hộp cứng, vải bố quá lớn, hoa văn tự bịa |
| Góc cận | Cùng instance/product/color; đọc rõ cấu tạo | Ảnh màu kem/sản phẩm khác xuất hiện |
| Góc cất | Bộ thực ở đúng slot, lớp gấp có chiều dày, bóng khớp | Nhân đôi bộ, đổi màu/scale, kệ không sâu |
| Phối màu | Vải đổi, viền/tường/sàn/ánh sáng ổn định | Swatch đổi nhưng vật không đổi hoặc cả phòng bị nhuộm |
| UI | Tên màu đầy đủ, không mãREF trong header, scene đủ rộng | Ellipsis tên màu, debugger/helpers trong cảnh |

Kiểm bằng cùng camera trước–sau, cùng ánh sáng khi so màu. Bổ sung phiên góc Mây0.95m để phát hiện texture/cạnh bị lộ ở thấp. Screenshot không chứng minh animation/FPS; dùng video và số đo riêng.

Nguồn thực địa là đối chiếu hình ảnh, không có dữ liệu scan/HDRI/camera calibration. Bản08 không tuyên bố tái tạo chính xác Kindy Garden từng centimet. Khung trường giả lập giữ nguyên; mục tiêu là chất lượng nội thất và sản phẩm tương xứng nguồn thật.
