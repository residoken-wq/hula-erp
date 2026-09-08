# Prompt AI IDE — Thay sản phẩm thật và gỡ chặn theo từng phần

Chạy từng lượt: Context + A, sau đó B, C, D. Chat mới thì dán lại Context. Đây là hướng dẫn thực hiện trong repo Hula của chủ dự án, không phải bằng chứng code đã được sửa.

## Context chung

```text
Tiếp tục dự án HULA 360 hiện có. Đọc chỉ dẫn repo, 00_START-HERE.md, 01_Sale-Kit_Analysis.md, 02_3D-Asset-Pipeline.md và product-reference-registry.json trong gói Instruction 05. Giữ các yêu cầu CMS/config/POV/UI của Instruction 03–04. Instruction 05 ưu tiên về tên sản phẩm, kiểu túi, màu, nhãn và dữ liệu catalogue.

Chủ dự án đã cung cấp sale kit gồm 56 JPEG. Đây là nguồn tham chiếu sản phẩm thật, không phải file GLB. Bỏ yêu cầu hula_bag.glb màu kem có lá xanh. Túi mới là REF-BAG-HANDLE size S, mẫu mặt trước xanh/mặt sau xám/quai xám theo TUI_BAO_QUAN_-_01.jpg; dùng nhãn demo “Mây — Lớp Mầm”. Kẹp lá trên tóc Mây vẫn giữ.

Reference ID trong registry không phải SKU. Không bịa giá, tồn kho, mã màu vải, độ dày chưa có hoặc thông tin giặt. Phân biệt túi ngủ dùng khi nằm với túi bảo quản dùng mang đồ. Không dùng tên/material/kích thước của dòng này cho dòng khác.

Không đánh dấu toàn bộ dự án BLOCKED vì thiếu nhân vật. Tách content, product mesh, character mesh/rig, animation và integration. Làm những phần đủ đầu vào; ghi blocker theo asset/công cụ cụ thể. Không làm app mới, không đưa placeholder thành kết quả nghiệm thu, không tự publish hoặc phát sinh chi phí dịch vụ chưa được cấp.

Cuối mỗi lượt: liệt kê file thay đổi, cách mở bản chạy, bằng chứng thật, PASS/FAIL/BLOCKED theo phần, đầu vào còn thiếu. Không dùng ảnh AI/ảnh catalogue làm screenshot chứng minh scene runtime.
```

## Prompt A — Thêm sản phẩm thật ngay, chưa phụ thuộc GLB

```text
Đối chiếu schema CMS/product hiện có và registry 15 reference trong gói. Tìm sản phẩm thật đã có trong CMS bằng tên và thông số; chỉ map productId/variantId khi xác minh được. Không auto-create 15 SKU hoặc coi tên ảnh là SKU. Dữ liệu chưa map giữ dạng tour reference/draft.

Chuẩn hóa các nhóm: bedding_set, foam_mattress, sleeping_bag, storage_bag. Giữ riêng dimensions theo thành phần và size, source refs, thông tin chưa xác minh, model readiness và publication state. Các field null là chưa biết, không phải 0 hoặc false. Giữ nguyên chuỗi “130×80/90” và chưa tạo lựa chọn bán hàng 80/90 cho tới khi mapping thật xác nhận.

Chọn demo chính REF-MAT-CARA-STD màu xanh dương: nệm 120×63cm, gối 40×25cm, chăn 130×70cm. Chọn REF-BAG-HANDLE size S 48×40cm làm túi bàn giao. Không khẳng định đây là combo bán hàng hoặc bộ nệm chắc chắn vừa túi; chưa có dữ liệu lòng túi/quy cách xếp.

Sửa seed, CMS draft, lời thoại, tooltip, action text và kiểm tra completion liên quan túi lá cũ:
- Cô An: “Mình kiểm tra nhãn tên Mây và lớp trước khi bàn giao.”
- Mẹ Linh: “Mình kiểm tra đúng tên Mây rồi nhận túi từ cô An.”
- Bé Mây: “Đây là túi có tên Mây!”; hướng dẫn ngắn “Chạm vào nhãn tên của con.”
Nhãn là của nhân vật hư cấu. Dùng object/label ID để nhận diện; không buộc trẻ phải OCR/đọc thành thạo, có gợi ý âm thanh khi có audio thật. Đừng dùng màu đơn độc để phân biệt đồ của trẻ.

Inspector hiển thị tên dòng, thành phần/kích thước có nguồn, màu mẫu, ảnh tương ứng và nội dung tùy chỉnh logo/nhãn có trong catalogue. Cotton Cara sáu màu có ảnh; Satin không tự sinh 80 swatch. Đổi màu thực chỉ cập nhật material sản phẩm được chọn; renderer ảnh thì dùng ảnh biến thể có thật, không tint lớp.

Bìa catalogue ghi lưu hành nội bộ. Để 56 JPEG làm evidence/draft ngoài public web root; chỉ dùng ảnh public đã được duyệt/map từ website. Không đưa nguyên trang quảng cáo vào texture mesh. Nếu cần ảnh tham chiếu riêng, IDE tạo bản crop bằng công cụ ảnh từ đúng nguồn, ghi lại vùng crop và giữ nguyên bản gốc; không sinh lại hình rồi gọi là ảnh chụp sản phẩm thật.

Tại renderer chỉ có ảnh, CTA phải mô tả khả năng thật: “Xem nhãn túi”/“Xem sản phẩm”, không đánh dấu đã thực hành nhận túi. Không chờ character GLB để sửa các nội dung này.

Nghiệm thu: không còn túi kem/lá trong sản phẩm/kịch bản; đúng kích thước từng dòng; null không bị lấp bằng số đoán; ảnh đúng reference; không ảnh nội bộ được public ngoài ý định; công bố rõ phần nội dung đã hoàn thành và phần 3D chưa có.
```

## Prompt B — Dựng product mesh độc lập

```text
Kiểm công cụ dựng asset thật trong môi trường IDE: Blender executable/tool access, engine và loader hiện có. Thực hiện prompt dựng túi và nệm ở 02_3D-Asset-Pipeline.md. Không yêu cầu humanoid rig cho túi tĩnh; không lấy thiếu co-an.glb làm lý do ngừng dựng hula_bag.glb.

Ưu tiên hula_bag.glb trước, theo TUI_BAO_QUAN_-_01.jpg; tiếp theo nệm/gối/chăn REF-MAT-CARA-STD. Giữ danh sách giả định về chiều sâu túi, quai, bề dày nệm trong metadata kỹ thuật, tách khỏi thông số catalogue. Giữ dữ liệu danh mục source-preserving.

Xuất file GLB và nguồn Blender thực sự. Kiểm mesh/material/nodes/anchors bằng loader đích, render front/back/side/3-quarter từ cùng asset. Đúng hai quai ngắn, mặt sau xám có khóa ngang, nhãn trước đọc rõ. Kiểm nệm/gối/chăn là thành phần riêng. Không xuất hộp xanh trơn, file rỗng, billboard hoặc texture nguyên trang sale kit rồi đánh dấu hoàn thành.

Nếu thiếu Blender/công cụ, báo BLOCKED_TOOL với bằng chứng kiểm và công cụ cần; vẫn giữ kết quả Prompt A. Nếu đã có công cụ, thực hiện đến khi có asset kiểm được, không chỉ viết lại một kế hoạch.
```

## Prompt C — Nhân vật, rig và animation có mapping thật

```text
Đọc pipeline nhân vật trong 02_3D-Asset-Pipeline.md và bộ 12 PNG characters/. Tìm asset/công cụ 3D được cấu hình sẵn. Nếu có Meshy hoặc pipeline tương đương đã được cấp, tạo từng nhân vật, kiểm model, auto-rig, rồi lấy/chỉnh clip. Nếu chưa có access, báo BLOCKED_CHARACTER_PIPELINE; không bịa kết quả job hoặc tự phát sinh chi phí. Không dựng ba capsule thay nhân vật.

GLB có thể chứa mesh + skeleton + animations, không bắt chủ dự án cung cấp một file skeleton riêng khi GLB đã rig đầy đủ. Giữ output co-an.glb, me-linh.glb, be-may.glb hoặc map asset registry sang convention repo. Rig.height là chiều cao toàn thân, camera.eyeHeight là tầm mắt, không dùng lẫn.

Map clip riêng theo vai. Cô An có give_bag/hold_bag; mẹ Linh có reach_out/receive_bag/hold_bag; Mây có idle/look_at_bag/wave. handover_transfer có thể là action phối hợp, không yêu cầu cùng một clip được copy cho mọi vai. Mỗi mapping phải trỏ tới clip có thật hoặc hành vi procedural trên rig được kiểm chứng.

Chỉnh hai tay theo grip anchors của túi thực, dùng chung timeline. Animation marker bàn giao phải được controller tiêu thụ qua metadata/runtime logic rõ ràng; không mặc định marker trong Blender tự thành event glTF. Thời điểm chuyển xác định trên animation cuối sau khi tay đã tiếp xúc, không hardcode 50% nếu pose chưa khớp.

Nghiệm thu: bốn view từ mỗi model, clip chạy không vỡ cổ tay/vai, ngón tay nắm được quai; character readiness, rig readiness, motion readiness báo riêng. Chưa chuyển sang PASS interactive khi mới có mesh tĩnh.
```

## Prompt D — Tích hợp cảnh nhận túi và kiểm tra cuối

```text
Tích hợp sản phẩm thật vào event đón cuối tuần trong tour hiện có, dùng event ID đã map. Cảnh đã thu dọn, Mây thức; cô An và mẹ Linh đứng tại điểm bàn giao. Không còn trẻ ngủ trong background khi nhãn thời điểm là giờ đón.

POV mẹ Linh: nhìn nhãn “Mây — Lớp Mầm” trên túi, CTA “Nhận túi”. Có đúng một bag instance. ready: cô An giữ; transferring: hai người thực hiện pose tiếp xúc; marker: đổi owner cô An → mẹ Linh, giữ world transform khi đổi parent; received: mẹ Linh giữ, cô An buông, mới hoàn tất bước. Loại bỏ mọi nhánh nhận diện túi bằng lá cũ.

Progress hành động khác content viewed. Bấm CTA liên tục không tạo nhiều clip/marker/instance; skip nếu có phải commit snapshot cuối hợp lệ và ghi skipped riêng. Replay/reset/đóng giữa thao tác và đổi vai phục hồi theo quy tắc Instruction 04. Vai Mây vẫn có nhiệm vụ tìm nhãn/chào cô, không phải khi mẹ đã nhận túi thì Mây tự hoàn tất lời chào.

Giữ UI gọn, vùng mặt/tay/túi không bị card che ở 390×844, 844×390, 1440×900. Không nhãn tầm mắt/debug trong public UI. Đổi dòng sản phẩm khác phải dùng đúng mesh/cấu hình/animation hoặc chuyển sang inspector; không giữ hình nệm Cara rồi chỉ thay tên thành foam/túi ngủ.

Kiểm: dữ liệu đúng nguồn; mặt sau túi đúng; vị trí khóa đúng; nhãn đọc được; scene đúng thời điểm; ownership nhất quán; đổi màu không tint phòng; full POV thật; loading/fallback trung thực; regression CMS enabled/route policy và script build/test cần thiết.

Đầu ra: ảnh before/after của runtime cùng viewpoint, video bàn giao, bảng asset có thật, thông số nguồn/ước lượng tách riêng, kết quả PASS/FAIL/BLOCKED. Báo số đo runtime theo thiết bị thực tế; không bịa FPS hoặc dùng JPEG sale kit làm ảnh kết quả của scene. Không tự publish.
```

## Tiêu chí bàn giao ngắn

| Phần | Điều kiện đạt |
|---|---|
| Nội dung thật | Đúng 15 reference, nguồn tương ứng, SKU chưa biết không bịa |
| Hero product | Cara tiêu chuẩn đúng kích thước thành phần, không lẫn Satin/foam |
| Túi thật | Quai xách S, xanh/xám, khóa sau, nhãn Mây; không còn túi kem lá |
| Bàn giao | Một túi, hai tay tiếp xúc, đổi chủ một lần, progress đúng |
| Render | Phân biệt ảnh tham chiếu/model thật/POV hoàn chỉnh |
| Chất lượng | Hình đúng, UI không che, replay/cancel ổn; có bằng chứng runtime |
