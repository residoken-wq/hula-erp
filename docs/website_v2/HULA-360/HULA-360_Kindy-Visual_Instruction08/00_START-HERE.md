# HULA — Instruction08: nâng chất lượng scene theo Kindy Garden
Ngày 09/09/2026. Giữ khung trường, 7 phòng, POV, world state và tương tác của Instruction07. Đợt này thay hình khối thô bằng nội thất, vật liệu và sản phẩm có độ chân thật.

## Đã chuẩn bị
- 17 ảnh gốc gallery từ [dự án Kindy Garden](https://www.nemmamnon.com/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-kindy-garden), giữ nguyên nội dung/watermark, có URL và checksum trong reference-index.json.
- Bảng đối chiếu hình ảnh `design/Kindy-Reference-Board.png`: ảnh thật để IDE so sánh, không phải ảnh website sau sửa.
- Hai ảnh vật liệu AI trong assets/materials: gỗ sáng và vải cotton trung tính. Đây là base-color candidates 1254×1254 thực tế, chưa phải bộ PBR hoàn chỉnh hoặc bản scan vật liệu Kindy.
- Instruction thay sàn, cửa, rèm, tủ kệ, ánh sáng, geometry sản phẩm và góc camera. Không cung cấp code website.

## Cách giao IDE
Gửi toàn bộ ZIP, dán `03_AI-IDE_Instruction08.md`. Yêu cầu làm phòng R4 đang được anh chụp trước, chụp lại cùng vị trí để so sánh, rồi mới áp dụng các module hình ảnh sang R1–R7. Không làm lại hệ thống phòng hoặc chuyển về background JPG.

Định nghĩa “background” trong scene POV: kiến trúc + nội thất 3D + ánh sáng; ảnh lớp học chỉ là evidence. Sản phẩm vẫn là mesh riêng để đổi màu/di chuyển/gấp/cất.

Ảnh dự án có nhiều sản phẩm/kiểu chăn khác nhau. Không suy ra mọi bộ màu đỏ là Cara tiêu chuẩn hay dùng một mesh cho tất cả phòng. Catalogue ở Instruction05/07 vẫn là nguồn quy cách từng product reference. Màu đỏ của dự án không tự trở thành màu thứ7 của Cara trong configurator.

Chưa có model nội thất/model sản phẩm mới hoặc normal/roughness maps trong gói này; IDE thực hiện geometry và thiết lập vật liệu theo hợp đồng. Chưa sửa hoặc kiểm thử website beta trong lượt này.
