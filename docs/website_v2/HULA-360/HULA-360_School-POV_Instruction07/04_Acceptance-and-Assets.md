# Bằng chứng, asset và điều kiện hoàn tất

## Đầu vào có trong ZIP
- 12 PNG nhân vật An/Linh/Mây: hình tham chiếu, chưa rig, không tự coi là multiview được hiệu chuẩn.
- 15 trang sản phẩm chính và trang 6 màu Cara: JPEG catalogue gốc; thông tin nguồn nằm trong product-reference-registry.json. REF không phải SKU.
- hula_bag.glb + README/validation từ gói trước: model túi quai xách tham khảo, có grip nodes; chỉ có chuyển động túi preview, không chứa bộ xương người.
- school-blueprint.json: mặt bằng, rooms/product mappings và lộ trình đề xuất, không phải scene đã chạy.
- color-preview-config.json: sáu màu xem thử Cara, không phải màu chuẩn vật lý.

## Phần cần tạo để triển khai
| Tài nguyên | Ai làm / cách làm | Không được thay bằng |
|---|---|---|
| Phòng/hành lang | IDE dựng geometry kiến trúc chung, ánh sáng trung tính, collision | Ảnh panorama giả hoặc ảnh các phòng không đồng nhất |
| Cara tiêu chuẩn | IDE dựng mesh tham số có vải/viền/gối/chăn riêng, sau đó tinh chỉnh theo kit | JPG xanh dính vào nền hoặc hộp thô nghiệm thu cuối |
| Satin | Geometry/material riêng đúng source, kích thước riêng | Cara đổi tên hoặc foam kem |
| Foam4 | 4 segment và hierarchy gấp đúng hình dạng | Scaling ảnh/mesh để giả gấp |
| Túi ngủ | Hai cấu tạo chăn tiêu chuẩn/nâng cao có nguồn | Cùng mẫu chỉ đổi chữ |
| Các loại túi | Dùng GLB quai xách có sẵn; dựng các mẫu còn lại theo nguồn | Cùng mesh cho tất cả loại |
| Humanoid3nhân vật | Asset pipeline AI theo bộ ảnh; rig/retarget/grip, kiểm riêng | Icon đầu người/capsule hands |
| Handover | Timeline2người + bag grip + state transaction | Một clip idle hoặc toast thành công |

Chưa có model nệm/rig người mới trong ZIP này. Bản 07 giải quyết đặc tả triển khai và kịch bản; không tự tuyên bố asset đã tồn tại. Geometry sản phẩm có thể được IDE tạo ngay để mở khóa chức năng, chất lượng visual phải qua bước đối chiếu riêng.

## Nghiệm thu chức năng
- R1 chọn Cam: nệm/gối/chăn hiện Cam; viền xám/tường/sàn giữ màu. Nếu không: FAIL, dù swatch đã chọn.
- Chọn Cara-02 Hồng: chỉ Cara-02 đổi; lại gần vẫn cùng kiểu dáng/màu/ID. Screenshot LITTLE OAKS hoặc vải hoa: FAIL.
- Tắt/mở inspector và đổi vai không mất màu. Rời R1 sang R6 rồi về: màu R1 còn giữ.
- Scope trong R6 chỉ tác động cùng product reference trong R6, không R1 và không nhóm khác.
- R3 cất lên kệ: đúng vật đang gấp, không nhân đôi, không xuyên mặt kệ. Khi shelf full, từ chối đặt và giữ nguyên vật.
- Điểm đến không xuyên tường, camera Mây thấp thật, khi đổi vai không sinh NPC bản sao.
- R7 H4 chỉ commit ownership một lần; hủy trước/sau marker đều không nhân đôi/mất túi. Chưa có animation đúng: phần này chưa đạt.
- Banner website không che topbar; thoát trả focus/scroll về đúng chỗ. Mở đóng5lần không nhân listeners hoặc controller.
- Lỗi load phòng: ở nguyên vị trí an toàn phòng cũ, có thử lại; không xóa world state. Không hiện swatch thành công nếu chưa commit render.

## Nghiệm thu nội dung
Không đưa giá/stock/SKU/claim giặt, kháng khuẩn hoặc thông số chưa có nguồn. Không dùng logo trường trong catalogue hoặc YOUR LOGO HERE làm logo mặc định. Không gán dày3cm cho Cara/Satin. Satin “80màu” không đủ dữ liệu tạo80swatch. Bối cảnh và nhãn Mây là hư cấu; độ vừa túi và bộ đã gấp chưa xác minh.

## Báo cáo IDE bắt buộc tách hai trục
Functional status: màu/camera/state/collision/gấp/bàn giao có hoạt động hay chưa.
Visual status: nhận diện/độ mềm/đường chần/viền/rig có đạt nguồn và hình mẫu hay chưa.
Một mesh thô đổi màu được = chức năng có tiến triển, hình ảnh chưa hoàn tất. Một ảnh đẹp bất động = chưa đạt chức năng. Không gộp hai trạng thái thành “100%”.
