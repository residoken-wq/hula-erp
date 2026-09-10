# DÁN CHO AI IDE — SẢN PHẨM TỪ ẢNH THẬT

Phòng, sàn và kệ đã được chủ dự án chấp nhận. Giữ chúng, chỉ sửa sản phẩm đang trông như tấm nhựa và bổ sung ảnh thật tương ứng.

## 1. Sử dụng ảnh thật trực tiếp ngay trong phần xem sản phẩm
Trong inspector thêm khu “Ảnh sản phẩm” bên cạnh thông số, cho phóng to/thu lại. Khi xem Cara tiêu chuẩn và chọn màu, hiển thị đúng vùng ảnh màu đó trong `photos/catalogue/NEM_MN_-_03.jpg`; tọa độ nằm trong `catalogue-photo-regions.json`. Dùng ảnh nguồn trực tiếp với crop/viewport phù hợp hoặc xuất crop không tái tạo nội dung. Đừng đưa nguyên trang catalogue thu nhỏ đến mức không thấy sản phẩm.

Ảnh này là ảnh catalogue có chữ YOUR LOGO HERE minh họa tùy biến; chú thích phù hợp, không lấy chữ đó làm logo mặc định của model. Không nhầm việc crop vùng chữ thành xóa nhận diện thực của dự án. Khi có packshot sạch đúng mẫu trong CMS, map thay vùng catalogue. Việc sử dụng ảnh để hoàn thiện chức năng đã được chủ dự án yêu cầu; không dừng chờ xin phép lại chỉ vì tài liệu nguồn có ghi nội bộ. Không đăng cả bộ catalogue lên website ngoài phạm vi sản phẩm đang tích hợp.

“Lại gần trong lớp” tiếp tục điều khiển camera POV. “Ảnh sản phẩm” mở ảnh thật có tên và nguồn, không âm thầm tráo canvas 3D thành JPEG. Đóng ảnh trở lại đúng camera/instance/color trước đó. Ảnh thật không bị CSS filter nhuộm theo màu; chọn ảnh biến thể có sẵn đúng màu. Nếu chưa có ảnh cho một biến thể, ghi “Ảnh tham khảo” cùng màu thật của ảnh, không ghi ảnh khớp lựa chọn.

## 2. Thay bề mặt generic bằng asset theo nguồn sản phẩm
Không chỉ tăng roughness hoặc phủ weave chung lên model cũ rồi nhận hoàn thành. Tạo bộ asset cho một Cara tiêu chuẩn:
- Tham chiếu tổng thể: NEM_MN_-_01.
- Sáu phối màu/cấu trúc chần tiêu chuẩn: NEM_MN_-_03.
- Góc nghiêng và độ mềm từ ảnh dự án chỉ dùng khi đã đối chiếu đúng cấu tạo; Sright và KIS là project references, chưa được gán SKU Cara tiêu chuẩn.

Tách nệm, gối, chăn, viền, nhãn thành surface/material riêng. Khối gối mềm, cạnh nệm bo và chăn có lớp/nếp gập. Phải phân biệt phần gối/chăn với một khối đùn nguyên tấm.

Từ vùng ảnh phù hợp, chuẩn bị texture bề mặt: tách đúng phần sản phẩm, hiệu chỉnh phối cảnh, loại trừ sàn/túi che phía trước, xử lý ánh sáng đã bake và map UV tương ứng. Không dán nguyên ảnh có gối/chăn lên cả model vốn đã có gối/chăn gây nhân đôi chi tiết. Không bake watermark hoặc logo trường vào albedo dùng chung. Phần bị che/khuất không thể khôi phục đúng bằng đoán từ một ảnh; dùng góc ảnh khác hoặc ghi modeling assumption.

Đường chần cần có normal/height/shading hợp lý; nếp lớn và silhouette cần geometry. Không tự biến ảnh RGB thành normal chỉ bằng đổi màu. Nếu dùng vẽ/AI tạo map từ ảnh, ghi là texture tái dựng và so với nguồn, không nhận đó là scan chính xác.

Màu vải nên dùng albedo trung tính + material tint, hoặc texture variants khớp UV. Giữ quilting, viền xám, nhãn và roughness khi đổi màu; không nhân Hồng lên albedo Xanh rồi cho ra sai màu. Ảnh catalogue6 màu là căn cứ đối chiếu kết quả, không phải6 ảnh toàn phòng để tráo.

## 3. Ràng buộc nhận diện
Cara tiêu chuẩn: nệm 120×63cm, gối 40×25cm, chăn 130×70cm. Không gán độ dày 3 cm của foam. Source KIS đỏ/xám không chứng minh Cara có phối đỏ/xám sẵn; source Sright có mẫu tùy biến không chứng minh mọi Cara đều có khóa tháo chăn.

Giữ nguyên productReference, instanceId, scope đổi màu và trạng thái lưu. Cả nhóm trong phòng vẫn chỉ đổi đúng nhóm đó. Từng bộ trên sàn phải có cùng chi tiết bề mặt với bản xem gần; không có một model đẹp riêng chỉ trong inspector.

## 4. Làm một bộ trước, nghiệm thu bằng hình
A. Map 6 ảnh Cara trong inspector, chứng minh chọn Xanh lá → ảnh thật Xanh lá; chọn Hồng → ảnh thật Hồng.
B. Nâng model/material của một bộ Cara trên sàn. Chụp ảnh ở3 góc: từ trên, nghiêng 45 độ và cận viền/gối; cạnh ảnh nguồn tương ứng để so.
C. Quay video đổi 6 màu và tiến gần: giữ viền/chần/gối/chăn, không thành nhựa và không mất state.
D. Khi bộ mẫu đạt mới share geometry/textures sang các instance; material color vẫn độc lập. Giữ kệ/phòng đã được chấp nhận.

Bàn giao phải có: đường dẫn ảnh nguồn đang được UI dùng; các texture/maps thật được tạo; tên material/mesh đã thay trên renderer đang chạy; ảnh/video từ bản chạy. Nếu chỉ thêm gallery mà model trên sàn vẫn cũ, báo gallery hoàn thành nhưng model chưa đạt. Không dùng ảnh nguồn làm screenshot chứng minh model đã được sửa.
