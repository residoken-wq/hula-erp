# Khóa tạo hình và hợp đồng asset HULA 360

## 1. Nhận diện cố định

| ID | Nhân vật | Tóc và điểm nhận diện | Trang phục | Tầm mắt khởi tạo |
|---|---|---|---|---|
| CHAR-AN | Cô An, giáo viên Việt Nam trưởng thành | Tóc đen buộc thấp, gương mặt hiền | Polo xanh ngọc tay ngắn; quần be; giày trắng | 1,55 m |
| CHAR-LINH | Mẹ Linh, phụ huynh Việt Nam trưởng thành | Tóc đen ngang vai, ngôi lệch | Áo kem có cổ tay ngắn; quần xanh nhạt; giày bệt be | 1,60 m |
| CHAR-MAY | Bé Mây, bé gái hư cấu khoảng 5 tuổi | Tóc bob đen; kẹp lá xanh bên phải của bé | Áo vàng nhạt tay ngắn; quần xanh dịu; giày trắng | 0,95 m |

Các tầm mắt là tham số thiết kế tạm, không phải chiều cao toàn thân hoặc thông số nhân trắc đã xác minh. Sau khi import model, hiệu chỉnh scale rồi đặt camera tại eye anchor thật. Giữ tỷ lệ cơ thể mầm non của Mây; không thu nhỏ model người lớn.

Kẹp tóc ở bên phải theo giải phẫu của Mây: ở bên trái ảnh chính diện, bên phải ảnh phía sau. Ảnh góc nghiêng chỉ là tham chiếu hình dáng; nếu AI tạo góc phụ lệch chi tiết thì lấy chính diện làm chuẩn. Không lật ảnh để tạo góc đối diện vì sẽ đảo kẹp tóc và ngôi tóc.

Phong cách: nhân vật 3D cách điệu nhẹ, chất vải mềm, khuôn mặt thân thiện. Dùng cùng mức cách điệu, ánh sáng và tương phản trong lớp. Không ghép hình người có nền trắng vào phòng. Không thêm logo/chứng nhận chưa có tài nguyên gốc.

## 2. Bản đồ file chính xác

| Nhân vật | Chính diện | Góc 3/4 | Nghiêng | Phía sau |
|---|---|---|---|---|
| Cô An | `references/CoAn/CoAn_front.png` | `references/CoAn/CoAn_three_quarter.png` | `references/CoAn/CoAn_profile.png` | `references/CoAn/CoAn_back.png` |
| Mẹ Linh | `references/MeLinh/MeLinh_front.png` | `references/MeLinh/MeLinh_three_quarter.png` | `references/MeLinh/MeLinh_profile.png` | `references/MeLinh/MeLinh_back.png` |
| Bé Mây | `references/BeMay/BeMay_front.png` | `references/BeMay/BeMay_three_quarter.png` | `references/BeMay/BeMay_profile.png` | `references/BeMay/BeMay_back.png` |

Ảnh studio có nền trắng, không mặc định là ảnh đã tách nền. Không trải trực tiếp ảnh toàn thân thành texture da/trang phục. Không dùng bốn mặt phẳng quay theo camera để giả nhân vật 3D. Được dùng crop gương mặt làm avatar UI, vì avatar không đại diện cho NPC trong lớp.

## 3. Asset cần có để vào bản chạy

Tên dưới đây là tên đích đề xuất; map sang convention repo nếu đã có, tránh nhân đôi asset.

| Asset đích | Điều kiện nhận |
|---|---|
| `co-an.glb`, `me-linh.glb`, `be-may.glb` | Mesh kín ở góc nhìn cần dùng; vật liệu/texture đủ; humanoid skeleton; ngón tay đủ cho thao tác; không kèm nền trắng |
| Tay POV theo từng vai | Có thể dùng tay từ cùng rig hoặc rig tay riêng khớp da/trang phục/tỷ lệ; chuyển động không lộ đầu/mắt của chính vai |
| Túi sản phẩm mẫu | Một object có quai và điểm gắn để bàn giao; màu kem, dấu lá là placeholder nội dung |
| Nệm/gối mẫu | Object riêng có vị trí cất/gấp; không dính vào texture phòng khi cần tương tác |
| Lớp ở trạng thái đón | Không chứa trẻ đang ngủ được bake trong nền; có cửa, chỗ bàn giao và chỗ cất đồ |

Skeleton phải có mapping root/pelvis/head, hai tay và điểm gắn bàn tay; tên xương theo exporter nhưng có bảng mapping rõ. Eye anchor và hand grip anchors thuộc model. Đặt sàn theo mét; chân tiếp đất; xác nhận hướng forward/up theo engine hiện có.

Animation tối thiểu cho cảnh mẫu: idle, nhìn người đối diện, với tay, giữ túi, đưa/nhận túi; Mây có idle đứng và chào nhẹ. Có thể tạo/retarget bằng AI hoặc công cụ animation hiện có, nhưng phải kiểm chuyển động trên chính rig cuối. Có một marker bàn giao duy nhất để chuyển chủ sở hữu túi. Khi chưa có clip đúng, báo thiếu thay vì kéo object theo timer rồi gọi là thao tác hoàn chỉnh.

Tầm nhìn POV phải là vị trí mắt trong không gian. Đổi số “0.95m” trên UI hoặc crop cùng một ảnh người lớn không tạo ra góc nhìn của trẻ.

## 4. Prompt giao cho công cụ dựng model bằng AI

Dùng riêng từng nhân vật, đính kèm đúng bốn ảnh của nhân vật đó. Prompt không phụ thuộc tên dịch vụ và không bảo đảm công cụ bất kỳ hỗ trợ rig/export.

> Create ONE consistent, fully clothed, stylized 3D character from the attached front, three-quarter, profile and back references. The front reference is the identity authority; reconcile small generated-view discrepancies into one coherent anatomy and silhouette. Preserve the exact hairstyle, garment colors and age-appropriate body proportions described in the accompanying character specification. For May, preserve the green leaf clip on her anatomical RIGHT side. Produce actual volumetric geometry, not image planes or a background scene. Use a neutral rig-friendly pose, clean deformation topology at shoulders, elbows, wrists, hips and knees, five fingers per hand, and materials suitable for real-time rendering. Deliver a GLB with embedded or packaged textures. Include a humanoid rig and finger bones only if your pipeline actually supports them; otherwise explicitly deliver the unrigged mesh and list rigging as missing. Do not claim animations exist unless actual clips are included. Render front, three-quarter, profile and back previews FROM THE SAME final mesh for inspection. No extra accessories, no text, no watermark, no duplicated body parts.

Sau xuất: mở GLB, kiểm mesh/material/rig thực tế; không chỉ kiểm đuôi file. Nếu công cụ không có khả năng tạo model hoặc thiếu tài khoản/tài nguyên, ghi danh sách đầu vào thiếu với tên đích ở bảng trên. Tiếp tục những việc UI/config không phụ thuộc asset, chưa công nhận phần 3D hoàn tất.

## 5. Kiểm asset trước tích hợp

Render bốn góc từ cùng model, so với PNG tương ứng. Kiểm mặt, tóc, đường viền quần áo, kẹp tóc, bàn tay, chân, material và bóng tiếp đất. Chạy idle/reach/hold trên rig; nhìn cổ tay, khuỷu tay, vai và quai túi khi chuyển động. Kiểm camera ở mắt và tay trong màn hình hẹp. Không cần làm một sản phẩm asset viewer riêng; dùng công cụ preview hoặc harness nội bộ có sẵn.

Ảnh/model nhân vật là nhân vật hư cấu tạo bằng AI. Nệm, túi, dấu lá và màu mẫu chỉ minh họa cho kịch bản cho đến khi có ảnh/SKU/kích thước thật từ chủ dự án. Không biến hình minh họa thành tuyên bố về sản phẩm đã bán.
