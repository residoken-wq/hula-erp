# Đọc ảnh Kindy Garden và chỉ rõ thứ cần thay

Nguồn: [trang dự án HULA](https://www.nemmamnon.com/du-an/cung-cap-giai-phap-nem-mam-non-cho-he-thong-truong-kindy-garden), 17 ảnh gallery tải trực tiếp ngày 09/09/2026; screenshot beta do chủ dự án cung cấp. Nội dung trang mô tả dự án có bộ nệm, túi ngủ và túi, đồng thời đề cập bộ nệm4 khúc. Không dùng mô tả cấp dự án để gán SKU cho từng ảnh.

## 1. Những chi tiết quan sát được
| Nguồn | Quan sát | Chuyển thành asset/thiết kế |
|---|---|---|
| kindy-02,03,05 | Sàn sáng có vân gỗ, đường nối tấm; mảng rèm xanh cạnh cửa kính; tủ cánh pastel | Sàn có texture theo tỷ lệ, cửa khung tối, rèm cuốn xanh và tủ thấp nhiều cánh |
| kindy-04 | Kệ gỗ mở nhiều ô, bàn ghế thấp, khung kính phân ô, chân tường | Hệ kệ/bàn/ghế cùng vật liệu gỗ; có độ dày tấm và mép bo |
| kindy-09,10,12 | Góc rộng thấy chiều sâu, trần sáng dạng ô, cửa cao và ánh sáng bên hông | Không gian có trần/cửa thực, bóng tiếp xúc; camera bao quát có sản phẩm tiền cảnh |
| kindy-08 | Góc trên một bộ: gối có thể tích, đường may, mép vải, mền gấp viền xám, các tai vải | Căn cứ quan sát hình dáng và chi tiết; xác nhận dòng bằng catalogue trước áp dụng |
| kindy-06,07 | Nhiều trạng thái trải/gấp, mặt vải có độ nhăn và khối; khác nhau giữa bộ | Geometry mềm có nếp lớn, chần và viền tách riêng; không là miếng phẳng hình chữ nhật |
| kindy-13,14 | Nệm gấp có độ dày và lớp, túi ở ô riêng, kệ có chiều sâu/cánh/bản lề | Kệ có slot theo kích thước folded mesh, shadow trong hộc, cửa có pivot nếu tương tác |
| kindy-15,16 | Góc chính diện kệ, nhiều tầng, viền sáng của bộ gấp nổi rõ | Nghiệm thu góc cất: nhìn rõ vật đang cất và cùng identity/color |
| kindy-17 | Túi dự án đỏ/xám, nhãn/logo và quai; có túi cá nhân màu nâu cạnh đó | Chỉ tham chiếu túi HULA; không coi túi nâu là sản phẩm HULA |

Mảng xanh lớn thấy trong các ảnh có rèm cuốn và dây kéo rèm; không sơn tất cả tường thành xanh chỉ vì ảnh có nhiều màu xanh. Tường chính sáng, trần sáng, nền gỗ có cảm giác ấm. Tên gỗ và kích thước nội thất không được cung cấp; các thông số dựng ở tài liệu02 là lựa chọn thiết kế.

## 2. Lỗi thị giác ở beta hiện tại
- Phòng gần như một hộp xám: thiếu chân tường, khung cửa, trần hoàn thiện và đồ nội thất định tỷ lệ.
- Sàn nâu đồng nhất: không có hướng vân, mạch tấm hoặc phản xạ nhẹ.
- Cửa sổ là ô tối với một đốm sáng: chưa tạo cảm giác ánh sáng ngoài trời. Cần kiểm tra geometry, material và setup ánh sáng thực tế, không khẳng định nguyên nhân từ screenshot.
- Túi ngủ rất phẳng, gối chưa đọc được thể tích; đường trắng dựng đứng và vòng cyan gây nhiễu. IDE phải kiểm tra đó là helper/selection hay mesh sai transform; không xóa tai vải thật theo phỏng đoán.
- Nhãn màu bị cắt “Xanh dư…”, “Xanh ng…” và REF-* nằm trên tiêu đề khách xem. Tên màu cần đủ; mã kỹ thuật chuyển vào chế độ debug.

## 3. Điều học theo / điều không sao chép
Học không gian sáng, tỷ lệ đồ mầm non, nhóm tủ đẹp, độ mềm sản phẩm và các góc ảnh thực. Không bê người ở kindy-01/11 vào nền. Không bake watermark HULA hoặc logo trường lên texture sàn/vải. Giữ ảnh nguồn nguyên bản trong evidence; nếu mở gallery tham khảo thì ghi nguồn Kindy Garden và giữ attribution.

Ảnh có nắng và watermark không phải albedo, normal hoặc panorama. Không dùng cùng một ảnh lớp học làm sàn, tường và environment. Tham khảo vật liệu nền, còn màu và logo thương mại phải đúng dòng/biến thể hiện có.
