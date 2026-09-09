# DÁN NGUYÊN VĂN CHO AI IDE — INSTRUCTION 07

Hãy sửa dự án HULA hiện có theo bộ HULA-360_School-POV_Instruction07. Thực hiện công việc, không chỉ trả kế hoạch. Không tạo thêm bản showroom ảnh tĩnh.

## A. Lỗi phải xử lý ngay
Screenshot hiện tại: chọn Cam nhưng nệm vẫn xanh, toast ghi “Pipeline 3D/Mask… khi có GLB”; cận cảnh hiển thị foam màu kem thêu LITTLE OAKS; góc cất đồ là bộ hoa văn khác; banner website phủ header trải nghiệm. Đây đều là lỗi nghiệm thu.

1. Gỡ mapping ba ảnh không đồng nhất khỏi tuyến trải nghiệm tương tác. Ảnh concept bản 06 chỉ được giữ ở tài liệu tham khảo, không là scene sản phẩm mới.
2. Gỡ thông báo kỹ thuật GLB/pipeline khỏi giao diện khách. Không đổi tên màu khi màu vật thể chưa commit.
3. Sửa lớp hiển thị: fullscreen experience nằm trong portal/layout riêng; banner/floating widgets trang gốc không đè lên. Khôi phục trạng thái trang khi đóng; giữ cờ enabled/route visibility CMS cũ.
4. Đọc actual code, lockfile, renderer trước khi chỉnh. Giữ engine 3D đang có nếu phù hợp; nếu đang là ảnh/Canvas2D thì tạo scene 3D thật cho tuyến mới. Không tiếp tục zoom/crop ảnh rồi gọi là góc nhìn sản phẩm.

## B. Định nghĩa sản phẩm tương tác
GLB là định dạng trao đổi, không phải điều kiện bắt buộc để vật thể trong engine có geometry và material. Trong chặng R1, hãy dựng nệm bằng geometry/tham số trong engine nếu chưa có GLB. Có thể xuất GLB để chuẩn hóa sau. Không dừng ở câu “chờ GLB” cho đổi màu.

Mỗi bộ là một group/instance gồm nệm, gối, chăn, viền xám và nhãn riêng. Bắt đầu Cara tiêu chuẩn theo references/NEM_MN_-_01.jpg và NEM_MN_-_03.jpg: nệm 1.20×0.63 m, gối 0.40×0.25, chăn 1.30×0.70. Chăn có thể gấp/mắc trên bộ để vừa bố cục, không âm thầm thay kích thước gốc. Chiều dày Cara chưa xác nhận, lưu trong modeling assumptions chứ không công bố như thông số thật.

Geometry phải thể hiện vật mềm, mép bo, viền riêng, gối riêng, chần bề mặt và chăn mỏng; hộp phẳng màu chỉ là bước kiểm chức năng, không đủ nghiệm thu hình ảnh. Không gán foam 3 cm, khóa kéo hoặc họa tiết LITTLE OAKS cho Cara.

Đổi màu: đổi material nhóm vải nệm/gối/chăn, giữ viền/nhãn/chống trượt và phòng. Albedo nền trung tính, giữ chần/roughness/normal/shadows; không nhân hồng lên texture xanh có sẵn hoặc hue-rotate cả canvas. Material của một bộ có state độc lập để chọn Một bộ không nhuộm tất cả do share reference.

Dùng 6 tên màu Cara và preview HEX từ config kèm theo; chưa phải mã màu vải chính thức. Satin/túi/foam dùng bảng biến thể có nguồn của chính dòng, không mặc định nhận palette Cara. Scope “Các bộ cùng dòng trong phòng” lọc roomId + productReference, không tác động xuyên phòng.

## C. Một đối tượng xuyên suốt các góc và hành động
Không còn asset tổng thể/cận/cất đồ rời rạc cho một sản phẩm. Cùng instance ID được:
- nhìn từ vị trí đứng trong lớp;
- tiếp cận bằng camera POV để xem gần;
- thay material để phối màu;
- chuyển transform/trạng thái khi gấp hoặc cất;
- tiếp tục được nhìn ở kệ với cùng màu, reference và nhãn.

Tách productReference (dòng), variantId (nếu CMS có thật), instanceId (vật trong trường), roomId, colorId, poseState, holder/slotId. REF-* không phải SKU thương mại. Đổi phòng lazy-load nhưng state ở cấp phiên/campus, không nằm riêng trong component phòng rồi mất khi unmount.

`selectedColor` phản ánh màu đã render thành công; pendingColor tách riêng nếu có tải. Mới nhất thắng khi đổi liên tục. Nếu các bộ khác màu, scope toàn nhóm hiện Nhiều màu. Chuyển scope không tự tô; chọn màu kế tiếp mới áp dụng.

## D. Trường học và góc nhìn thứ nhất
Dựng hành lang + 7 phòng trong `01_School-and-Room-Scripts.md`, blueprint JSON kèm theo là dữ liệu thiết kế. Chọn vai một lần ở đầu; mặc định gợi ý Mẹ Linh, người dùng tự đổi. Mắt An 1.55 m, Linh 1.60 m, Mây 0.95 m là giá trị thiết kế; không nhầm thành chiều cao mesh.

Một camera controller và một world state. Có collider sàn/tường, clamp vị trí hợp lệ. Di chuyển bằng điểm đến/cửa và vuốt nhìn; desktop có phím tùy chọn. Khi chỉ vào sản phẩm, hiện tên + hành động theo capability. Không có nhiệm vụ dài cố định phủ đáy và không có bảng màu thường trực khi đang đi hành lang.

“Lại gần” tính từ bounding box sản phẩm và các anchor đứng/quỳ được thiết kế, có khoảng cách tối thiểu, không xuyên geometry, giữ góc POV. Khi vào phòng bằng cửa, spawn hợp lệ trước cửa; return về hành lang gần đúng cửa vừa ra. Không tự quay tour khi người dùng chưa chọn.

R1–R6 không có người trong background. R7 là ngoại lệ có NPC động theo vai; không có ảnh người bake trong tường/nền. Nhân vật đang điều khiển không xuất hiện thêm làm NPC. Giữ kịch bản gốc An/Linh/Mây, không đổi tên hoặc tạo nhân vật mới.

## E. UI trong trải nghiệm
- Header desktop 64 px, mobile 56 px: tên trường/phòng, nút Bản đồ, vai đang chọn, Đóng. Không trộn banner trang bán hàng.
- Scene chiếm phần còn lại. Khi chưa chọn sản phẩm, HUD tối giản; hotspot gần nhất có vùng chạm 48 px và tên ngắn.
- Khi chọn: inspector desktop rộng 320–360 px, scene resize/fit vùng còn lại; mobile dùng sheet thu gọn có tên/màu/hành động, mở rộng để đọc thông số. Không che điểm quan sát và không chặn thoát.
- Bản đồ liệt kê phòng có nhãn, trạng thái đã ghé và nút Đi đến; không buộc hoàn thành từng phòng. Có tuyến nhanh R1→R6→R7.
- Cận cảnh và cất đồ là hành động của sản phẩm cụ thể, không phải tab gallery toàn cục.
- Chữ thao tác 14–16 px trở lên, contrast rõ, focus visible, radio màu có tên + check. Hỗ trợ bàn phím, reduced motion và safe-area. Desktop 1440×900, mobile 390×844 và 360×800; không tràn ngang.
- Thời gian mục tiêu: phản hồi chọn màu dưới 100 ms khi material đã sẵn; di chuyển điểm đến 500–900 ms không rung; cho hủy điều hướng khi kéo/đi bằng tay. Các mốc cần đo trên bản chạy thật.
- Không ghi “3D pipeline”, “GLB”, “mask”, “mock”, “developer” trong thông báo cho khách. Thiếu tài nguyên là báo cáo kỹ thuật của IDE, không phải toast thay chức năng.

## F. Gấp/cất và bàn giao
R3: dựng 4 segment foam với pivot đúng, kích thước tổng mở 1.20×0.60×0.03 m; gấp theo cấu tạo và tránh xuyên geometry. Kệ có slot hợp lệ; move chính instance, không hide một mesh/show bản sao lệch dữ liệu. Loại foam cơ bản không có hành động gấp4.

R5: GLB túi có sẵn trong assets/hula_bag.glb. Kiểm tra scale, grip nodes và vật liệu trước dùng. Không dùng clip carry_sway_preview như humanoid handover. Các loại túi khác cần geometry riêng.

R7: triển khai đúng state machine tài liệu 02. Một túi duy nhất; bàn giao bằng marker chuyển holder tại thời điểm người nhận nắm quai, bảo toàn world transform. Chống double click, hủy/replay hợp lệ. Nếu chưa có rig/clip người, hoàn thiện state/scene và báo riêng phần NPC chưa đạt. Không dùng icon đầu người, tay capsule hoặc toast để giả hoàn thành handover.

## G. Thực hiện theo chặng, không nhân lỗi ra 7 phòng
Chặng 1: R1 + hallway nhỏ + 3 camera eye heights. Geometry sản phẩm thật trong scene; đủ6màu; một bộ/toàn nhóm; nhìn gần cùng vật; ra/vào giữ màu. Hoàn thành và tự kiểm hình ảnh/video trước khi nhân phòng. Không cần chờ asset nhân vật.
Chặng 2: R2–R5; từng model đúng nhóm; gấp/cất ở R3; sản phẩm không đổi identity. Dùng catalogue kèm để đối chiếu. Không lấy ảnh ngẫu nhiên thay model còn thiếu.
Chặng 3: R6 đủ nhóm và map toàn trường; scope chỉ cùng dòng cùng phòng; UI theo vai.
Chặng 4: R7 với character assets/rig/animation; kiểm state và grip transfer theo3POV.
Chặng 5: kiểm mobile, hiệu năng, keyboard, lỗi tải, đóng mở, CMS/route; bàn giao bằng chứng.

Tiếp tục các chặng đã có đầu vào mà không hỏi duyệt lại các chỉnh sửa có thể hoàn tác. Nếu một asset thật sự thiếu, nêu tên/capability thiếu và tiếp tục phần độc lập, không nhận toàn dự án hoàn tất.

## H. Bằng chứng bắt buộc
1. Video R1 30 giây: xanh → Cam thấy nệm đổi → Hồng một bộ → nhìn gần chính bộ hồng → ra/vào phòng màu còn giữ.
2. Video R3: cùng instance mở → gấp → lên kệ → nhìn gần → lấy ra. Log ID phục vụ kỹ thuật nằm ngoài UI khách.
3. Video R6: đổi Cara không làm Satin/foam/túi đổi; chuyển phòng không mất state.
4. Video R7 ở cả3vai: không clone túi/người, nhãn đúng, ownership chuyển đúng marker; nếu rig thiếu, ghi chưa nghiệm thu video này.
5. Ảnh desktop/mobile không bị banner che; báo renderer thực, file sửa, asset đã có/đang thiếu, phần tests đã chạy. Không dùng concept trong tài liệu làm ảnh sau sửa.

Không đánh dấu done khi chỉ swatch/tiêu đề đổi màu, camera chuyển sang ảnh sản phẩm khác, hoặc bàn giao chỉ là toast thành công.
