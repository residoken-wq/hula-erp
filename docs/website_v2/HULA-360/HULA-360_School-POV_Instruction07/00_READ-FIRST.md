# HULA School POV — Instruction 07
09/09/2026 · Kịch bản, hợp đồng tương tác và instruction cho AI IDE. Không chứa code website.

## Sửa trách nhiệm của bản 06
Bản 06 bàn giao ảnh concept và UI khi chưa có mesh/mask nệm. Điều đó không đủ để triển khai đổi màu trong cảnh. Screenshot mới xác nhận: chọn Cam nhưng nệm vẫn xanh; góc cận là nệm màu kem có chữ LITTLE OAKS; góc cất đồ là sản phẩm khác; banner website che header trải nghiệm. Đây là kết quả không đạt.

Bản 07 thay thế kiến trúc một phòng ảnh tĩnh của bản 06 bằng trường học 3D theo góc nhìn thứ nhất. Giữ sáu tên màu Cara và dữ liệu sale kit, bỏ các ảnh cận/cất đồ không đúng hàng. Không lấy ảnh dựng phòng của bản 06 làm nền cố định cho trải nghiệm mới.

## Mục tiêu
Chọn Cô An, Mẹ Linh hoặc Bé Mây → vào hành lang → tự đi/chọn cửa vào phòng → trải nghiệm sản phẩm của phòng → đến lớp phối hợp → tham gia bàn giao cuối tuần.

Bảy phòng: Cara, Satin, foam, túi ngủ, túi bảo quản, lớp phối hợp, phòng đón trẻ và bàn giao. Phòng sản phẩm không có người bake trong nền; chỉ phòng bàn giao có NPC động đúng ba nhân vật. Nhân vật đang nhập vai không xuất hiện thêm một bản sao trước camera.

## Dùng bộ này
1. Đọc `01_School-and-Room-Scripts.md`: mặt bằng và kịch bản từng phòng.
2. Đọc `02_Three-POV-and-Handover.md`: lời thoại/hành động theo vai, state bàn giao.
3. Gửi IDE `03_AI-IDE_Instruction07.md` cùng toàn bộ ZIP.
4. IDE làm chặng đầu R1 Cara chạy thật trước, sau đó nhân kiến trúc sang các phòng; tiêu chí ở `04_Acceptance-and-Assets.md`.

Gói kèm catalogue tham chiếu 15 dòng sản phẩm, 12 ảnh nhân vật trước đây và GLB túi đã tạo. Chưa có GLB nệm hay humanoid rig hoàn thiện. Hướng dẫn yêu cầu IDE dựng geometry sản phẩm có vật liệu riêng ngay trong engine hiện có, có thể xuất GLB sau; định dạng GLB không phải điều kiện để đổi màu. Geometry thô chưa đạt nhận diện không được xem là hoàn thiện hình ảnh.

Ảnh nhân vật chỉ là tham chiếu, không phải rig. GLB túi là bản dựng tham khảo đã kiểm tra cấu trúc ở lượt trước; chưa kiểm thử tích hợp website, không có animation người bàn giao. Phần nhân vật phải được hoàn thiện như một đầu việc asset riêng, không dùng avatar đầu người để thay nhân vật trong cảnh rồi nhận hoàn thành.

Tài liệu này chưa phải bản website đã sửa. Bằng chứng nghiệm thu phải được AI IDE ghi từ bản chạy thật.
