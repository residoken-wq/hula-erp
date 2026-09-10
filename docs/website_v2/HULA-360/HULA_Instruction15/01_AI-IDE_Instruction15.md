# Instruction15 — R7 góc nhìn bé Mây

## Phạm vi

Sáu ảnh minh họa H0–H5 mới cho role be-may. Tạo bằng công cụ tạo ảnh tích hợp, prompt trong source-index.json. Người xem chính là bé nên không có mặt/thân bé trong ảnh. Camera nhìn thấp lên hai người lớn; cô An trái, mẹ Linh phải. Đây là minh họa theo khung, không phải rig/animation, ảnh chụp sản phẩm hoặc panorama 360. Chưa triển khai website.

## Prompt giao AI IDE

Giữ shared mobile layout của Instruction11. Nhập sáu ảnh vào media CMS và gắn R7 + be-may + H0–H5; không chỉ đổi nhãn vai trên bộ ảnh người lớn. Không thêm nhân vật bé Mây vào scene khi đang dùng POV này. Ảnh nguyên cảnh đã có cả cô/mẹ/túi: tắt nền, sprite nhân vật, túi và crosshair cũ trong nhánh illustrated_sequence. Không WASD hoặc camera orbit trên ảnh phẳng.

| State | File trong assets | Câu của bé | CTA |
|---|---|---|---|
| H0 | r7-be-may-h0.png | Mẹ đến đón con rồi! | Xem túi của con |
| H1 | r7-be-may-h1.png | Con thấy túi màu xanh trên bàn. | Nhìn nhãn túi |
| H2 | r7-be-may-h2.png | Mẹ cùng con xem tên nhé. | Cùng mẹ xác nhận |
| H3 | r7-be-may-h3.png | Cô An đang đưa túi cho mẹ. | Xem mẹ nhận túi |
| H4 | r7-be-may-h4.png | Mẹ đã cầm quai túi rồi. | Xem tiếp |
| H5 | r7-be-may-h5.png | Con chào cô An, con về với mẹ ạ! | Chào cô và hoàn tất |

Bé quan sát và nhận diện, không thay mẹ thực hiện giao dịch bàn giao. Người giữ túi cuối cùng luôn mother, không be-may. “Cùng mẹ xác nhận” là hành động mô phỏng; dữ liệu tên Mây – Lớp Mầm nằm ở UI ngoài ảnh, không coi chữ nhỏ trong ảnh là kết quả OCR. Không yêu cầu trẻ tự đọc nhãn để đi tiếp, luôn có nút hỗ trợ; nếu có giọng đọc, chỉ phát sau thao tác và có nút tắt, transcript tương đương. Gói không chứa audio.

## Desktop/mobile

Desktop scene và panel cạnh nhau. Mobile ảnh trên, thoại và CTA bên dưới trong flow. Dùng contain toàn ảnh; H5 túi lệch phải, center-cover sẽ cắt mất. Không kéo giãn hoặc phóng to toàn ảnh chỉ để che viền. H2 là góc gần túi, phần đầu người lớn có thể nằm ngoài ảnh có chủ đích; không crop thêm. Bố trí tên vai/nút bản đồ gọn, không tự bật product sheet khi mở R7. Thẻ ngắn một câu, chữ rõ và nút chạm ít nhất 44px; nội dung bổ sung mở riêng, không chồng tooltip lên tay/túi.

Chỉ minh họa túi xanh. Không filter toàn scene để đổi màu. Ảnh sale kit vẫn ở gallery thật; ảnh AI không chứng minh cấu tạo quai, khóa phía sau, kích thước hoặc đồ bên trong. Không gọi H2 là kiểm tra đồ bên trong.

## State và tải ảnh

Decode ảnh đích trước khi commit bước; loading không báo thành công. H4→H5 chuyển bagOwner teacher→mother đúng một lần. Double click không nhảy bước; replay reset H0; rời phòng hủy tác vụ tải; lỗi tải giữ bước hợp lệ và cho thử lại. Đổi vai đóng overlay và reset H0 để tránh sai trạng thái. Không nhảy về H0 âm thầm giữa hành động vì asset role bị thiếu: báo tải lỗi nếu role đã được chọn mà thiếu binding.

Dùng cut/crossfade ngắn; reduced motion chuyển trực tiếp. Không morph hoặc báo đây là hoạt ảnh liên tục. Dữ liệu session không mang lại thông tin giao nhận thật hay xác nhận logistics trên ERP.

## Kiểm tra đã thực hiện và còn lại

Đã xem sáu khung: không có bé ở phía trước camera, cô trái/mẹ phải; H3 cô giữ và tay mẹ chưa chạm; H4 cả hai cùng cầm quai; H5 mẹ giữ, cô buông/vẫy. Cấu trúc nền nhất quán theo ảnh gốc nhưng tỷ lệ túi, khoảng cách, tư thế vẫn thay đổi giữa khung; H5 bỏ bàn khỏi khung. Chưa chứng nhận continuity cơ học hoặc camera chính xác 0,95m. Chưa có ảnh dọc riêng; contain là phương án hiện có.

Nghiệm thu IDE: video H0–H5 ở 400×528, 390×844 và desktop; ảnh/túi/CTA không bị che; đổi cả ba vai; H5 lỗi tải; replay. Ghi rõ PASS/FAIL từng mục. Chưa có bằng chứng UI mobile hay CMS đã được sửa trên beta.

## Tình trạng toàn bộ R7

| Vai | Gói | Ảnh | Tình trạng |
|---|---|---|---|
| Mẹ Linh | Instruction13 | H0–H5 | Đủ ảnh minh họa; cần kiểm tra tích hợp/continuity |
| Cô An | Instruction14 | H0–H5 | Đủ ảnh preview; còn khác vị trí bé/nội thất, H2 chưa cận |
| Bé Mây | Instruction15 | H0–H5 | Đủ ảnh minh họa góc thấp; chưa kiểm tra runtime |

Tổng 18 ảnh không đồng nghĩa R7 đã hoàn thành. Bước kế tiếp nên đồng bộ các khung còn sai và kiểm tra bản preview với cả ba vai; không tiếp tục thêm tính năng để né lỗi mobile, CMS hoặc asset hiện tại. Không tuyên bố GLB/rig người đã có.
