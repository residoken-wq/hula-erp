# Prompt thực hiện cho AI IDE

## Mục tiêu

Tích hợp 18 ảnh R7 từ gói Instruction16, sửa shared mobile theo Instruction11 và nối quản trị ảnh theo Instruction10. Không dựng lại sản phẩm/phòng đã được chấp nhận. Không phát hành production trong công việc này; giao preview và bằng chứng kiểm thử. Kiểm kê mã nguồn/admin/storage hiện có trước, tái sử dụng, không tự tạo CMS thứ hai.

## 1. Nguồn ảnh duy nhất

r7-assets.json có roleId, stepId, file, kích thước và checksum thật. Import ảnh vào storage/media, trả về assetId/version, liên kết đúng room R7 + role + step. Đường dẫn file trong gói là đường dẫn tương đối, không dùng đường dẫn scratch làm URL web. Không hardcode thứ tự bằng tên người hiển thị; dùng ID ổn định. Không để ảnh cũ nằm trong fallback hợp lệ rồi vô tình hiển thị thay bản mới.

Ảnh nguyên cảnh: tắt background/sprite túi/nhân vật/crosshair cũ khi nhánh illustrated_sequence hoạt động. Ảnh không phải panorama/mesh, không WASD hay orbit. Giữ gallery sale kit cho ảnh sản phẩm thật, không dùng cảnh AI để thay catalogue.

## 2. Vai và kịch bản

| State | Mẹ Linh | Cô An | Bé Mây |
|---|---|---|---|
| H0 | Chào cô, xem túi | Chào mẹ, chọn túi | Nhìn mẹ đến đón |
| H1 | Xem túi trên bàn | Chỉ túi đã chọn | Nhận ra túi xanh |
| H2 | Cùng xác nhận tên | Đối chiếu tên | Cùng mẹ xem tên |
| H3 | Chuẩn bị nhận | Nhấc túi đưa mẹ | Quan sát cô nhấc túi |
| H4 | Nắm quai nhận | Chờ mẹ cầm, buông quai | Xem mẹ nhận túi |
| H5 | Giữ túi, chào cô | Đã trao, chào bé | Chào cô, về cùng mẹ |

Người giữ cuối là mẹ với mọi vai. H2 chỉ đối chiếu dữ liệu tên mô phỏng ở UI: Mây – Lớp Mầm; không nhận diện chữ AI bằng OCR, không tuyên bố kiểm tra bên trong/khóa mặt sau. Bé không cần tự đọc để đi tiếp. Chọn vai mới reset H0, đóng overlay và hủy tải frame cũ; có thông báo gọn “Bắt đầu lại theo góc nhìn ...”.

## 3. Render và mobile

Desktop: scene/panel cạnh nhau; mobile: scene trên, thoại/CTA dưới trong flow. Dùng contain toàn ảnh. Không center-cover cho mọi ảnh vì túi H0 mẹ lệch trái, H5 bé lệch phải và H5 mẹ sát đáy. Không overlay thoại/tooltip lên vùng túi hoặc bàn tay. Chữ 200% vẫn truy cập được nội dung và nút, cho cuộn đúng vùng khi cần.

R1–R6 vào lần đầu product sheet đóng mặc dù có selectedProductId. Header có thể hai hàng; tên vai gọn; chỉ một modal chính. Không body scroll và nhiều sheet cuộn lồng vô ích. Không sửa bằng z-index/offset riêng từng phòng. Kiểm tra ngay frame đầu ở 400×528, 390×844, 360×640, desktop1366×768. Map có modal fit chiều cao, nhãn R7 không trùng chữ.

## 4. Chuyển bước

Decode ảnh đích trước khi commit; giữ bước hợp lệ khi tải lỗi, có thử lại. Double click khóa khi đang chuyển. H4→H5 cập nhật bagOwner teacher→mother đúng một lần sau khi ảnh đích đã sẵn sàng hiển thị. Replay reset; rời phòng hủy tác vụ, không update scene mới từ callback cũ. Không prefetch 18 PNG cùng lúc: ưu tiên frame hiện tại và kế tiếp theo vai. Có thể tạo bản WebP/AVIF tối ưu trong pipeline dự án, giữ originals và kiểm tra chất lượng trước khi dùng; gói hiện là PNG gốc.

Cut/crossfade ngắn là chuyển cảnh minh họa, không animation rig. Reduced motion chuyển trực tiếp. Không gọi đổi màu túi bằng CSS filter toàn scene; hiện bộ này chỉ xanh. Khi người dùng chọn màu khác ở phòng sản phẩm, giữ lựa chọn nhưng giải thích trong phần chi tiết rằng cảnh bàn giao minh họa xanh.

## 5. CMS

Người quản trị chọn R7 → vai → bước → Thay ảnh → Preview desktop/mobile → Lưu nháp → Xuất bản. UI không yêu cầu sửa JSON. Public chỉ đọc revision published; publish kiểm tra đủ 18 binding, giữ bản cũ khi lỗi. Rollback nguyên revision. Không xóa media vẫn được bản published/rollback dùng. Upload và phân quyền server theo Instruction10.

Binding đủ chỉ chứng minh không thiếu file, không chứng minh UI/continuity đã đạt. Dùng trạng thái riêng assetReady, runtimeTested, visualAccepted. Không tự đặt runtimeTested=true khi import.

## 6. Kiểm tra và báo cáo

Dùng 02_ACCEPTANCE.csv, điền actualResult/evidence/status. Chỉ PASS khi có bằng chứng; build thành công không đủ. Giao URL preview + commit/version + video cả ba vai H0–H5 + screenshot cold load R1–R7 mobile + clip thay ảnh CMS draft/publish/rollback. Phần chưa làm ghi NOT_RUN/BLOCKED và lý do cụ thể.

## Giới hạn hiện có

Đã kiểm tra tệp: 18 PNG, 18 cặp role-step duy nhất, có kích thước/checksum. Đã xem ảnh sửa cô An H0/H2: vị trí bé đúng bên phải, H2 cận túi. Chi tiết room/pose/scale của các bộ còn thay đổi; chưa đạt continuity cơ học hoặc ánh xạ chính xác cùng một không gian 3D giữa ba POV. Chưa có rig/clip người, ảnh dọc riêng hay audio. Lần thử mở https://beta.nemmamnon.com bằng công cụ truy cập web trả lỗi không mở được; đây không phải bằng chứng website bị down. Không đánh dấu UI/mobile/CMS đã kiểm thử.
