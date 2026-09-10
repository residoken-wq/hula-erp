# HULA · Instruction09 — dùng ảnh sản phẩm thật

Giữ phòng học, sàn, tủ/kệ và hành trình hiện có. Chỉ nâng sản phẩm và phần xem ảnh thật.

Lỗi hiện tại: model Cara có hình khối và bề mặt quá đơn giản; chọn màu chạy được nhưng gối/chăn giống nhựa, không có chất chần của ảnh nguồn. Texture vải chung trong bản08 không đủ thay thế ảnh bề mặt đúng sản phẩm.

Bộ này có ảnh gốc của hai dự án Sright/KIS, trang catalogue và bản đồ vùng ảnh 6 màu Cara. Ảnh được giữ nguyên, không dùng AI tạo lại rồi gọi là ảnh thật. Không có model/texture atlas/normal map mới trong gói; việc nâng mesh/material là bước IDE cần làm.

## Dùng ngay
- Dán `01_AI-IDE_Instruction09.md` cho IDE cùng ZIP.
- `catalogue-photo-regions.json`: vùng ảnh có sản phẩm theo6 màu để dựng gallery Cara chính xác. Vùng crop là chỉ dẫn hiển thị, không phải mask alpha hoặc UV atlas.
- `photo-index.json`: URL gốc và đường dẫn từng ảnh dự án.
- `02_Product-Source-Rules.md`: phân biệt mẫu chuẩn và mẫu tùy biến.

Ưu tiên bản mẫu một bộ Cara: ảnh thật theo màu + mesh đã nâng chi tiết + đối chiếu ba góc. Sau đó mới nhân sang các bộ khác.
