# Gỡ chặn mesh, rig và bàn giao túi

## 1. Điều chỉnh yêu cầu của AI IDE

| IDE đang yêu cầu | Điều chỉnh đúng | Đầu ra cần nghiệm thu |
|---|---|---|
| Ba GLB nhân vật | Giữ tên co-an.glb, me-linh.glb, be-may.glb; mesh/material/skeleton có thể cùng nằm trong GLB | Ba nhân vật đúng hình, có skinning, anchor mắt/tay và clip phù hợp |
| Một “Animation Rig” riêng | Rig là skeleton + skin weights; animation là dữ liệu chuyển động, hai khái niệm khác nhau | GLB rigged và clip embedded hoặc file animation cùng mapping skeleton |
| idle/reach_out/hold_bag/handover_transfer | Đây là tên logic dự án, không phải cam kết thư viện AI có sẵn đúng clip | Mapping clip thật theo vai; người trao/người nhận có chuyển động khác nhau |
| Túi kem lá xanh | Bỏ; thay bằng túi quai xách thật REF-BAG-HANDLE từ sale kit | hula_bag.glb đúng kiểu, màu, quai, nhãn, khóa mặt sau |
| Túi gắn bone tay | Giữ; túi tĩnh chỉ cần grip anchor, không cần humanoid skeleton riêng | Một object túi có ownership duy nhất; giữ world transform khi đổi parent |

glTF hỗ trợ animation transform/pose và skinning; exporter Blender có phần xuất animation/skinning. IDE phải kiểm bản Blender và tùy chọn export đang cài, rồi mở lại GLB để xác nhận dữ liệu thật. [Blender glTF manual](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html).

Đủ ba GLB nhân vật và một túi vẫn chưa đủ “3D toàn phần”: cần renderer/camera 3D thật, không gian đúng thời điểm, model nệm/gối/chăn, controls, controller bàn giao và loading. Nếu repo đã có phần nào thì tái sử dụng, không yêu cầu dựng lại.

## 2. Phân công sản xuất bằng AI

| Công việc | Công cụ/phương án | Điều kiện |
|---|---|---|
| Dữ liệu, UI, state, importer | AI IDE trong repo hiện có | Có code repo và tài nguyên gói |
| Túi/nệm, hình học tương đối đơn giản | AI IDE điều khiển Blender bằng script do IDE viết | Blender chạy được trong môi trường IDE; hình tham chiếu và tham số rõ |
| Nhân vật cần đúng khuôn mặt | Meshy tạo model từ bộ ảnh, sau đó auto-rig; chỉnh/kiểm lại trong Blender | Có tài khoản/công cụ được cấu hình, quyền sử dụng và hạn mức thích hợp |
| Với tay/giữ/trao túi | Chuyển động AI làm đầu vào; IDE chỉnh animation/IK rồi bake nếu cần | Có rig đúng, grip anchors và túi đã dựng |

Không bắt buộc người dùng thuê họa sĩ 3D hoặc tự dựng tay. Công việc vẫn có thể do AI thực hiện qua các công cụ tương ứng. Trong phiên ChatGPT hiện tại chưa có kết nối tạo mesh/rig để xuất các GLB này; tài liệu không giả vờ chúng đã tồn tại. Không gửi API key vào chat hoặc nhúng vào frontend; IDE dùng cấu hình bí mật đã có trong môi trường của chủ dự án. Không tự mua dịch vụ hoặc chạy job trả phí ngoài phạm vi/hạn mức đã được cấp.

## 3. Tạo ba nhân vật bằng Meshy

Meshy Multi-Image to 3D nhận 1–4 ảnh cùng vật thể; đặt ảnh front đầu tiên và gửi riêng từng nhân vật. Với model hỗ trợ, chọn pose A; yêu cầu GLB và texture. Đây là bước tạo mesh, không thay cho rig. Đọc schema hiện hành khi thực hiện, không sao chép tham số cũ. [Multi-Image to 3D](https://docs.meshy.ai/en/api/multi-image-to-3d).

| Job | Bộ ảnh trong gói | Output cuối |
|---|---|---|
| Cô An | characters/CoAn/CoAn_front.png, CoAn_three_quarter.png, CoAn_profile.png, CoAn_back.png | co-an.glb |
| Mẹ Linh | characters/MeLinh/MeLinh_front.png, MeLinh_three_quarter.png, MeLinh_profile.png, MeLinh_back.png | me-linh.glb |
| Mây | characters/BeMay/BeMay_front.png, BeMay_three_quarter.png, BeMay_profile.png, BeMay_back.png | be-may.glb |

Ở bảng, tên file thứ hai trở đi cùng thư mục với file đầu. Không gửi sheet ba người hoặc ảnh lớp học làm đầu vào job một nhân vật. Ảnh tạo bằng AI có sai khác nhỏ giữa góc; lấy front làm chuẩn nhận diện, dựng thành một cơ thể thống nhất rồi kiểm các view render từ chính mesh.

Prompt chung cho công cụ/agent dựng mesh:

```text
Build one fully clothed, real volumetric stylized character from these four views. Use the front view as the identity authority and reconcile minor inconsistencies across generated reference views. Preserve face, hair, garment colors and age-appropriate proportions. Neutral A-pose, separate arms, five fingers per hand, clean deformation topology. No floor, image planes, baked background, bag or extra character. Output textured GLB. Do not claim rigging or animation until actual skeleton, skin weights and clips have been produced and inspected.
```

Prompt màu/nhận diện ngắn riêng, dùng cho trường texture prompt nếu công cụ có hỗ trợ; không dán toàn tài liệu vào trường giới hạn ký tự:

**Cô An**

```text
Adult Vietnamese woman, gentle oval face, black low ponytail. Turquoise short-sleeve collared polo, beige straight trousers, white indoor shoes. Preserve the exact reference identity. Soft fabric, clean stylized 3D finish. No logos, jewelry, bag or accessories.
```

**Mẹ Linh**

```text
Adult Vietnamese mother, warm oval face, shoulder-length straight black hair with side part. Cream short-sleeve collared blouse, light blue straight trousers, beige closed flat shoes. Preserve reference identity and gentle stylized 3D finish. No jewelry, bag or extra accessories.
```

**Bé Mây**

```text
Fictional Vietnamese girl about five years old, round youthful face, black chin-length bob, green leaf clip on her anatomical RIGHT side. Pale yellow short-sleeve T-shirt, muted blue trousers, small white shoes. Preserve preschool proportions and the reference identity. Fully clothed; no bag or extra accessories.
```

Sau mesh đạt hình dáng, auto-rig từng nhân vật. API rigging của Meshy nhắm tới humanoid hai chân có cấu trúc chi rõ; có thể trả GLB rigged. `height_meters` là chiều cao model, không phải tầm mắt camera. Kiểm ngón tay và skin weights thực tế, nhất là Mây; không suy ra rig đầy đủ chỉ từ trạng thái job thành công. [Rigging API](https://docs.meshy.ai/en/api/rigging).

Tầm mắt thiết kế ban đầu: An 1,55 m; Linh 1,60 m; Mây 0,95 m. Đo model từ chân tới đỉnh đầu để nhập chiều cao toàn thân; sau đó đặt eye anchor vào mắt. Không dùng 0,95 m làm chiều cao toàn thân chỉ vì vai Mây có camera 0,95 m.

## 4. Prompt dựng túi thật — giao AI IDE với Blender

```text
Tạo asset hula_bag.glb trong pipeline asset của repo, không sửa UI ở nhiệm vụ này. Đọc sale-kit/TUI_BAO_QUAN_-_01.jpg. Chỉ dựng dòng TÚI QUAI XÁCH, REF-BAG-HANDLE, size S; không lấy hình túi hộp/quai đeo của trang khác ghép vào.

Hình cần có: thân túi vải mềm, góc dưới bo; hai quai xách ngắn màu xám; mặt trước xanh dương theo ảnh; chọn biến thể mặt sau xám ở ảnh nhỏ góc trên phải; khóa ngang trên mặt SAU, không chuyển khóa lên miệng túi kiểu hộp. Phía trước có vùng logo tùy chỉnh và nhãn tên/lớp thấp hơn. Không giữ chữ YOUR LOGO HERE như họa tiết thật. Không tạo logo trường khách hàng. Nhãn demo “Mây — Lớp Mầm” là decal/text được tạo bằng typography rõ, không để model AI vẽ chữ méo. Bỏ hoàn toàn túi kem và lá xanh từ bản cũ.

Catalogue ghi 48×40cm, chưa xác định quy ước đo/quai/độ sâu. Cho bản dựng draft, quy ước thân rộng 0.48m × cao 0.40m là giả định có ghi metadata; độ sâu và chiều cao quai lấy tỷ lệ ảnh để dựng gần đúng, lưu riêng vào modelingAssumptions, không xuất thành thông số thương mại. Chưa kiểm kích thước lòng túi và độ vừa của bộ nệm. Không làm animation nhét nệm vừa khít dựa trên số đo đoán.

Dùng mesh có thể tích, topology sạch; quai là dải vải có bề rộng, độ dày và khoảng rỗng để bàn tay nắm được. Tách material thân trước/sau/quai/nhãn/kim loại khóa. Vải không metallic, bề mặt không bóng nhựa; chi tiết đường may và nếp nhăn vừa phải. Giữ mặt sau xám khi đổi màu mặt trước trừ khi cấu hình biến thể chỉ rõ khác.

Tạo root HULA_BAG và grip anchors có vị trí/orientation thực trên quai để bàn tay cho/nhận cùng tiếp cận được. Túi không cần humanoid rig; gắn root vào tay/anchor. Nếu muốn quai biến dạng khi nắm, đó là bước nâng cao riêng, không chặn bàn giao túi tĩnh.

Xuất file .blend nguồn và GLB; mở lại GLB bằng renderer đích. Render front/back/side/3-quarter từ cùng mesh và kiểm với catalogue. Ghi kích thước thật từ bounding box, thông số nguồn và thông số suy ra riêng. Không giao một hộp xanh trơn hoặc plane dán nguyên trang catalogue rồi đánh dấu đạt.
```

Nếu IDE không truy cập được Blender, ghi BLOCKED_TOOL cho tác vụ asset; không đổi thành yêu cầu anh phải tự model thủ công. Bước thêm dữ liệu sản phẩm và UI vẫn làm tiếp.

## 5. Prompt dựng nệm thật

```text
Dựng riêng REF-MAT-CARA-STD theo sale-kit/NEM_MN_-_01.jpg: nệm 1.20×0.63m, gối 0.40×0.25m, chăn 1.30×0.70m, màu xanh dương theo mẫu. Ba thành phần riêng, viền xám, đường chần và móc/nhãn theo ảnh. Chiều dày chưa có dữ liệu: dùng draft assumption có ghi rõ, không mượn 3cm của dòng foam. Không sao chép logo BAY trong ảnh dự án lên mẫu giả lập.

Nệm, chăn và gối phải có material riêng; đổi màu chỉ tác động thành phần được chỉ định, không tint phòng. Hình open/folded phải cùng sản phẩm. Chưa rõ kiểu xếp thực thì chỉ triển khai open và trạng thái đã cất; không gọi animation gấp bốn khúc của foam là cách gấp của nệm Cara.

Nếu dựng thêm REF-FOAM-FOLD4, dùng NEM_KHUC_-_01.jpg, tổng kích thước 1.20×0.60×0.03m; tách bốn đoạn và đường gấp hợp lý. Số đoạn là thông tin thật; phân đoạn đều/độ hở/bán kính gấp là giả định cần kiểm theo ảnh. Không tạo hình chăn/gối từ chung một khối nệm. Xuất GLB, nguồn Blender và ảnh kiểm các trạng thái thực có.
```

## 6. Animation và marker bàn giao

Meshy có API áp dụng animation cho nhân vật đã rig, từ action có sẵn hoặc motion task. Cần truy vấn hành động thực, không bịa action ID hoặc mặc định có clip trao đúng túi của Hula. [Animation API](https://docs.meshy.ai/en/api/animation).

| Vai | Clip logic tối thiểu cho cảnh đón | Ghi chú |
|---|---|---|
| Cô An | idle, hold_bag, give_bag | Bắt đầu giữ túi, đưa ra và buông sau marker |
| Mẹ Linh | idle, reach_out, receive_bag, hold_bag | Tiếp cận quai và giữ túi sau marker |
| Mây | idle, look_at_bag, wave | Không cần mang túi lớn hoặc clip trao túi như người lớn |

Nếu repo dùng `handover_transfer`, giữ đó là tên action phối hợp hoặc map sang clip give/receive theo vai. Hai clip phải dùng chung đồng hồ/timeline để tay gặp nhau. Không đổi tên cùng một clip walking thành reach_out/hold_bag.

Prompt chuyển động đầu vào cho công cụ hỗ trợ text-to-motion:

```text
Standing adult, feet planted, calm small movement. From a relaxed pose, reach one hand forward to a bag handle at comfortable waist height, curl fingers into a carrying grip, pause at contact, then hold the hand steadily. Minimal torso movement, no walking, no camera motion, no generated prop. This is a draft motion for later alignment to the actual bag grip anchor.
```

Không yêu cầu text-to-motion tạo cả túi/người đối diện. IDE chỉnh IK/pose trên hai rig thật và grip anchor, rồi bake thành animation khi cần. `hold_bag` có thể là pose ổn định hoặc loop nhẹ; không cần một animation dài giả tạo.

Marker chuyển túi là dữ liệu do controller runtime sử dụng; không mặc định marker Blender tự xuất thành sự kiện glTF dùng được. Xuất metadata riêng theo convention repo, hoặc map marker vào normalized time đã kiểm trên clip cuối. Chỉ chuyển ownership một lần khi đi qua marker; bảo toàn world transform khi đổi parent, tránh giật/nhân đôi. Người trao chỉ buông sau tiếp xúc; người nhận đã có tư thế nắm trước khi ownership đổi.

Khi hủy/replay/đổi vai, controller phục hồi snapshot đã định nghĩa; không chỉ reset thanh tiến độ. Nghiệm thu bằng video ready → tiếp xúc → đổi chủ → giữ túi, cùng dữ liệu ownership và clip thật.

## 7. Gate đầu ra

| Gate | Đạt khi | Nếu chưa đạt |
|---|---|---|
| Dữ liệu sản phẩm | 15 reference có nguồn, SKU chưa biết giữ null | Sửa mapping, không chặn renderer |
| Túi thật | Đúng loại quai/khóa/nhãn và nhìn đủ các mặt | Sửa mesh/material, không đổi tiêu chí |
| Nhân vật | Mặt, tóc, quần áo, tỷ lệ đúng; rig hoạt động | Báo lỗi cụ thể về mesh/rig |
| Animation | Hai tay và túi khớp nhau, marker hoạt động | Sửa align/clip/state, không dùng timer giả |
| Nhập vai | Camera mắt, NPC đúng, sản phẩm thật, cảnh đón đúng trạng thái | Chưa công nhận 3D toàn phần |

Các công cụ trên là đề xuất triển khai đã đối chiếu tài liệu ngày 08/09/2026. Chưa gọi job tạo 3D hoặc sử dụng hạn mức tài khoản của anh trong phiên này.
