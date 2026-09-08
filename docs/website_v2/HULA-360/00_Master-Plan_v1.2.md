# HULA 360 — Nhập vai một ngày ở lớp

**Kế hoạch v1.2 — ChatGPT sáng tạo và giao instruction; AI IDE code**  
Cập nhật: 08/09/2026. Thay thế phương án nhân sự sản xuất và tour quan sát trong v1.0 theo chỉ dẫn mới của anh.

## 1. Mô hình thực hiện đã thống nhất

Anh cung cấp tài nguyên, thông tin sản phẩm, quyền truy cập cần thiết và duyệt đầu ra. ChatGPT phụ trách phân tích, sáng tạo nhân vật, kịch bản, thiết kế, tạo hình tham chiếu, instruction và review. AI IDE của anh thực hiện mọi code sản phẩm, mã dựng cảnh, animation và tích hợp; ChatGPT không viết code sản phẩm trong luồng này. Công cụ AI bổ sung được chọn theo nhu cầu thực tế; không yêu cầu tuyển đội thiết kế 3D, diễn viên, thu âm hay lập trình viên bên ngoài.

“100% AI” là toàn bộ phần sản xuất sáng tạo và kỹ thuật do AI thực hiện. Blender, trình render và trình duyệt là công cụ phần mềm được AI IDE điều khiển; chúng không tự trở thành mô hình AI. Thông tin thật về sản phẩm vẫn lấy từ tài nguyên anh cung cấp. Việc duyệt tính đúng sản phẩm và đánh giá cảm nhận người dùng vẫn cần anh; kiểm tra tự động không thay thế được các xác nhận đó.

**Định hướng mới:** người xem nhập vai vào một nhân vật cụ thể, nhìn bằng mắt nhân vật, nghe suy nghĩ/lời nói của nhân vật và kích hoạt hành động trong lớp. Hướng dẫn giao diện nằm riêng, không thay toàn bộ câu chuyện bằng lời thuyết minh từ bên ngoài.

Công nghệ chính đề xuất chuyển từ panorama cộng khung sản phẩm sang **lớp học 3D gọn, góc nhìn ngôi thứ nhất, di chuyển theo điểm định sẵn**. Panorama/ảnh 2D là chế độ nhẹ. Cần cảnh thử để chốt hiệu năng và chất lượng trước khi mở rộng.

## 2. Review website hiện tại

### 2.1. Phạm vi và mức độ kiểm chứng

Đã đọc trang chủ, danh mục, trang dự án, một trang chi tiết sản phẩm và bài viết cấu tạo sản phẩm. Đã quan sát trang chủ trên trình duyệt desktop, gồm trạng thái trước và sau khi dữ liệu động tải về. Chưa kiểm thử mua hàng, gửi form, quản trị, mã nguồn, tốc độ bằng công cụ đo hoặc giao diện trên thiết bị di động thật.

| Quan sát | Nhận xét và hành động đề xuất |
|---|---|
| Trang chủ tổ chức quanh lợi ích vận hành, sản phẩm, dự án và tư vấn; chưa thấy điểm vào 360 trong phần đã kiểm tra [S1] | Thêm lời mời vào lớp học ngay khu vực đầu trang; liên kết từ dự án và sản phẩm |
| Giao diện desktop có nhận diện xanh cyan, trắng và vàng nhạt [S1, quan sát trực tiếp] | Kế thừa nhận diện; làm lớp học dịu màu, ít đồ trang trí cạnh sản phẩm |
| Danh mục hiển thị 10 sản phẩm, có bộ 3 món, 4 món và túi ngủ; tên nhóm có mã viết tắt; bộ lọc có lỗi chữ “Vảng” [S2] | Chuẩn hóa nhãn người dùng; giữ SKU bên trong hệ thống; chọn ít mẫu đại diện để dựng |
| Mẫu Khu rừng vui vẻ có SKU và kích thước riêng [S3] | Dùng làm ứng viên đầu tiên để xây mô hình đúng tỷ lệ; đo bổ sung độ dày và kích thước sau gấp |
| Trang dự án có nhiều trường, gồm BAY và Kindy Garden [S4] | Đặt liên kết dự án liên quan sau trải nghiệm; không trình bày lớp giả lập như ảnh của trường thật |
| Logo, liên hệ và menu thay đổi sau khi cấu hình động tải xong [quan sát trực tiếp tại S1] | Giữ bố cục ổn định, có ảnh đại diện trước khi tải panorama; không tải toàn bộ 360 trên trang chủ |
| Khung Facebook không hiển thị trong phiên trình duyệt này [quan sát trực tiếp tại S1] | Kiểm tra lại trên môi trường khách hàng; giữ liên kết mạng xã hội làm phương án thay thế |

Các placeholder liên hệ/bản đồ trong nội dung trích xuất không được kết luận là lỗi cấu hình: thông tin này đã xuất hiện sau khi trang tải dữ liệu. Ảnh hero cũng đã tải thành công. Không dùng ảnh chụp ban đầu để kết luận website hỏng ảnh.

### 2.2. Điểm phải thống nhất trước khi viết lời dẫn

Website mô tả xưởng trực tiếp [S1], trong khi thông tin Hula đã cung cấp trong dự án là **không có xưởng riêng, quản lý các đối tác gia công**. Kịch bản mới theo mô hình đã được anh cung cấp: Hula thiết kế, điều phối cung ứng và kiểm soát chất lượng qua đối tác gia công. Product Owner cần rà lại nội dung website cho thống nhất.

Các chi tiết chống trượt, cố định gối, nhãn tên, thao tác gấp và chăm sóc phải được kiểm chứng theo **từng SKU**. Bài tư vấn [S5] là đầu vào nội dung, không thay hồ sơ kỹ thuật. Không biến mô phỏng thành cam kết sức khỏe, thời gian tiết kiệm hoặc mức chống trượt đã được thử nghiệm.

## 3. Bộ nhân vật nguyên bản và thế giới chung

### 3.1. Hồ sơ nhân vật đề xuất

Tất cả là nhân vật hư cấu được tạo riêng cho dự án. Phong cách hình ảnh đề xuất: 3D cách điệu nhẹ, biểu cảm tự nhiên, màu dịu; sản phẩm Hula bám ảnh/thông số thật.

| Mã | Nhân vật | Nhận diện xuyên suốt | Tính cách và động lực | Giọng/lời nói |
|---|---|---|---|---|
| CHAR-AN | Cô An, giáo viên | Áo polo xanh ngọc, quần be, tóc buộc thấp | Bình tĩnh, chu đáo; chuẩn bị lớp và hỗ trợ trẻ tự làm | Nữ trưởng thành, ấm và rõ; suy nghĩ dùng “mình”, nói với trẻ dùng “cô” |
| CHAR-LINH | Mẹ Linh, mẹ của bé Mây | Áo màu kem, quần xanh nhạt, tóc ngang vai | Quan tâm đến sinh hoạt của con; muốn hiểu cách dùng và chăm sóc đồ | Nữ trưởng thành, tự nhiên; suy nghĩ dùng “mình”, đối thoại dùng “tôi/mẹ” tùy người nghe |
| CHAR-MAY | Bé Mây, khoảng 5 tuổi | Áo vàng nhạt, quần xanh; biểu tượng chiếc lá | Tò mò, mới tập nhận và cất đồ của mình | Câu ngắn, nhẹ; suy nghĩ dùng “mình”, nói với cô/mẹ dùng “con” |

Tuổi và trang phục là lựa chọn sáng tạo ban đầu. Giọng bé ưu tiên giọng nhân vật hoạt hình tổng hợp phù hợp và dùng được thương mại; có thể dùng giọng kể trưởng thành nhẹ nhàng nếu công cụ không có lựa chọn phù hợp. Không cần bản sao hình/giọng của trẻ thật.

Gói nhân vật AI sẽ gồm ảnh chính diện/nghiêng/sau, bảng màu, tỷ lệ, biểu cảm, mẫu bàn tay và tay áo, mẫu giọng, quy tắc xưng hô. Dùng cùng bộ tham chiếu trong mọi lượt tạo. Tên, trang phục và nhận diện không đổi giữa các cảnh nếu câu chuyện không giải thích.

### 3.2. Nguyên tắc ngôi thứ nhất

- Camera ở vị trí mắt nhân vật; dùng chiều cao và tư thế riêng. Không quay từ sau lưng nhân vật đang nhập vai.
- Có thể thấy bàn tay/tay áo của mình khi tương tác; không để camera xuyên thân, tay hoặc nệm.
- Hai nhân vật còn lại có thể xuất hiện trước mắt và đối thoại. Cùng một sự kiện được kể từ ba phía.
- Chọn hành động bằng chạm/click; animation tay và đồ vật thể hiện hành động của nhân vật, không chỉ mở thẻ thông tin.
- Cho nhìn quanh 360° theo phương ngang; giới hạn góc ngẩng/cúi khi cần tránh xuyên hình. Không yêu cầu quay đầu thật hay đeo kính VR.
- Trong thao tác chi tiết, hướng nhìn có thể được giới hạn ngắn để bảo đảm thấy rõ tay và sản phẩm; phải báo bằng giao diện, có dừng/bỏ qua và trả quyền nhìn quanh sau đó.
- Không tự lắc đầu, rung camera hay chuyển động kiểu tàu lượn. Di chuyển theo điểm bằng chuyển cảnh ngắn, có chế độ giảm chuyển động.
- Thẻ xem cấu tạo và CTA thương mại là lớp giao diện bổ sung. Đóng thẻ trở lại đúng vai, trạng thái và vị trí.

Phân biệt **vai nhân vật** với **người đang sử dụng**: người lớn vẫn có thể nhập vai bé Mây. Chế độ “Cùng bé chơi” mới bật hướng dẫn đơn giản cho trẻ dùng cùng người lớn; chế độ này không có giá bán hoặc CTA mua.

### 3.3. Một phòng học, một chuỗi sự kiện

Phòng giả lập ban đầu 6 × 8 m, ba trạng thái đón trẻ–ngủ trưa–thu dọn. Kích thước và số nệm hiển thị là giả định dựng cảnh, không phải sức chứa trường đã thẩm định. Dùng một scene 3D gốc làm nguồn chung cho mọi camera, hình, animation và ảnh thay thế.

Các điểm di chuyển định sẵn: cửa lớp, tủ đồ, vị trí trải nệm. Camera ban đầu tham khảo: cô An 1,55 m, mẹ Linh 1,60 m, bé Mây 0,95 m; điều chỉnh theo mô hình đã duyệt. Các động tác cúi/ngồi cần camera và bàn tay tương ứng, không chỉ giảm độ cao tùy tiện.

Sự kiện nối ba hành trình: mẹ Linh bàn giao túi đồ của Mây → cô An hướng dẫn giờ ngủ → Mây nhận đúng bộ → cô hỗ trợ trải/gấp → đồ về đúng ngăn. Mẹ chỉ xuất hiện vào thời điểm đón/bàn giao hoặc buổi tham quan được giải thích; không tự nhiên đi lại trong lớp khi trẻ đang ngủ.

## 4. Kịch bản cô An — “Tôi chuẩn bị giờ ngủ cho lớp”

Thời lượng mục tiêu 2–3 phút. Lời trong ngoặc kép là bản nháp lời nghĩ/nói của nhân vật; hướng dẫn thao tác được hiển thị riêng.

| ID | Tôi nhìn thấy | Tôi nghĩ/nói | Tôi làm gì? | Phản hồi và giá trị sản phẩm |
|---|---|---|---|---|
| GV-01 | Từ trong lớp nhìn mẹ Linh và Mây ở cửa, túi đồ trước mắt | “Mình nhận bộ đồ của Mây trước nhé.” | Chạm nhận túi; tay cô xuất hiện | Bàn giao theo cùng một bộ/biểu tượng |
| GV-02 | Nhìn xuống nhãn túi; tủ ở phía trước | “Đúng ký hiệu chiếc lá rồi.” | Đưa túi lại gần, xem nhãn và cất | Nhận diện đúng bộ; nhãn phải khớp SKU |
| GV-03 | Nhìn vào khu sinh hoạt đã được người lớn thu xếp | “Mình kiểm tra vị trí trải nệm và lối đi.” | Chọn điểm chuẩn bị; chuyển trạng thái lớp | Bố cục mẫu; không suy ra số trẻ phù hợp tự động |
| GV-04 | Tay cô mở bộ nệm ở vị trí thao tác | “Mình mở bộ nệm, rồi đặt gối đúng chỗ.” | Bấm thực hiện từng bước | Animation đúng cấu tạo và trình tự đã xác nhận |
| GV-05 | Hai túi cùng màu, ký hiệu khác nhau | “Mình xem ký hiệu trước khi lấy.” | Chọn đúng túi của nhân vật cần hỗ trợ | Làm rõ nhận diện thay vì chỉ nhìn màu |
| GV-06 | Nhìn xuống bộ đồ sau giờ nghỉ, rồi nhìn ngăn tủ | “Mình cùng Mây gấp và cất lại nhé.” | Kích hoạt gấp; chọn ngăn phù hợp | Tay cô hỗ trợ; bộ đồ chuyển trạng thái nhất quán |
| GV-07 | Lớp đã thu dọn; Mây đứng cạnh tủ | “Đồ đã về đúng chỗ. Lớp sẵn sàng cho hoạt động tiếp theo.” | Kết thúc vai | Panel ngoài câu chuyện: xem mẫu/giải pháp cho lớp |

Không đặt lời thoại quảng cáo vào miệng giáo viên hư cấu như lời chứng thực thật. Các cam kết hiệu quả phải có dữ liệu; animation không chứng minh số phút tiết kiệm.

## 5. Kịch bản mẹ Linh — “Tôi tìm hiểu góc ngủ của con”

Thời lượng mục tiêu 2–3 phút. Bối cảnh là buổi làm quen/tham quan lớp; giáo viên giải thích cách sử dụng trước khi giờ ngủ thực tế bắt đầu.

| ID | Tôi nhìn thấy | Tôi nghĩ/nói | Tôi làm gì? | Phản hồi |
|---|---|---|---|---|
| PH-01 | Cô An trước mắt, Mây bên cạnh, tay mình giữ túi đồ | “Hôm nay mình cùng Mây làm quen góc ngủ.” | Bước theo điểm đến cửa lớp | Cô An đón; tạo mối liên hệ ba nhân vật |
| PH-02 | Bộ đồ mẫu đặt trước mặt, cô An ở bên | “Bộ của con gồm những món nào nhỉ?” | Chạm từng món, đưa món đó vào vùng quan sát | Hiện tên món đúng bộ; không trộn dòng sản phẩm |
| PH-03 | Tay mình giữ mép nệm hoặc xoay món mẫu | “Mình xem kỹ bề mặt và kích thước.” | Xem gần, lật mặt dưới, bật số đo | Ảnh/thông số theo SKU; không giả lập cảm giác như phép đo |
| PH-04 | Tủ và nhãn chiếc lá ngang hướng nhìn | “Con sẽ nhận ra đồ của mình bằng ký hiệu này.” | Kiểm nhãn và ngăn tương ứng | Trùng ký hiệu với cảnh cô An và Mây |
| PH-05 | Túi được cô trao lại tại điểm bàn giao | “Mình xem hướng dẫn trước khi mang bộ đồ về giặt.” | Nhận túi, mở thẻ chăm sóc | Hướng dẫn có nguồn; thiếu thì chỉ đề nghị hỏi Hula |
| PH-06 | Mây và cô An chào ở cửa | “Mình đã hiểu cách con sử dụng và cất bộ đồ.” | Kết thúc vai | Panel ngoài câu chuyện: xem SKU hoặc hỏi tư vấn |

Thời điểm PH-05 là cảnh bàn giao về nhà có nhãn chuyển thời gian rõ ràng. Không để chuyển cảnh ngầm khiến người xem hiểu trẻ ngủ vài giây đã về.

## 6. Kịch bản bé Mây — “Đây là góc ngủ của mình”

Thời lượng mục tiêu 60–90 giây. Khi người dùng là trẻ nhỏ, dùng cùng người lớn. Không yêu cầu đọc, nhập tên hoặc ghi âm.

| ID | Tôi nhìn thấy | Tôi nghĩ/nói | Tôi làm gì? | Phản hồi |
|---|---|---|---|---|
| BE-01 | Từ tầm mắt thấp nhìn mẹ Linh bên cạnh, cô An phía trước | “Hôm nay mình vào lớp cùng mẹ.” | Chạm đi tới cô | Hai người lớn chào Mây; không có camera quan sát Mây từ xa |
| BE-02 | Tủ trước mặt, túi có chiếc lá vừa tầm | “Túi có chiếc lá là của mình!” | Chạm túi đúng ký hiệu | Bàn tay nhỏ nhận túi; chọn sai được gợi ý nhẹ |
| BE-03 | Nhìn xuống nệm và tay cô hỗ trợ bên cạnh | “Mình cùng cô mở nệm nhé.” | Chạm làm từng bước | Tay của mình và cô phối hợp theo animation đã duyệt |
| BE-04 | Gối và vị trí đặt ngay trước mắt | “Mình đặt gối ở đây.” | Chạm gối rồi vị trí gợi ý | Gối về đúng chỗ; không bắt buộc kéo thả |
| BE-05 | Sau chuyển thời gian rõ ràng, nệm và ngăn tủ chiếc lá | “Mình cất đồ vào ngăn chiếc lá.” | Cùng cô gấp rồi chọn ngăn | Đồ chuyển trạng thái; không yêu cầu trẻ thao tác phụ kiện khó một mình |
| BE-06 | Cô An trước mặt và ngăn đồ vừa cất | “Mình tìm đúng đồ và cất xong rồi!” | Kết thúc | Cô phản hồi ngắn; gợi ý thực hành ngoài màn hình |

Giữ chiếc lá làm ký hiệu cố định trong câu chuyện đầu tiên để ba vai khớp nhau. Đổi biểu tượng có thể thêm về sau nhưng phải đổi đồng bộ toàn bộ cảnh. Chế độ trẻ không có mua hàng, chấm điểm, đếm ngược hay xếp hạng.

## 7. Quy trình AI thực hiện toàn bộ

| Hạng mục | Bên thực hiện | Công cụ đề xuất | Điều kiện/giới hạn |
|---|---|---|---|
| Ý tưởng, hồ sơ nhân vật, kịch bản | Viết, kiểm tra logic, quản lý phiên bản | ChatGPT/Codex | Đã có bản nội dung khởi đầu trong tài liệu này |
| Concept nhân vật/lớp học | Tạo hình, biến thể và bộ ảnh tham chiếu | Công cụ tạo ảnh có sẵn trong phiên | Ảnh concept không tự trở thành mô hình 3D hoặc panorama chuẩn |
| Lớp học, nệm và cấu trúc đúng tỷ lệ | AI IDE viết mã dựng hình, đặt camera, vật liệu và animation theo instruction | Blender Python/Three.js do AI điều khiển | Phải đối chiếu số đo; thao tác gấp cần dựng chuyển động riêng |
| Nhân vật/đạo cụ phức tạp | Tạo mô hình nháp từ ảnh, rồi kiểm tra và tối ưu | Meshy tùy chọn | Cần kết nối/tài khoản/API và tài nguyên; không mặc định đúng topology hoặc sản phẩm |
| Giọng nói | Viết lời, tạo voice, nghe kiểm tra phát âm, ghép phụ đề | ElevenLabs tùy chọn | Hỗ trợ tiếng Việt; cần thử giọng và quyền dùng phù hợp |
| Web trải nghiệm | AI IDE viết UI, điều khiển POV, trạng thái và liên kết theo instruction | Codex + Three.js | Cần source/quyền tích hợp khi ghép website thật |
| Kiểm tra | Kiểm thử luồng, camera, lỗi, tải cảnh; chụp và so sánh đầu ra | Mã kiểm thử + trình duyệt + AI review | Anh xác nhận tính đúng sản phẩm và cảm nhận thực tế |

Meshy có API tạo 3D từ nhiều ảnh; tài liệu hiện tại cho phép 1–4 ảnh của cùng vật thể [A1]. Vì sản phẩm Hula có kích thước và cấu tạo cụ thể, ưu tiên dựng hình có tham số cho nệm/gối/túi và dùng ảnh thật làm texture; dùng Meshy khi tạo hình giúp tiết kiệm công cho nhân vật/đạo cụ, sau đó vẫn phải kiểm tra.

ElevenLabs cung cấp text-to-speech tiếng Việt [A2]. Chọn giọng theo mẫu nghe thực tế, không chốt dựa riêng tên model hoặc quảng cáo. Giữ một giọng và thiết lập cho mỗi nhân vật.

Blender hỗ trợ camera panorama equirectangular [A3] và API camera [A4]. Có thể dùng scene gốc để xuất tài nguyên 360/ảnh nhẹ thay thế.

**Trạng thái năng lực:** phiên này có công cụ tạo ảnh và viết mã. Meshy và ElevenLabs là đề xuất bổ sung, chưa kết nối hoặc chạy thử cho dự án. Nếu dùng dịch vụ ngoài, phần gọi tự động phụ thuộc kết nối được hỗ trợ và quyền truy cập; anh có thể cung cấp file kết quả nếu chưa kết nối được. Không gửi API key trong nội dung chat.

Không lấy video AI thông thường làm bằng chứng rằng đã có không gian 360 tương tác. Video tạo sinh tùy chọn chỉ phục vụ teaser hoặc cảnh chuyển mang tính cảm xúc; hoạt động chính lấy từ cùng scene 3D để kiểm soát vị trí, tay, logo và sản phẩm. Không cần bổ sung công cụ video ở bước đầu.

## 8. Tài nguyên anh cung cấp và những phần em tự tạo

### 8.1. Gói tối thiểu cho một sản phẩm đầu tiên

| Tài nguyên | Cần để làm gì? | Nếu chưa có |
|---|---|---|
| Logo Hula PNG nền trong hoặc SVG; màu thương hiệu nếu có | Giữ nhận diện chính xác | Dùng bản công khai làm tham chiếu, chưa coi là master in/render |
| Chọn một SKU ưu tiên; ảnh mặt trên, mặt dưới, bên hông và sau gấp | Dựng đúng sản phẩm và texture | Dùng mẫu Khu rừng vui vẻ làm ứng viên; đánh dấu phần chưa xác nhận |
| Kích thước mở/gấp, độ dày, thành phần và phụ kiện | Dựng tỷ lệ và chuyển trạng thái | Dựng placeholder ghi rõ minh họa, chưa duyệt hình sản phẩm cuối |
| Ảnh/video sẵn có hoặc mô tả từng bước trải–gấp–cất | Xác định animation đúng | Anh xác nhận trình tự từ bảng AI đề xuất; không bắt buộc quay đoàn phim |
| Hướng dẫn chăm sóc đã duyệt | Nội dung vai phụ huynh | Không tự điền nhiệt độ giặt hoặc cam kết độ bền |

Ảnh phòng học là tùy chọn vì dự án dùng lớp giả lập. Không cần ảnh cô giáo, phụ huynh hoặc trẻ thật. Source website/quyền triển khai chỉ cần khi chuyển sang tích hợp; không cản việc dựng concept và demo độc lập.

### 8.2. Phân công tạo tài nguyên

ChatGPT tạo hồ sơ nhân vật, concept lớp học/đạo cụ, hình tham chiếu, kịch bản/lời dẫn, storyboard POV, instruction giao diện/kỹ thuật và tài liệu. AI IDE thực hiện mô hình bằng mã, rig/animation, giao diện chạy thật, mã tương tác và kiểm thử theo instruction. Audio tổng hợp thực hiện khi có công cụ phù hợp.

Mọi chi tiết sản phẩm chưa có tài nguyên xác nhận đều gắn trạng thái “giả định/chờ đối chiếu”; AI không tự coi chi tiết suy đoán là đặc tính Hula. Logo và nhãn dùng file nguồn, không nhờ mô hình ảnh tự vẽ lại chữ.

## 9. Kiến trúc trải nghiệm cập nhật

### 9.1. Phạm vi bản đầu

- Một lớp học 3D, ba trạng thái; ba điểm di chuyển định sẵn.
- Ba nhân vật hư cấu; người dùng điều khiển một vai, hai vai còn lại là nhân vật theo kịch bản.
- Một sản phẩm hoàn chỉnh trước; thêm dòng thứ hai khi cảnh mẫu đạt yêu cầu.
- Ngôi thứ nhất với tay nhân vật cho các thao tác trọng tâm, animation dựng sẵn và điểm tiếp xúc kiểm soát được.
- Khám phá 360 quanh điểm đứng, di chuyển bằng chạm; chưa có đi lại tự do, nhiều người online hoặc mô phỏng vải vật lý.
- Desktop/tablet/mobile; fallback ảnh và nội dung có cùng nhãn vai nếu máy không chạy 3D được. Fallback được ghi rõ là chế độ ảnh.
- Link xem SKU/tư vấn ở lớp giao diện người lớn sau câu chuyện.

Thay đổi so với v1: 12 panorama không còn là khối lượng bắt buộc của đường trải nghiệm chính. Không dùng viewer xoay sản phẩm bên ngoài làm thay thế cho hành động ngôi thứ nhất. Viewer chi tiết vẫn có thể bổ sung cho người lớn.

### 9.2. Tính nhất quán và quản lý trạng thái

Cùng một bộ đồ có các trạng thái: trong túi → lấy ra → trải → sử dụng → gấp → cất/bàn giao. Khi cầm, vật thể gắn vào tay; khi đặt, trả về vị trí scene. Không để vừa nằm trong tủ vừa ở tay; không để hình dạng đổi tùy camera.

Lưu `characterId`, `phase`, `node`, `pose`, `productSku`, `productState`, `stepId`, `audioState`. Đổi vai có nhãn thời điểm tương ứng, giữ sự kiện đã xảy ra nhưng tiến độ nhiệm vụ từng vai tách riêng. Các cảnh khác thời điểm phải báo chuyển thời gian.

Quản lý version cho character sheet, scene, product mesh/texture, animation và voice. Dùng cùng bộ đã duyệt; mọi đầu ra AI mới phải được so lại tham chiếu trước khi thay vào bản đang chạy.

### 9.3. Tích hợp và hiệu năng

Giữ CTA đề xuất “Nhập vai trải nghiệm lớp học 360°”; route dự kiến `/trai-nghiem-360`. Đường dẫn này chưa được xây dựng. Tour không tự gửi dữ liệu; CTA người lớn gắn đúng SKU và nhu cầu vào form đã xác minh. Chưa xác nhận API Hula ERP.

Mục tiêu prototype: khoảng 30 fps trên điện thoại mục tiêu, tải tài nguyên theo nhu cầu, ảnh đại diện xuất hiện sớm. Chốt budget dung lượng và thời gian tải sau đo một cảnh có nhân vật/tay/sản phẩm thật; không giữ cam kết 5 MB hay 6 giây từ phương án panorama cũ khi chưa đo kiến trúc mới.

Chế độ giảm chuyển động, nút reset hướng nhìn, điều khiển chạm không phụ thuộc hover, phụ đề, tắt tiếng, dừng/bỏ qua. Không tự phát âm thanh. Góc nhìn/tay không che nhiệm vụ hoặc đi xuyên đạo cụ.

## 10. Các bước triển khai và đầu ra

Bỏ giả định đội nhân sự 3D/UX/dev bên ngoài và lịch 6 tuần của v1. Lịch mới dựa trên một cảnh thử, tốc độ tạo/render tài nguyên và thời gian anh cung cấp đầu vào; AI có thể phải tạo lại nhiều lượt.

| Bước | Đầu ra AI; phần code do AI IDE | Anh cung cấp/duyệt | Điều kiện hoàn thành |
|---|---|---|---|
| 1. Khóa hướng sáng tạo | Ba hồ sơ nhân vật, quy tắc POV và kịch bản v1.1 | Tài nguyên thương hiệu/sản phẩm đầu tiên | Đã có bản nội dung; hình tham chiếu là việc tiếp theo |
| 2. Tạo concept AI | Bộ tham chiếu nhân vật, lớp học, storyboard 3 POV | Duyệt nhận diện và cảm giác | Nhân vật/lớp thống nhất; không bịa đặc tính sản phẩm |
| 3. Làm một cảnh chạy được | Cô An lấy–trải–cất một bộ nệm ở góc nhìn thứ nhất | Đối chiếu sản phẩm và thao tác | Tay, camera, vật thể đúng; chạy được trên thiết bị mục tiêu |
| 4. Mở rộng ba vai | 19 cảnh; cùng lớp, cùng bộ đồ, cùng sự kiện | Duyệt trải nghiệm | Không mâu thuẫn thời gian, trạng thái hay nhân vật |
| 5. Hoàn thiện AI assets | Giọng, phụ đề, animation, dòng sản phẩm thứ hai nếu đủ tài nguyên | Tài nguyên bổ sung và kết nối công cụ nếu cần | Chất lượng đủ dùng, phát âm và sản phẩm đúng |
| 6. Tích hợp và nghiệm thu | Module web, CTA, bản kiểm tra và hướng khôi phục | Source/quyền truy cập; duyệt phát hành | Ba vai hoàn chỉnh, fallback và link/form đúng |

Chi phí nếu có tập trung vào credit tạo ảnh/3D/giọng, API, render và hosting. Không có cơ sở chốt tổng tiền hoặc hứa nhanh hơn bao nhiêu trước cảnh thử. Chưa mua dịch vụ hoặc sử dụng API trả phí trong lần cập nhật này.

## 11. Tiêu chí nghiệm thu phù hợp ngôi thứ nhất

1. Mỗi vai có camera/tầm mắt/tay/lời nói tương ứng; không biến thành camera theo sau nhân vật.
2. Khi quay nhìn, phòng và đồ vật giữ vị trí; logo/texture không đổi giữa hai cảnh hoặc hai vai.
3. Lấy, đặt, mở, gấp, cất là hành động trong không gian với trạng thái đúng; không chỉ thay bằng popup.
4. Camera không xuyên người/đồ; tay không trôi khỏi vật thể; thao tác không chạy ở ngoài vùng người dùng đang nhìn mà không được hướng dẫn.
5. Ba góc nhìn cùng sự kiện không mâu thuẫn; mẹ không xuất hiện sai thời điểm; chiếc lá và bộ đồ xuyên suốt.
6. Mẫu 3D, kích thước, phụ kiện và hướng dẫn chăm sóc được đối chiếu với tài nguyên anh cung cấp.
7. Có dừng, bỏ qua, tắt tiếng, phụ đề, giảm chuyển động và chế độ ảnh nếu 3D thất bại.
8. Chế độ cùng bé không có giá, form mua, thu âm, ảnh trẻ hay tracking quảng cáo; người lớn chủ động chuyển ra giao diện thương mại.
9. Link SKU đúng; form chỉ báo thành công khi backend nhận. Không công bố kết nối ERP khi chưa triển khai.
10. AI kiểm thử kỹ thuật; anh duyệt tính đúng sản phẩm. Thử người dùng thực là tùy chọn sau bản mẫu, không được ghi kết quả AI mô phỏng như phản hồi khách hàng thật.

Đo hiệu quả người lớn: bắt đầu tour, hoàn thành theo vai, xem SKU, yêu cầu tư vấn nhận thành công và lỗi/fallback. Chưa đặt tỷ lệ tăng doanh số. Không coi nhân vật AI là khách hàng thật hoặc lời chứng thực thật.

## 12. Tiến độ sau bước sáng tạo đầu tiên

Đã tạo bảng nhân vật cô An–mẹ Linh–bé Mây và storyboard 6 khung cô An ngôi thứ nhất; đã sửa tay áo trong storyboard. Đã bàn giao creative brief và instruction 01 cho AI IDE triển khai prototype nhận–trải–cất. Hình sản phẩm hiện là minh họa, chưa gắn SKU thật. Chưa có model GLB/rig/voice hoặc bản chạy. Hình mới là concept đề xuất, chưa được anh duyệt riêng.

Gói HULA-360_AI-IDE_Pack chứa hai tài liệu, hai hình tham chiếu đã chọn và kế hoạch tổng. Bước tiếp theo do AI IDE thực hiện là một cảnh prototype cô An theo instruction 01. ChatGPT sẽ review kết quả được anh gửi lại và tiếp tục chuẩn bị storyboard hai vai còn lại cùng instruction kế tiếp. Anh cung cấp tài nguyên một SKU để chuyển từ đồ demo sang sản phẩm Hula đúng thông số.

## 13. Nguồn công cụ AI bổ sung

- [A1 — Meshy Multi-Image to 3D API](https://docs.meshy.ai/en/api/multi-image-to-3d)
- [A2 — ElevenLabs Text to Speech](https://elevenlabs.io/docs/overview/capabilities/text-to-speech)
- [A3 — Blender panorama camera](https://docs.blender.org/manual/en/latest/render/cycles/object_settings/cameras.html)
- [A4 — Blender Camera Python API](https://docs.blender.org/api/current/bpy.types.Camera.html)

Các công cụ ngoài được nghiên cứu ngày 08/09/2026; khả năng phù hợp với tài nguyên Hula cần kiểm chứng bằng lượt chạy thật.

## 14. Nguồn và giới hạn

Nguồn website là nội dung Hula công bố; không phải xác minh độc lập hiệu quả hay tính năng. Truy cập ngày 08/09/2026. Các thiết kế, lời dẫn, camera, kế hoạch và chỉ số trong tài liệu là đề xuất riêng cho Hula.

- [S1 — Trang chủ Hula](https://www.nemmamnon.com/)
- [S2 — Danh mục sản phẩm](https://www.nemmamnon.com/san-pham)
- [S3 — Bộ nệm 4 món Khu rừng vui vẻ](https://www.nemmamnon.com/san-pham/BO_NMN_HQ_6CT_MONKEY_04)
- [S4 — Dự án Hula](https://www.nemmamnon.com/du-an)
- [S5 — Bài tư vấn cấu tạo bộ nệm](https://www.nemmamnon.com/tin-tuc/kham-pha-cau-tao-bo-nem-goi-men-cho-be-di-hoc)
- [T1 — Marzipano, tài liệu sản phẩm chính thức](https://www.marzipano.net/)
- [T2 — model-viewer, website chính thức](https://modelviewer.dev/)
- [T3 — Three.js, tài liệu chính thức](https://threejs.org/docs/)

**Trạng thái bàn giao:** kế hoạch v1.2 đã theo ràng buộc ChatGPT không code; đã có hình nhân vật, storyboard cô An và instruction AI IDE. Chưa có sản phẩm chạy hoặc thay đổi website.
