# DÁN NGUYÊN VĂN CHO AI IDE — HULA INSTRUCTION 06

Bạn đang chỉnh dự án HULA hiện có. Hãy thực hiện thay đổi và tự kiểm tra, không chỉ trả lời kế hoạch. Bộ handoff kèm theo là hợp đồng thiết kế. Chủ dự án yêu cầu: UI/UX dễ nhìn, mượt; chọn màu nệm ngay trong lớp học; background hoàn toàn không có người và sản phẩm phải đối chiếu sale kit.

## 0. Phạm vi và nguyên tắc
- Ưu tiên bản 06 cho màn phối màu. Giữ dữ liệu/cấu hình nhập vai cũ để dùng lại; không xóa lịch sử hoặc thay cấu trúc CMS hàng loạt.
- Không viết lại toàn bộ website. Đọc code thực tế, package/lockfile và convention trước khi sửa. Không đoán đường dẫn từ tài liệu cũ.
- Không chờ GLB/rig nhân vật. Bản này là showroom sản phẩm không người; cần tài nguyên nệm riêng để đổi màu.
- Không dùng screenshot làm toàn bộ UI. Các nút, radio màu và panel phải là thành phần giao diện thao tác được.
- Không gọi ảnh JPG rê trái/phải là 3D Interactive Mesh hoặc panorama 360. Phân biệt renderer thực tế và chỉ cung cấp tương tác nó hỗ trợ.

## 1. Đọc hiện trạng và chọn tuyến render
Tự xác định entry/modal trải nghiệm, nguồn settings, renderer hiện tại, asset loader, dữ liệu sản phẩm và camera owner. Các đường dẫn ở bản cũ chỉ là đầu mối. Ghi nhận ngắn gọn file thực tế, cách render và phần dùng lại; rồi tiếp tục triển khai.

Nếu đã có scene 3D và nệm có mesh/material riêng: giữ engine hiện có, dùng tuyến A.
Nếu đang là Canvas2D/ảnh phẳng: hoàn thành UI và tuyến B có mask/render variants thật khi có tài nguyên phù hợp. Không tự thêm khung 3D rỗng hoặc nút xoay không hoạt động. Nếu chưa có layer/mask/variant, hoàn thành shell/giao diện, để preview ảnh có nhãn đúng và báo chức năng đổi màu còn thiếu asset; tuyệt đối không đánh dấu done.

A — Scene 3D: phòng và nệm riêng; phối màu bằng material, xem được ba camera preset. Ảnh phòng trống kèm theo là tham chiếu dựng cảnh, không phải sphere texture. Mesh trên nền ảnh chỉ dùng camera cố định đã hiệu chỉnh; không cho di chuyển tạo parallax giả.
B — Ảnh/layer theo góc: mỗi góc có scene ID, ảnh sạch cùng camera, layer sản phẩm và mask vải cho từng bộ, hoặc 6 bản render được xuất cùng geometry/camera/lighting. Cho chọn góc bằng tab; không giả free-orbit. Không lấy 6 ảnh AI độc lập làm 6 màu vì hình học/ánh sáng sẽ thay đổi. Đọc chi tiết trong Color Contract.

## 2. Bố cục phải bám mẫu
Mở `design/desktop.png` và `design/mobile.png` trước khi sửa. Các ảnh là mẫu thiết kế, không phải background để dán lên app.

Desktop từ 1024 px:
- Full viewport dialog nếu đây là modal hiện tại, dùng chiều cao viewport động, focus trap và khôi phục focus khi đóng. Nếu là page riêng, dùng landmark bình thường, không gán role dialog.
- Header cao 72 px; trái: tên HULA có thể dùng logo asset thật hiện có + “Phối màu lớp học”. Phải: Trợ giúp và Đóng, vùng chạm 48 px.
- Bên phải panel rộng 360 px, padding 24 px, nền trắng ấm. Bên trái là vùng scene còn lại; không đặt panel đè lên nệm.
- Scene dùng phần lớn diện tích. Thanh ba góc đặt ở dải riêng dưới scene cao 64 px. Không cắt foreground mat chỉ để phủ đầy ảnh; poster dùng contain, render 3D phải fit camera.
- Panel: Bộ nệm Cotton Cara → Chăn tiêu chuẩn → Màu sắc/tên màu đang dùng → 6 swatch có tên → phạm vi Toàn bộ lớp/Một bộ → danh sách bộ nếu cần → kích thước → nút Xem chi tiết.
- Body 16/24 px; nhãn phụ tối thiểu 14/20 px; tiêu đề 24/32 px. Không thu nhỏ toàn UI theo viewport bằng transform scale.
- Ô màu là cả card bấm được, tối thiểu 48 px cao, bố trí 3 cột × 2 hàng; màu chọn có viền và dấu check, không chỉ khác màu nền.
- Background app #F7F8F5, panel #FFFFFF, text #183B3A, text phụ #566967, line #DDE5E1, accent #087F8C. Radius card 16, control 12; shadow nhẹ. Không gradient cyan–tím, không neon/glow.

Mobile dưới 1024 px:
- Header 56 px; scene và thanh góc phía trên, bảng màu bên dưới. Bản chuẩn 390×844 có bảng thu gọn vẫn thấy đủ 6 màu và phạm vi.
- Dùng layout phân vùng theo chiều cao thực có; không fixed panel phủ mất scene. Ở màn thấp hoặc landscape, cho panel cuộn và giữ scene tối thiểu 220 px; không khóa cả trang gây cắt CTA.
- Chỉ chi tiết dài mới mở bottom sheet; sheet cuộn bên trong, có nút đóng và safe-area. Chạm vuốt panel không xoay camera.
- Không ép xoay ngang. Kiểm tra 360×800, 390×844, 844×390 và tablet 768×1024.
- Nút đổi góc có tên; nhãn “Cận sản phẩm” có thể xuống dòng, không thu font dưới 14 px. Camera controls chỉ hiện khi thực sự hỗ trợ.

## 3. Nội dung và sản phẩm
- Tên chức năng “Phối màu lớp học”. Dòng mặc định “Bộ nệm Cotton Cara — Chăn tiêu chuẩn”.
- Dùng reference ID REF-MAT-CARA-STD để đối chiếu CMS, không coi nó là SKU bán hàng.
- Theo sale kit: nệm 120×63 cm, gối 40×25 cm, chăn 130×70 cm. Không thêm chiều dày 3 cm của foam vào Cara.
- Sáu màu: Xanh dương / Xanh lá / Xanh ngọc / Cam / Vàng / Hồng. Thứ tự, tên và selection đồng nhất các góc.
- Ghi chú một dòng: “Màu hiển thị chỉ mang tính tham khảo.” Không tự tạo 80 màu Satin.
- Background không có người ở bất kỳ góc nào, cả thumbnail, ảnh tải ban đầu và fallback lỗi. Bỏ NPC portrait, tag túi, bàn tay capsule, thoại và taskcard khỏi showroom.
- Chỉ dùng ảnh thật từ bộ đã được cho phép public của dự án cho gallery thương mại. Catalogue kèm theo là evidence thiết kế; ảnh dựng AI là tham khảo không gian. Không tự bịa logo, họa tiết hay nhãn khách hàng.

## 4. Đổi màu phải có kết quả trong cảnh
Thực hiện `03_Color-and-Asset-Contract.md`, không chỉ state cho swatch.
- Mặc định xanh dương, áp dụng Toàn bộ lớp. Các phần vải của nệm/gối/chăn trong cùng bộ đổi đồng bộ; viền xám, logo/nhãn, nền và túi giữ nguyên.
- Chọn “Một bộ”: giữ bộ đang chọn, nếu chưa có thì chọn bộ đầu tiên và ghi rõ “Bộ 01”. Có danh sách lựa chọn tương đương việc bấm lên nệm.
- Chuyển phạm vi không tự tô lại. Chỉ lần chọn màu kế tiếp mới áp dụng phạm vi mới. Nếu nhiều bộ khác màu, hiển thị “Nhiều màu”, không tự tick một màu sai.
- Đổi góc giữ màu từng instance và phạm vi. Cận sản phẩm nhìn bộ đang chọn; tổng thể thấy tất cả. Nếu góc cất đồ không hiển thị bộ đang chọn, báo “Bộ đang chọn ở khu trải nệm” và có nút quay lại; không đổi màu túi thay cho nệm.
- Không reload background, không reset camera, không flash trắng hoặc hiển thị màu cũ sau thao tác nhanh. Yêu cầu mới nhất thắng, dispose/cancel request cũ đúng vòng đời.
- Chỉ báo “Đã áp dụng” sau khi render/layer hiện màu thành công. Nếu lỗi, giữ màu trước và có Thử lại; swatch không được báo thành công giả.

## 5. Thao tác, độ mượt và khả năng tiếp cận
- Khi dữ liệu đã sẵn sàng: phản hồi chọn màu trong 100 ms; chuyển màu khoảng 180–250 ms. Đây là mục tiêu cần đo, không tự ghi đã đạt.
- Chuyển camera 450–650 ms có easing, chỉ khi người dùng chọn góc. Với reduced motion, đổi trực tiếp. Khi người dùng kéo camera, hủy tween trước; chỉ một controller được ghi camera mỗi frame.
- Mục tiêu 60 fps desktop, ít nhất 30 fps mobile khi tương tác, phải báo thiết bị và kết quả đo. Không render loop vô hạn khi cảnh tĩnh nếu renderer cho phép render theo nhu cầu.
- Lazy-load trải nghiệm; cache geometry/material/textures hợp lý. Với 3D, dùng texture 1K–2K theo nhu cầu, giới hạn DPR mobile theo đo thực tế. Không tăng bloom/postprocessing để che vật liệu sai.
- Pointer drag tách click: kéo không chọn nhầm nệm. Raycast chỉ vùng scene; pointer trên panel không xuyên xuống canvas. Dispose listeners, geometry/material sở hữu riêng khi đóng.
- Tab/Shift+Tab tới được mọi nút; radio màu điều khiển bằng phím mũi tên, dấu check và label đọc được; live region thông báo đổi màu sau commit. Có focus visible. Chữ thường tương phản tối thiểu 4.5:1.
- Target 48 px là tiêu chuẩn thiết kế của dự án; không viết nhầm đây là ngưỡng tối thiểu AA của WCAG 2.2.
- Nút “Xem chi tiết” mở drawer thông số thật và ảnh thật đã được map; không dẫn tới URL tưởng tượng. Giữ luồng liên hệ/báo giá hiện có nếu có, không tự thêm đơn hàng hoặc API gửi yêu cầu.

## 6. Thứ tự thực hiện và bằng chứng bàn giao
Thực hiện tuần tự, không dừng xin duyệt giữa các chặng sửa có thể hoàn tác:
1. Layout + loại bỏ người/UI nhập vai ở showroom. Chụp desktop/mobile để tự so mẫu và sửa lệch trước.
2. Map sản phẩm và màu; hoàn thiện tuyến render khả dụng. Kiểm tra viền xám, chần và bóng vẫn nguyên.
3. Hoàn thiện ba góc, state màu, lỗi, loading, keyboard và mobile.
4. Kiểm tra tích hợp; trả danh sách file sửa, renderer thực dùng, ảnh trước/sau và video thao tác.

Các ca bắt buộc:
- Mở mới: không người ở cả poster lẫn scene; thấy đúng sản phẩm và màu mặc định.
- Lần lượt chọn đủ 6 màu: vải thay đổi; tường/sàn/kệ/ánh sáng/viền xám không đổi.
- Chọn Một bộ → Bộ 02 → Hồng: chỉ Bộ 02 đổi. Đổi góc rồi về: màu còn đúng.
- Chuyển Toàn bộ lớp khi các bộ khác màu: không tự tô; hiển thị Nhiều màu. Chọn Vàng sau đó mới đồng bộ tất cả các bộ cùng dòng.
- Bấm 10 màu liên tiếp: kết quả cuối đúng lựa chọn cuối, không tải đè.
- Network/asset failure: giữ bản hiển thị trước, thông báo ngắn, retry được. Không có màu “selected” trái với ảnh.
- Keyboard đầy đủ; mobile không bị cắt swatch/CTA; không scroll ngang; mở/đóng 5 lần không nhân đôi listeners/scene.
- Đường vào trải nghiệm và cờ bật/tắt CMS, route visibility cũ còn đúng.

Bàn giao ảnh 1440×900 và 390×844, thêm video khoảng 20–30 giây thể hiện: toàn lớp xanh → toàn lớp hồng → chỉ Bộ 02 vàng → đổi góc → quay lại. Không dùng ảnh mockup trong handoff làm “ảnh sau sửa”. Nếu chưa có mesh/mask đúng, ghi rõ phần đó chưa hoàn tất và liệt kê đúng tài nguyên cần; không biến việc đổi màu swatch thành nghiệm thu chức năng.
