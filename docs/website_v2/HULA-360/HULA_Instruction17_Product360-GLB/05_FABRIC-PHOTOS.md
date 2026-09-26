# 05 — Ảnh vải thật (D7) và những gì ảnh cho thấy

Chủ dự án gửi 22 ảnh ngày 2026-09-26. Ảnh gốc nằm ở `C:\Users\admin\Downloads\HÌNH 360-20260926T081640Z-1-001\HÌNH 360\`, JPG 4096×2304 (dọc thì 2304×4096), tổng khoảng 109 MB. Claude đã xem hết.

Antigravity chép ảnh vào `assets-src/product360/fabric/raw/`, đổi tên theo cột `role` trong `fabric-photos.json`, rồi thêm `assets-src/product360/fabric/raw/` vào `.gitignore`. **Không commit ảnh gốc.** Chỉ commit texture đã xử lý (≤ 2048², WebP) nằm trong GLB.

---

## 1. Phân loại ảnh

| Nhóm | File | Nội dung | Dùng để |
|---|---|---|---|
| **Vải xanh lá, vân nhăn** (dự kiến Cotton Cara, chờ Q1) | `…7771`, `…7784` (có A4), `…7848`, `…7860` | Vải trơn, không chần, vân nhăn nhỏ kiểu crepe | **Texture mặt vải.** `…7860` chụp thẳng và đều sáng nhất. `…7784` có giấy A4 để cân trắng |
| Mặt chần xanh lá | `…7490`, `…7527` (cận cảnh), `…7570` | `…7490`/`…7527`: chần hình **thoi bo tròn**. `…7570`: chần **gợn sóng**, có quai treo. Chỉ chần trắng mũi nhỏ | Mẫu chần (geometry), độ phồng ô chần, đường chỉ |
| **Vải vàng, dệt trơn** (dự kiến Satin HQ, chờ Q1) | `…7801`, `…7817`, `…7833` (có A4) | Vải trơn, có đường may mép | **Texture mặt vải.** `…7817` và `…7833` chụp thẳng |
| Mặt chần vàng | `…7730`, `…7744`, `…7755` | `…7730`/`…7744`: chần **lục giác**, viền **xanh dương**. `…7755`: chần **sóng**, chỉ chần vàng zigzag, có độ bóng | Mẫu chần, độ bóng (sheen), viền |
| **Mặt đáy xám chần** | `…7662`, `…7675`, `…7689` | Vải xám bóng nhẹ, chần hình **giọt/ogee** | Texture + mẫu chần mặt dưới nệm |
| **Lưới chống trượt** | `…7698` (xiên), `…7714` (thẳng) | Miếng lưới màu be may lên mặt đáy xám, ở đầu nệm | Material `antislip_mesh` (alpha/normal), hotspot 3 |
| **Viền + quai + dây dán** | `…7593` (dây velcro xám + viền), `…7608` (quai treo vòng), `…7627` (dây velcro nhìn ngang) | Viền là **dải vải bọc mép** khoảng 1,5 cm, không phải ống tròn. Dây velcro dài khoảng 20-25 cm | Mesh `binding`, `strap_velcro`, `hang_loop`. Hotspot 1 |
| **Nhãn tên** | `…7642` | Nhãn satin trắng in "Tên ___ / Lớp ___", có velcro phía trên, trên mặt xám | Mesh `name_label` (texture nhãn **dựng lại bằng chữ vector**, không lấy pixel ảnh). Hotspot 5 |

(`…7490` là viết tắt của `1790409797490.jpg`. Các file khác tương tự.)

## 2. Chất lượng ảnh: dùng được, không cần chụp lại

- Độ phân giải 9,4 MP, đủ để làm texture 2048².
- Nhiều ảnh chụp xiên, xa thì bị mờ (`…7490`, `…7771`, `…7848`, `…7698`). Chỉ dùng làm **tham chiếu**, không dùng làm texture.
- Ánh sáng không đều (sáng bên này tối bên kia). Script `make-fabric-textures` phải làm phẳng sáng, kiểu high-pass hay chia cho bản làm mờ, **trước** khi khử màu (01 mục 3.3).
- **Không có thước**, nên kích thước ô chần hiện chỉ ước lượng được. Xem Q3.

## 3. Hệ quả cho model (sửa hợp đồng ở 01)

Bản 3D cũ sai ở mấy điểm này so với hàng thật:
1. **Mặt nệm chần bông**, gồm các ô phồng giữa đường chỉ chần. Đây là chi tiết làm hàng thật trông "thật" nhất. Script phải dựng đường chần thành **rãnh trong mesh** (lún 3-5 mm), rồi cloth sim có pressure làm các ô phồng lên. `quilt_pattern` ∈ `thoi`, `song` (Q2), ô 14 × 15 cm (Q3). Mặt đáy dùng `ogee`.
2. **Viền là dải vải bọc mép** (binding) rộng 3 cm mỗi mặt (Q3), phẳng, bo quanh mép, có đường chỉ, màu xám (Q4). Không phải ống tròn như bản cũ.
3. **Mặt đáy là vải xám chần ogee** có miếng lưới be, không phải tấm tối màu.
4. Có thêm **dây velcro** (giữ gối hoặc cuộn nệm), **quai treo vòng** và **nhãn tên**.
5. Chỉ chần có màu riêng (trắng trên xanh, vàng trên vàng). Mesh hoặc normal cho đường chỉ tách material `stitch`. Chỉ chần có đổi màu theo vải hay không: xem Q4.

## 4. Câu trả lời của chủ dự án (2026-09-26), đã chốt

| ID | Câu hỏi | Trả lời | Áp vào model |
|---|---|---|---|
| Q1 | Vải nào là dòng nào? | ✅ Xanh lá vân nhăn = **Cotton Cara**. Vàng dệt trơn bóng nhẹ = **Satin Hàn Quốc** | `fabric-photos.json`: bỏ dấu `?` |
| Q2 | Kiểu chần nào là nệm, kiểu nào là chăn? | ✅ "Cùng loại thoi và sóng" | Chỉ có **2 kiểu chần**: `thoi` (thoi bo tròn; mẫu "lục giác" trên vải vàng cũng tính là `thoi`) và `song` (gợn sóng). **Nệm và chăn trong cùng một bộ dùng chung một kiểu.** Kiểu chần cấu hình theo từng dòng trong `params.json` và manifest. Mặc định lấy theo sales kit: Satin = `thoi` (trang 20-21), Cara = `song` (trang 16-17). Mặt đáy xám giữ kiểu ogee riêng |
| Q3 | Kích thước ô chần và viền | ✅ Ô chần **14 × 15 cm**. Viền rộng **3 cm** | `quilt_cell_cm: [14, 15]`. `binding_width_cm: 3`, là bề rộng nhìn thấy trên **mỗi mặt** (viền bọc qua mép nên xuất hiện ở cả mặt trên và mặt đáy). Cả hai là tham số, chỉnh được nếu đo lại |
| Q4 | Màu viền và chỉ chần | ✅ Sản phẩm tiêu chuẩn: **viền xám** | `binding`, `strap_velcro`, `hang_loop`, `underside` cố định màu xám lấy từ ảnh. Chỉ chần theo màu vải. Viền xanh dương trong ảnh `…7730/…7744` là hàng đặt riêng, không dùng làm mặc định. Sales kit trang 44 cho thấy đổi màu viền, màu lót sau và màu mặt sau túi là **tuỳ chọn bổ sung**. Engine phải hỗ trợ nhuộm các material này qua `recolor_secondary`, nhưng **P1 không làm UI** cho tuỳ chọn đó |
| Q5 | Sửa chữ hotspot 3 "chấm bi silicon"? | ✅ **Không sửa** | Giữ nguyên nội dung `HULA_HOTSPOTS`. Model vẫn dựng lưới chống trượt đúng hàng thật |
| Q6 | Thiếu ảnh khoá kéo, gối, túi | ✅ Dựng theo catalogue và **sales kit** | Xem mục 5 |

## 5. Sales kit (nguồn tham chiếu cho gối, chăn, khoá kéo, túi)

File: `C:\Users\admin\Downloads\HULA SHOP-SALE KIT - PRINT.pdf` (56 trang, 1500×1500 pt, **652 MB**). Không commit file này. Antigravity render các trang dưới đây ra JPG (dùng `pdfjs-dist` + `@napi-rs/canvas`, cả hai đã có trong `node_modules` ở thư mục gốc), scale 2, vào `assets-src/product360/salekit/` (gitignore).

| Trang | Nội dung | Dùng cho |
|---|---|---|
| 16, 17 | Nệm Cotton Cara, chăn tiêu chuẩn / size lớn. Ảnh lớp học thật, chần sóng chéo | `mattress-cara`, chăn Cara, gối |
| 20, 21 | Nệm Satin HQ, chăn tiêu chuẩn / size lớn. Chần thoi, gối có vạt | `mattress-satin`, `blanket-std`, `pillow` |
| 11, 44 | Dây kéo liên kết chăn (cận cảnh khoá kéo), vải lót mặt sau logo, các tuỳ chọn đổi màu | Hotspot 2, hotspot 4, `recolor_secondary` |
| 29 | **Balo rút**: dây rút trắng, tab đen ở 2 góc dưới, nhãn HULA ở đường may hông, miếng "Name/Class" trắng. Mặt sau có 2 lựa chọn: xám hoặc cùng màu | `bag-drawstring` |
| 30, 34 | **Túi quai xách**: 2 quai xám, **khoá kéo mặt sau**, mặt sau có 2 lựa chọn (xám hoặc cùng màu) | `bag-handle` |
| 32, 33 | **Túi hộp quai đeo**: **dây đeo vai dài** có khoá chỉnh, **khoá kéo mặt trên**, túi hông mini, mặt sau và hông cùng màu | `bag-box` |
| 31 | Túi quai đeo (không có hông) | Ngoài pilot |
| 43 | Cận cảnh 4 chất liệu: Cotton Cara, Satin HQ, Poly Canvas, Canvas | Tham chiếu vải túi (**Poly Canvas**, dệt ô rõ). Chưa có ảnh chụp thật vải túi, nên texture túi dựng bằng vân canvas procedural, đối chiếu với trang này |

Quy tắc chung cho 3 túi (theo sales kit): mặt trước nhuộm theo màu khách chọn, có `logo_zone` và miếng nhãn `name_label` ("Name / Class", dựng bằng chữ vector). Nhãn dệt HULA nằm ở đường may hông (material `brand_tag`, không nhuộm). Mặt sau mặc định **xám** (`fabric_accent`). Riêng túi hộp: mặt sau và hông cùng màu mặt trước.

Chữ "YOUR LOGO HERE" trong sales kit chỉ là chỗ đặt logo mẫu. **Không** dựng chữ này vào model.
