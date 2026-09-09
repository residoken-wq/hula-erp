# Góc nhìn thứ nhất và kịch bản theo vai

## Nguyên tắc camera
Cô An: mắt khoảng 1.55 m; Mẹ Linh: 1.60 m; Bé Mây: 0.95 m. Đây là thông số thiết kế từ bộ nhân vật trước, không phải chiều cao toàn thân. Camera gắn với điểm mắt nhân vật, có collider và hướng nhìn. Không hiện chân dung người đang nhập vai lơ lửng trong cảnh. Không có tự quay camera hoặc rung đầu mặc định.

“Lại gần” đưa người dùng tới điểm đứng/quỳ quan sát hợp lệ cạnh sản phẩm, không đổi sang camera bay kiểu quảng cáo. Khi quỳ, chuyển chiều cao có chủ đích; có nút đứng dậy. Người dùng vẫn nhìn vật thể từ bên ngoài ở vị trí con người có thể đứng; không chui vào nệm. Đổi vai tại điểm an toàn, giữ màu và thế giới, chuyển tới spawn tương ứng, không xuyên tường khi đổi chiều cao.

Desktop: kéo để nhìn, phím di chuyển tùy chọn; cửa/điểm đứng có thể bấm để đến. Mobile: vuốt nhìn, chạm điểm đến, không bắt dùng hai joystick. Không bắt pointer lock ngay lúc vào. Chỉ một hệ thống điều khiển camera hoạt động mỗi thời điểm.

## Lời dẫn/hành động của ba vai trong bảy phòng
Lời dẫn ngắn, có thể tắt; không bắt đọc hội thoại để thao tác. Các câu dưới là nội dung hư cấu của dự án.

| Phòng | Cô An — tôi chuẩn bị lớp | Mẹ Linh — tôi tìm hiểu đồ của con | Bé Mây — con tự khám phá |
|---|---|---|---|
| R1 Cara | “Mình phối màu cho các bộ nệm của lớp.” Chọn cả nhóm, kiểm nhãn và kích thước. | “Mình muốn nhìn kỹ bộ nệm Mây sẽ dùng.” Chọn một bộ, đổi màu rồi lại gần. | “Con thử chọn màu con thích nhé!” Chạm màu, tìm lại đúng bộ. |
| R2 Satin | “Mình xem dòng Satin và cách bố trí trong lớp.” Kiểm kích thước, so Cara. | “Bộ này khác bộ vừa xem ở điểm nào?” Xem dữ liệu thật, bề mặt và viền. | “Con đi tới bộ nệm bên cửa sổ.” Điểm đến lớn, lời mô tả đơn giản. |
| R3 Foam | “Mình thử gấp và cất bộ bốn khúc.” Gấp, chọn ô, cất, lấy ra. | “Mình xem bộ nệm được gấp gọn như thế nào.” Quan sát thao tác vật thể từ vị trí của mẹ. | “Con xem bộ nệm xếp lại nhé.” Chạm nút hỗ trợ mô phỏng, không ngụ ý trẻ tự nâng đồ nặng. |
| R4 Túi ngủ | “Mình so phần chăn của hai mẫu.” Chọn tiêu chuẩn/nâng cao đúng instance. | “Mình xem kỹ phần chăn và kích thước.” So thông số, màu Cara. | “Con tìm màu giống bộ con đã chọn.” Chọn mẫu/màu, không phải trả lời bài kiểm tra. |
| R5 Túi | “Mình kiểm quai, khóa và nhãn trước khi cất.” Xem mặt trước/sau, đặt đúng ô. | “Mình cần nhận ra túi của Mây.” Xem nhãn Mây, xác nhận tên/lớp. | “Con tìm nhãn tên Mây.” Chạm nhãn; có gợi ý nếu chọn nhầm. |
| R6 Phối hợp | “Mình bố trí các nhóm sản phẩm cho lớp.” Phối theo nhóm; xem đủ khu. | “Mình xem đồ được dùng và cất trong lớp thế nào.” Đi khu nghỉ → kệ → R7. | “Con đi theo dấu đến góc đồ của con.” Điểm đến trực quan, không hiện panel thông số dài mặc định. |
| R7 Bàn giao | Tôi kiểm và trao túi. NPC: Linh, Mây. | Tôi kiểm nhãn và nhận túi. NPC: An, Mây. | Tôi nhận ra túi của mình và nhìn cô trao cho mẹ. NPC: An, Linh. |

Mây vẫn có thể mở thông tin khi cần; chỉ thay thứ tự/nội dung mặc định. Không ẩn cứng tính năng khám phá theo tuổi vai hư cấu. Tất cả vai dùng cùng world state và sản phẩm, không có ba bản cảnh riêng sai khác.

## R7 — kịch bản chuẩn 6 bước
Túi `bag-may-01`, nhãn “Mây — Lớp Mầm”. Bộ nệm tham chiếu `REF-MAT-CARA-STD` trong danh mục đồ; túi `REF-BAG-HANDLE`. Nhận diện bằng tên/lớp, không bằng logo chiếc lá. Kẹp tóc lá của Mây được giữ theo thiết kế nhân vật, không biến thành thương hiệu túi.

| Bước | Cảnh nhìn thấy | Cô An POV | Mẹ Linh POV | Bé Mây POV | Điều kiện hoàn tất |
|---|---|---|---|---|---|
| H0 Gặp nhau | Cô ở bàn, mẹ tại cửa, Mây cạnh mẹ | Nhìn mẹ và Mây: “Chào mẹ Linh, cô đã chuẩn bị túi của Mây.” | Đi đến bàn: “Em chào cô An.” | Đi cùng mẹ: “Con chào cô.” | Người dùng tới vùng gặp; chỉ khởi động một lần |
| H1 Tìm túi | Túi Mây trên kệ, vài túi nhãn hư cấu khác | Chọn đúng bag-may-01 để đưa lên bàn | Nhìn cô chọn túi và bấm “Xem nhãn” | Chạm nhãn Mây để chỉ cho cô | ID nhãn đúng; chọn nhầm được gợi ý, không chuyển bước |
| H2 Kiểm thông tin | Cùng túi ở bàn, nhãn nhìn rõ | “Túi của Mây, Lớp Mầm đây nhé.” Xác nhận nhãn và danh mục | “Đúng tên và lớp của con rồi.” Xác nhận | “Tên Mây của con đây!” Chỉ nhãn; mẹ xác nhận danh mục | Label check + danh mục được xác nhận |
| H3 Chuẩn bị trao | Cô cầm quai túi, mẹ đưa tay | Bấm “Trao túi cho mẹ Linh” | Bấm “Nhận túi” | Bấm “Nhờ mẹ nhận túi”; con quan sát hai người lớn | Đúng người nhận, đúng túi, hai nhân vật sẵn sàng |
| H4 Chuyển túi | Quai túi chuyển từ tay cô sang tay mẹ, chỉ một túi | Cô thả sau khi mẹ nắm | Mẹ giữ túi sau điểm chuyển | Mây nhìn cùng hành động, không tự nhận thay mẹ | Ownership đã chuyển và clip kết thúc hợp lệ |
| H5 Kết thúc | Túi trong tay mẹ, cô đứng trước mặt | “Hẹn gặp lại Mây đầu tuần nhé.” | “Cảm ơn cô, mẹ con em về nhé.” | “Con chào cô An!” | Hiện kết thúc sau khi H4 hoàn tất, có Khám phá tiếp / Xem lại |

## State machine và chuyển quyền sở hữu
Trạng thái hợp lệ: waiting → bag_selected → label_verified → ready_to_transfer → transferring → received → completed.

- Một bag-may-01 duy nhất; holder bắt đầu là shelf, sau đó table, teacher, mother. Không tạo thêm bản sao tại mỗi state.
- Khi bắt đầu H4, gắn túi theo grip point tay cô. Tại marker `grip_transfer`, giữ world transform rồi đổi parent sang tay mẹ; đồng bộ clip hai người. Marker chỉ chạy một lần trong một transaction.
- Clip chung `idle`, `reach_out`, `hold_bag` không tự tạo thành bàn giao hoàn chỉnh. Cần timeline hai nhân vật, grip transforms và marker thật.
- Trước marker: hủy/rời phòng thì trả về trạng thái ready với túi thuộc cô. Sau marker: giữ trạng thái received với túi thuộc mẹ; không quay lại tạo túi mới. Nếu lỗi clip trước marker, không hiện hoàn thành.
- Bấm đúp: cùng action token chỉ được xử lý một lần. Trong transferring, không đổi vai; cho bỏ chuyển động bằng cách hoàn tất transaction tới endpoint hợp lệ, không bỏ qua kiểm nhãn.
- Replay tạo encounter mới sau khi dọn state cũ, trả NPC/túi về H0, giữ các phối màu ở R1–R6.
- Đổi vai trước H3: chuyển spawn an toàn và vai điều khiển, giữ state đủ điều kiện; không tua lại toàn bộ trường. Chọn “Xem lại từ đầu” mới reset encounter.
- Khi đang nhập vai Cô An/Mẹ Linh, không render đầu/thân toàn bộ của chính nhân vật vào camera. Tay POV chỉ bật khi có model/rig phù hợp; không thay bằng capsule vàng. Mây POV thấy hai NPC đầy đủ trong H4.

## Yêu cầu nhân vật
Giữ nhận diện từ 12 ảnh trong references/characters. Cô An tóc buộc thấp, polo turquoise, quần be; mẹ Linh tóc ngang vai, áo kem, quần xanh; Mây bob đen, kẹp lá bên phải của bé, áo vàng nhạt, quần xanh. Nhân vật dựng AI có thể phong cách bán hiện thực đồng nhất, nhưng không được thay bằng icon chân dung để tuyên bố đã có NPC 3D.

Tài nguyên rig/clip người chưa có trong gói: phần R7 chưa thể nghiệm thu chỉ nhờ GLB túi. IDE chuẩn bị đầy đủ scene/state/attachment contract, tích hợp asset khi có; tiến độ riêng phải ghi “chưa hoàn tất”, không cản dựng sản phẩm và màu ở R1–R6.
