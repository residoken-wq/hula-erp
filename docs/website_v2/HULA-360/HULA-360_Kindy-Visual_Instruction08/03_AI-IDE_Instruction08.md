# DÁN CHO AI IDE — HULA INSTRUCTION08 / KINDY VISUAL UPGRADE

Khung trường7 phòng, POV và tương tác đã tương đối ổn. Nhiệm vụ hiện tại là nâng chất lượng hình ảnh theo ảnh dự án Kindy Garden; không làm lại kiến trúc hoặc đổi trải nghiệm thành gallery ảnh. Đọc01_Reference-Analysis.md và02_Environment-and-Product-Spec.md, mở các ảnh nguồn trước khi sửa.

## 1. Khóa phạm vi
Giữ navigation, collision, world state, instance IDs, màu từng bộ, productReference, camera POV3 vai, gấp/cất và handover hiện có. Không viết lại engine. Xác định source scene, asset loader, material registry và light rig thực tế trong repo; báo các file sẽ sửa rồi thực hiện.

Không dùng ảnh phòng làm backdrop thay toàn bộ geometry. “Thay background” ở đây là thay room shell, sàn, cửa, rèm, kệ và ánh sáng bằng scene có vật liệu/chiều sâu. Ảnh gốc trong references/kindy là đối chiếu, không là texture toàn cảnh, environment map hoặc sản phẩm trong scene.

## 2. Phòng mẫu bắt buộc: R4 — Lớp Mây / Túi ngủ
Chụp ảnh trạng thái hiện tại ở một camera bookmark lưu sẵn. Hoàn thiện R4 trước, vì đây là màn được người dùng phản hồi. Camera/viewport/role giữ cố định khi so trước–sau. Sau khi R4 đạt hình ảnh và màu vẫn chạy, mới dùng các module để thay phòng khác.

Chuẩn hình ảnh nhìn theo kindy-02/04/10/14: sàn vân gỗ sáng, tường kem trắng, cửa khung tối có ánh sáng ngoài trời, rèm cuốn xanh, tủ cánh pastel và kệ gỗ nhỏ. Có trần sáng và chân tường; không còn hộp xám trống.

## 3. Sửa theo thứ tự
A. Ánh sáng và color pipeline: kiểm màu texture/output, exposure, hướng sáng cửa, môi trường và shadows. Giải quyết ô cửa đen/đốm sáng và tường xám bẩn. Không kết luận do material nào khi chưa đọc code. Không dùng filter toàn canvas.
B. Sàn/tường/cửa/rèm: map vân theo tỷ lệ thật; floor nhận bóng; khung cửa có độ dày; ngoài cửa sáng vừa, thấy cây hoặc cảnh xa đơn giản; tường và rèm là hai material riêng.
C. Tủ/kệ: tạo module trong spec02 bằng geometry thật có bevel và độ dày, màu pastel đúng tinh thần ảnh. Có hộc, lưng, chân và khoảng hở; tủ cất nệm phải đủ sâu theo folded bounding box. Kệ thấp ở vùng chơi, kệ nệm ở vùng cất, không đặt giữa lối đi.
D. Sản phẩm: sửa silhouette gối/nệm/chăn, sau đó viền/chần, cuối cùng texture vải. Không dừng ở một plane xanh hoặc hộp được bọc texture. Đối chiếu mẫu Cara túi ngủ tiêu chuẩn với catalogue của nó; giữ nâng cao khác chăn mỏng.
E. Camera: triển khai6 bookmark QA trong spec02 trên cùng scene. Người dùng lại gần cùng sản phẩm, không chuyển source ảnh; khi đổi màu phải còn chính màu đó ở cận/kệ.
F. Áp dụng module đã đạt cho các phòng khác; khác nhau bố cục và sản phẩm, cùng chất lượng sàn/cửa/nội thất. Giữ không gian không người ở R1–R6; R7 dùng NPC theo kịch bản cũ.

## 4. Dùng tài nguyên trong gói
- Mở design/Kindy-Reference-Board.png để nắm nhóm ảnh; file gốc đầy đủ trong references/kindy.
- Hai PNG assets/materials là base-color candidates 1254×1254. Không đổi tên thành2K/4K hoặc bộ PBR đầy đủ. Thử chúng trên floor/fabric ngay trong nhánh làm việc; kiểm seam 2×2 và tỷ lệ, thay asset khi không đạt.
- Floor candidate đã có đường ghép ván. Không tạo thêm đường kẻ geometry không trùng mạch. Khoảng1.8m/tile là điểm đầu cần kiểm, không kéo một tile phủ cả phòng.
- Cotton neutral dùng grain nhỏ để màu material vẫn hoạt động. Không kéo grain quá lớn thành bao bố. Không gán cùng ảnh vào baseColor, normal, roughness, AO mà gọi đó là PBR.
- Ảnh 17 có túi cá nhân nâu cạnh túi HULA; không tạo túi nâu thành sản phẩm. Ảnh 01/11 có người thật chỉ giữ làm evidence, không đưa vào nền.
- Giữ nguồn/watermark của ảnh tham khảo. Không bake watermark hoặc logo Kindy vào vải/sàn; model thương mại dùng logo/nhãn đúng config. Màu đỏ của dự án không tự thêm vào palette6 màu Cara. Nếu cần xem ảnh dự án, dùng gallery tham khảo riêng có ghi nguồn, không đổi scene đang trải nghiệm.

## 5. Giữ đổi màu và cất đồ hoạt động sau thay hình
Màu chỉ áp lên slots vải của instance mục tiêu, không lan ra viền, kệ, sàn hay phòng khác. Khi thay geometry/material, giữ mapping semantic và độc lập material theo instance; thế giới không reset.

Gấp/cất di chuyển cùng instance, không dùng mesh mới mất màu/nhãn. Kệ slots được kiểm bằng kích thước vật gấp; không scale nệm nhỏ lại để nhét vừa. Kiểm mô hình đã tăng chi tiết có làm raycast chọn nhầm viền/helper hay không.

Mọi đường trắng/vòng chọn bất thường trong screenshot phải được truy ra object và transform. Tắt debug helpers ở production; nếu đó là tai vải/quai thật thì sửa tỷ lệ/hướng đúng nguồn, không xóa bừa chi tiết sản phẩm.

## 6. Chỉnh UI nhỏ đúng vấn đề hiện tại
- Bỏ REF-* và chiều cao mắt khỏi tiêu đề khách hàng; để trong debug. Header hiển thị “Lớp Mây · Túi ngủ” và tên vai.
- Swatch3 cột, đủ tên Xanh dương/Xanh ngọc; không ellipsis. Vùng bấm 48px trở lên.
- Inspector mở phải chừa scene đủ rộng và focus camera vào vùng trống còn lại. Màn nhỏ dùng sheet có thể thu gọn, không che nệm.
- Thẻ suy nghĩ của vai thu gọn, tối đa2 dòng hoặc tắt; không bắt nằm phủ sản phẩm. Tooltip hướng dẫn chỉ hiện khi cần.
- Không thêm badge “photorealistic” hoặc “3D thật” để thay chất lượng nhìn; không viết thông báo kỹ thuật asset/pipeline cho khách.

## 7. Chất lượng và hiệu năng
Dùng LOD hoặc giới hạn chi tiết ngoài góc gần; share geometry/texture tĩnh hợp lý. Giữ texture budget và draw calls phù hợp máy mục tiêu. Nguồn shadow chính tập trung phòng đang xem; bóng đồ động không được bake cố định sai khi cất/lấy.

Mục tiêu 60 fps desktop và 30 fps mobile là mục tiêu cần đo. Không nhận đã đạt khi chỉ chụp ảnh. Ghi thiết bị/viewport/DPR, tình huống và FPS đo. Không bật hàng loạt đèn đổ bóng/postprocessing để bù texture hoặc silhouette sai.

## 8. Bằng chứng bàn giao
1. Ảnh trước–sau R4 cùng camera/viewport. Ảnh sau phải có sàn gỗ, cửa sáng, rèm, tủ/kệ và sản phẩm đã có thể tích.
2. Sáu shot V01–V06 của bản chạy thật, mỗi shot ghi roomId/instanceId trong báo cáo kỹ thuật, không đè lên UI khách.
3. Video 30–45giây: đi qua phòng → lại gần sản phẩm → đổi xanh sang cam/hồng → nhìn viền/chần → đến kệ → trở lại sản phẩm. Không có source-image swap.
4. Video kiểm R3 gấp/cất sau khi thay kệ: cùng vật/cùng màu, không xuyên hoặc đổi tỷ lệ.
5. Ảnh 1440×900 và 390×844; tên màu không cắt, UI không che vật chính.
6. Báo file sửa, asset source, phần còn thô/thiếu và kết quả hồi quy các chức năng trước. Không dùng ảnh Kindy gốc hoặc mockup làm ảnh sau sửa.

Hoàn thiện visual phòng mẫu trước khi nhân sang7 phòng. Không nghiệm thu chỉ vì đổi sàn nâu sang sàn có texture nếu tủ/gối/nệm vẫn là blockout.
