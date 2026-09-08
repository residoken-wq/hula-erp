# HULA 360 — Bảng nghiệm thu Instruction 04

Điền PASS / FAIL / BLOCKED cùng bằng chứng. Tài liệu này quy định mục tiêu, không báo rằng ứng dụng hiện tại đã đạt. ChatGPT chưa được cung cấp repo/bản chạy để kiểm tra triển khai.

| Mã | Tiêu chí | Bằng chứng cần có |
|---|---|---|
| A01 | Ba nhân vật đúng mặt, tóc, màu áo, tỷ lệ; Mây có kẹp lá đúng bên | Bốn view render từ mỗi GLB cuối, đối chiếu PNG |
| A02 | Nhân vật là mesh có rig; nhìn nghiêng/phía sau không thành tấm phẳng | Preview xoay model và animation thực |
| A03 | Vai được chọn có camera mắt và tay đúng, hai vai còn lại là NPC | Ba ảnh cùng thời điểm từ ba vai |
| A04 | Cảnh đón không còn trẻ ngủ/bộ nệm trải trong vùng lớp đang thu dọn | Ảnh toàn cảnh và inventory background |
| A05 | Một túi duy nhất chuyển từ cô An sang mẹ Linh; pose và tiến độ cùng trạng thái | Ba frame ready/transferring/received và video |
| A06 | Bấm nhanh CTA không tạo nhiều túi hoặc nhiều completion; replay/đóng giữa thao tác phục hồi đúng | Test state hoặc video tái hiện cùng log phù hợp |
| A07 | Đổi vai giữ cùng thời điểm/ownership; progress hành động riêng đúng vai | Video đổi vai trước/sau bàn giao |
| A08 | Card không che mặt, tay, túi ở thao tác chính; UI không có nhãn debug công khai | Ảnh 390×844, 844×390, 1440×900 |
| A09 | Chữ 200%, bàn phím, đóng panel/tour và focus hoạt động; không click xuyên panel | Kiểm thao tác thực và ghi nhận kết quả |
| A10 | Kéo nhìn hủy auto-pan; reduced motion tránh ép camera; audio không tự bật | Kiểm thao tác thực |
| A11 | Loading/lỗi asset có trạng thái rõ; mở đóng không nhân loop/audio; đo hiệu năng thật | Log, môi trường đo, kết quả tải và frame time/FPS |
| A12 | Bật/tắt từ CMS và route policy vẫn đúng; build không lỗi do thay đổi | Kết quả regression/build thực |

Một scene “đạt nhập vai” cần A01–A07 đạt cho vai được công bố hỗ trợ. UI đẹp hơn nhưng chưa có mesh/rig chỉ được ghi là hoàn thiện giao diện. Không dùng PNG tham chiếu hoặc ảnh AI minh họa làm screenshot chứng minh bản chạy.

Mẫu báo cáo một tiêu chí: “A05 — FAIL: có một túi nhưng đổi vị trí đột ngột khi gắn sang tay mẹ; video tại ...; cần sửa bảo toàn world transform ở marker.” Báo cáo cụ thể như vậy hữu ích hơn đánh giá chung “đã mượt”.
