# R7 — Danh sách hình minh họa cần sản xuất / liên kết

Đây là brief tài nguyên, chưa phải các ảnh/clip đã được tạo. AI IDE phải kiểm kê file hiện có trước; không đặt đường dẫn giả để vượt kiểm tra.

## Gói tối thiểu

Ba vai × sáu bước H0–H5 = 18 slot hình. H2 có thể dùng cận cảnh túi chung nếu phối cảnh phù hợp; mỗi slot vẫn cần binding rõ. H4 cần clip ngắn hoặc chuỗi khung riêng: cô giữ → hai người tiếp xúc quai → mẹ giữ. Crossfade hai ảnh là chuyển cảnh minh họa, không phải chuyển động tay liên tục.

Tên quy ước đề xuất: r7/{co-an|me-linh|be-may}/{h0-greet|h1-table|h2-label|h3-ready|h4-transfer|h5-received}.webp. Chỉ thêm đường dẫn vào dữ liệu khi file thực sự tồn tại và đã kiểm tra.

## Prompt sản xuất ảnh dùng với công cụ tạo ảnh

Dùng ảnh chuẩn nhân vật và ảnh túi thật trong tài nguyên dự án làm tham chiếu bắt buộc. Tạo một khung hình riêng, tỉ lệ 16:9, lớp mầm non Việt Nam sáng tự nhiên, sàn gỗ sáng, tủ thấp pastel, bàn đón bé. Giữ cùng căn phòng, cùng ánh sáng, trang phục, khuôn mặt, túi và bố cục giữa các khung. Sản phẩm là túi quai xách HULA theo ảnh tham chiếu; không tự vẽ logo hoặc chữ, để vùng nhãn trống cho UI đặt chữ. Không thêm nhân vật ngoài cô An, mẹ Linh, bé Mây. Không có UI, watermark mới hay chữ giả. Không tạo nội thất khác cho từng bước.

Biến POV:
- co-an: mắt cô An, mẹ Linh đối diện; không thấy mặt cô An, chỉ tay khi cần.
- me-linh: mắt mẹ Linh, cô An đối diện; không thấy mặt mẹ Linh, chỉ tay khi cần.
- be-may: mắt bé Mây, góc thấp thấy người lớn; không thấy mặt bé Mây, không cho bé nhận túi thay mẹ.

Biến hành động:
- H0: đứng cách bàn một khoảng, người đối diện chào, túi ở vị trí cất có thể nhận ra.
- H1: túi trên bàn, tay cô vừa đặt xuống, góc gần hơn H0.
- H2: cận túi, quai, khóa và vùng nhãn; không biến thành nệm hoặc túi khác.
- H3: cô An nhấc túi bằng quai, đưa đến giữa bàn; mẹ chuẩn bị đưa tay nhận.
- H4: bàn tay cô và mẹ cùng tiếp xúc quai trong đúng một thời điểm bàn giao; chỉ một túi.
- H5: túi ở tay mẹ Linh, cô đã buông; cảnh hoàn tất khác rõ H0.

Sản xuất H0 trước làm cảnh gốc, các bước sau tham chiếu cả cảnh gốc lẫn sản phẩm. Kiểm tra bàn tay, số quai, chiều khóa, màu mặt trước/sau và tính nhất quán trước khi đưa vào CMS. Video tùy chọn 2–4 giây cần cùng điểm đầu/cuối với state runtime.

## Bảng quản trị cần có

Hàng là H0–H5; cột là ba vai. Mỗi ô có thumbnail, trạng thái Đã có/Thiếu/Lỗi, Thay ảnh, Xem trước. Không cho xuất bản chuỗi còn thiếu slot có thể đi tới. Có chọn chế độ minh họa/3D ở cấp kịch bản; chế độ 3D có checklist rig và clip riêng, không suy ra từ số ảnh đã tải.
