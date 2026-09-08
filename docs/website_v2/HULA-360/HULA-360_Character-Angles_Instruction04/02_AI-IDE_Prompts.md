# HULA 360 — Prompt chính xác cho AI IDE · Instruction 04

Dán **Context chung + một prompt** mỗi lượt. Giữ tên file ảnh như trong gói. Đường dẫn là tương đối với thư mục chứa tài liệu này. Nếu chat IDE mới, dán lại Context chung. Mỗi lượt phải thực hiện công việc được giao, không chỉ viết kế hoạch.

## Context chung — dán đầu tiên

```text
Bạn đang sửa trải nghiệm HULA 360 trong repo Hula hiện có. Đọc chỉ dẫn repo trước, rồi đọc 00_START-HERE.md, 01_Character-Spec.md và ảnh evidence/Current-UI.png của bộ Instruction 04. Giữ nền CMS/API/config/accessibility của Instruction 03 nếu đã triển khai; không tạo app mới hoặc viết lại cả website.

Mục tiêu: trải nghiệm ngôi thứ nhất trong lớp học giả lập cho CHAR-AN (cô An), CHAR-LINH (mẹ Linh), CHAR-MAY (bé Mây). Nhân vật khi được chọn là camera tại mắt và tay phù hợp; hai người còn lại là NPC hiện diện thực trong cảnh. 12 PNG trong references là tham chiếu dựng hình, không phải model 3D, rig hay sprite nhân vật dùng trực tiếp trong lớp.

Không coi emoji, capsule, hình người phẳng, ảnh nền thay đổi hoặc nhãn chiều cao là bằng chứng đã có POV 3D. Placeholder được dùng trong phát triển nội bộ nhưng phải ghi rõ trạng thái chưa đạt. Không suy ra engine/FPS từ screenshot. Không bịa GLB, animation, kết quả test hoặc đường dẫn asset. Nếu pipeline không tạo được một asset, ghi chính xác đầu vào thiếu; tiếp tục các sửa đổi độc lập đã đủ điều kiện.

Chỉ làm nhiệm vụ của prompt hiện tại. Giữ thay đổi ngoài phạm vi của người khác. Không tự thêm dịch vụ trả phí, phát hành public hoặc gửi dữ liệu/form thật. Kiểm phiên bản dependency trong repo trước khi áp dụng API; giữ engine hiện có nếu đáp ứng yêu cầu.

Mỗi lượt kết thúc bằng: (1) những gì đã sửa; (2) file thay đổi; (3) cách mở bản chạy; (4) bằng chứng ảnh/video/log thực sự đã tạo; (5) tiêu chí PASS/FAIL/BLOCKED và phần còn thiếu. Không dùng “xong 100%” nếu chưa có bằng chứng. Không cần hỏi lại để làm các sửa đổi trong phạm vi đã giao.
```

## Prompt 01 — Xác minh bản hiện tại

```text
Thực hiện audit có giới hạn trước khi sửa. Xem screenshot được đính kèm và đọc code thực tế. Tìm Classroom360Modal, FloatingActionWidgets, SettingsContext, màn appearance của CMS và đường settings public; đường dẫn trong báo cáo cũ chỉ là đầu mối, không được tin số dòng cũ.

Tạo docs/hula360/current-state.md với:
- Entry point, renderer thực tế, state điều khiển role/event/step, đường CMS → API → viewer.
- Asset đang tải: URL/path, loại ảnh/mesh, projection nếu có, có người ngủ bake sẵn hay không, có skeleton/animation hay không.
- Đối chiếu bốn vấn đề trên screenshot: NPC bằng emoji; hình tay vàng; cảnh đón vẫn có trẻ ngủ; card che hành động. Phân biệt điều quan sát được với lỗi đã tái hiện.
- Map ID hiện tại sang CHAR-AN/CHAR-LINH/CHAR-MAY và sự kiện đón cuối tuần; không tạo ID trùng nếu repo đã có tương đương EV06.
- Các asset còn thiếu để thực hiện một cảnh mẹ Linh nhận túi theo 01_Character-Spec.md.

Chạy bản hiện tại bằng cách của repo, chụp một ảnh desktop và một ảnh mobile nếu môi trường cho phép. Ghi rõ nếu chưa chạy được. Chưa refactor hoặc đổi giao diện trong lượt này.
Đạt khi: mọi kết luận kiến trúc có đường dẫn/symbol bằng chứng; có inventory asset thật; biết chính xác điều gì cản cảnh mẫu.
```

## Prompt 02 — Nhập và kiểm nhân vật thật

```text
Đọc current-state.md và 01_Character-Spec.md. Ưu tiên CHAR-AN trước để xác nhận pipeline. Dùng bốn ảnh trong references/CoAn làm tham chiếu; sau khi pipeline đạt mới áp dụng cho MeLinh và BeMay.

Nếu repo hoặc công cụ hiện có đã có GLB phù hợp, mở và kiểm mesh/material/rig; không chỉ kiểm file tồn tại. Nếu có công cụ tạo model được cấu hình sẵn, dùng prompt dựng model trong 01_Character-Spec.md. Nếu không có, báo BLOCKED_ASSET với model, rig và clip thiếu; không tạo capsule/plane thay thế rồi đánh dấu PASS. Vẫn có thể chạy Prompt 04 để sửa UI độc lập.

Tích hợp loader theo engine hiện có, scale theo mét, chân tiếp đất; map eye anchor, hai hand grip anchors và animation clips thực tế. Khi một vai là người chơi, không hiện bản sao mặt/thân của chính vai che camera; hai vai khác là NPC. Cách ẩn đầu phải không làm mất tay hoặc NPC khác.

Render bốn góc FROM THE SAME mesh trong preview nội bộ, chạy idle/reach/hold. Kiểm màu áo, tóc, kẹp lá bên phải của Mây, tỷ lệ trẻ em và biến dạng cổ tay. Chọn camera 1.55/1.60/0.95m làm khởi tạo rồi hiệu chỉnh theo rig thật, không scale mù theo chiều cao ảnh.

Đầu ra: danh sách asset đã nhập và clip có thật; bốn ảnh preview từ mỗi model đã đạt; lỗi còn lại. Chưa làm cả sáu bước tour và chưa polish hiệu ứng. PASS nhân vật chỉ khi model nhìn đúng ở nhiều hướng và rig chạy được; unrigged mesh là một đầu ra trung gian.
```

## Prompt 03 — Hoàn thiện cảnh mẫu mẹ Linh nhận túi

```text
Chỉ hoàn thiện sự kiện đón cuối tuần, POV mẹ Linh. Dùng event ID hiện tại nếu đã có; nếu chưa có dùng EV06_PICKUP. Nối vào tour hiện có, không dựng một trang demo thay thế.

Scene: mẹ Linh đứng ở điểm đón gần cửa; cô An đối diện, ban đầu giữ một túi kem có dấu lá; Mây đứng bên cô, đã thức và sẵn sàng về. Nệm đã thu dọn vào kệ; không còn nhóm trẻ nằm ngủ trong scene hoặc ảnh nền. Nếu background chứa trẻ ngủ bake sẵn thì thay bằng asset cảnh đón phù hợp; không dùng CSS che/crop, phủ màu hay xóa hotspot để gọi là đã đổi trạng thái. Thiếu background đúng thì báo thiếu, không công nhận cảnh hoàn tất.

Chọn các vị trí cố định nhìn được cửa/kệ/người đối diện; không cần freewalk. Camera ở mắt mẹ Linh; cô An và Mây là NPC. Giữ phong cách nhân vật và ánh sáng phòng thống nhất, có bóng tiếp đất.

Triển khai ba trạng thái quan sát được:
1. ready: túi thuộc cô An, mẹ Linh nhìn thấy túi và Mây; CTA “Nhận túi”.
2. transferring: mẹ Linh với tay; cô An đưa túi; hai bàn tay tiến tới điểm nắm hợp lý. Vô hiệu kích hoạt lặp. Tại một animation marker, chuyển cùng object túi từ điểm gắn tay cô An sang điểm gắn tay mẹ Linh, giữ world transform tại thời điểm chuyển rồi blend nhẹ tới tư thế giữ.
3. received: mẹ Linh giữ túi ổn định; cô An buông tay; tiến độ mới được ghi hoàn tất. CTA “Kết thúc trải nghiệm”. Không nhân đôi túi, không làm túi nhảy xuyên người hoặc biến mất giữa chừng.

Nếu animation chưa có thật, ghi BLOCKED_ANIMATION. Không lấy hết timer hoặc mở thẻ nội dung làm bằng chứng người chơi đã nhận túi. Chuyển animation, quyền sở hữu túi và tiến độ bằng một luồng state nhất quán.

Trong thao tác, giữ camera ổn định, cho phép hủy qua đóng tour; hoãn đổi vai tới khi thao tác kết thúc hoặc hủy về snapshot rõ ràng. Không để camera auto-pan tranh quyền với kéo nhìn. Replay trả toàn bộ vai, pose, vị trí, túi, checkpoint về ready. Với reduced motion, chuyển trực tiếp giữa các snapshot đầu/cuối nhất quán; không ép chuyển động camera.

Đầu ra: ảnh ready, transferring, received và video ngắn thể hiện thao tác; kiểm replay, bấm CTA nhanh nhiều lần, đóng giữa thao tác. PASS khi có đúng một túi và hình ảnh/ownership/progress khớp nhau ở mọi mốc.
```

## Prompt 04 — Giao diện gọn, dễ dùng, không che hành động

```text
Sửa shell UI hiện có. Có thể làm lượt này khi asset 3D còn thiếu, nhưng không ghi rằng đã hoàn thiện POV. Tham khảo evidence/Current-UI.png để sửa phần che khuất và mật độ điều khiển.

- Thanh trên: avatar chân dung nhỏ + tên vai; một nhãn thời điểm ngắn; âm thanh nếu có, trợ giúp, đóng. Chuyển tầm mắt/ID/debug sang chế độ phát triển. Avatar UI được crop từ ảnh tham chiếu, không dùng emoji thay NPC trong lớp.
- Card nhiệm vụ mặc định gọn: số bước nhỏ, tiêu đề một dòng nếu đủ chỗ, hướng dẫn một câu và một CTA. Bỏ đoạn tự sự dài/quote lặp lại khỏi trạng thái mặc định; nút “Chi tiết” mở phần bổ sung. Giữ nội dung đầy đủ trong panel khi người dùng muốn đọc.
- Desktop >=1024px: card gọn cao mục tiêu <=112px ở cỡ chữ mặc định; phần cảnh còn lại chứa trọn mặt hai NPC và hành động túi. Nếu không đủ chỗ, dùng panel bên phải 320–360px và thu vùng render tương ứng. Không ép chữ nhỏ để đạt chiều cao.
- Mobile: card gọn với CTA tối thiểu 48px; vùng chạm trong vai bé tối thiểu 56px. Chi tiết mở bottom sheet tối đa khoảng 45% viewport ở chế độ đọc thông thường, cuộn bên trong; khi phóng to chữ phải ưu tiên nội dung và nút thoát, có thể mở panel đọc rộng hơn. Tôn trọng safe area/dynamic viewport, không tràn ngang.
- Xác định vùng render khả dụng sau topbar/card/panel. Bố trí điểm bàn giao và camera theo vùng này; không để túi sau panel rồi gọi là camera đúng. Scene không nhận click xuyên panel.
- Dùng token thương hiệu hiện có; một màu nhấn chính. Giảm glow, gradient nhiều màu, vignette tối và viền nổi dày. Panel sáng trung tính, chữ rõ, khoảng cách theo nhịp 8px. Không tự đổi thương hiệu toàn site.
- Chỉ nhấn 1–3 hotspot liên quan bước hiện tại, không nhấp nháy liên tục. Nội dung dài dùng cùng một inspector, không mở modal chồng nhau.
- Kéo nhìn hủy auto-pan; không tự quay tiếp sau khi thả. Có “Về điểm hướng dẫn”. Không autoplay âm thanh. Nút tắt âm thanh chỉ xuất hiện khi có audio thật.
- Bàn phím: có focus nhìn thấy; danh sách hành động semantic ngoài canvas; Escape đóng panel trước rồi tour; trả focus về nút mở. Không bắt phím mũi tên khi focus đang ở vùng đọc.

Chụp cùng cảnh tại 390×844, 844×390 và 1440×900. Kiểm thêm phóng to chữ 200%: CTA và nút thoát vẫn dùng được. Đánh dấu vùng bàn giao trong ảnh báo cáo nếu cần, không thêm khung debug vào UI sản phẩm. PASS khi mặt người đối diện, túi và tay đang thao tác không bị card che, chữ dễ đọc và chỉ có một hành động chính tại mỗi trạng thái.
```

## Prompt 05 — Mở rộng đúng POV cô An và bé Mây

```text
Chỉ thực hiện khi cảnh mẹ Linh nhận túi đạt tiêu chí hình ảnh và state. Tái sử dụng cùng lớp và vật thể; không clone ba thế giới độc lập.

POV cô An: camera ở mắt cô An; thấy tay áo polo xanh ngọc và tay cô; mẹ Linh cùng Mây là NPC. Trong sự kiện đón, CTA “Trao túi”; cùng object túi chuyển sang mẹ Linh qua marker bàn giao đã có.

POV Mây: camera thật thấp theo eye anchor khoảng 0.95m; tay/ống tay vàng đúng tỷ lệ trẻ. Cô An và mẹ Linh là NPC ở tầm người lớn. Nhiệm vụ phù hợp vai bé: “Tìm túi của mình”, tiếp theo “Chào cô”; chọn túi dấu lá làm điểm tương tác minh họa. Không giao cho trẻ nội dung chứng nhận, mua hàng hoặc thu thập thông tin cá nhân. Không bắt trẻ cầm túi lớn nếu kịch bản chưa có asset/animation phù hợp.

Đổi vai khi idle giữ cùng thời điểm và ownership; kết quả hiển thị theo perspective của vai mới. Hoàn tất của mẹ Linh không tự đồng nghĩa Mây đã chào cô. Cho replay bằng thao tác riêng có nhãn rõ. Trong transferring, hoãn hoặc hủy có phục hồi theo quy tắc Prompt 03; không reset âm thầm làm túi nhân đôi.

Mỗi vai phải thay đổi camera, tay, NPC visibility và hành động hợp lệ, không chỉ đổi tên/lời thoại. POV Mây nhìn kệ/người lớn từ dưới lên một cách hình học thật; không dùng cùng ảnh người lớn rồi đổi pitch/crop.

Đầu ra: ba ảnh chụp cùng một mốc thế giới từ ba vai; video đổi vai sau khi nhận túi; checklist camera/tay/NPC/action/progress. Chưa mở rộng toàn bộ kịch bản cũ cho đến khi ba POV của cảnh mẫu đạt.
```

## Prompt 06 — Nghiệm thu và bàn giao bản chạy

```text
Đọc 04_Acceptance.md và chạy các kiểm tra áp dụng cho thay đổi thật. Không chỉ trả lời dựa trên code inspection. Sửa lỗi tái hiện được trong phạm vi, rồi ghi PASS/FAIL/BLOCKED từng tiêu chí.

Đo runtime trên môi trường có thật: máy/trình duyệt/viewport, thời gian scene sẵn sàng, khoảng FPS khi kéo nhìn/nhận túi, lỗi console và asset tải lỗi. Mục tiêu dự án: khoảng 30 FPS ổn định trên thiết bị di động thử nghiệm, không khựng rõ lúc bàn giao sau khi asset đã tải. Đây là mục tiêu cần đo, không phải số đã đạt. Nếu chỉ dùng desktop giả lập kích thước, ghi rõ chưa kiểm hiệu năng trên điện thoại thật.

Kiểm mở/đóng tour nhiều lần không nhân render loop, audio hoặc handler; request cũ không ghi đè vai mới; asset lỗi có retry/thoát và không để màn trắng. Giữ regression CMS enabled/route exclusions theo Instruction 03. Chạy build/lint/test phù hợp script repo, chỉ bổ sung test state có giá trị cho ownership/replay/cancel; không tạo hàng loạt test chỉ phản chiếu JSX.

Bàn giao: đường dẫn bản chạy; file đã sửa; asset thực có; ảnh/video bằng chứng; kết quả kiểm tra; phần chưa xong và đầu vào cụ thể cần bổ sung. Không tự publish. Không gộp “UI đã sửa” và “nhập vai 3D hoàn tất” thành một trạng thái thành công khi asset hoặc animation còn thiếu.
```
