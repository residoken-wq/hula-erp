# HULA 360 — Instruction 02: Mở rộng ba vai ngôi thứ nhất

Ngày 08/09/2026 · Phạm vi: mẹ Linh, bé Mây, bộ chọn vai và tính nhất quán sự kiện. Đây là instruction cho AI IDE; ChatGPT chưa code hoặc nghiệm thu bản chạy.

## 1. Đọc đầu vào và xác định trạng thái thật

Đọc chỉ dẫn repo hiện tại; đọc kế hoạch tổng, creative brief và instruction 01 trong gói, sau đó `03_Storyboards_Parent-Child.md` cùng các hình reference.

Không giả định instruction 01 đã được thực hiện chỉ vì có tài liệu. Kiểm repo và chạy bản hiện có nếu có. Nếu đã có nền tốt, mở rộng tại đó. Nếu chưa có, hoàn thành nền prototype theo instruction 01 trước trong cùng luồng công việc, rồi triển khai instruction này. Không dựng ba app riêng hoặc thay stack khi không cần.

Gate nền bắt buộc trước khi nối thêm vai: camera cô An đúng ngôi thứ nhất; một phòng; chuỗi nhận–trải–gấp–cất có state hợp lệ; reset/skip không nhân đôi đồ. Nếu lỗi, sửa và ghi kết quả. Thiếu asset final thì dùng proxy đã gắn nhãn, không dừng phần kỹ thuật độc lập.

Người dùng đã yêu cầu AI thực hiện phần code; bạn triển khai và kiểm thử. ChatGPT giao nội dung và review. Không yêu cầu anh viết mã. Không tự đăng ký dịch vụ, chạy API tính phí, gửi form thật hoặc phát hành công khai trong phạm vi bản thử này.

## 2. Đầu ra yêu cầu

- Một bản chạy có ba vai CHAR-AN, CHAR-LINH, CHAR-MAY.
- Cùng một scene và nguồn asset, ba bộ camera/tay/lời dẫn/nhiệm vụ khác nhau.
- Hoàn thành sáu cảnh mẹ Linh và sáu cảnh Mây theo brief, có các hành động nối.
- Bộ chọn vai, xem lại sự kiện qua vai khác, lưu tiến độ từng vai trong phiên.
- Giao diện “Cùng bé khám phá” khác giao diện người lớn, không yêu cầu dữ liệu trẻ.
- Hướng dẫn thiếu nguồn, tài nguyên demo và các giới hạn phải được trình bày đúng.

Hai ảnh storyboard mới không thay thế cảnh 3D; không làm slideshow hoặc iframe video rồi gọi là hoàn thành ngôi thứ nhất.

## 3. Mô hình sự kiện và góc nhìn

Tách bốn khái niệm: nhân vật điều khiển; sự kiện/thời điểm; trạng thái đồ vật; tiến độ hành trình. Một vai không tương đương một scene độc lập có dữ liệu sản phẩm riêng.

Các mốc chuẩn: EV-01 đón và bàn giao; EV-02 xem bộ đồ; EV-03 tủ cá nhân; EV-04 chuẩn bị ngủ; EV-05 sau giờ nghỉ; EV-06 bàn giao cuối tuần. Dùng ID nhất quán theo brief. Chỉ cho vai xuất hiện ở sự kiện phù hợp.

| Sự kiện | Vai xem cùng thời điểm | Ghi chú |
|---|---|---|
| EV-01 | Cô An, mẹ Linh, Mây | Đổi POV phải giữ ai đang cầm túi |
| EV-02 | Cô An, mẹ Linh | Mây có thể là NPC; chưa cần tạo nhiệm vụ trẻ ở bàn giới thiệu |
| EV-03 | Cô An, mẹ Linh hoặc Mây theo checkpoint | Chốt checkpoint mẹ còn ở lớp hoặc đã rời, không nhập nhằng |
| EV-04 | Cô An, Mây | Mẹ đã rời lớp; không có lựa chọn xem cùng thời điểm từ mẹ |
| EV-05 | Cô An, Mây | Cùng thao tác thu dọn; một state sản phẩm |
| EV-06 | Cô An, mẹ Linh | Mây là NPC; chưa mở nhiệm vụ trẻ tại giờ đón |

Sự kiện trùng nghĩa ở các vai phải dùng chung dữ liệu hoặc checkpoint, không tạo bản sao đồ vật cho mỗi nhân vật.

## 4. Hai kiểu chuyển vai rõ ràng

### 4.1. Xem cùng thời điểm

Chỉ cho chọn các vai hiện diện trong bảng. Giữ event, checkpoint, productState, vị trí và người giữ đồ. Đổi camera cùng rig tay hiển thị phù hợp; nhân vật cũ trở thành NPC, nhân vật mới không được hiện thêm một bản trước camera.

Nếu đang animation, tạm khóa nút đổi hoặc xếp yêu cầu đến điểm ổn định kế tiếp; hiển thị phản hồi ngắn. Không chuyển quyền cầm giữa animation chỉ vì đổi camera. Khi đổi từ cô sang Mây lúc cô đang giữ nệm, nệm vẫn ở tay cô, tay Mây không tự nhận lại.

### 4.2. Bắt đầu hành trình của vai khác

Đây là replay từ checkpoint mở đầu phù hợp, phải có nhãn “Bắt đầu hành trình…” để người xem hiểu việc chuyển thời gian. Lưu tiến độ vai đang xem trong phiên; dựng lại trạng thái có kiểm soát từ checkpoint. Không cố giữ đồ đang nằm ngủ vào cảnh mẹ mang túi tới cửa.

Nút “Tiếp tục” mở checkpoint ổn định gần nhất của vai đã xem, không phục hồi frame giữa animation. Mỗi lần xem dùng một scene instance đang hoạt động; có thể lưu snapshot dữ liệu để replay, không tạo ba canvas chạy nền.

Khi vai mới không hiện diện ở sự kiện hiện tại, chỉ đề xuất bắt đầu/tiếp tục hành trình của vai đó. Không giả lập mẹ ở trong lớp sau giờ ngủ nếu chưa có kịch bản.

## 5. Camera, rig và nhân vật

- CHAR-AN: 1,55 m tham khảo, tay người lớn, polo xanh ngọc ngắn tay.
- CHAR-LINH: 1,60 m tham khảo, tay người lớn, mép áo kem ngắn tay.
- CHAR-MAY: 0,95 m tham khảo, tay nhỏ, mép áo vàng nhạt; không chỉ thu nhỏ camera người lớn mà giữ rig tay cũ.
- Định nghĩa pose đứng/cúi/quỳ và các điểm hành động riêng. Kiểm giao nhau tay–đồ và camera–mesh khi thay rig.
- Cô phải có pose cúi/quỳ khi hỗ trợ Mây; tủ và điểm cầm nằm trong tầm hoạt động của rig trẻ đã chọn.
- Nhìn ngang 360° tại điểm khám phá, góc cúi/ngẩng có giới hạn phù hợp; khi thao tác có camera hướng dẫn, dừng/bỏ qua và giảm chuyển động.
- Lớp render tự nhìn và lớp render NPC phải tách để nhân vật điều khiển không bị nhân đôi; bóng hoặc cơ thể tự nhìn nếu có không làm xuyên camera.

Nhân vật proxy vẫn được phép nếu thiếu model/rig final, nhưng phải có nhận diện trang phục/tỷ lệ, tay POV và vị trí đối diện đúng. Không dùng ảnh nhân vật trên billboard làm nghiệm thu nhân vật 3D final.

## 6. Triển khai mẹ Linh

Thực hiện PH-01 tới PH-06 cùng các hành động nối trong brief. Bàn demo dùng cùng bộ đồ đã nhận, có thao tác lấy ra và cất lại. Khi xem chi tiết mép nệm, sản phẩm có vị trí đặt trả rõ ràng.

PH-05 phải mở bằng nhãn “Cuối tuần — giờ đón trẻ”. Việc nhận đúng túi dựa ký hiệu. Thẻ chăm sóc dùng dữ liệu được cấp; nếu thiếu, hiển thị trạng thái chờ xác nhận, không tự điền nhãn giặt.

Kết thúc prototype có Xem lại/Chọn vai. Chỉ thêm link SKU nếu đã được người dùng cung cấp và đối chiếu; không bịa URL, giá hoặc gọi form/ERP. Không dùng câu thoại AI như review của phụ huynh thật.

## 7. Triển khai bé Mây và chế độ cùng bé

Thực hiện BE-01 tới BE-06. Mây không xuất hiện đối diện chính mình. Khi cần cô hỗ trợ, animation cô và đồ vật phải phối hợp: một chủ thể điều khiển transform sản phẩm, các tay hỗ trợ theo điểm tiếp xúc; không để hai rig kéo nệm về hai hướng.

Tách vai CHAR-MAY khỏi chế độ giao diện. Người lớn có thể xem POV Mây với panel thông tin; “Cùng bé khám phá” là chế độ nhiệm vụ đơn giản. Trong chế độ này:

- Mỗi thời điểm một hành động lớn, mục tiêu chạm 56–64 px.
- Biểu tượng và lời dẫn ngắn; có Nghe lại, tắt tiếng, phụ đề cho người lớn đồng hành.
- Chạm sai gợi ý nhẹ; không timer, điểm số, xếp hạng hoặc hình phạt.
- Không form, giá, giỏ hàng, thu ảnh/voice, tên thật, tài khoản, session replay hoặc quảng cáo theo dõi.
- Không đòi quyền micro/camera/gyro. Giọng nếu có là file kịch bản; thiếu giọng vẫn dùng được bằng hình/gợi ý.
- Người lớn chủ động rời chế độ bằng nút riêng; đây là ranh giới giao diện, không quảng cáo là xác minh tuổi.

Trong BE-02, tìm đúng túi/biểu tượng; BE-03 cô giúp mở; BE-04 bé đặt gối; sau nhãn thời gian BE-05 cô giúp thu/gấp; BE-06 cất vào ngăn thấp. Không yêu cầu bé xử lý chi tiết khó một mình.

## 8. Lời thoại và âm thanh

Mỗi câu có role/speaker, scene/step, text, trạng thái nguồn và audio tùy chọn. Suy nghĩ nhân vật dùng “mình”; lời đối thoại dùng cô/mẹ/con đúng người nghe. Không để giọng mẹ tiếp tục khi đã đổi sang suy nghĩ của bé.

Đổi vai, thoát, reset phải dừng queue audio trước. Mỗi thời điểm một câu chính, không chồng tiếng. Có nghe lại và phụ đề; âm thanh chỉ phát sau thao tác cho phép người dùng. Không gọi API tạo giọng trực tiếp mỗi lần khách bấm.

Chưa có voice file trong gói này. Triển khai chế độ không voice và điểm nhận audio; không ghi đã tích hợp ElevenLabs hoặc voice AI khi chưa có file/kết nối thật.

## 9. Tái sử dụng và quản lý state

Giữ một identity cho bag/mat/pillow và từng nhân vật. State bao gồm ai giữ, vị trí, mở/gấp/đóng gói, checkpoint thời gian, camera pose và tiến độ. Phân biệt dữ liệu demo với SKU đã duyệt.

Các thao tác phải chịu được bấm lặp, reset, bỏ qua, đổi vai và ẩn/hiện tab. Mọi gián đoạn kết thúc ở snapshot ổn định; không lưu pose tay nửa chừng như checkpoint. Thay tài nguyên final không thay identity và quy tắc trạng thái.

Không cần đồng bộ nhiều người dùng, tài khoản, backend lưu tiến độ hoặc ERP ở instruction này. Tiến độ trong phiên đủ dùng; nếu dùng lưu cục bộ thì chỉ dữ liệu hành trình phi cá nhân, có reset và không dùng cho theo dõi trẻ.

## 10. Ma trận kiểm thử trọng tâm

| Test | Thực hiện | Kết quả cần đạt |
|---|---|---|
| MR-01 | Đi hết từng vai từ đầu | Đủ cảnh và kết thúc, đúng lời/camera/tay |
| MR-02 | EV-01 đổi cô ↔ mẹ tại checkpoint sau bàn giao | Túi vẫn do cô giữ, chỉ một túi |
| MR-03 | EV-04 đổi cô ↔ Mây lúc nệm đã trải | Nệm giữ nguyên, tay/camera đổi đúng; cô là NPC khi nhập vai bé |
| MR-04 | Tại EV-04 chọn mẹ | Chỉ bắt đầu/tiếp tục hành trình mẹ, có nhãn chuyển thời điểm |
| MR-05 | Đổi vai liên tục hoặc bấm khi animation chạy | Queue/khóa hợp lý, không nhân đôi NPC/đồ hoặc kẹt rig |
| MR-06 | Đang giữ nệm, bắt đầu lại vai khác rồi tiếp tục vai cũ | Khôi phục checkpoint ổn định, không scene mâu thuẫn |
| MR-07 | Chuyển vai khi đang phát câu thoại | Giọng cũ dừng, không phát chồng hoặc sai speaker |
| MR-08 | Chế độ cùng bé, chạm sai/nghe lại/tắt tiếng | Gợi ý nhẹ, hoàn thành được, không UI thương mại |
| MR-09 | Đóng mở panel/ẩn tab/reset trong mỗi hành động phối hợp | Tay và đồ về state đúng, không rung hoặc nhân đôi |
| MR-10 | Sai/mất asset và WebGL không hỗ trợ | Fallback rõ, có retry, không màn hình trắng |
| MR-11 | Kiểm chuột/touch/keyboard và giảm chuyển động | Không click nhầm khi kéo; có hành động tương đương |
| MR-12 | Quay nhìn các góc ở ba độ cao và pose quỳ | Không camera theo sau, xuyên hình hoặc bé thấy bản sao chính mình |

Không chỉ test các snapshot UI. Các trường hợp đổi vai phải kiểm scene đang chạy và state đồ vật. Đo tài nguyên/fps trên môi trường có thật; ghi rõ thiết bị thực hay emulation. Không công bố mobile pass chỉ từ resize cửa sổ.

## 11. Thứ tự thực hiện và bàn giao

1. Audit và xác minh nền instruction 01; hoàn thiện nền nếu chưa có.
2. Chuẩn hóa event/checkpoint và cơ chế render vai; thêm bộ chọn vai.
3. Hoàn thiện PH-01..06 với camera/tay mẹ.
4. Hoàn thiện BE-01..06 cùng chế độ đơn giản và trợ giúp của cô.
5. Hoàn thiện chuyển vai/replay/audio queue/fallback và kiểm các trường hợp trong bảng.
6. Bàn giao bản chạy, bằng chứng, danh sách còn thiếu; không dừng ở mô tả khả năng.

Báo cáo tiếng Việt gồm: cách mở bản chạy; nền ban đầu đã có gì; file thay đổi; cảnh/video ngắn của từng vai; test pass/fail/chưa kiểm; số đo và môi trường; asset demo/final; lỗi còn lại; tài nguyên cần anh gửi. Không báo hình storyboard là ảnh chụp từ bản chạy.

## 12. Điều kiện hoàn thành instruction

Ba vai đi hết được; hai kiểu chuyển vai hoạt động rõ; sản phẩm/nhân vật không nhân đôi; góc nhìn và tay đúng vai; chế độ bé không có UI thương mại; lỗi tải có lối thoát; kết quả kiểm thử được ghi thật. Chất lượng asset final và độ đúng SKU là gate riêng sau khi nhận tài nguyên.

Phần chưa làm trong scope này: công cụ bố trí lớp theo diện tích/sĩ số, mẫu SKU thương mại chưa có tài nguyên, tự tạo voice trả phí, AR/VR, nhiều người online, giỏ hàng và tích hợp ERP.
