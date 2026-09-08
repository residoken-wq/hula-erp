# HULA 360 — Bước 04: Storyboard phụ huynh và trẻ

Phiên bản 1.0 · 08/09/2026. Gói này tiếp nối storyboard cô An và instruction prototype. ChatGPT tạo nội dung, hình và instruction; AI IDE thực hiện mọi code sản phẩm.

## 1. Đã bàn giao trong bước này

- Storyboard mẹ Linh: 6 khung, ngôi thứ nhất, dùng lại nhân vật và không gian từ concept trước.
- Storyboard bé Mây: 6 khung, góc nhìn thấp, có tay của bé và sự hỗ trợ của cô An.
- Shot list, lời dẫn nháp, các hành động nối và thời điểm trong câu chuyện.
- Instruction 02 cho AI IDE mở rộng từ prototype cô An thành ba vai.

Đây là hình concept, chưa là panorama, mesh, rig, animation hay bản chạy. Hai storyboard được tạo bằng công cụ tạo ảnh tích hợp, dùng bảng nhân vật và storyboard cô An làm tham chiếu. Chưa có kết quả chạy AI IDE được cung cấp trong hội thoại; không coi prototype cô An là đã đạt nghiệm thu.

## 2. Tài nguyên hình trong gói

| File | Dùng cho | Tình trạng |
|---|---|---|
| `references/HULA360_Characters_V01.png` | Gương mặt, trang phục, kiểu tóc và tỷ lệ nhân vật | Concept đã tạo ở bước trước |
| `references/HULA360_CoAn_POV_Storyboard_V02.png` | Tham chiếu POV cô An và chất liệu lớp | Bản đã sửa tay áo ở bước trước |
| `references/HULA360_MeLinh_POV_Storyboard_V01.png` | Hành trình phụ huynh | Mới tạo trong bước này |
| `references/HULA360_BeMay_POV_Storyboard_V01.png` | Hành trình trẻ | Mới tạo trong bước này |

Nệm mint, gối kem, túi kem có chiếc lá đều là đạo cụ sản phẩm minh họa. Không gán SKU thật, kích thước suy từ ảnh, quy cách gấp, đặc tính hoặc giá bán. Nhân vật là hư cấu; không trình bày lời thoại như lời chứng thực khách hàng.

## 3. Dòng thời gian chung

Ba hành trình là ba cách kể cùng thế giới, không phải ba người dùng online cùng điều khiển. Dùng một lớp học và một bộ đồ có identity thống nhất, các lần xem có thể là replay theo kịch bản.

| Mốc | Thời điểm | Sự kiện | Nhân vật có mặt |
|---|---|---|---|
| EV-01 | Buổi làm quen, đầu ngày | Mẹ và Mây tới cửa, cô nhận túi | Cả ba |
| EV-02 | Buổi làm quen, trước giờ sinh hoạt | Cô cho mẹ xem bộ đồ tại bàn demo | Cả ba; không có trẻ đang ngủ |
| EV-03 | Sau phần làm quen | Bộ đồ về ngăn cá nhân, Mây nhận ra ký hiệu | Cả ba hoặc cô và Mây sau khi mẹ chào về |
| EV-04 | Chuẩn bị giờ nghỉ | Cô và Mây lấy bộ đồ, trải nệm, đặt gối | Cô và Mây |
| EV-05 | Sau giờ nghỉ | Thu gối, gấp, đóng gói, cất | Cô và Mây |
| EV-06 | Cuối tuần — giờ đón trẻ | Cô lấy đúng túi và bàn giao về nhà | Cả ba |

Các nhãn “Sau giờ nghỉ” và “Cuối tuần — giờ đón trẻ” phải hiển thị khi nhảy thời gian. Không kéo dài giờ ngủ thật; không làm khách hiểu mọi việc diễn ra trong một phút.

Ở EV-02, cô lấy bộ từ túi ra bàn để giới thiệu, sau đó đóng gói trước EV-03. Có thể dùng thao tác nối ngắn hoặc một checkpoint có mô tả; không để có thêm một bộ demo thứ hai mà không khai báo.

## 4. Storyboard mẹ Linh

### Góc nhìn và nhận diện

Người xem ở mắt mẹ Linh, đứng tham khảo 1,60 m, thấy bàn tay/cẳng tay của mình và mép áo kem ngắn tay nếu lọt khung. Không thấy mặt hoặc lưng mẹ Linh. Cô An và Mây là người đối diện. Mẹ chỉ có mặt trong buổi làm quen hoặc lúc bàn giao, không đứng trong lớp đang ngủ.

| Khung | Mốc | Hình ảnh qua mắt tôi | Lời nghĩ/nói nháp | Tương tác và kết quả |
|---|---|---|---|---|
| PH-01 | EV-01 | Cô An trước cửa, Mây bên cạnh; tôi cầm túi | “Hôm nay mình cùng Mây làm quen với lớp.” | Chạm Bàn giao; túi chuyển từ tay mẹ sang tay cô |
| PH-02 | EV-02 | Cô giới thiệu nệm, gối và túi trên bàn | “Mình xem trong bộ đồ có những gì nhé.” | Chạm từng món; hiện tên món demo, vật thể được chỉ đúng |
| PH-03 | EV-02 | Tay tôi cầm nhẹ mép nệm, xem mặt vải và cạnh | “Mình muốn xem kỹ bề mặt và đường may.” | Nâng mép, xem gần rồi trả lại; panel thông tin không tự thêm đặc tính chưa có |
| PH-04 | EV-03 | Ngăn tủ có chiếc lá; Mây đứng cạnh cô | “Đây là ký hiệu để nhận ra đồ của con.” | Chọn ký hiệu, xem vị trí cất; cùng một túi và ngăn xuyên suốt |
| PH-05 | EV-06 | Cô trao lại túi tại cửa lớp | “Mình kiểm tra đúng bộ trước khi mang về.” | Nhận túi, kiểm ký hiệu; có lựa chọn mở hướng dẫn chăm sóc nếu đã có nguồn |
| PH-06 | EV-06 | Tôi giữ túi; Mây bên cạnh, cô chào ở cửa | “Mình đã biết cách nhận và cất đồ cùng con.” | Kết thúc; tùy chọn xem lại hoặc xem thông tin mẫu đã xác minh |

Chỉ dẫn giao diện và suy nghĩ nhân vật là hai lớp riêng. Cô có thể nói “Mời chị xem bộ đồ của Mây” ở PH-02; không dùng lời quảng cáo về sức khỏe hoặc mức tiết kiệm như một sự thật đã kiểm nghiệm.

### Hành động nối cần có

1. Sau PH-01: cô đặt túi xuống bàn, mở và lấy các món ra; mẹ đi đến điểm quan sát tương ứng.
2. Sau PH-03: mẹ trả mép nệm về vị trí; cô đóng gói trước khi chuyển sang ngăn tủ.
3. PH-04: Mây có thể cầm túi trong lúc nhận diện; phải kết thúc bằng cất túi hoặc checkpoint ghi rõ đã cất.
4. Trước PH-05: chuyển thời gian có nhãn; cô lấy bộ đã đóng gói từ ngăn và mang ra cửa. Không để túi còn trong tủ đồng thời ở tay cô.
5. PH-06: mẹ đã nhận quyền giữ túi; cô buông tay trước khi chào.

Hướng dẫn chăm sóc đang thiếu: bản demo hiển thị “Hướng dẫn của mẫu này đang chờ xác nhận”, không tự tạo nhiệt độ giặt hay biểu tượng nhãn giặt. Hình PH-03 chỉ thể hiện xem chất liệu; không mô phỏng cảm giác như phép đo.

## 5. Storyboard bé Mây

### Góc nhìn và cách dùng

Camera đứng tham khảo 0,95 m, thấp hơn người lớn; tay nhỏ, áo vàng nhạt ngắn tay. Khi quỳ, camera và cơ thể phải chuyển cùng pose. Không thấy mặt/lưng Mây từ bên ngoài. Cô An cúi hoặc quỳ khi hỗ trợ để giao tiếp gần tầm mắt.

Người lớn có thể chọn vai Mây để hiểu trải nghiệm của trẻ. Nếu chọn “Cùng bé khám phá”, áp dụng giao diện đơn giản: một thao tác/lần, nút lớn, có nghe lại, không giá/form mua và không yêu cầu nhập dữ liệu.

| Khung | Mốc | Hình ảnh qua mắt tôi | Lời nghĩ/nói nháp | Tương tác và kết quả |
|---|---|---|---|---|
| BE-01 | EV-01 | Nhìn lên mẹ và cô đang chào; tay tôi vẫy | “Con chào cô An!” | Chạm Chào cô; cô phản hồi nhẹ, không yêu cầu thu âm |
| BE-02 | EV-03/04 | Túi chiếc lá ở ngăn thấp; cô hỗ trợ bên cạnh | “Túi có chiếc lá là của mình!” | Chạm đúng túi; tay bé và cô phối hợp lấy xuống |
| BE-03 | EV-04 | Nhìn xuống nệm; tay tôi ở mép gần, cô ở phía đối diện | “Mình cùng cô trải nệm nhé.” | Chạm Trải cùng cô; hành động phối hợp, không hai tay điều khiển xung đột |
| BE-04 | EV-04 | Tay tôi đưa gối vào vị trí; cô hướng dẫn | “Con đặt gối ở đây.” | Chạm gối rồi vị trí gợi ý; gối về đúng đầu nệm |
| BE-05 | EV-05 | Tôi và cô cùng gấp bộ đồ | “Mình cùng cô thu dọn.” | Sau nhãn thời gian, thu gối rồi gấp; cô thực hiện phần cần trợ giúp |
| BE-06 | EV-05 | Túi về ngăn thấp; cô bên cạnh | “Mình cất xong rồi!” | Đóng gói cùng cô, cất đúng ngăn; kết thúc hoạt động |

### Hành động nối và trợ giúp

- BE-01 → BE-02: có nhãn “Chuẩn bị giờ nghỉ”; mẹ đã chào về, bộ đồ đã ở ngăn. Không giữ mẹ trong cảnh nếu không có lý do.
- BE-02 → BE-03: cô và bé đưa túi đến vùng thao tác, đặt xuống, mở và lấy đồ. Bỏ qua phần minh họa vẫn phải chuyển tới state hợp lệ.
- BE-04 → BE-05: nhãn “Sau giờ nghỉ”; không mô phỏng trẻ phải ngủ theo timer.
- BE-05 → BE-06: gối và nệm được cho vào túi trước khi đưa vào ngăn. Cô có animation trợ giúp riêng.
- Chạm sai chỉ làm nổi bật gợi ý, không trừ điểm, âm thanh báo lỗi gắt hoặc bắt đầu lại toàn bộ.
- Dùng biểu tượng chiếc lá cố định trong vòng demo. Không chỉ dùng màu để nhận diện.

## 6. Ma trận camera và người được nhìn thấy

| Vai điều khiển | Tự thấy | Có thể thấy đối diện | Phải tránh |
|---|---|---|---|
| Cô An | Tay/cẳng tay người lớn, polo ngắn tay | Mẹ Linh, Mây đúng thời điểm | Thấy lưng/mặt cô An trong POV |
| Mẹ Linh | Tay/cẳng tay người lớn, mép áo kem | Cô An, Mây | Tay áo xanh của cô thay tay mẹ |
| Bé Mây | Tay nhỏ, mép áo vàng nhạt | Cô An, mẹ Linh đúng thời điểm | Hiện thêm một bé Mây trước mắt mình |

Nhân vật đang điều khiển vẫn có thể cần body/rig cho bóng hoặc tương tác nội bộ, nhưng render lớp tự nhìn phải tránh xuyên hình. Không thêm gương trong bản mẫu để tránh yêu cầu render nhân vật phản chiếu ngoài phạm vi.

## 7. Review hình và giới hạn bàn giao

Đã quan sát sáu khung của mỗi storyboard: tay POV, trang phục, cô/mẹ đúng vai, biểu tượng chiếc lá và sản phẩm minh họa. Storyboard Mây thể hiện người lớn cúi/quỳ và góc nhìn thấp, không có nhân vật Mây đối diện camera.

Các khung tạo sinh không phải bản vẽ đo tỷ lệ: tay, kích thước túi và bố cục nhỏ có thể khác giữa khung. AI IDE phải dùng một scene, một rig và cùng asset nguồn; không tái tạo từng phòng khác nhau theo từng ảnh. Mốc chuyển thời gian sẽ do UI thực hiện, chưa được viết trực tiếp trên hình. Ký hiệu ngăn tủ phải có trong scene kể cả khi hình chỉ thấy ký hiệu trên túi.

Chưa kiểm chứng sản phẩm Hula, camera 360 thật, animation liên tục, giọng, thiết bị hoặc kết quả AI IDE. Không ghi những nội dung đó là đã nghiệm thu.

## 8. Tiếp nhận tài nguyên

Vẫn ưu tiên một SKU đầu tiên: ảnh đa góc/mặt dưới/sau gấp, kích thước và độ dày, phụ kiện, trình tự gấp, hướng dẫn chăm sóc, logo nguồn. Có thể tiếp tục demo proxy theo instruction trong khi chờ. Không yêu cầu anh cung cấp ảnh người thật.

## 9. Prompt tạo hình

Hai prompt nguyên bản được đính kèm phía dưới; cả hai dùng cùng bảng nhân vật và storyboard cô An làm reference. Tạo lại bằng prompt có thể khác chi tiết, vì vậy ảnh đã chọn và character bible là nguồn nhận diện ưu tiên.


### 9.1. Prompt mẹ Linh

Use case: illustration-story.
Create a polished SIX-panel storyboard for HULA 360, literal first-person point of view of MOTHER LINH. The first reference is the CHARACTER IDENTITY reference; second reference is CLASSROOM, BAG, MAT, PILLOW AND RENDER STYLE reference only. Do NOT copy the teacher POV hands or sequence. Keep exactly the identities: teacher An dark low ponytail turquoise SHORT-SLEEVE polo beige trousers; daughter May five years old black bob with green leaf hair clip, pale yellow short-sleeve tee blue trousers. Mother Linh whose eyes we inhabit wears cream SHORT-SLEEVE blouse, so the two natural hands/forearms in the foreground are BARE with at most tiny cream sleeve edges near upper arms at bottom. Never show mother's face, head, back, or a third-person view of mother.
Artboard: landscape 3 columns by 2 rows, six spacious cinematic panels, chronological 01–06. Minimal cream gutters, title exactly "HULA 360 • GÓC NHÌN MẸ LINH". Footer exactly "STORYBOARD V01 • SẢN PHẨM MINH HỌA". Only these texts plus panel numbers. No body text or gibberish.
Same bright preschool: ivory walls, light oak floor, low wooden cubbies left, window right, calm neutral background. Product is same generic mint quilted foldable floor mat, cream small pillow, cream cloth carry bag with ONE green leaf patch. These are fictional product placeholders, not certified Hula specs. No invented logos, labels, anti-slip mechanisms, clasps or washing symbols.
01: first-person mother at classroom doorway, own hands holding cream leaf bag in foreground, teacher An facing her inside classroom reaching to receive it, May at mother's side in view with correct short height. Clearly a welcome visit.
02: mother POV standing at low demonstration table: teacher An on opposite side shows the SAME open cream bag with mint folded mat and cream pillow arranged beside it. Mother's bare hand reaches toward one item. Just one mat, one pillow, one bag total.
03: mother POV closer at table, own bare hands lift just a corner of mint quilted mat to inspect fabric and edge, realistic soft thickness, teacher's turquoise short sleeve visible across table. Do not make a scientific cutaway, do not invent product internals.
04: mother turns to low cubby at left: own hand points at green leaf marker on designated cubby, May stands beside it pointing at her own matching cream leaf bag. Adult eye view angled down; An optionally behind May. No duplicate product in hand.
05: DIFFERENT TIME, end-of-week pickup: mother first-person at same doorway reaching with two bare hands as teacher An hands back the single CLOSED cream leaf bag. May beside An ready to leave. Same characters/clothes for this concept. No sleeping scene.
06: mother standing just outside doorway, first-person looking down at cream leaf bag held at waist in her left hand; right bare hand supports bottom, May smiling up beside her and teacher An waving in doorway further ahead. No phone, no fake care labels, no shopping or sales symbols.
Preserve identities, room style and props, make all six frames clearly through mother's eyes. Physically plausible hand contact, no floating limbs, no cuffs at wrist, no mother shown externally, no over-shoulder or spectator shots. Storyboard artwork only, not a stitched panorama.

### 9.2. Prompt bé Mây

Use case: illustration-story.
Create a coherent SIX-panel storyboard for HULA 360, literal first-person view THROUGH THE EYES OF FIVE-YEAR-OLD MAY. Reference 1 is the character identity sheet, reference 2 is the classroom/product rendering style. This is NOT a picture of a child playing. It is what that child herself sees. ABSOLUTE REQUIREMENT: NEVER show May's face, head, back, body from outside, or a third-person/over-shoulder camera in any panel. The only portions of May that may appear are her own TWO small child hands and short bare forearms entering from the bottom, tiny pale-yellow short sleeve edge near upper arm if visible. Her hands must be visibly smaller and rounder than the adult teacher's hands. No adult-sized POV hands. No duplicated child.
Other characters: teacher An Vietnamese woman black low ponytail turquoise SHORT-SLEEVE polo beige pants white shoes; mother Linh Vietnamese woman black shoulder-length hair cream SHORT-SLEEVE blouse light blue pants neutral shoes. Preserve faces/clothing from reference. Adults are tall from child's 0.95m standing eye level; teacher crouches at appropriate times to communicate at child's level.
Layout landscape 3 columns x 2 rows, six clear cinematic frames 01 through 06, generous cream gutters. Title exact "HULA 360 • GÓC NHÌN BÉ MÂY". Footer exact "STORYBOARD V01 • SẢN PHẨM MINH HỌA". No additional text, diagrams or arrows.
Same calm bright room: light oak floor, ivory walls, low oak cubbies left, soft daylight windows right. Same placeholder mint quilted foldable sleeping mat, cream small pillow, cream fabric carry bag with single green leaf patch. No extra characters/children. No actual brand logo, no invented specs.
Panel 01: low child's first-person view at doorway looking gently UP at teacher An smiling in front, teacher bent slightly at waist, mother Linh at left beside viewer seen only as another person; viewer's small hand at bottom waves. Camera is unmistakably lower than adult eye level. Show reasonable adult height.
Panel 02: child eye view looking at a LOW oak cubby at easy reach; own small hands reach for cream leaf bag in cubby matching leaf marker. Teacher's adult hand enters from side to assist, with clear size difference. Don't place shelf above child's reach.
Panel 03: child seated/kneeling low POV looking forward-down at partially unfolding mint mat on wood floor; own small hands hold NEAR edge, teacher's visibly larger hands guide FAR edge from opposite side. Teacher An crouching beyond mat is visible, no May character facing camera. Correct physical mat contact.
Panel 04: same low first-person POV, own TWO small hands place small cream pillow on mat at defined head end while teacher An crouches diagonally beyond it to guide. Do not put an external child in the frame. No extra hands.
Panel 05: later after rest, child first-person kneeling, own small hands and ONE or TWO teacher hands from opposite side work together to fold the same mint mat. Teacher crouches on far side, calm, no child face.
Panel 06: child standing low POV, own small hands slide the cream bag containing folded kit into the low cubby with green leaf marker; teacher An crouches beside cubby looking toward viewer with encouragement. Camera near 0.95m, no external May.
Warm professional stylized 3D animation aesthetic, believable anatomy, physically supported product, adult assistance, calm emotions, clean perspective, no floating fingers, no long sleeves at wrist, no commercial CTA. These are conceptual storyboard stills, not a panorama or final product model.
