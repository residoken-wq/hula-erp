# HULA Instruction13 — Đủ sáu ảnh R7, POV mẹ Linh

## Phạm vi

Gói chứa H0–H5 cho mẹ Linh; H0–H3 mới, H4/H5 từ Instruction12. Ảnh minh họa AI, không phải ảnh sản phẩm thật hoặc animation rig. Chưa triển khai lên beta. Giữ yêu cầu responsive của Instruction11.

## Giao AI IDE

Tích hợp toàn bộ sáu ảnh theo thứ tự dưới đây vào nhánh R7 illustrated_sequence, role me-linh. Đường dẫn tương đối trong gói; nhập vào storage/media CMS hiện có, lưu assetId/version. Không tự tạo một CMS mới. Không dùng các ảnh này cho POV cô An hoặc bé Mây.

| State | File | Nội dung UI đề xuất | CTA |
|---|---|---|---|
| H0 | assets/r7-me-linh-h0.png | Em chào cô An, em đến đón Mây và nhận túi ạ. | Xem túi của Mây |
| H1 | assets/r7-me-linh-h1.png | Túi đã được đặt lên bàn để mình kiểm tra. | Xem nhãn túi |
| H2 | assets/r7-me-linh-h2.png | Đối chiếu thông tin: Mây – Lớp Mầm. | Xác nhận đúng túi |
| H3 | assets/r7-me-linh-h3.png | Cô An đã nhấc túi, mình chuẩn bị nhận. | Đưa tay nhận túi |
| H4 | assets/r7-me-linh-h4.png | Mình đã nắm quai, chờ cô buông tay. | Nhận túi |
| H5 | assets/r7-me-linh-h5.png | Mình đã nhận túi. Cảm ơn cô An! | Hoàn tất bàn giao |

H2 là đối chiếu thông tin mô phỏng trong UI bên ngoài ảnh; nhãn trong ảnh trống/không đủ chữ thật, không nói OCR đã xác nhận. Không tuyên bố kiểm tra đồ bên trong hoặc khóa mặt sau vì hình không chứng minh thao tác đó.

Ảnh nguyên cảnh đã có nhân vật và túi: tắt sprite/background/nhãn/crosshair cũ để tránh nhân đôi. Trình bày nguyên ảnh, không dán vào mesh túi hoặc đặt trước camera WASD. Các scene này không phải panorama 360.

Desktop dùng scene và panel thoại cạnh nhau. Mobile ảnh trên, thoại/CTA dưới trong flow. Dùng contain giữ toàn cảnh vì túi H0 lệch trái và túi H5 sát đáy; không dùng cùng một center-crop cho sáu ảnh. Không đặt card tuyệt đối trên đáy ảnh. Nội dung phải truy cập được tại 400×528, 390×844 và chữ 200%. Chỉ một vùng cuộn nội dung khi cần; ảnh không phải nền bị sheet che.

Đây là các khung minh họa riêng, góc và tỉ lệ túi có sai khác nhẹ. Dùng chuyển cảnh ngắn 200–300ms hoặc chuyển trực tiếp khi reduced motion. Không morph hoặc kéo dài fade để giả chuyển động liên tục. H3/H4 tư thế cầm tay thay đổi giữa khung: chưa đạt kiểm chứng liên tục cơ học. Không báo hoàn thành animation mesh.

Tải/decode ảnh đích trước khi commit state; lỗi giữ bước trước và cho thử lại. Khóa double-click trong chuyển cảnh. H4→H5 chỉ chuyển bagOwner từ teacher sang mother một lần; replay reset; rời phòng hủy tác vụ tải và không cập nhật state của phòng khác. H5 chỉ hiện thành công sau ảnh H5 được hiển thị.

Gói chỉ màu túi xanh. Không dùng filter toàn ảnh để đổi màu; ghi rõ minh họa xanh nếu lựa chọn màu của người dùng khác. Gallery sản phẩm thật vẫn dùng sale kit, không thay bằng ảnh này. Túi minh họa chưa xác minh chính xác khóa phía sau, kích thước hoặc toàn bộ cấu tạo quai.

## Nghiệm thu

- Cả sáu file tải được, map đúng vai và bước, không ảnh phòng cũ xen lẫn.
- H0 chào, H1 túi trên bàn, H2 cận túi, H3 tay mẹ chưa chạm, H4 cùng tiếp xúc quai, H5 cô buông và mẹ giữ.
- CTA và túi không bị che ở desktop/mobile; không tooltip che mặt.
- Video đi đủ H0–H5, replay, đổi phòng; kiểm tra giả lập H5 lỗi.
- Báo riêng: asset đã tích hợp, UI mobile đã sửa, backend/CMS đã lưu thật, kiểm thử nào chưa chạy. Không dùng việc có sáu ảnh để kết luận mọi phần đã xong.

## Còn lại

POV cô An và bé Mây chưa có bộ sáu ảnh tương ứng trong gói này. Ảnh dọc riêng, clip chuyển động và GLB/rig người chưa được hoàn thiện. CMS và lỗi mobile cần AI IDE thực thi rồi cung cấp ảnh/video để kiểm tra; tác giả bộ asset chưa truy cập/sửa mã nguồn website.
