# HULA 360 — Instruction 01 cho AI IDE

**Nhiệm vụ:** xây bản thử ngôi thứ nhất của cô An, hoàn thành chuỗi nhận túi–xem ký hiệu–trải nệm–đặt gối–gấp–cất. Đây là instruction để AI IDE thực hiện, không phải code đã triển khai.

## 1. Đầu vào và cách sử dụng

Đọc `01_Creative-Brief_Characters-POV.md`, hai hình trong thư mục `references/` và kế hoạch tổng trong gói. Chỉ dùng storyboard V02 đã sửa tay áo. Nếu workspace đang ở repo website Hula, đọc chỉ dẫn repo và kiểm tra cấu trúc hiện có trước khi sửa. Không đoán framework, API ERP hoặc đường dẫn code từ tên website.

Vai trò của bạn: AI IDE thực hiện lập trình, dựng hình bằng công cụ/mã phù hợp, kiểm thử và báo cáo. Anh là người cung cấp tài nguyên và duyệt. ChatGPT bên ngoài cung cấp nội dung và review. Không yêu cầu người dùng viết code hoặc thuê nhân sự để làm các phần bạn có thể thực hiện.

Hãy hoàn thành phạm vi bản thử dưới đây. Thiếu model 3D/voice không phải lý do dừng: dùng placeholder 3D rõ ràng và phụ đề; ghi chính xác những gì còn thiếu. Nếu không có repo, tạo dự án demo độc lập theo môi trường sẵn có và ghi lại lựa chọn. Không tích hợp form thật hoặc phát hành website công khai trong nhiệm vụ bản thử.

## 2. Kết quả bắt buộc

Một bản chạy gồm một phòng học 3D, góc nhìn cô An, mẹ Linh và Mây là nhân vật đối diện, một bộ đồ demo và ba điểm di chuyển. Người dùng nhìn quanh theo phương ngang 360°, chọn hành động bằng chuột/chạm, thấy tay mình thao tác và thấy trạng thái đồ vật thay đổi đúng.

Không dùng slideshow sáu ảnh, ảnh phẳng trên mặt cầu, video toàn màn hình hoặc camera orbit quanh cô An để thay thế yêu cầu này. Hai hình đầu vào là tài liệu mỹ thuật, không phải mesh/texture sẵn sàng dùng. Có thể đặt chúng trong trang tài liệu phát triển; không coi việc hiển thị hình là hoàn thành cảnh tương tác.

## 3. Phạm vi và kiến trúc

- Giữ stack và quy ước repo nếu phù hợp. Chọn giải pháp WebGL/Three.js hoặc lớp tích hợp tương thích hiện có; kiểm tài liệu phiên bản thư viện đang dùng trước khi triển khai.
- Một scene lớp học nhất quán, ba điểm: cửa, tủ, điểm trải. Di chuyển theo điểm định sẵn; chưa cần WASD/đi tự do/VR.
- Một vai điều khiển: CHAR-AN. CHAR-LINH và CHAR-MAY là nhân vật theo kịch bản. Chưa triển khai hai vai điều khiển còn lại, nhưng cấu trúc dữ liệu phải cho phép bổ sung.
- Một sản phẩm `DEMO-KIT-01`: nệm, gối, túi. Nhãn “Bản minh họa — đang chờ tài nguyên sản phẩm” xuất hiện gọn ở phần giới thiệu; không gán SKU/giá/cam kết thật.
- Nếu có GLB được cung cấp, kiểm và tối ưu trước khi dùng. Nếu chưa có, dựng phòng/sản phẩm và nhân vật proxy từ hình khối; phải có tay/điểm cầm và chuyển động rõ ràng. Không báo proxy là nhân vật final.
- Tách dữ liệu nhân vật, scene, bước, sản phẩm, camera và lời dẫn khỏi logic điều khiển để thay asset mà không viết lại hành trình.
- Giữ scene tương tác thật cho bản chính; fallback ảnh 2D có nhãn rõ khi WebGL/tài nguyên không dùng được.

## 4. Camera và cơ thể ngôi thứ nhất

- Góc nhìn tại mắt cô An; không hiện mặt/đầu cô trong khung hình và không quay từ sau lưng.
- Tư thế đứng tham khảo 1,55 m. Khi quỳ/cúi, chuyển đến pose đã định; tay theo cùng body anchor/pose, không chỉ dán tay lên màn hình.
- Cho xoay ngang trọn vòng ở chế độ khám phá; giới hạn cúi/ngẩng đủ để tránh xuyên hình. Nút Trở về hướng chính phải hoạt động.
- Tay phù hợp người trưởng thành; cô mặc polo ngắn tay. Không có ống tay dài tại cổ tay.
- Khi thao tác cần định hướng, hiển thị hướng dẫn rồi chuyển về góc hành động; không giật camera. Hỗ trợ giảm chuyển động bằng chuyển cảnh tức thời hoặc mờ ngắn.
- Tại điểm thao tác, ngăn nhìn xuyên cơ thể/đồ bằng giới hạn góc, ẩn phần mesh gây lỗi hoặc camera collision phù hợp. Ghi rõ phương án thực hiện.
- Điều khiển chuột và chạm không xung đột: kéo để nhìn, click/tap để chọn; kéo không kích hoạt hotspot khi thả. Có nút hành động tương đương cho bàn phím.

## 5. Hành trình và trạng thái đồ vật

Định nghĩa chuyển trạng thái hợp lệ và điều kiện trước mỗi thao tác. Tối thiểu cần phân biệt:

| Bước | Trước | Hành động | Sau |
|---|---|---|---|
| Nhận | Túi do mẹ giữ | Tay cô nhận, mẹ buông | Túi do cô giữ |
| Xem ký hiệu | Túi do cô giữ | Nâng túi xem chiếc lá | Ký hiệu đã được xem; túi vẫn do cô giữ |
| Đặt túi | Túi do cô giữ | Đặt tại vùng chuẩn bị | Túi ở điểm chuẩn bị |
| Lấy bộ gấp | Bộ còn trong túi | Mở túi, lấy bộ và gối | Bộ gấp ở vùng trải; gối ở vị trí sạch đã định |
| Trải | Nệm gấp tại vùng trải | Mở theo animation demo | Nệm trải hoàn chỉnh |
| Đặt gối | Nệm trải, gối ở vị trí tạm | Tay chuyển gối lên đầu nệm | Bộ sẵn sàng |
| Sau giờ nghỉ | Bộ sẵn sàng | Thẻ chuyển thời gian và nút Tiếp tục | Cho phép thu dọn |
| Thu gối | Gối trên nệm | Chuyển gối về vị trí tạm | Nệm sẵn sàng gấp |
| Gấp | Nệm trải, đã thu gối | Animation gấp | Nệm gấp |
| Đóng gói | Nệm gấp + gối + túi | Cho bộ vào túi | Túi chứa đủ bộ |
| Cất | Túi chứa đủ bộ | Nhấc, đưa vào ngăn chiếc lá, buông | Bộ trong tủ, hoàn thành |

Tay–vật thể phải có điểm gắn và thời điểm chuyển quyền giữ rõ ràng. Mỗi món có một identity; không nhân đôi ở tay/sàn/tủ. Nếu cần bản mesh biểu diễn khác cho trạng thái mở/gấp, chỉ một biểu diễn được kích hoạt trong cùng thời điểm và cùng identity sản phẩm.

Khi bấm nhanh nhiều lần, chỉ chạy một hành động hợp lệ. Nút xem lại/reset phải đưa đồ về trạng thái bắt đầu nhất quán. Khi bỏ qua animation, đưa hệ thống tới trạng thái cuối hợp lệ, không bỏ dở đồ đang lơ lửng. Khi ẩn tab hoặc mở panel, tạm dừng; tiếp tục đúng bước. Nếu animation lỗi, trả về trạng thái ổn định có thể thử lại.

Thứ tự gấp demo chỉ dùng kiểm chứng kỹ thuật. Thao tác chính thức phải thay theo SKU anh cung cấp; không hard-code một cơ chế gấp như đặc tính chung của Hula.

## 6. Giao diện và lời dẫn

- Màn mở đầu: tên trải nghiệm, mô tả ngắn nhập vai cô An, trạng thái minh họa, nút Bắt đầu.
- Trong cảnh: nhiệm vụ hiện tại, một nút hành động chính, tiến độ, tắt tiếng, reset hướng nhìn, tạm dừng/thoát.
- Không ép toàn màn hình, không bắt buộc xoay ngang, không yêu cầu cấp camera/micro/gyro để trải nghiệm.
- Có phụ đề cho toàn bộ lời dẫn trong brief. Voice là tùy chọn khi có file; không giả báo có voice AI khi chưa tích hợp. Không tự phát âm thanh trước thao tác người dùng.
- Nút chạm mục tiêu tối thiểu 48 px, chữ dễ đọc, focus rõ; panel thông tin đóng được và không che nút chính.
- “Bắt đầu lại” khôi phục toàn bộ state, camera và NPC; “Thoát” quay về màn mở đầu.
- Kết thúc: tóm tắt đã trải nghiệm nhận–trải–cất; nút Xem lại. Chưa nối giỏ hàng, form hoặc ERP.

## 7. Tài nguyên, nội dung và tính đúng

- Dùng asset nhân vật riêng nếu có; khi chưa có dùng proxy cùng màu/tỷ lệ để test, không tự tải model không rõ nguồn.
- Không dán cả bảng nhân vật/storyboard lên hộp hoặc billboard rồi gọi là nhân vật 3D hoàn thiện.
- Không dùng ảnh AI để suy ra nhãn giặt, độ dày, thành phần, số điểm chống trượt hoặc cơ chế khóa.
- Dùng file logo thật khi được cấp. Chưa có thì dùng tên chữ “HULA 360” làm tên trải nghiệm, không tự vẽ lại logo thương hiệu.
- Có danh sách asset: ID, file, nguồn, trạng thái demo/final, phiên bản và vị trí dùng. Liệt kê riêng asset còn thiếu.
- Chỉ có lời thoại kịch bản; không thêm chatbot tự do với trẻ hoặc dữ liệu cá nhân vào prototype.

## 8. Kiểm thử cần thực hiện

Kiểm thử tập trung vào rủi ro của bản thử, không chỉ kiểm tra có component hoặc khớp snapshot mã.

1. Hoàn thành từ nhận túi đến cất mà không có state sai; cả bấm tuần tự lẫn bấm nhanh lặp lại.
2. Bỏ qua từng animation, reset ở giữa thao tác, ẩn/hiện tab và mở/đóng panel: đồ không nhân đôi/biến mất, tay không bị kẹt.
3. Chọn bước trái trình tự bị ngăn và có chỉ dẫn phù hợp.
4. Chuột và touch: thao tác xoay không gây click nhầm. Có luồng bàn phím sử dụng được các hành động chính.
5. Góc nhìn ở cửa/tủ/vùng trải, đứng/cúi và tại biên xoay: không thành ngôi thứ ba hoặc xuyên hình.
6. WebGL không khả dụng hoặc asset lỗi: thông báo/fallback rõ, có thử lại; không canvas trắng vô hạn.
7. Giảm chuyển động và không voice: vẫn hoàn thành được nhiệm vụ.
8. Đo hiệu năng ít nhất trên desktop thực tế của môi trường và viewport mobile mô phỏng. Nếu chưa thử thiết bị thật, ghi rõ; không gọi emulation là kiểm thử iPhone/Android thật.

Ghi số đo tải, dung lượng và fps ở môi trường đã dùng. Mục tiêu tham khảo 30 fps trên thiết bị mục tiêu, chưa phải gate đã đạt. Tối ưu đủ để cảnh thử hoạt động; không mở rộng thêm tính năng ngoài phạm vi.

## 9. Thứ tự thực hiện

1. Kiểm repo và chỉ dẫn, xác định điểm tích hợp/dự án demo, kiểm các asset được giao; báo ngắn lựa chọn.
2. Dựng phòng, camera, ba điểm di chuyển và proxy nhân vật/sản phẩm.
3. Hoàn thiện state và chuỗi tay–sản phẩm; chứng minh lấy–đặt–trải–gấp–cất.
4. Thêm nhiệm vụ, phụ đề, reset, pause, giảm chuyển động, fallback.
5. Thực hiện kiểm thử trọng tâm; sửa lỗi còn lại rồi bàn giao.

Không dừng ở bản kế hoạch nếu đã đủ điều kiện làm demo. Không đợi đủ tài nguyên final để xây nền tương tác. Nếu gặp blocker thật về môi trường/quyền, hoàn thành phần độc lập còn lại rồi nêu chính xác tài nguyên hoặc quyền thiếu.

## 10. Mẫu báo cáo bàn giao của AI IDE

Trả lời bằng tiếng Việt và cung cấp:

- Phạm vi đã làm; phần còn là proxy/demo; phần chưa thực hiện.
- Cách mở/chạy đúng với repo và môi trường thực tế, dùng lệnh đã kiểm chứng tại đó.
- Danh sách file đã thay đổi và lý do.
- Ảnh chụp sáu trạng thái chính từ bản chạy, cùng video ngắn nếu môi trường hỗ trợ.
- Kết quả kiểm thử: pass/fail/chưa kiểm, môi trường đo, lỗi còn lại.
- Danh sách tài nguyên cần anh gửi để thay demo bằng sản phẩm/nhân vật final.
- Đề xuất bước tiếp theo, chưa tự triển khai mẹ Linh/bé Mây ngoài phạm vi instruction này.

**Hoàn thành prototype kỹ thuật không đồng nghĩa hoàn thành sản phẩm thương mại.** Chỉ gọi bản mẫu đạt khi chuỗi thao tác ngôi thứ nhất chạy được và các giới hạn được ghi đúng.
