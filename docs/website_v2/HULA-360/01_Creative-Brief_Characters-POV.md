# HULA 360 — Bước 02: Nhân vật và storyboard POV

Phiên bản 1.0 · 08/09/2026 · Đầu ra sáng tạo để AI IDE triển khai.

## 1. Quy tắc thực hiện

Anh cung cấp tài nguyên và duyệt đầu ra. ChatGPT phụ trách sáng tạo, phân tích, hình tham chiếu, kịch bản, instruction và review. **AI IDE của anh thực hiện toàn bộ code sản phẩm, mã dựng 3D, animation và tích hợp.** Tài liệu này không chứa code sản phẩm.

Đã tạo hai hình bằng công cụ tạo ảnh tích hợp: bộ nhân vật và storyboard cô An. Đã chỉnh storyboard để tay áo khớp áo polo ngắn tay của cô An. Đây là concept và storyboard; chưa phải mô hình rigged, texture UV, animation, panorama chuẩn hoặc bản web đã chạy.

Hình trong gói bàn giao:

- `references/HULA360_Characters_V01.png`: bảng nhân vật chính thức của vòng concept này.
- `references/HULA360_CoAn_POV_Storyboard_V02.png`: storyboard đã sửa tay áo. Dòng chữ V01 trong hình là phiên bản storyboard nội dung; V02 trong tên file là lần sửa hình. Dùng file này, không dùng bản trước sửa.

## 2. Character bible

| Thuộc tính | Cô An / CHAR-AN | Mẹ Linh / CHAR-LINH | Bé Mây / CHAR-MAY |
|---|---|---|---|
| Vai trò | Giáo viên của Mây | Mẹ của Mây | Trẻ khoảng 5 tuổi |
| Ngoại hình | Người Việt, tóc đen buộc thấp | Người Việt, tóc đen ngang vai | Người Việt, tóc bob đen, kẹp chiếc lá xanh |
| Trang phục cố định | Polo xanh ngọc ngắn tay, quần be, giày trắng | Áo kem ngắn tay, quần xanh nhạt, giày màu trung tính | Áo vàng nhạt, quần xanh dịu, giày nhỏ màu sáng |
| Tính cách | Bình tĩnh, chu đáo, hướng dẫn rõ | Quan tâm, quan sát, gần gũi | Tò mò, vui nhẹ, đang tập tự lập |
| POV đứng tham khảo | 1,55 m | 1,60 m | 0,95 m |
| Lời nghĩ | “Mình…” | “Mình…” | “Mình…” |
| Lời nói | “Cô…” khi nói với trẻ | “Mẹ…” khi nói với Mây | “Con…” khi nói với cô/mẹ |

Chiều cao camera là giả định dựng cảnh, không phải số đo dân số. Bảng nhân vật gồm hình chính và góc phụ với tỷ lệ trình bày khác nhau; không đo kích thước mô hình 3D từ tỷ lệ pixel giữa các hình phụ.

Phong cách: 3D cách điệu nhẹ, chất liệu mềm, nét mặt tự nhiên, ánh sáng ấm. Nhân vật là hư cấu. Không dùng hình ảnh này như lời chứng thực của khách hàng hoặc nhân viên thật.

### Bất biến cần giữ

- Mây luôn có kẹp chiếc lá và cùng một gương mặt; mẹ và cô phân biệt qua tóc/trang phục.
- Cô An mặc tay ngắn; bàn tay/cẳng tay POV không có cổ tay áo dài.
- Tay POV thuộc nhân vật đang nhập vai, không phải tay của camera quan sát.
- Độ lớn tay của Mây nhỏ và phù hợp tỷ lệ trẻ; không thu nhỏ nguyên mô hình người lớn.
- Không đổi tóc, áo, biểu tượng, màu sản phẩm hoặc hướng phòng giữa hai cảnh liền nhau.
- Nhân vật có thể xuất hiện toàn thân trong bảng tham chiếu hoặc khi là người đối diện; không thấy nhân vật đang điều khiển từ phía sau trong trải nghiệm chính.

## 3. Lớp học và sản phẩm mẫu

Lớp giả lập: sàn gỗ sáng, tường kem, tủ gỗ thấp ở bên trái theo hướng nhìn vào lớp, cửa sổ bên phải, bàn ghế ở vùng hậu cảnh. AI IDE phải dựng một bố cục 3D thống nhất, không suy ra mặt bằng chính xác từ các khung AI vốn có thể khác nhau về phối cảnh.

Mẫu minh họa hiện tại: nệm xanh mint, gối kem, túi kem có biểu tượng chiếc lá. **Đây chưa phải bản sao SKU Hula.** Không lấy màu mint, túi có quai, cách gấp hoặc cách đặt gối trong hình làm thông số sản phẩm thật.

Một sản phẩm demo có ID `DEMO-KIT-01`; không gán SKU thật, giá hoặc tuyên bố tính năng. Biểu tượng chiếc lá chỉ để kể chuyện nhận đúng đồ, không là tính năng mặc định của mọi sản phẩm Hula.

Dữ liệu còn thiếu để dựng SKU thật: ảnh đa góc, kích thước sau gấp, độ dày, phụ kiện, cách gấp chính xác, hướng dẫn chăm sóc và logo nguồn. Có thể làm bản demo hình khối với nhãn minh họa trong khi chờ các dữ liệu này.

## 4. Storyboard cô An — 6 khung và các hành động nối

Sáu khung là điểm nhìn chính. Các thao tác trung gian dưới đây phải tồn tại trong trải nghiệm, dù không có hình riêng; không cho đồ vật tự biến mất hoặc tự xuất hiện.

| Khung | Camera / bối cảnh | Lời nghĩ/nói | Hành động người xem | Trạng thái và chuyển động cần thấy |
|---|---|---|---|---|
| 01 — Nhận túi | Đứng tại cửa; mẹ Linh và Mây phía trước | “Mình nhận bộ đồ của Mây trước nhé.” | Chọn Nhận túi | Mẹ đang giữ túi → tay cô tiếp nhận → mẹ thả tay; chỉ một túi |
| 02 — Xem ký hiệu | Nhìn xuống túi trong tay; tủ ở bên trái | “Đúng ký hiệu chiếc lá rồi.” | Chọn Xem ký hiệu | Nâng túi vừa tầm; mở thông tin rồi hạ lại; tay không che biểu tượng |
| 03 — Lấy và trải | Di chuyển đến điểm trải; chuyển tư thế quỳ/cúi phù hợp | “Mình lấy nệm ra và trải ở đây.” | Chọn Lấy nệm → Trải nệm | Đặt túi → mở túi → lấy bộ gấp → đặt xuống → mở ra; gối nằm ở vị trí sạch đã định |
| 04 — Đặt gối | Giữ POV thấp tại vị trí thao tác; Mây bên cạnh | “Cô đặt gối vào vị trí này nhé.” | Chọn Đặt gối | Tay lấy gối và đặt đúng đầu nệm; gối không nhân đôi |
| Chuyển thời gian | Góc nhìn đứng yên; thẻ ngắn “Sau giờ nghỉ” | Không bắt buộc lời nói | Chọn Tiếp tục | Không giả vờ toàn bộ giờ ngủ diễn ra trong vài giây; không tự chuyển khi người dùng đang mở thẻ |
| 05 — Gấp | POV thao tác tại nệm | “Mình cùng Mây thu dọn nhé.” | Chọn Thu gối → Gấp nệm | Đưa gối về vị trí đệm tạm; gấp nệm theo animation demo; chưa tuyên bố cách gấp chuẩn Hula |
| 06 — Cất | Trước ngăn tủ có cùng biểu tượng; Mây đứng bên | “Đồ đã về đúng ngăn rồi.” | Chọn Cho vào túi → Cất đồ | Bộ gấp và gối được đóng gói, túi được cầm lên, đưa vào ngăn, tay rời túi |

Thời lượng dự kiến khi xem trơn: 60–90 giây, cho phép dừng và khám phá lâu hơn. Thời lượng animation không được dùng làm chứng minh thời gian thao tác thật.

Ở hình 04, vị trí gối là minh họa bố cục; khi code phải đặt theo đầu nệm được định nghĩa trong scene. Ở hình 06, camera thấp gần tủ là tư thế cúi của cô, không phải tự chuyển sang mắt của Mây.

### Ngoài phạm vi storyboard lần này

Hai hành trình mẹ Linh và Mây đã có kịch bản trong kế hoạch tổng, nhưng chưa tạo storyboard hình riêng. Không ghi chúng là đã hoàn thiện thị giác. Instruction đầu tiên chỉ triển khai cảnh cô An để kiểm chứng POV, tay và trạng thái sản phẩm.

## 5. Các điểm tương tác ưu tiên

| ID | Điểm tương tác | Mục tiêu |
|---|---|---|
| HP-HANDOVER | Túi ở tay mẹ Linh | Nhận túi |
| HP-TAG | Biểu tượng chiếc lá | Kiểm tra nhận diện |
| HP-MAT | Bộ nệm tại điểm trải | Mở và gấp |
| HP-PILLOW | Gối của cùng bộ | Lấy và đặt |
| HP-CUBBY | Ngăn cá nhân | Cất đúng chỗ |

Mỗi bước chỉ nhấn mạnh một thao tác tiếp theo. Có thể xoay nhìn xung quanh trước thao tác; khi cần hướng nhìn chính xác, hệ thống giải thích ngắn và điều chỉnh có kiểm soát, có tùy chọn giảm chuyển động.

## 6. Kiểm tra concept đã thực hiện

- Đã quan sát ba nhân vật, nhãn tên, trang phục và các góc phụ.
- Đã quan sát cả sáu khung storyboard: đều dùng tay người xem, không có góc theo sau cô An.
- Đã sửa tay áo dài ở bản storyboard đầu thành cẳng tay trần phù hợp áo ngắn tay.
- Hình chưa chứng minh tỷ lệ 3D, cấu tạo sản phẩm, topology, chuyển động liên tục hoặc hiệu năng.
- Phối cảnh, vân chần và chi tiết nhỏ trong các khung không phải nguồn dữ liệu hình học; AI IDE phải dùng một scene và một mô hình gốc.

## 7. Tài nguyên và thứ tự tiếp nhận

Anh có thể gửi một SKU trước. Ưu tiên: logo nguồn → ảnh mặt trên/dưới/bên/sau gấp → số đo → trình tự thao tác → hướng dẫn chăm sóc. Ảnh/video điện thoại rõ ràng hoặc tài liệu sẵn có đều dùng được để đối chiếu. Không cần ảnh người thật hoặc bản vẽ lớp thật.

Trong lúc chưa có tài nguyên sản phẩm, instruction đã cho phép AI IDE làm demo nội bộ bằng hình khối có nhãn minh họa. Không cần mua thêm dịch vụ AI để bắt đầu khung tương tác.

## 8. Trạng thái bàn giao

Đã hoàn thành bước 02 ở mức concept: bảng nhân vật, storyboard cô An, shot list, quy tắc POV và nhận diện. Đã soạn instruction bước 03 để AI IDE xây cảnh thử. Chưa tạo asset GLB/rig/audio hoặc bản chạy. Anh chưa duyệt riêng các hình vừa tạo; chúng là đề xuất V01 cho vòng sáng tạo này.

Các prompt tạo hình và chỉnh sửa được lưu ở phần cuối tài liệu để tái sử dụng cùng ảnh tham chiếu. Việc tạo lại bằng cùng prompt có thể khác chi tiết; luôn dùng ảnh đã chọn làm reference.


## 9. Prompt tạo hình nguyên bản

### 9.1. Bộ nhân vật — tạo mới

Use case: stylized-concept.
Create a polished high resolution landscape character reference art board for the HULA preschool classroom first-person product experience, three original fictional Vietnamese characters, gentle stylized 3D animation art direction, warm realistic materials, expressive but not oversized eyes, believable anatomy, refined educational brand look. This is a preproduction cast reference, not an in-game screenshot.
Layout: warm ivory background, three evenly spaced clearly separated vertical columns, discreet cyan and pale yellow accents. Each column has one large front three-quarter full-body figure, plus two small consistent side and rear full-body views and a small hand/forearm reference. Clear generous margins; characters uncropped, feet visible.
LEFT: teacher Co An, Vietnamese woman about 30, calm welcoming expression, black hair tied in a low ponytail, turquoise short-sleeve polo shirt, beige straight-leg trousers, simple white indoor shoes, no jewelry. Same exact design across views.
MIDDLE: mother Me Linh, Vietnamese woman about 33, warm observant expression, straight shoulder-length dark hair, cream short-sleeve blouse, light blue trousers, simple neutral shoes. Distinct from teacher in face and hairstyle, consistent across views.
RIGHT: Be May, fictional Vietnamese preschool girl age about five, natural age-appropriate proportions and height noticeably much shorter than adults using a shared baseline, dark bob hair with simple small green leaf hair clip, pale yellow short-sleeve shirt, muted blue trousers, small indoor shoes; cheerful curious expression, fully clothed child, small age-appropriate hands.
Adult figures about 6.5 heads tall, child about 4.5 heads tall; don't make the child a scaled-down adult. No bags or mattress, no classroom yet.
Top title exact: "HULA 360". Subtitle exact: "CHARACTER CONCEPT • V01".
Column labels exact: "CÔ AN", "MẸ LINH", "BÉ MÂY".
Bottom small note exact: "NHÂN VẬT HƯ CẤU • HÌNH THAM CHIẾU".
No extra text, no invented Hula logo, no dimensions, no watermark. Render coherent original 3D character designs with softly lit studio material shading, not toy plastic.

### 9.2. Storyboard — dùng bộ nhân vật làm ảnh tham chiếu

Use case: illustration-story.
Create a premium 6-panel storyboard art board for the HULA 360 preschool classroom project. Input reference image is the CHARACTER IDENTITY AND STYLE REFERENCE only. Preserve Co An's turquoise short-sleeve polo/forearms, Me Linh's cream blouse and shoulder-length dark hair, and five-year-old May's black bob with green leaf clip, yellow tee, blue trousers. Soft stylized 3D illustration consistent with the reference.
Every panel MUST be literal first-person POV THROUGH TEACHER CO AN'S EYES. Never show Co An's face, back, head or a full-body teacher in any panel. Co An's own forearms/hands enter naturally from lower frame edges; do not show over-shoulder views. Characters Me Linh and May may be visible as other people in front of the teacher. Anatomically plausible hands, clear contact with objects, coherent scale.
Landscape artboard with clean cream margins, SIX large rectangular cinematic panels, 3 columns x 2 rows, chronological left to right. Small number labels only 01 to 06 in upper left of each panel. Title at top exactly "HULA 360 • GÓC NHÌN CÔ AN". Footer exactly "STORYBOARD V01 • SẢN PHẨM MINH HỌA".
One consistent bright Vietnamese preschool room: light oak floor, pale ivory walls, low light oak cubby shelves on left wall, windows with soft cream curtains on right wall, entrance near front left. Uncluttered, cozy and professional. Keep geography and props consistent. Product is a GENERIC PLACEHOLDER preschool mint padded foldable mat with subtle stitched rectangular quilting, small cream pillow, cream fabric storage bag with a green leaf icon. It is not an exact commercial SKU. No product logo or made-up product specs or fasteners. No text besides title, six numbers and footer.
Panel 01: teacher-eye view at doorway. Mother Linh stands ahead and extends the cream bag by its handle, young May beside her at correct child height. Teacher's two hands reach to receive the bag. Warm greeting.
Panel 02: teacher looks down at the bag held in her hands, showing its single green leaf identification patch clearly. Low oak cubby shelf is behind bag to left. No names, no duplicate bags in hands.
Panel 03: teacher now kneeling, eye camera naturally lower and looking diagonally down, own hands unfolding the mint mat on clear wooden floor. Mat visibly partially unfolded, normal proportions. This is a close first-person action, not a overhead spectator camera.
Panel 04: from same kneeling teacher POV, own hands place a small cream pillow at the far short end of the fully opened mint mat. Child May at side watching from outside the mat area, not standing on the mattress. Clear appropriate classroom spacing.
Panel 05: later after rest, teacher same first-person kneeling angle folds the mint mat, pillow set on clean adjacent surface. Both own hands act at the fold line. No sleeping children, no time text. This is a schematic folding moment, not a verified folding instruction.
Panel 06: first-person standing near low oak cubby, teacher own hands set the single cream bag containing the folded kit into its designated cubby with matching green leaf icon; May stands a little to the side watching, not blocking arms.
Maintain polished coherent materials, stable character identities and clothing, no extra limbs, no floating hands, no mascot, no fisheye, no arrows, no UI mockup, no teacher seen in third person. These are storyboard stills, not a stitched panorama.

### 9.3. Chỉnh storyboard — dùng storyboard lần đầu làm ảnh chỉnh sửa

Edit the supplied six-panel HULA 360 teacher first-person storyboard. Change ONLY the teacher's sleeve length: Co An wears a SHORT-SLEEVE turquoise polo, as established in the character reference. In EVERY one of the six panels, her wrists and lower forearms must be bare natural skin, no turquoise cuffs at the wrists or elbows. The turquoise short sleeve can be barely visible only at the extreme bottom edges near the upper arms, or entirely out of frame. In particular remove the long turquoise sleeve reaching the wrist in panel 06. Preserve the hands, poses, product, mother, child, room, all text, panel layout, numbering, lighting and composition exactly. No other changes. Maintain first-person POV.
