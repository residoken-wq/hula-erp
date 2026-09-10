# HULA · Instruction 10 — CMS ảnh, R7 bàn giao, bản đồ trực quan

Ngày: 10/09/2026. Đây là đặc tả triển khai cho AI IDE, chưa phải bản sửa đã chạy trên beta. Giữ phần sản phẩm tĩnh, phòng học và đổi màu đang được chấp nhận. Không dựng lại toàn bộ showroom.

## Prompt giao việc cho AI IDE

Bạn tiếp quản dự án HULA hiện có. Hãy đọc mã nguồn và thực hiện lần lượt các yêu cầu dưới đây. Không báo hoàn thành bằng ảnh giao diện có nút nhưng chức năng chưa hoạt động. Trước khi sửa, xác định file/component hiện đang quản lý scene R7, state bàn giao, bản đồ, cấu hình ảnh, backend/admin, storage và xác thực. Ghi nhận đường dẫn thực tế; không giả định framework hay tạo CMS thứ hai khi hệ thống đã có admin phù hợp.

Thứ tự triển khai: (1) truy vết và sửa R7 hiện trống; (2) tách cấu hình nội dung chung và xây CMS; (3) thay bản đồ text bằng mặt bằng; (4) kiểm tra ba phần cùng nhau. Không triển khai production trong nhiệm vụ này. Giao bản chạy thử và bằng chứng nghiệm thu.

## 1. CMS để người quản trị tự thay ảnh

### Trải nghiệm quản trị

Thêm mục “Trải nghiệm trường học” vào admin hiện có, gồm: Sản phẩm; Phòng học; Bàn giao R7; Bản đồ; Thư viện ảnh; Lịch sử xuất bản. Nếu chưa có backend/admin, trình bày lựa chọn phù hợp stack hiện có, rồi triển khai trang quản trị có xác thực và lưu bền vững. localStorage chỉ dùng tùy chọn xem, không làm CMS.

Luồng chính: chọn sản phẩm → chọn màu → chọn vị trí ảnh → tải ảnh hoặc chọn ảnh có sẵn → điều chỉnh khung ảnh → xem trước trong phòng → lưu nháp → xuất bản. Không yêu cầu người dùng nhập URL hoặc sửa JSON. Hiển thị ảnh đang dùng, ảnh mới, những nơi bị ảnh hưởng và trạng thái lưu.

Tách các vị trí tài nguyên:

| Vị trí | Cách dùng | Quy tắc |
|---|---|---|
| Ảnh sản phẩm thật | Gallery/cận cảnh | Gắn đúng sản phẩm và màu; giữ tỉ lệ |
| Ảnh theo màu | Hiển thị biến thể | Thiếu ảnh thì ghi rõ, không lấy màu khác và đổi nhãn |
| Ảnh góc cất đồ | Gallery minh họa | Đúng sản phẩm gấp/cất; không ảnh kệ ngẫu nhiên |
| Bề mặt mô hình 3D | Chế độ nâng cao | Texture riêng, không tự dán nguyên ảnh catalogue lên mesh |
| Cảnh phòng | Ảnh nền/ảnh xem trước theo loại renderer | Phân biệt ảnh thường với panorama; ảnh thường không biến thành 360 |
| Cảnh bàn giao | Theo vai và bước R7 | Có ảnh hoặc clip tương ứng trạng thái |
| Ảnh phòng trên bản đồ | Thumbnail | Đúng phòng, không đổi vị trí camera trong thế giới |

Ảnh chụp không tự trở thành mesh 3D. CMS phải cho biết ảnh sẽ xuất hiện ở đâu; phần đổi ảnh không được vô tình làm hỏng cơ chế đổi màu mô hình đang chạy.

### Lưu trữ và dữ liệu

Dùng lại DB, storage và quyền admin nếu có. Tạo các thực thể tương đương MediaAsset, ProductVisualBinding, RoomContent, HandoverStepMedia, MapRoom, ContentRevision; tên có thể theo quy ước repo. Mỗi binding giữ assetId + version, productReference, variant/color, slot. ID phòng R1–R7 ổn định. Không dùng tên file làm khóa sản phẩm.

Media lưu file gốc, các bản tối ưu, kích thước, MIME, checksum, nguồn, mô tả, điểm lấy nét, người sửa và danh sách nơi sử dụng. Không lưu base64 ảnh trong DB. Thay ảnh tạo version mới; không ghi đè URL cũ. Chặn xóa ảnh đang được phiên bản xuất bản hoặc rollback tham chiếu, hoặc buộc thay liên kết hợp lệ trước.

Upload ảnh JPG/PNG/WebP; đề xuất tối đa 10 MB và 24 megapixel/file, kiểm tra cả phía server, giải mã được, loại file thực tế, tên lưu do hệ thống tạo. Không tin MIME do trình duyệt khai báo. Clip R7 có luồng riêng MP4/WebM với giới hạn và kiểm tra riêng. Quyền sửa/xuất bản được kiểm tra server, tái dùng cơ chế chống CSRF nếu dùng cookie. Không nhận SVG tùy ý trong thư viện ảnh thường.

Di chuyển cấu hình tĩnh hiện có sang dữ liệu khởi tạo một lần, idempotent, giữ nguyên mapping và ảnh đang chạy. Public chỉ đọc revision đã xuất bản. Preview nháp phải có quyền truy cập. Publish kiểm tra toàn bộ tham chiếu rồi đổi revision nguyên tử; không để ảnh mới đi với metadata cũ. Xung đột hai người sửa phải báo và cho tải bản mới, không ghi đè âm thầm. Có khôi phục revision cũ. Phiên tham quan đang mở giữ revision hiện tại tới lần tải nội dung tiếp theo, tránh đổi ảnh giữa hành động.

### Nghiệm thu CMS

Quản trị tải một ảnh mới của biến thể xanh → xem trong đúng slot → lưu nháp: cửa sổ khách chưa đổi → xuất bản: phiên khách mới thấy ảnh → rollback: phiên mới thấy ảnh cũ. Màu khác và các sản phẩm khác không đổi. Đóng trình duyệt mở lại vẫn còn nội dung. Người không đăng nhập không sửa hoặc xem bản nháp được. Lỗi upload có nút thử lại và không xóa ảnh cũ.

## 2. R7 phải có cảnh và hành động minh họa

Ảnh hiện tại chứng minh H0/H1 đã đổi thoại trong khi scene vẫn là mảng màu. Chưa đủ cơ sở kết luận lỗi do thiếu GLB: kiểm tra đồng thời nhánh mount R7, tải asset, camera trong/vướng mesh, clipping, mặt phẳng che camera, ánh sáng và kích thước đối tượng. Dùng debug bounds/raycast chỉ trong môi trường phát triển. Không sửa bằng cách chỉ đổi background hoặc tăng far plane tùy tiện.

### Hai chế độ hiển thị có khai báo

- scene3d: khi có đủ nhân vật, rig, clip và mô hình túi hợp lệ; giữ góc nhìn thứ nhất.
- illustrated_sequence: ảnh/clip theo từng vai và từng bước để chạy được khi rig chưa sẵn sàng. Đây là minh họa tương tác, không được báo là animation mesh hoàn chỉnh. Không gắn ảnh phẳng trước camera rồi vẫn cho WASD xuyên ảnh; chế độ này dùng các điểm nhìn cố định và hotspot.

Đọc tài nguyên thực tế trước khi chọn chế độ. Không coi hula_bag.glb và carry_sway_preview là đã có rig người hoặc clip bàn giao. Nếu thiếu hình minh họa, tạo danh sách slot còn thiếu theo tài liệu 02, không xuất bản R7 trống. Bản đang chạy phải có ảnh dự phòng thật sự hợp lệ hoặc thông báo không tải được cùng nút thử lại/quay lại; không tiếp tục kịch bản giả.

| Bước | Bằng chứng hình ảnh bắt buộc | Tương tác |
|---|---|---|
| H0 Gặp nhau | Bàn đón bé, cô An/mẹ Linh theo POV, túi có thể nhận diện | Tiến lại bàn |
| H1 Chọn túi | Túi đúng mẫu được đưa/đặt lên bàn; hướng nhìn khác H0 | Chọn túi của Mây |
| H2 Kiểm tra | Góc cận túi và nhãn rõ; nhãn tên dựng bằng UI để không sai chữ | Xác nhận đúng túi |
| H3 Chuẩn bị trao | Cô An giữ quai/đưa túi tới vùng nhận | Sẵn sàng nhận/trao |
| H4 Bàn giao | Có động tác đưa–nhận hoặc chuỗi khung minh họa tiếp xúc | Chỉ chuyển khi kết quả đã hiển thị |
| H5 Hoàn tất | Mẹ Linh giữ túi; không còn túi trùng ở tay cô/bàn | Xem lại hoặc về bản đồ |

POV mẹ Linh: thấy cô An phía đối diện, có thể thấy tay mình; không thấy mặt chính mình. POV cô An: thấy mẹ Linh và tay mình. POV bé Mây: camera thấp, thấy hai người lớn trao túi; bé xác nhận nhãn, không biến bé thành người nhận túi cuối cùng. Không chèn trẻ vào background các phòng sản phẩm; nhân vật tại R7 là một phần kịch bản riêng.

Túi theo nguồn thật: bản quai xách xanh/phía sau xám và hai quai ngắn xám nếu đúng binding được chọn; không tự đổi sang túi kem lá xanh. Giữ một bagInstanceId xuyên chuỗi; chủ sở hữu chuyển cô An → mẹ Linh đúng một lần. Nhãn tên Mây là dữ liệu mô phỏng, không phải chi tiết in thật của mọi sản phẩm.

Chuyển bước phải chờ media decoded/scene ready và kết quả hành động. Double click không chạy hai lần. Back, replay, đổi vai, rời phòng giữa H4 có quy tắc reset hoặc hoàn tất giao dịch xác định; không nhân đôi túi. Reduced motion bỏ chuyển động nhưng vẫn hiển thị trạng thái cuối đúng. Lỗi tải media giữ trạng thái hợp lệ trước đó và cho thử lại.

### Nghiệm thu R7

Giao video H0–H5 cho cả ba vai, cho thấy rõ thay đổi hình ảnh, túi và POV. Kiểm tra tải trực tiếp R7, đổi vai giữa kịch bản, click nhanh hai lần, replay và giả lập một URL media lỗi. Không chấp nhận video chỉ thay lời thoại trên nền trống. Chế độ minh họa phải được báo đúng là minh họa.

## 3. Bản đồ trường trực quan

Dùng 03_Visual-Map.png/SVG làm hướng thiết kế; đây là mockup mặt bằng, không phải bản đo công trình. Giữ tên/ID phòng đang có. Bố cục: R1/R2 ở đầu hành lang, R3/R4 tiếp theo, R5/R6 gần cuối, R7 phía cuối đối diện lối vào. Vẽ tường, cửa, hành lang và biểu tượng nệm/kệ/bàn nhỏ; không thay danh sách bằng bảy thẻ text đặt quanh một hình nền.

SVG tương tác hoặc các vùng bấm HTML đồng bộ trên SVG; không cần đưa bản đồ vào WebGL. Mỗi phòng là vùng bấm có tên truy cập được. Có nhãn “Bạn đang ở đây”, dấu đã ghé và tuyến nhanh R1 → R6 → R7 đi theo hành lang/cửa. Không vẽ đường xuyên tường. Nếu chỉ biết roomId, đánh dấu phòng hiện tại; không giả vờ biết vị trí camera chính xác.

Chọn phòng làm nổi viền và mở thẻ thông tin: tên, sản phẩm chính, thumbnail, trạng thái và “Đi đến phòng”. Chỉ đổi currentRoom khi scene đích sẵn sàng. Lỗi tải giữ phòng cũ, bản đồ báo thử lại. Giữ vai và màu đã chọn khi di chuyển. Không tự sắp xếp lại vị trí các phòng theo trạng thái đã ghé.

Desktop: modal rộng khoảng 1040–1120px, bản đồ bên trái/thẻ phòng bên phải. Mobile: bản đồ chiếm phần chính, thẻ phòng gọn phía dưới; hỗ trợ pan/zoom và “Vừa màn hình”, không yêu cầu kéo cả danh sách mới thấy phòng. Vùng chạm ít nhất 44px, dùng cả nhãn/ký hiệu ngoài màu. Có chế độ danh sách phụ để truy cập thuận tiện.

Modal: focus đi vào khi mở, Tab không thoát khỏi dialog, Escape đóng, trả focus về nút mở; có nút đóng rõ. Phím di chuyển bản đồ không đồng thời điều khiển camera phòng. Không khóa cuộn trang vĩnh viễn sau khi đóng.

CMS cho sửa tên hiển thị, mô tả, thumbnail, bật/tắt phòng và tuyến tham quan. Sửa vị trí trình bày bản đồ không thay world camera anchor; hai trường dữ liệu tách riêng. Phòng đang ẩn khỏi tham quan không được route nhanh dẫn tới.

### Nghiệm thu bản đồ

Ở desktop 1366×768 thấy đủ bảy phòng trong mặt bằng. Mobile 390×844 đọc được tên phòng, chạm chọn và đi tới được R7. Kiểm tra vị trí hiện tại sau di chuyển, route nhanh, lỗi tải phòng, bàn phím và đóng/mở modal nhiều lần. Giao screenshot desktop/mobile và video R1 → R6 → R7.

## Bằng chứng bàn giao cuối cùng

Liệt kê file thực tế đã sửa, migration, assets thật đã tích hợp và slot còn thiếu. Cung cấp URL preview, ảnh/video nghiệm thu, trạng thái từng tiêu chí. Không ghi “hoàn thành” nếu backend chỉ mock, CMS chỉ lưu browser, R7 còn nền trống hoặc map vẫn là danh sách chính.

## Cơ sở tham khảo

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): xác thực file phía server, giới hạn upload, quyền và nơi lưu. Các ngưỡng dung lượng trong tài liệu này là đề xuất cho HULA.
- [W3C APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): quản lý focus, bàn phím, đóng và trả focus.
- Ảnh chụp người dùng: R7 H0/H1 nền màu, modal bản đồ danh sách. Chưa truy cập mã nguồn nên các nguyên nhân renderer nêu trên là giả thuyết kiểm tra, không phải kết luận đã xác minh.
