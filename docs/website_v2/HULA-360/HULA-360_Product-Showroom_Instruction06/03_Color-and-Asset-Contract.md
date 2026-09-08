# Hợp đồng màu và asset

## 1. Dữ liệu chuẩn
`color-preview-config.json` cung cấp tên sáu màu có trong catalogue, với HEX do thiết kế chọn để mô phỏng gần ảnh. Chưa phải mã màu vải chính thức; không suy ra SKU/stock. Nguồn chính: NEM_MN_-_01 và NEM_MN_-_03 trong references.

Mỗi bộ cần một ID instance ổn định qua các góc (mat-01…mat-06), một product reference và một color ID. Một màu thuộc dòng sản phẩm, không phải global theme. Camera preset, phạm vi áp dụng, selection và màu từng instance là state riêng.

Đổi màu toàn lớp áp dụng các bộ cùng REF-MAT-CARA-STD được đăng ký, kể cả bản gấp trên kệ nếu renderer có biểu diễn đúng cùng instance. Không tạo bản sao cùng bộ vừa nằm sàn vừa trên kệ; đồ mẫu trên kệ có ID riêng. Túi thuộc dòng khác không nằm trong scope này.

## 2. Tuyến A: nệm 3D có material riêng
Asset đề xuất, chưa có trong gói: `hula_cara_standard.glb`.

| Nhóm surface | Có đổi màu? | Yêu cầu |
|---|---|---|
| Mattress_Fabric | Có | Neutral albedo, giữ quilting normal/roughness/UV |
| Blanket_Fabric | Có | Chăn mỏng, mặt vải và nếp gấp đúng nguồn |
| Pillow_Fabric | Có | Gối riêng, cùng màu bộ |
| Piping_Gray | Không | Viền xám liên tục |
| Label / Logo | Không | Layer/material riêng; không placeholder |
| AntiSlip_Back | Không mặc định | Không nhuộm texture mặt dưới theo mặt trên |
| Room / Furniture / Bag | Không | Không dùng chung material với vải nệm |

Các tên trên là hợp đồng mong muốn, chưa khẳng định file hiện có dùng các tên này. IDE phải map tên thật hoặc chuẩn hóa bằng asset pipeline.

Không nhân một texture xanh đã có màu với màu hồng rồi mong ra hồng đúng: màu material được nhân với color map. Cần albedo vải trung tính và mask sạch hoặc texture variants thật. Giữ normal, roughness, AO và hình học; clone material theo instance/scope khi cần để một bộ không làm đổi tất cả do share reference. Texture/geometry tĩnh có thể share để tiết kiệm bộ nhớ.

Thiết lập color space, tone mapping và exposure đúng phiên bản engine cài trong dự án; khóa lighting khi so màu. Texture màu khác với dữ liệu normal/roughness. Không dùng CSS filter, hue-rotate cả canvas hoặc ánh sáng màu để mô phỏng màu vải. [Three.js: color map được điều biến bởi màu material](https://threejs.org/docs/pages/MeshBasicMaterial.html).

Ảnh phòng 1536×1024 trong gói là ảnh phối cảnh thường. Không map vào sphere 360. Nếu overlay mesh lên ảnh, camera chỉ được zoom/pan hình 2D tương thích, không có free parallax; shadow receiver phải khớp sàn đã hiệu chỉnh.

## 3. Tuyến B: compositing 2D theo từng góc
Mỗi góc phải có một trong hai bộ đầu vào:
- Room plate cùng camera + các layer sản phẩm có alpha + mask vùng vải theo instance; hoặc
- Bộ render màu đã xuất từ cùng geometry/camera/lighting, có hỗ trợ layer theo instance nếu cung cấp chế độ Một bộ.

Mask cần nhận diện nệm, gối, chăn của từng bộ; loại trừ viền, nhãn, vật che phía trước và contact shadow. Mask có antialias ở mép nhưng không tràn màu lên sàn. Vải gốc trung tính/shading layer cho phép giữ nếp chần và độ sáng tối. Nếu chỉ có ảnh xanh đã bake, việc khử màu và tạo mask cần QA; không tuyên bố fidelity như texture sản phẩm thật.

Ảnh AI có nệm kèm trong gói chỉ là concept. Chưa có mask/layer tương ứng, không dùng một lần hue shift toàn ảnh. Hai ảnh phòng AI có thể khác vài chi tiết nên không dùng hiệu ảnh để lấy alpha. Không upscale hoặc crop ảnh rồi gọi là góc chụp khác.

Nếu không có asset đổi màu hợp lệ, ưu tiên UI, map dữ liệu và liệt kê asset còn thiếu. Trạng thái preview tĩnh cần thể hiện đúng; không nghiệm thu tính năng phối màu khi nệm còn bất động.

## 4. Transaction đổi màu
1. Người dùng chọn màu + phạm vi. Chụp danh sách instance mục tiêu tại thời điểm thao tác.
2. Chuẩn bị material/texture/layer của yêu cầu mới. Khi tải bất đồng bộ, giữ màu đã commit và trạng thái pending riêng.
3. Commit hình ảnh và dữ liệu cùng lần cập nhật; chuyển tiếp nhẹ nếu có thể. Yêu cầu cũ không được overwrite yêu cầu mới.
4. Lỗi: giữ màu trước, thông báo ngắn và retry. Đổi góc không mất lựa chọn.

Mỗi scene phải có map instance ID tương ứng. Nếu chưa hỗ trợ một bộ riêng, không hiển thị nút Một bộ giả hoạt động. Đây là thiếu capability phải báo, không phải kết quả đạt yêu cầu cuối.

## 5. QA nhìn và đo
Ảnh đối chiếu xanh/hồng/vàng phải cùng camera, ánh sáng và kích thước viewport. Ngoài vùng vải và viền antialias của nó, cảnh phải ổn định. Giữ xám của viền, hình chần, đổ bóng và chi tiết nhãn. Không đòi toàn bộ pixel vải bằng HEX vì ánh sáng làm thay đổi giá trị hiển thị.

Kiểm tra ở 100% zoom, thiết bị thật hoặc emulation có thông số rõ. Mốc phản hồi và FPS là mục tiêu nghiệm thu chưa đo trên website hiện tại.

Tham khảo tương tác: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) và [focus visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). Dự án chọn vùng chạm 48 px; WCAG 2.2 AA có tiêu chí target size 24×24 CSS px với ngoại lệ, không phải 48 px bắt buộc.
