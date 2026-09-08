# Phân tích sale kit và bản đồ sản phẩm thật

Nguồn duy nhất cho thông tin sản phẩm: ZIP `HULA SHOP-SALE KIT- JPEG-20260908T105931Z-1-001.zip` do chủ dự án cung cấp. Tên file dẫn dưới đây đã đổi khoảng trắng thành dấu gạch dưới; nội dung JPEG giữ nguyên. Các thông số là thông tin catalogue, chưa được đo trực tiếp trên sản phẩm. Không có bảng mã SKU, giá hoặc tồn kho trong bộ này.

## 1. Phạm vi 56 trang

| Nhóm | Số trang | Vai trò |
|---|---:|---|
| Bìa và category | 5 | Nhận diện và tổng quan |
| Nệm mầm non | 10 | Cotton Cara, Satin Hàn Quốc; chăn tiêu chuẩn/lớn |
| Nệm foam | 4 | Foam gấp bốn khúc và foam cơ bản |
| Túi ngủ | 10 | Cara/Satin; tiêu chuẩn/nâng cao |
| Túi bảo quản | 8 | Balo rút, quai xách, quai đeo, hộp quai đeo, hộp diễu |
| Sản phẩm khác | 6 | Túi/balo, đồng phục, phụ kiện, nệm người lớn, đệm/gối |
| Phụ lục | 13 | Vải, tùy chọn bổ sung, dự án thực tế |

## 2. Mười lăm dòng chính để đưa vào dữ liệu draft

Mã `REF-*` do tài liệu này đặt để tham chiếu, **không phải SKU Hula**. Đơn vị bảng là cm. Dấu gạch ngang là chưa có thông số, không phải số 0.

| Reference ID | Dòng sản phẩm | Thông số ghi trong catalogue | Nguồn |
|---|---|---|---|
| REF-MAT-CARA-STD | Bộ nệm Cotton Cara, chăn tiêu chuẩn | Nệm 120×63; gối 40×25; chăn 130×70 | [NEM_MN_-_01.jpg](sale-kit/NEM_MN_-_01.jpg) |
| REF-MAT-CARA-LARGE | Bộ nệm Cotton Cara, chăn size lớn | Nệm 120×63; gối 40×25; chăn ghi “130×80/90” | [NEM_MN_-_02.jpg](sale-kit/NEM_MN_-_02.jpg) |
| REF-MAT-SATIN-STD | Bộ nệm Satin Hàn Quốc, chăn tiêu chuẩn | Nệm 120×65; gối 40×25; chăn 130×70 | [NEM_MN_-_05.jpg](sale-kit/NEM_MN_-_05.jpg) |
| REF-MAT-SATIN-LARGE | Bộ nệm Satin Hàn Quốc, chăn size lớn | Nệm 120×65; gối 40×25; chăn ghi “130×80/90” | [NEM_MN_-_06.jpg](sale-kit/NEM_MN_-_06.jpg) |
| REF-FOAM-FOLD4 | Nệm foam gấp bốn khúc, drap Satin Hàn Quốc | Nệm 120×60×3; gối 40×25 | [NEM_KHUC_-_01.jpg](sale-kit/NEM_KHUC_-_01.jpg) |
| REF-FOAM-BASIC | Nệm foam cơ bản, drap Poly | Nệm 120×60×3; gối 40×25 | [NEM_KHUC_-_02.jpg](sale-kit/NEM_KHUC_-_02.jpg) |
| REF-SLEEP-CARA-STD | Túi ngủ Cotton Cara tiêu chuẩn | Nệm 125×63; chăn 98×80 | [TUI_NGU_-_01.jpg](sale-kit/TUI_NGU_-_01.jpg) |
| REF-SLEEP-CARA-PLUS | Túi ngủ Cotton Cara nâng cao | Nệm 125×63; chăn 98×80 | [TUI_NGU_-_02.jpg](sale-kit/TUI_NGU_-_02.jpg) |
| REF-SLEEP-SATIN-STD | Túi ngủ Satin Hàn Quốc tiêu chuẩn | Nệm 130×70; chăn 98×70 | [TUI_NGU_-_05.jpg](sale-kit/TUI_NGU_-_05.jpg) |
| REF-SLEEP-SATIN-PLUS | Túi ngủ Satin Hàn Quốc nâng cao | Nệm 130×70; chăn 98×90 | [TUI_NGU_-_06.jpg](sale-kit/TUI_NGU_-_06.jpg) |
| REF-BAG-DRAWSTRING | Balo rút bảo quản | S:40×50; M:42×52 | [TUI_BAO_QUAN_-_00.jpg](sale-kit/TUI_BAO_QUAN_-_00.jpg) |
| REF-BAG-HANDLE | Túi bảo quản quai xách | S:48×40; M:50×42 | [TUI_BAO_QUAN_-_01.jpg](sale-kit/TUI_BAO_QUAN_-_01.jpg) |
| REF-BAG-SHOULDER | Túi bảo quản quai đeo | S:48×40; M:50×42 | [TUI_BAO_QUAN_-_02.jpg](sale-kit/TUI_BAO_QUAN_-_02.jpg) |
| REF-BAG-BOX | Túi hộp quai đeo | S:36×28; M:36×30 | [TUI_BAO_QUAN_-_03.jpg](sale-kit/TUI_BAO_QUAN_-_03.jpg) |
| REF-BAG-BOX-STITCH | Túi quai đeo hộp diễu | S:40×32; M:45×35 | [TUI_BAO_QUAN_-_04.jpg](sale-kit/TUI_BAO_QUAN_-_04.jpg) |

“130×80/90” cần map thành lựa chọn được xác nhận trước khi tạo biến thể bán hàng; không hiểu thành ba chiều 130×80×90. Catalogue không cho chiều dày các bộ nệm Cara/Satin hoặc túi ngủ; không lấy độ dày 3 cm của foam gán sang chúng. Với túi, chưa có quy ước trục kích thước, độ sâu, độ cao quai hay thể tích hữu dụng.

## 3. Khác biệt sản phẩm phải thể hiện trong mô phỏng

| Nhóm | Chi tiết có nguồn | Hành động phù hợp |
|---|---|---|
| Bộ nệm Cara/Satin | Nệm, gối, chăn riêng; móc cố định; nhãn tên/lớp; mặt chống trượt được catalogue mô tả | Cô An kiểm nhãn, trải nệm, xem gối và mặt dưới; mẹ Linh mở thông tin; Mây tìm đồ của mình |
| Foam gấp bốn khúc | Bốn đoạn, đường gấp, dây cố định; drap Satin, dây kéo mặt sau | Gấp theo đoạn và cất kệ khi đã có model/clip đúng |
| Foam cơ bản | Drap Poly, dây kéo phía sau | Xem cấu tạo bên ngoài; không tự gắn hành vi gấp bốn khúc |
| Túi ngủ Cara tiêu chuẩn | Chăn mỏng; nhãn/móc theo trang chi tiết | Trải/mở phần chăn; không dùng hình chăn chần gòn của bản nâng cao |
| Túi ngủ Cara nâng cao | Chăn chần gòn; hình chần khác bản tiêu chuẩn | So sánh bề mặt/cấu hình; không biến khác biệt thành kết luận đo nhiệt |
| Túi ngủ Satin nâng cao | Liên kết chăn bằng dây kéo là lựa chọn bổ sung | Chỉ có animation mở khóa khi biến thể thật có tùy chọn đó |
| Túi quai xách/quai đeo | Khóa ở mặt sau; mặt sau xám hoặc xanh trong ảnh | Bàn giao theo quai; kiểm nhãn ở mặt trước; quay mặt sau để xem khóa |
| Túi hộp/hộp diễu | Có hông; khóa phía trên; mặt sau và hông cùng màu | Dựng đúng cấu trúc hộp và vị trí khóa, không dùng chung mesh túi phẳng |
| Balo rút | Dây rút, đeo hai vai; không dùng dây kéo | Chỉ mô phỏng rút dây khi có rig/shape đúng |

Nguồn thêm: [PHU_LUC_-_01.jpg](sale-kit/PHU_LUC_-_01.jpg) liệt kê tùy chọn bổ sung; [TUI_BAO_QUAN_-_05.jpg](sale-kit/TUI_BAO_QUAN_-_05.jpg) tổng hợp các kiểu túi. Các claim “an toàn”, “khô thoáng”, “mát mẻ” trên catalogue không phải kết quả kiểm định do dự án 360 thực hiện. Không thêm thông số kháng khuẩn, chứng nhận, khuyến cáo giặt hoặc lợi ích sức khỏe ngoài nguồn.

## 4. Màu và logo

Cotton Cara có sáu màu cơ bản: xanh dương, xanh lá, xanh ngọc, cam, vàng, hồng; tên được thể hiện ở [TUI_NGU_-_03.jpg](sale-kit/TUI_NGU_-_03.jpg) và [TUI_NGU_-_04.jpg](sale-kit/TUI_NGU_-_04.jpg), bộ nệm có hình tương ứng ở NEM_MN_-_03/04. Chưa có mã vải hoặc màu sRGB/Pantone chính thức; giá trị màu lấy từ JPEG chỉ dùng preview.

Satin ghi “80 màu” kèm yêu cầu liên hệ xem bảng màu thực tế. Không tạo 80 swatch hoặc 80 SKU tưởng tượng. Chỉ đưa các phối màu có ảnh vào gallery tham khảo; phần đặt hàng theo màu thực tế vẫn chưa có dữ liệu.

Chữ “YOUR LOGO HERE” trên hình là chỗ minh họa tùy biến, không phải họa tiết phải bake vào mesh. Các logo KIS, BAY, ilo, Vietnam Canada… thuộc dự án minh họa trong sale kit, không tự chọn làm thương hiệu lớp giả lập. Nhãn “Mây — Lớp Mầm” là dữ liệu nhân vật hư cấu, không phải nhãn sẵn của hàng bán.

Bìa COVER_01 có dòng “TÀI LIỆU LƯU HÀNH NỘI BỘ”. Giữ bản gốc làm evidence cho IDE/draft; không chép nguyên toàn bộ catalogue và ảnh khách hàng vào thư mục web public. Dữ liệu sản phẩm vẫn có thể chuẩn bị ngay; ảnh công khai dùng asset đã được duyệt của website hoặc bản hình sản phẩm được duyệt riêng. Đây là phân biệt phạm vi sử dụng của chính nguồn, không cản công việc phân tích/tích hợp draft.

## 5. Lựa chọn cho cảnh mẫu

**Bộ nệm:** REF-MAT-CARA-STD xanh dương, đúng trang NEM_MN_-_01. Dùng nệm 1,20×0,63 m, gối 0,40×0,25 m, chăn 1,30×0,70 m để bố trí mặt bằng; chiều dày là tham số dựng hình chưa xác minh, không xuất thành thông số thương mại.

**Túi:** REF-BAG-HANDLE size S, chọn mặt trước xanh/mặt sau xám/quai xám từ TUI_BAO_QUAN_-_01. Kịch bản dùng túi đóng sẵn, nhãn Mây để nhận diện. Chưa biểu diễn “bộ nệm đã chắc chắn nhét vừa túi” hoặc kiểm tra thể tích khi chưa có kích thước xếp gọn và lòng túi.

Đây là lựa chọn thiết kế để triển khai trước; không phải kết luận đây là combo bán chạy nhất hay combo đóng gói sẵn. Tài liệu đã đủ để bỏ sản phẩm màu kem/lá tưởng tượng; chưa đủ để xác lập mã hàng ERP, giá, tồn kho hoặc quy cách may đầy đủ.

## 6. Phụ kiện ngoài cảnh mẫu

SP_KHAC_-_01: bóp bút, túi eco, balo rút bình nước/mini. SP_KHAC_-_02: balo mầm non, balo thời trang mini, tote, túi đeo mini. SP_KHAC_-_03: tạp dề/mũ, áo bib, túi đồ dơ/đồ bơi. SP_KHAC_-_04: nệm văn phòng/giáo viên, đệm/gối. Giữ ở nhóm “Khám phá thêm”, không đưa tất cả vào lớp khiến người xem mất mục tiêu. Chưa import kích thước của nhóm này vào registry 15 dòng chính.

## 7. Những thông tin còn thiếu thực sự

| Thiếu | Ảnh hưởng | Cách tiếp tục |
|---|---|---|
| SKU/variant ID và đường sản phẩm hiện có | Chưa liên kết commerce chính xác | Dùng REF nội bộ; IDE đối chiếu CMS, không tự tạo SKU |
| Bề dày nệm mềm, lòng túi, độ sâu/quai | Model chưa là bản sao theo kích thước đầy đủ | Dùng tham số draft có nhãn kỹ thuật; không công bố con số đoán |
| Ảnh packshot/texture/logo gốc phù hợp public | Chưa có texture sạch hoàn chỉnh | Dùng JPEG làm tham chiếu nội bộ; map asset đã có trong website |
| Mã màu thực tế và quy cách giặt | Không chuẩn hóa swatch/giặt chính xác | Giữ null; không bịa thông tin |
| Mesh/rig/clip nhân vật | Chưa hoàn thành nhập vai 3D | Quy trình riêng trong 02_3D-Asset-Pipeline.md |

Sau khi đọc ảnh chi tiết, nệm foam được xác nhận ghi **3 cm** ở cả trang tổng quan và trang chi tiết; không còn nghi vấn từ hình thu nhỏ. Khác biệt 63/65/70 cm thuộc các dòng khác nhau, không tự coi là lỗi dữ liệu và hợp nhất chúng.
