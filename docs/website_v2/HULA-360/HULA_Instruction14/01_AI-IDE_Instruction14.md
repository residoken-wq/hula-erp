# Instruction14 — R7 góc nhìn cô An

## Gói tài nguyên

Sáu ảnh minh họa AI H0–H5, role co-an. Đây là bộ ảnh để tích hợp bản preview, chưa nghiệm thu continuity toàn cảnh; không phải GLB, rig, video hoặc ảnh chụp sản phẩm. Tạo bằng công cụ sinh ảnh tích hợp, prompt gốc lưu trong source-index.json. Các khung H1–H5 đã sửa riêng: bỏ tay áo kem của người xem thành cẳng tay trần để phù hợp cô An mặc polo ngắn tay; giữ áo kem của mẹ Linh đối diện.

## Mapping bắt buộc

| Bước | File trong assets | Lời cô An | CTA |
|---|---|---|---|
| H0 | r7-co-an-h0.png | Chào mẹ Linh, hôm nay mình bàn giao túi của Mây nhé. | Chọn túi của Mây |
| H1 | r7-co-an-h1.png | Mình đặt túi trên bàn để cùng đối chiếu. | Xem thông tin túi |
| H2 | r7-co-an-h2.png | Cùng xác nhận thông tin Mây – Lớp Mầm. | Xác nhận đúng túi |
| H3 | r7-co-an-h3.png | Mình giữ quai túi và đưa về phía mẹ Linh. | Đưa túi cho mẹ |
| H4 | r7-co-an-h4.png | Mẹ Linh đã nắm quai, mình chuẩn bị buông tay. | Buông quai túi |
| H5 | r7-co-an-h5.png | Mẹ đã nhận túi. Chào Mây, hẹn gặp con nhé! | Hoàn tất bàn giao |

Người xem là cô An, không hiển thị mặt cô An. Tay tiền cảnh là tay cô, mẹ Linh đứng đối diện, bé Mây không nhận túi cuối cùng. Không reuse ảnh mẹ Linh cho role cô An hoặc chỉ đổi tên trên header. Dữ liệu tên nhãn là mô phỏng UI, không đọc chữ nhỏ AI như thông tin xác minh thật. H2 hiện là góc đối chiếu trung cảnh, chưa đạt ảnh cận kỹ thuật; không mô tả kiểm tra khóa/bên trong.

## Tích hợp

Dùng nhánh illustrated_sequence có sẵn, nhập media vào CMS và bind room R7 + role co-an + step. Không tạo hệ thống mới. Khi đổi vai, đóng tooltip/sheet, hủy tải frame cũ và reset H0; nếu UI đã có chức năng giữ bước thì phải giữ cả trạng thái bàn giao nhất quán, không chỉ ảnh.

Tắt toàn bộ sprite túi/nhân vật và nền 3D cũ trong nhánh ảnh nguyên cảnh. Không WASD trên ảnh phẳng. Desktop scene và panel cạnh nhau; mobile ảnh trên, thẻ/CTA dưới trong flow. Contain toàn ảnh; không card trên vùng túi, không crosshair giữa mặt nhân vật. Kiểm tra 400×528 và 390×844 theo Instruction11.

Load và decode frame đích trước khi commit. H4→H5 chuyển người giữ túi từ teacher sang mother đúng một lần. Tải lỗi giữ bước trước, có thử lại; double click không bỏ bước; replay reset. Dùng chuyển cảnh ngắn hoặc cut, không morph giả animation. Các ảnh chưa khớp pixel hoặc tư thế liên tục.

Chỉ minh họa túi xanh. Không filter toàn ảnh để đổi màu, không dùng trong gallery ảnh sản phẩm thật. Bề mặt, kích thước, vị trí khóa và quai của ảnh AI không thay thông số sale kit.

## Kiểm tra hình ảnh và giới hạn đã biết

Đã xem cả sáu khung và bản sửa tay: H3 cô giữ túi, H4 cả hai tiếp xúc quai, H5 mẹ giữ và cô vẫy chào; không thấy mặt người chơi. Tuy nhiên H0 bé đứng khác phía so với H1–H5 và có túi cá nhân của mẹ; bố trí cửa/tủ và chi tiết túi thay đổi giữa khung. Vì vậy gói có đủ slot cho preview nhưng CHƯA đạt continuity cho bản hoàn thiện. Không tự báo toàn bộ R7 đã xong. H2 chưa thực sự là closeup. Cần sửa đồng bộ các khác biệt này nếu dùng chuỗi chuyển cảnh liền mạch. Không lật ảnh toàn cảnh để sửa vị trí bé vì sẽ đảo phòng và bên tay.

## Bằng chứng IDE cần giao

Video H0–H5 vai cô An trên desktop/mobile; chuyển mẹ Linh→cô An; replay; giả lập H5 lỗi. Giao bảng trạng thái riêng cho asset, responsive, backend CMS và continuity. Chưa có bằng chứng website đã được sửa từ bộ tài liệu này.

Còn lại: bộ POV bé Mây, hoàn thiện continuity, asset dọc nếu cần, kiểm tra UI thật và animation/rig người. Instruction13 vẫn là bộ riêng cho mẹ Linh, không bị thay thế.
