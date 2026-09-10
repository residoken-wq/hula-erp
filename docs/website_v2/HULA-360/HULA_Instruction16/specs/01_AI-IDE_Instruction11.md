# HULA Instruction 11 — Sửa UI/UX R7 và mobile toàn trường

Bản thiết kế và instruction ngày 10/09/2026. Chưa sửa hoặc kiểm thử website trực tiếp. Cơ sở là bảy screenshot mới do người dùng cung cấp. Giữ sản phẩm, phòng học và CMS theo Instruction10; ưu tiên sửa trải nghiệm đang lỗi trước khi thêm tính năng.

## Prompt thực hiện cho AI IDE

Kiểm tra mã nguồn thực tế rồi sửa shared layout toàn bộ R1–R7, sau đó sửa lớp trình bày R7. Không sửa từng phòng bằng top/left hoặc z-index riêng. Không dùng thu nhỏ font toàn cục để che lỗi tràn. Giao bản preview với ảnh chụp và video nghiệm thu dưới đây. Không báo hoàn thành chỉ dựa vào build thành công.

## A. Kết quả kiểm tra ảnh

| Ảnh | Quan sát xác nhận được | Việc phải sửa |
|---|---|---|
| de9a4b7d… | Map đã là mặt bằng; nhãn/trạng thái R7 chồng nhau; phần dưới modal sát mép màn hình; thuật ngữ “Mặt bằng SVG” xuất hiện | Đổi thành “Bản đồ”; tách hàng tên và trạng thái; giới hạn modal theo chiều cao khả dụng |
| 5b0574f1… H0 | Có phòng, cô An, bé Mây; túi nhỏ bên trái còn chữ catalogue, nền và thanh xanh dài | Dùng ảnh túi được tách nền đúng hoặc khung ảnh sản phẩm riêng; không đưa cả trang catalogue vào cảnh |
| 0cc35eae… H1 | Nhãn tên nổi gần nhân vật, thân túi bị thẻ thoại che | Đưa túi vào vùng hành động; nhãn bám túi và tránh mặt người |
| b657f0c4… H2 | Phóng to làm thanh xanh/nhãn cắt ngang nhân vật, phần túi dưới thẻ thoại | Dùng góc cận cảnh túi riêng, ảnh giữ đúng tỉ lệ; không scale cả ảnh catalogue có lề |
| 986d72b4… H3 | Mô tả cô nhấc quai nhưng hình tay cô vẫn buông; túi không rõ | Thay asset đúng tư thế hoặc thể hiện chuỗi minh họa thật, không chỉ đổi dòng trạng thái |
| 04f5fdab… H5 | Tooltip che mặt cô; chưa thấy túi ở tay mẹ | Đặt thông tin trong panel; khung kết thúc phải thấy túi đã nhận |
| c9e2d963… | Viewport emulation 400×528; header cắt tên; panel sản phẩm lấp cảnh và nhiều dấu cuộn | Sửa shell responsive, trạng thái mở panel ban đầu và vùng scroll |

Không có screenshot H4 nên chưa xác nhận động tác H4. Ảnh mobile này không đủ xác nhận mọi R đều bị chữ đè; người dùng báo lỗi toàn trường nên phải kiểm tra đủ R1–R7. Các số lỗi/warning trong DevTools không cho biết nội dung lỗi, không suy đoán chúng là nguyên nhân. Chưa có bằng chứng CMS đã triển khai đầy đủ.

## B. Shared layout mobile — P0

### 1. Trạng thái khi mở phòng

Trên màn hình hẹp, mặc định product panel đóng ở mọi R1–R6, dù dữ liệu có selectedProductId mặc định. Selected không đồng nghĩa panelOpen. Sau vào phòng: header, cảnh, một gợi ý ngắn và nút “Xem sản phẩm”. Không tự bật cùng lúc intro, lời nhân vật, tooltip và product sheet. Người đã chọn sản phẩm chạm nút mới mở sheet. Chuyển phòng đóng sheet/tooltip cũ, cập nhật selected theo phòng mới nhưng không tự bật sheet.

R7 mặc định có thẻ bước gọn; không mở product panel chồng lên thẻ. Đổi vai không làm sheet tự mở. Nếu deep link có yêu cầu mở chi tiết rõ ràng, chỉ mở một sheet và vẫn có nút đóng; không áp dụng mặc định này cho mọi link.

### 2. Phân vùng màn hình

Shell có chiều cao theo viewport khả dụng thực tế, hỗ trợ dynamic viewport và safe-area. Header và nội dung nằm trong flow. Vùng scene lấy phần còn lại với min-height:0; panel cuộn bên trong khi cần. Kiểm tra container portal, body scroll lock, h-screen/w-screen và các flex child đang cản co lại. Đây là các điểm cần kiểm tra, chưa phải nguyên nhân đã xác minh.

Mobile header dùng hai hàng khi thiếu chỗ: hàng tên phòng + đóng; hàng chọn vai + bản đồ. Ưu tiên tên phòng đọc được; bỏ tagline dài trên mobile. Nút có vùng chạm tối thiểu 44×44px. Không dành quá nhiều chiều rộng cho mô tả vai; tên “Mẹ Linh” là đủ, chi tiết nằm trong bộ chọn.

Tại 400×528, mục tiêu đề xuất: header khoảng 88px; scene khoảng 264px; thanh điều khiển/thẻ R7 khoảng 176px, tất cả trừ safe-area thực tế. Đây là phân bổ thiết kế, không hardcode ba chiều cao bất chấp text zoom. Với chữ lớn hoặc chiều cao thấp hơn, cho nội dung text cuộn/thu gọn có chủ đích và cảnh có kích thước tối thiểu hữu ích; không che nút hoặc cắt nội dung. Không yêu cầu scene và text cùng cố định theo kích thước px tại mọi breakpoint.

### 3. Panel sản phẩm

Bottom sheet có ba trạng thái: đóng, mở gọn, mở rộng. Mở rộng có header và nút đóng cố định trong sheet, đúng một vùng cuộn nội dung, CTA ở cuối không phủ nội dung. Không để cả body và panel cuộn lồng nhau. Sheet chi tiết có thể chiếm phần lớn màn hình sau thao tác rõ ràng của người dùng; không dùng trạng thái đó khi mới vào phòng.

Trong sheet: tên sản phẩm → ảnh thật → chọn màu → phạm vi một bộ/cả nhóm → thông số. Bộ chọn 6 sản phẩm thu gọn thành bộ chọn “Bộ 01” khi cần để ảnh và màu không bị đẩy quá xa. Nhãn màu được xuống dòng hoặc bố trí lại, không cắt thành “Xanh dư…”. Font nội dung thường 14–16px; không giảm font để chứa mọi nút trên một hàng.

### 4. Quy tắc lớp giao diện

Một overlay manager quản lý product sheet, role selector, map, gallery và tooltip. Mỗi lúc chỉ một modal chính; mở gallery từ sheet giữ ngữ cảnh và khi đóng quay lại sheet. Trong modal, khóa tương tác camera. Tap điều khiển không xuyên qua chọn sản phẩm bên dưới. Tooltip không chứa thao tác thiết yếu trên mobile; thay bằng nội dung trong sheet. Không để crosshair tròn ở giữa đè vào label/nút trong chế độ minh họa.

Phòng sản phẩm chỉ hiện lời nhân vật khi có yêu cầu/hành động phù hợp; gợi ý ban đầu một câu và biến mất sau thao tác đầu, có thể mở lại trong trợ giúp. Không để toast dài nằm trên CTA. Thông báo tải/lỗi nằm trong vùng của nội dung liên quan.

## C. R7 — P0 bố cục, P1 tư thế/ảnh

### Desktop

Dùng bố cục scene bên trái và panel bước bên phải khi chiều rộng cho phép, ví dụ panel 320–360px. Scene không nằm dưới panel. Nếu viewport thấp, panel tự cuộn, nút hành động vẫn truy cập được. Không giữ card tuyệt đối ở giữa đáy che túi. Đưa trạng thái cảnh, lời thoại và CTA về cùng panel, bỏ hai badge đen mô tả lặp ở hai góc.

### Mobile

Scene ở trên, thẻ bước ở dưới trong flow. Thẻ: “Bước 1/6 · Gặp cô An”, một câu thoại, một CTA. Có “Chi tiết” để mở nội dung bổ sung. Hiện số bước rõ thay cho bảy chấm khó hiểu; lấy tổng bước từ state machine thực tế, đồng bộ H0–H5 nếu vẫn dùng sáu bước. Không tạo bước rỗng chỉ để khớp dấu chấm cũ.

### Vùng hành động và asset

Xác định actionBounds cho toàn túi, quai và bàn tay; faceBounds cho các mặt cần thấy, focalPoint cho mỗi media. Camera/crop chọn để actionBounds nằm trong vùng scene an toàn, cách UI ít nhất 16px. Không chỉ đặt z-index cho túi lên trên card. Cả mặt và túi cần không bị che trong H3–H5; H2 có thể chuyển sang cận túi và không cần mặt.

Ảnh hiện có khác tỉ lệ mobile. Cần crop riêng theo vai/bước và viewport; nếu crop làm mất túi hoặc bàn tay, dùng asset dọc riêng hoặc fit-contain có nền trung tính. Không kéo giãn. Không dùng object-cover cố định center cho mọi frame. Khi contain, tính vị trí hotspot theo khung ảnh thực sự hiển thị, gồm cả offset letterbox, không theo toàn viewport. Khi cover, áp dụng đúng scale/crop offset. Resize/đổi hướng phải tính lại.

Nếu file túi chứa cả chữ và nền catalogue, kiểm tra alpha và crop trước. Không biến lề/trang thành hình chữ nhật trôi trong cảnh. Khi chưa có cutout chuẩn, dùng ảnh gốc trong khung “Ảnh túi thật” ở panel; tuyệt đối không giả vờ đã là túi đặt trên bàn. Để hoàn thiện hành động cần asset tư thế thật sự phù hợp; CSS dịch chuyển một sprite túi không chứng minh cô đang cầm nó.

H0: thấy nhân vật đối diện và túi ở vị trí rõ. H1: thấy toàn bộ túi trên bàn. H2: cận túi, nhãn và khóa; nhãn UI ngắn, không che sản phẩm. H3: thấy tay cô giữ quai. H4: thấy chuyển giao, chỉ một túi. H5: thấy túi phía người nhận, ví dụ bàn tay mẹ và túi ở tiền cảnh; không cần hiện mặt người chơi trong POV mẹ. Với POV bé, thấy mẹ giữ túi. Trạng thái “Đã khớp” chỉ xuất hiện sau thao tác xác nhận; không để text nói đã kiểm tra danh mục bên trong nếu cảnh không hỗ trợ thao tác đó.

Không có asset đúng tư thế thì ghi rõ slot còn thiếu; giữ trạng thái “Chưa nghiệm thu hành động”. Khung cảnh hiện có đã cải thiện, nhưng không được gọi R7 hoàn tất khi chưa có bằng chứng bàn giao nhìn thấy được.

## D. Map — chỉnh phần còn tồn đọng

Giữ mặt bằng đã làm. Đổi “Mặt bằng SVG” thành “Bản đồ”, loại mã REF khỏi luồng chính. Tách tên R7, mô tả và trạng thái đã ghé thành các dòng không trùng nhau. Modal cách mép viewport, chiều cao tối đa theo viewport trừ safe-area; trên mobile có thể dùng full-screen. Map tự fit theo vùng còn lại sau header và thẻ phòng; không để nút zoom, footer hoặc CTA ra ngoài màn hình.

## E. CMS — nối tiếp Instruction10

Thêm vào editor R7 các trường media desktop/mobile, focalPoint, actionBounds, faceBounds, mô tả ảnh và thumbnail preview. Người quản trị chỉnh vùng bằng kéo khung trực quan, không nhập tọa độ JSON. Media reference phải đúng vai và bước. Cho xem trước 400×528 và 390×844 ngay trong admin.

Các tọa độ vùng ảnh chuẩn hóa theo ảnh nguồn, không phải pixel màn hình. Publish cảnh báo vùng hành động bị crop ở preset đã khai báo; chặn slot bắt buộc thiếu asset. Không sửa lại dữ liệu sản phẩm hoặc tạo CMS khác nếu Instruction10 đã có. Báo riêng phần CMS thực sự chạy và phần mới đang đặc tả.

## F. Nghiệm thu bắt buộc

1. Cold load từng R1–R7 ở 360×640, 390×844, 400×528, 430×932: screenshot ngay trước thao tác. R1–R6 thấy cảnh, sheet đóng; R7 thấy scene và CTA, không che nhau.
2. Mobile: mở/đóng chi tiết, gallery, map, đổi vai, đổi phòng, xoay ngang và quay lại. Không mất khả năng cuộn/đóng, không có hai modal chồng nhau. Kiểm tra trình duyệt mobile thật ngoài DevTools nếu có thiết bị; nếu chưa có phải ghi rõ.
3. Desktop 1366×768 và 1920×1080: R7 H0–H5, túi/tay nằm ngoài panel. Video cho cả ba vai, đặc biệt H4 và H5. Không chấp nhận chỉ screenshot H0.
4. Chữ 200%, tên sản phẩm/thoại dài, font tải chậm, mạng chậm: không đè chữ hoặc mất CTA. Nội dung được cuộn hoặc xuống dòng hợp lý.
5. Kiểm tra vùng giao nhau giữa header, CTA, panel, actionBounds; phân biệt lớp cố ý nằm trên scene như hotspot với che khuất không mong muốn. Không coi mọi giao nhau là lỗi.
6. Kiểm tra asset 404, double click, replay H5→H0, rời R7 giữa H4; không túi trùng, không báo đã nhận khi media chưa hiển thị.
7. Giao bảng PASS/FAIL theo phòng, viewport và vai; ảnh trước/sau; video; file đã sửa; lỗi còn lại. Build/lint không thay thế kiểm tra hình ảnh. Chỉ test rộng hơn khi còn rủi ro cụ thể.

Ưu tiên hoàn thành sửa shared mobile và bố cục R7 trước, sau đó bổ sung ảnh/tư thế còn thiếu, cuối cùng nối các trường chỉnh ảnh vào CMS. Không thay nền lớp học đang được chấp nhận để né vấn đề.
