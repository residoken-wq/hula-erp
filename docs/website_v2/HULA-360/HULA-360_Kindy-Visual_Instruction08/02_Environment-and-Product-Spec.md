# Hợp đồng hình ảnh: từ blockout đến lớp học hoàn thiện

Tất cả khoảng kích thước/roughness dưới đây là điểm bắt đầu dựng hình, chưa phải số đo Kindy Garden. Giữ kích thước sản phẩm đã xác nhận trong catalogue.

## 1. Bộ module phòng dùng chung
| Asset | Cấu tạo bắt buộc | Tham số thiết kế khởi đầu |
|---|---|---|
| Floor_LightWood | Plane có UV đúng tỷ lệ, vân gỗ sáng và mạch ghép; nhận bóng | Bề rộng ván nhìn khoảng0.15–0.20m; metalness 0; roughness 0.45–0.65 |
| Wall_WarmWhite | Tường sáng, chân tường riêng, góc tiếp giáp rõ | Roughness 0.85–0.95; texture rất nhẹ, không sần như bê tông |
| Window_FrameDark | Khung có độ dày, kính, cảnh sáng phía ngoài | Không phải plane đen; khung than xám, kính trong ở mức phù hợp hiệu năng |
| Blind_Blue | Rèm cuốn tách khỏi tường, có thanh trên/dưới | Xanh dịu theo ảnh02; để ít nhất một vùng cửa nhận sáng |
| Cabinet_Pastel | Thân vân gỗ, nhiều cánh xanh/kem/hồng/vàng, khe cánh, mép bo | Thấp vừa lớp mầm non; bề dày tấm tham khảo18mm, bevel1–3mm |
| Cubby_OpenWood | Kệ mở, nhiều ô, vách/hậu/chân thật | Kệ mẫu rộng 1.2m sâu 0.35m cao 0.7m; điều chỉnh để phù hợp phòng |
| Rack_FoldedMats | Kệ sâu có nhiều tầng, từng slot độc lập | Dùng bounding box bộ gấp + khoảng hở; không ép fit bằng scaling sản phẩm |
| Shelf_PlayAccent | Kệ đồ chơi thấp có đỉnh cong, một màu nhấn vàng | Chi tiết vừa đủ, không tranh chú ý với sản phẩm |
| Table_Chair_Child | Bàn ghế thấp bằng gỗ, mép bo, chân có tiếp xúc sàn | Bố trí ngoài lối đi; không cần vật lý động |
| Ceiling_Light | Trần sáng/ô trần gọn, đèn nhẹ | Không để mặt trên căn phòng bị tối xám |

Tủ gỗ dùng thớ chạy đúng hướng tấm. Texture sàn có mạch ghép không đem phủ lên mặt cánh tủ; mặt gỗ tủ cần vùng vân sạch hoặc vật liệu riêng. Những ô kệ nhìn thấy phải có chiều sâu, không dùng mặt phẳng sơn đen để giả hộc. Bản lề chỉ cần mức chi tiết hợp khoảng nhìn.

## 2. Hai ảnh vật liệu đã tạo
- `wood-light-basecolor-candidate.png`: AI tạo mới theo tông sàn, 1254×1254px, đã có đường mạch tấm. Bắt đầu coi ô texture phủ khoảng1.8×1.8m vì ảnh có khoảng 10 hàng ván, rồi hiệu chỉnh theo renderer và tỷ lệ nhìn. Không chồng thêm lưới mạch geometry không trùng texture.
- `cotton-neutral-basecolor-candidate.png`: AI tạo mới màu trung tính, 1254×1254px. Bắt đầu một ô tương ứng0.08–0.12m bề mặt để thớ chỉ đọc ở cận cảnh, không kéo cả ảnh lên một chiếc nệm thành vải bố khổ lớn.

Cả hai là candidate base color, chưa kiểm tra seam lặp trong engine và không có normal/roughness chuẩn đi kèm. IDE phải thử lặp 2×2, kiểm cạnh, mipmap và góc xiên; nếu lộ seam thì sửa asset bằng công cụ texture hoặc thay bằng texture tileable đã có nguồn. Không gọi ảnh AI là scan/PBR calibrated. Nếu dùng bộ PBR sẵn có trong repo, ưu tiên bộ khớp hình tham chiếu và có nguồn rõ.

Không suy ra normal vật lý chỉ bằng đổi màu ảnh sang tím. Chần và nếp lớn phải có geometry/normal được tạo đúng; grain vải chỉ là chi tiết nhỏ. Có thể dùng roughness scalar ở chặng đầu khi chưa có map, nhưng phải ghi đúng asset readiness.

## 3. Ánh sáng và màu
Một nguồn sáng cửa chính và ánh sáng môi trường đủ sáng để đọc vật liệu; hướng bóng khớp cửa. Tránh nhiều đèn điểm trắng gây đốm trên ô cửa. Có bóng dưới nệm/gối, chân kệ và trong hộc; bóng mềm vừa phải, không viền AO đen dày. Không dùng bloom, fog hoặc vignette để che model thô.

Giữ exposure/white balance ổn định khi đổi màu. Texture màu và dữ liệu normal/roughness phải được gán color space đúng engine/phiên bản. Nếu dự án dùng Three.js: tham khảo [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html) và [Texture](https://threejs.org/docs/pages/Texture.html); map màu tương tác với màu material, normal không thay silhouette, roughness và metalness có vai trò riêng. Kiểm tra API theo lockfile của repo.

Các giá trị roughness trong tài liệu là lựa chọn thiết kế cần tinh chỉnh, không trích từ ảnh hay thông số đo. Mục tiêu là vải khô mềm, gỗ có phản xạ nhẹ, tường mờ; không để mọi thứ cùng độ bóng như nhựa.

## 4. Nâng geometry sản phẩm
Tách ba cấp chi tiết:
1. Khối lớn: nệm có chiều dày đúng loại, mép mềm, gối có thể tích, chăn có nếp/gập; thay silhouette hình hộp/plane hiện tại.
2. Chi tiết vừa: viền chạy theo mép, đường chần đúng dòng, chỗ gập/độ phồng không đồng đều tuyệt đối, quai và nhãn đúng vị trí.
3. Chi tiết nhỏ: weave, đường chỉ, roughness variation. Chỉ thấy rõ ở góc gần; không dùng chúng thay cấp 1.

R4 Cara tiêu chuẩn dùng ảnh sale kit đúng TUI_NGU_-_01 để phân biệt chăn mỏng với PLUS chần gòn. Ảnh Kindy hỗ trợ độ mềm/nếp/viền, không tự đổi loại sản phẩm. Không biến mọi mẫu thành cùng một tấm đỏ có logo Kindy. Foam4 giữ4 đoạn, pivot gấp và tổng120×60×3cm. Cara/Satin mềm không tự gán dày3cm.

Giữ nguyên instance IDs, material slots, selection và animation bindings khi thay mesh. Nếu đổi hierarchy, tạo mapping rõ; không mất khả năng phối màu của vải. Viền xám/nhãn không nhận màu vải; dây/nhãn không dựng đứng thành tia trắng. Không bật wireframe/helper/selection ring lớn trong trạng thái bình thường.

## 5. Góc nhìn nghiệm thu trên cùng scene
| Shot | Góc / cách bố trí | Phải thấy |
|---|---|---|
| V01 Cửa vào | Mắt vai đang chọn, nhìn chéo qua phòng; tham chiếu02/10 | Sàn, tủ pastel, cửa sáng, ít nhất một sản phẩm gần |
| V02 Dọc lối đi | Camera đi giữa các hàng, tham chiếu03/09 | Parallax thật, nệm giữ tỷ lệ và màu; kệ hậu cảnh có chiều sâu |
| V03 Cận sản phẩm | Đứng/quỳ cạnh đúng instance; tham chiếu06/08 về chi tiết | Gối mềm, viền, đường chần đúng mẫu; không đổi sang ảnh khác |
| V04 Kệ chính diện | Đi tới kệ; tham chiếu15/16 | Bộ gấp đúng trạng thái, slot có chiều sâu, cùng màu/ID |
| V05 Kệ góc chéo | Đi lệch30–45độ so với chính diện; tham chiếu13/14 | Chiều sâu kệ, lớp nệm, quai/mép, bóng trong hộc |
| V06 Góc Bé Mây | Mắt0.95m, cùng scene; tham chiếu góc thấp09 để bố cục | Tỷ lệ đồ rõ, camera không xuyên sàn; vật cản đúng |

V03 góc ảnh trên cao trong nguồn chỉ giúp đọc cấu tạo. Không đưa camera POV bay lên trần để bắt chước y hệt. Chọn FOV khoảng50–60độ dọc làm điểm đầu, fit viewport và tránh méo quá mạnh; đây là tham số thiết kế, không phải calibration từ ảnh. Khi inspector mở, target nằm trong vùng scene còn nhìn thấy.
