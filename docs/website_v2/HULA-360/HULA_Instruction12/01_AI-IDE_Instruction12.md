# Instruction12 — Tích hợp cảnh R7 H4/H5, POV mẹ Linh

## Phạm vi gói

Hai ảnh minh họa AI theo nhân vật chuẩn và mẫu túi quai xách trong sale kit. Đây không phải ảnh chụp sản phẩm thật, video hoặc GLB/rig. Không thay gallery ảnh thật bằng ảnh này. Chưa hoàn thiện H0–H3 cùng bối cảnh và chưa có ảnh cho POV cô An/bé Mây trong gói này. Cần giữ trạng thái nghiệm thu từng slot riêng.

## Prompt giao AI IDE

Đọc Instruction11 và sửa shared mobile layout trước khi nghiệm thu ảnh mới. Dùng hai file trong assets cho đúng R7, role me-linh, state H4 và H5 ở chế độ illustrated_sequence. Không map sang vai khác; không dán ảnh lên một mặt phẳng trong scene 3D có WASD. Không đặt cả ảnh vào material của túi. Đây là ảnh nguyên cảnh.

- H4: r7-me-linh-h4-transfer.png — cô và mẹ cùng tiếp xúc quai túi.
- H5: r7-me-linh-h5-received.png — mẹ giữ túi; hai tay cô đã rời túi, cô vẫy chào.

Ảnh có nhân vật và túi sẵn: tắt các sprite nhân vật, sprite túi, label, crosshair và nền cũ trong nhánh minh họa này để không bị nhân đôi. Giữ UI ngoài vùng ảnh. Trạng thái tooltip sản phẩm phải đóng khi vào bước; thông tin túi nằm trong panel khi người dùng yêu cầu.

Desktop: scene ở trái, panel ở phải, không đè card lên đáy ảnh. Mobile: ảnh ở trên, thẻ bước ở dưới trong flow; mặc định fit-contain giữ trọn túi và tay. Không crop cover giữa ảnh: H5 túi sát đáy, crop sẽ mất túi. Không phóng to ảnh toàn màn hình khi người dùng chỉ bấm tiếp. Có thể cho nút phóng to riêng.

Chuyển H4→H5: tải và decode H5 trước; nút “Nhận túi” chỉ chạy một lần; đổi ảnh bằng crossfade ngắn khoảng 200–300ms, sau hiển thị thành công mới commit received. Reduced motion đổi trực tiếp. Không tuyên bố crossfade là animation bàn giao. Nếu H5 lỗi, giữ H4 và báo thử lại, không hiện “Đã nhận”. Replay reset state và không thêm bản sao túi.

Mỗi ảnh là một khung minh họa, không thể đổi màu riêng túi bằng CSS filter trên toàn ảnh. Với hai slot này chỉ hỗ trợ màu xanh minh họa. Nếu màu sản phẩm từ phòng trước khác, không tự gán rằng ảnh xanh đang hiển thị màu đã chọn; giữ lựa chọn sản phẩm và ghi “Minh họa túi màu xanh” trong phần chi tiết. Muốn thêm màu cần bộ ảnh tương ứng hoặc mesh riêng đã kiểm chứng.

Không gắn nhãn “Mây – Lớp Mầm” vào mặt nhân vật. Nếu cần tên, đặt trong thẻ bước bên ngoài ảnh; không cố đọc chữ nhỏ AI trên miếng nhãn như dữ liệu thật. Miếng nhãn và mặt sau/khóa chưa đủ chi tiết để dùng kiểm tra kỹ thuật sản phẩm. Ảnh sale kit vẫn là nguồn đối chiếu.

## CMS

Nhập hai ảnh vào thư viện media và liên kết bằng assetId/version với role+state. Preview mobile 400×528 dùng contain; đánh dấu ảnh là minh họa AI, nguồn tham chiếu TUI_BAO_QUAN_-_01.jpg và character refs. Không tự xuất bản toàn chuỗi R7 chỉ vì hai slot này đã có ảnh. H0–H3 cần đồng bộ bối cảnh/túi; các vai khác cần asset phù hợp trước khi nghiệm thu toàn bộ.

## Kiểm tra

1. H4 nhìn được toàn túi và bàn tay đang giao; H5 nhìn được tay mẹ giữ và tay cô rời túi.
2. Không card, tooltip, nhãn hoặc crosshair che ảnh. Không hai bộ nhân vật/túi chồng lên nhau.
3. 400×528 và 390×844 có CTA truy cập được, không body/panel cuộn lồng vô ích.
4. Tải H5 lỗi không commit received. Double click và replay không sai state.
5. Quay video H3→H4→H5 để đánh giá độ liên tục; nếu H3 hiện tại khác phòng/góc, báo chưa đồng bộ thay vì giấu bằng transition dài.

## Tình trạng kiểm tra tài nguyên

Đã kiểm tra bằng mắt hai khung: có sự thay đổi quyền giữ túi, tay cô rời túi ở H5, một túi trong mỗi khung. Tạo hình và chất liệu là minh họa; không chứng nhận chính xác kích thước, mặt sau, khóa kéo hoặc cấu tạo quai. H5 sát đáy nên ưu tiên contain. Chưa chạy kiểm tra tích hợp trên beta hoặc tạo ảnh dọc riêng. Chưa hoàn thiện toàn bộ ba vai/sáu bước.
