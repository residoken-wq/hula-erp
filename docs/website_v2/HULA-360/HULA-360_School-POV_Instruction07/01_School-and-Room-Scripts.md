# Trường mầm non HULA — thiết kế hành trình

## 1. Tổ chức trường
Đây là trường giả lập phục vụ trải nghiệm sản phẩm, không đại diện một trường khách hàng. Ngôn ngữ hình ảnh: tường sáng, sàn gỗ nhạt, đồ nội thất mầm non vừa tỷ lệ, biển phòng tiếng Việt. Nhất quán kiến trúc, ánh sáng và tỷ lệ sản phẩm giữa các phòng.

Hành lang là không gian di chuyển thật trong scene. Người dùng có thể đi đến cửa hoặc bấm bản đồ nhỏ để đến điểm đứng hợp lệ trước cửa. Mỗi phòng tải theo nhu cầu. Có lối quay lại hành lang; không bắt hoàn thành nhiệm vụ mới ra được.

| ID / phòng | Sản phẩm trọng tâm | Bố trí và việc phải làm được | Thời lượng gợi ý |
|---|---|---|---|
| R1 · Lớp Lá — Cotton Cara | REF-MAT-CARA-STD | 6 bộ đang trải, một bàn kiểm sản phẩm; thay 6 màu, xem viền/chần/gối/chăn của cùng bộ | 60–90 giây |
| R2 · Lớp Nắng — Satin | REF-MAT-SATIN-STD | 3 bộ tiêu chuẩn, bàn xem chất liệu; nhận biết dòng Satin, kiểm kích thước đúng | 45–75 giây |
| R3 · Lớp Mầm — Nệm foam | REF-FOAM-FOLD4 và REF-FOAM-BASIC | 1 bộ gấp bốn khúc, 1 bộ cơ bản để so; thao tác gấp đúng 4 đoạn và đưa lên kệ | 60–90 giây |
| R4 · Lớp Mây — Túi ngủ | REF-SLEEP-CARA-STD / PLUS, Satin ở khu so sánh | 2 trạm tiêu chuẩn/nâng cao; xem chăn mỏng so với chần gòn, phối màu Cara | 60–90 giây |
| R5 · Góc Gọn Gàng — Túi bảo quản | 5 REF-BAG-* | 5 mẫu ở giá riêng; xem quai, vị trí khóa/dây rút, nhãn và chọn ô cất | 60–90 giây |
| R6 · Lớp HULA — Phối hợp sản phẩm | Đại diện tất cả 5 nhóm trên | Lớp hoàn chỉnh: khu nghỉ, bàn kiểm, kệ cất, móc túi; đổi lựa chọn từng nhóm và phối màu đúng dòng | 90–120 giây |
| R7 · Phòng Đón Bé — Bàn giao cuối tuần | REF-BAG-HANDLE + hồ sơ bộ của Mây | Cô An, Mẹ Linh, Bé Mây; kiểm nhãn, xác nhận, chuyển túi và kết thúc | 60–90 giây |

Tuyến khám phá đủ khoảng 8–12 phút là ước lượng thiết kế. Có tuyến nhanh 3 phòng R1 → R6 → R7; không ép người dùng xem toàn bộ catalogue. “Đủ loại” ở R6 nghĩa là đủ nhóm sản phẩm, không xếp tất cả kích cỡ/biến thể vào lớp.

## 2. Mặt bằng tham chiếu cho IDE
Tọa độ thiết kế theo mét, trục Y lên, mặt sàn Y=0, không phải đo đạc trường thật. Hành lang rộng 4 m theo trục Z; ba cặp phòng hai bên. R1/R2 ở Z=4, R3/R4 ở Z=11, R5/R6 ở Z=18; R7 ở cuối Z=27. Phòng hai bên 8×6 m, tâm X=-6 hoặc +6. R7 8×8 m, tâm X=0. Cửa thông hành lang đặt tại X=-2 hoặc +2; cửa R7 tại Z=23. Spawn hành lang (0,0,0.5), hướng về cuối hành lang. IDE phải dựng collider, cửa và lối đi phù hợp, không coi các tọa độ này là camera preset của sản phẩm.

## 3. Kịch bản R1 — chọn màu và nhận diện cùng một bộ
**Bối cảnh:** buổi chuẩn bị lớp, không có trẻ trong phòng. Mỗi bộ có instance ID Cara-01…06; riêng góc kiểm là một instance khác nếu trưng bày thêm.

1. Qua cửa: biển Lớp Lá, sáu bộ Cara mỏng viền xám. Lời mở theo vai ở tài liệu 02.
2. Tiến đến Cara-02: viền nhấn nhẹ xuất hiện khi trỏ, thẻ nhỏ “Bộ 02 · Cotton Cara”. Bấm/chạm chọn.
3. Mở bảng màu: chọn Cam. Nệm, gối và chăn của Cara-02 đổi sang Cam ngay; viền xám và phòng giữ nguyên. Không có toast kỹ thuật.
4. Chọn “Các bộ Cara trong phòng” rồi Hồng: chỉ các instance Cara ở R1 đổi. Không nhuộm các dòng khác.
5. Bấm “Lại gần”: camera di chuyển đến điểm quan sát của chính Cara-02, nhìn rõ viền và chần. Không đổi sang JPEG khác. Có nút “Đứng dậy/Quay lại vị trí trước”.
6. Xem nhãn/thông số: drawer lấy reference của Cara-02. Nệm 120×63, gối 40×25, chăn 130×70 cm. Không tự gán cấu tạo foam hoặc khóa kéo của dòng khác.
7. Đi ra rồi quay lại: màu từng bộ còn nguyên trong phiên.

**Kết quả:** người dùng hiểu màu, tỷ lệ và bề mặt sản phẩm. Không bắt thao tác gấp Cara khi chưa có mô phỏng vải đúng; hành động gấp được tập trung ở R3 có cấu tạo 4 đoạn rõ ràng.

## 4. Kịch bản R2 — xem đúng dòng Satin
1. Qua cửa Lớp Nắng: biển “Bộ nệm Satin”, ba bộ có cùng nguồn mẫu; không dùng lại nệm Cara rồi chỉ đổi tiêu đề.
2. Chọn Satin-01 → lại gần bề mặt/viền → mở kích thước nệm 120×65 cm, gối 40×25, chăn 130×70.
3. “So với Cara” mở bảng chỉ các thông số có nguồn, giữ scene Satin và cho chọn trở lại R1. Không chuyển sang foam màu kem.
4. Nếu chưa có bảng màu Satin chuẩn, hiển thị phối màu có nguồn hiện tại và “Xem bảng màu” theo tài nguyên thật. Không tạo 80 màu ngẫu nhiên hoặc gắn sáu màu Cara mặc định cho Satin.
5. Ra hành lang; trạng thái sản phẩm được giữ.

## 5. Kịch bản R3 — thao tác cất đồ thực sự
1. Chọn Foam-Fold4-01 tại khu trải: nệm 120×60×3 cm, bốn đoạn rõ ràng, drap theo catalogue.
2. “Gấp nệm”: bốn segment của cùng instance gập tuần tự theo pivot, không xuyên nhau hoặc sàn. Thời gian toàn thao tác khoảng 1.5–2.5 giây, có thể bỏ chuyển động với reduced motion.
3. “Cất lên kệ”: chính instance đó đi tới ô kệ đã chỉ định, footprint nằm trọn trong ô. Kệ phải được bố trí đủ chỗ theo mesh thực; không đổi ảnh toàn cảnh.
4. Đi gần kệ: xem đúng bộ, còn màu/ID/trạng thái folded. “Lấy ra” đảo quá trình, về vị trí trải hợp lệ.
5. Chọn Foam-Basic-01: xem mặt sau/khóa nếu có asset mô tả đúng. Không hiện thao tác gấp bốn khúc cho loại cơ bản.

Khi người dùng rời phòng trong animation: hoàn tất đến endpoint an toàn hoặc hoàn tác nguyên tử theo quy tắc chung; không để nệm biến mất/nhân đôi.

## 6. Kịch bản R4 — trải nghiệm túi ngủ
1. Hai trạm Cara tiêu chuẩn và nâng cao, tên nhãn trên UI lấy cùng product reference với model.
2. Chọn trạm tiêu chuẩn: xem phần chăn mỏng và tỷ lệ; chọn một trong sáu màu Cara, màu cập nhật đúng instance.
3. Chọn trạm nâng cao: nhìn cận bề mặt chăn chần gòn có nguồn. Giữ khác biệt hình học/material, không chỉ đổi dòng chữ.
4. So sánh Satin tiêu chuẩn/nâng cao trong drawer hoặc khu mẫu phụ nếu model đã có. Chỉ bật mở khóa nối chăn khi biến thể có tùy chọn khóa được xác nhận.
5. “Xem phần chăn” là camera nhìn sản phẩm; không giả chuyển động kéo khóa nếu asset chưa có. Không đưa claim y tế hoặc kháng khuẩn ngoài nguồn.

## 7. Kịch bản R5 — phân biệt túi và vị trí cất
1. Giá trưng bày 5 mẫu: balo rút, quai xách, quai đeo, túi hộp, túi hộp diễu. Mỗi mẫu có silhouette riêng.
2. Chọn mẫu → lại gần → xoay chính sản phẩm trên giá kiểm hoặc di chuyển đến phía sau, giữ camera góc nhìn người dùng. Balo rút dùng dây rút; quai xách/quai đeo khóa mặt sau; túi hộp khóa mặt trên.
3. Túi quai xách dùng GLB đi kèm để bắt đầu; các mẫu khác phải dựng riêng, không dùng lại cùng mesh rồi đổi tên.
4. Chọn một ô cất còn trống → đưa túi vào ô/móc phù hợp → lấy lại. Vị trí đặt phải kiểm footprint và quai, không xuyên kệ.
5. Nhãn Mây xuất hiện ở túi dành cho kịch bản, không tự in lên mọi hàng thương mại. Không khẳng định nệm chắc chắn nhét vừa khi chưa có thể tích trong túi/kích thước bộ đã gấp.

## 8. Kịch bản R6 — lớp phối hợp
Bố trí: khu A Cara, khu B Satin, khu C foam, khu D túi ngủ, kệ E túi bảo quản. Mỗi khu 1–2 bộ đại diện, có lối đi. Tối đa các điểm tương tác gần camera hiện nhãn; không phủ dày hotspot.

1. Từ cửa nhìn toàn lớp; thấy sự khác nhau giữa các nhóm, không thấy người ngủ.
2. Đi tới một nhóm → chọn sản phẩm → bảng điều khiển tự đổi theo đúng product reference/capability.
3. Chọn màu Cara Cam với phạm vi “Các bộ Cara trong phòng”: Cara đổi, Satin/foam/túi giữ nguyên. Phạm vi không vượt sang R1 hoặc R4.
4. Muốn phối từng bộ: chọn instance và màu; khi nhiều màu cùng nhóm hiển thị “Nhiều màu”.
5. Đi đến kệ xem mẫu đang cất; lấy/cất vật thể được hỗ trợ. Không có tab chung trỏ tới ảnh kệ lạ.
6. “Xem lựa chọn của tôi” tóm tắt loại/màu/instance đang chọn, không tự tạo đơn mua hàng hoặc giá giả.
7. Qua cửa R7 tham gia bàn giao. Bộ dành riêng cho Mây trong kịch bản có record riêng; không tự lấy ngẫu nhiên sản phẩm đang chọn ở R6 làm đồ của Mây.

## 9. R7 — cuộc gặp cuối tuần
Phòng đón trẻ có bàn kiểm, kệ túi và cửa ra. Bối cảnh cuối tuần, các sản phẩm đã được sắp gọn. Cô An, Mẹ Linh và Mây là NPC/nhân vật động, không bake người vào background. Kịch bản và điều kiện chuyển bước chi tiết ở tài liệu 02.

Không mô tả nệm đã được nhét vào túi bằng animation khi chưa xác minh độ vừa. Dùng túi đã đóng, kiểm nhãn và danh mục đồ; thông tin “bộ của Mây” là dữ liệu kịch bản hư cấu, không phải chứng nhận combo thương mại.
