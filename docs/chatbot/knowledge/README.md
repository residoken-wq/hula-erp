# Kho tri thức Cừu Hula v2: phân tích 3 tài liệu nguồn

Người lập: Claude (BA), 2026-09-28. Nguồn do Chủ dự án gửi:

| Mã | File | Nội dung |
|---|---|---|
| S1 | TỔNG HỢP CÂU HỎI (Quy trình tư vấn bán hàng chuẩn) | Khách lẻ: kích thước, độ dày, chất liệu, giá trọn bộ, vận chuyển, đổi trả, giặt. Khách sỉ: thêu logo, xem mẫu, vận chuyển sỉ |
| S2 | KỊCH BẢN BÁN HÀNG TỔNG HỢP (B2B 6 bước) | Mở lời, so sánh túi ngủ và bộ rời, 2 phân khúc vải, bảng giá theo số lượng, 5 form túi bảo quản, hợp đồng/tạm ứng, giao hàng, upsell |
| S3 | HỘI THOẠI KHÁCH HÀNG (31 case) | Hội thoại thật: có tên, SĐT, địa chỉ, MST, email, số tiền. **Không đưa nguyên văn vào hệ thống** |

## File trong thư mục này
- `kb-v2.json`: 52 mục tri thức + 18 câu kịch bản + conflict mới D17. Nhập qua CMS → Trợ lý AI → Tri thức → **Nhập JSON** (P3.2). Mọi mục ở trạng thái `draft`/`needs_review`.
- `eval-cases.json`: 31 tình huống rút từ S3, **đã ẩn danh**, dùng để chấm bot (P3.8) và cho sales chấm tay (P5).

## Cách sắp xếp
1. **Mục trả lời an toàn (`faq.*.process`)**: không nêu con số. Có cho giá, độ dày, thời gian, vận chuyển, thuế/hoá đơn, đổi trả, thanh toán, chất liệu, in/thêu. Duyệt xong là bot dùng được ngay, dù conflict chưa giải quyết.
2. **Mục có con số / chính sách**: gắn `conflict_code` hoặc topic bị khoá, nên **không xuất bản được** cho tới khi người phụ trách giải quyết conflict trong CMS → Mâu thuẫn. Khi đó sửa nội dung cho đúng rồi xuất bản.
3. **Kịch bản (`script.*`)**: câu mở đầu và câu chuyển tiếp theo giọng sales HULA (S2 Bước 1, S3), đã chỉnh theo SPEC: gọi "anh/chị", không hỏi giới tính bé, không hứa thời gian.

## Mâu thuẫn tìm thấy (cần người phụ trách chốt)

| Conflict | Nội dung trong nguồn | Mục bị khoá |
|---|---|---|
| D01 | Bảng giá S2: bậc 50–300 **đắt hơn** bậc 30–49; "nệm gối mền" rẻ hơn "nệm gối"; cột >300 trống | `price.table.s2` (draft, không công khai) |
| D02 | Trọn bộ nệm+gối+túi 290–400k (S1) và bộ tiêu chuẩn 350–400k / cao cấp 420–500k (S3) | `price.range.*` |
| D03 | Chần gòn thành phẩm 1–1,5 / 1,5–2 cm, gòn trước chần 4–5 cm (S1); SPEC ghi S2 "3–5 cm" | `product.thickness.quilted` |
| D04 | Foam 2,5–3 cm (S1) và 3–5 cm tùy đặt (S3.6) | `product.thickness.foam` |
| D05 | Thêu nệm từ 50 bộ, 10–15k (S1) và thêu chăn 20k (S3.3) | `service.logo.embroider` |
| D06 | In túi từ 30; balo 300/mẫu (S3.4) nhưng S3.18 nói balo số lượng ít; đồng phục 500 | `moq.*` |
| D07 | 20–30 ngày làm việc (S2, S3); 15 ngày (S3.24); 15–20 ngày cho đơn ít (S3.25) | `leadtime.*` |
| D08 | Nhãn "tên lớp" (S1) và cải tiến chỉ Name (S2, S3.30) | `product.label.name` |
| D09 | Túi gọn 47×35 (S1) không có trong 5 form túi S2 | `bundle.bag_fit.fold` |
| D10 | Miễn ship nội thành HCM khi CK trước (lẻ); hỗ trợ 20–50% đơn ≥100 bộ (sỉ); S3 có hỗ trợ theo từng đơn | `shipping.*` |
| D11 | "VAT 8% cho tất cả mặt hàng" (S2, S3.17) | `tax.vat` |
| D12 | Đổi trả: mỗi bên 1 chiều ship / lỗi NSX 2 chiều miễn phí, **không có thời hạn** | `policy.return.retail` |
| D15 | "Mặt trên 100% cotton", "cotton satin HQ", "Satin Hàn Quốc": chưa rõ thành phần theo dòng | `product.material_claim.*` |
| D16 | Tạm ứng không có mức chuẩn; S3 có QR và tài khoản cá nhân | `payment.deposit` |
| **D17 (mới)** | Chăn Cara 130×70 / Satin 130×90 (S1) và chăn bộ rời 130×80/90 (S2) | `product.spec.size.blanket` |

## Những gì tao đã loại khỏi nội dung cho khách
- **Câu quảng cáo chưa có hồ sơ:** "thoáng mát, mau khô", "mềm mại", "80 tone màu", "lót chống thấm", "form đứng đẳng cấp", "đựng vừa bộ nệm lớn cùng thú bông", "đạt chuẩn". Ghi lại ở `review_note` để người duyệt thêm lại nếu xác nhận được.
- **Câu hỏi giới tính bé** (S1 Bước 1): SPEC yêu cầu không hỏi.
- **Thông tin cá nhân và giá riêng từng khách trong S3:** không đưa vào (ví dụ giá riêng 305k/bộ có hạn 31/7, hỗ trợ ship 50% của một đơn).
- **Email công ty:** dùng placeholder `{email_public}`, lấy từ Cấu hình hệ thống.

## Việc cho người duyệt (theo Q-11)
1. Nhập `kb-v2.json` trong CMS.
2. Duyệt hàng loạt các mục `faq.*`, `script.*` và các mục thông số, cách giặt không bị khoá.
3. Với từng conflict: chốt con số trong CMS → Mâu thuẫn → Giải quyết, sửa mục bị khoá, rồi xuất bản.
4. Giá chính thức nhập bằng **Rule giá** (CMS → Giá), không nhập vào tri thức.
