# 01 — Asset pipeline và hợp đồng GLB (P0)

Mục tiêu P0: có đủ file GLB **đã tối ưu** cho các vật thể trong pilot (D5), mỗi file đạt mục 3 "Hợp đồng GLB", kèm manifest. P0 không sửa code website.

Ảnh tham chiếu thật đã có trong repo: `hula-web/website/public/images/tour360/real-photos/catalogue/`. Mã tham chiếu và kích thước catalogue nằm trong `../HULA-360_Real-Products_Instruction05/product-reference-registry.json`. Kích thước catalogue chưa xác nhận chiều đo (`axisConventionVerified:false`), nên số nào dùng để dựng phải ghi vào `modelingAssumptions` trong manifest.

---

## 1. Danh sách asset pilot

Theo D1 và D3: **mọi asset do script Blender sinh ra**. Không dùng dịch vụ trả phí. Chủ dự án có GLB tốt hơn cho asset nào thì import đè lên asset đó (mục 2.5).

| Asset id | Vật thể | Kỹ thuật chính trong script | Ảnh tham chiếu | Kích thước dựng (m, giả định) |
|---|---|---|---|---|
| `mattress-satin` | Nệm Satin HQ | **Mặt chần bông** theo `quilt_pattern` (05 mục 3): đường chần là rãnh lún 3-5 mm, cloth sim có pressure làm ô phồng lên. Dải viền bọc mép. Mặt đáy xám chần ogee + lưới chống trượt, dây velcro, quai treo, nhãn tên | `NEM_MN_-_05.jpg` | 1.20 × 0.65 × 0.025 |
| `mattress-cara` | Nệm Cotton Cara | Như trên, texture Cara | `NEM_MN_-_01.jpg` | 1.20 × 0.63 × 0.025 |
| `blanket-std` | Chăn tiêu chuẩn, gấp 1/3 đặt trên nệm | Tấm vải 130×70 cm, **có chần** theo `quilt_pattern` của chăn (Q2). Cloth sim thả rơi lên nệm (nệm làm collision), gấp bằng 2 bước sim, rồi apply modifier | cùng ảnh nệm | 1.30 × 0.70 khi trải |
| `pillow` | Gối | Hộp chia ô + cloth sim có **pressure** (bơm phồng), đường may viền quanh mép | ảnh gối trong `NEM_MN_*` | 0.40 × 0.25 × ~0.08 |
| `bag-box` | **Túi hộp quai đeo** (sales kit trang 32-33) | Hộp bo góc (bevel) + solidify vải Poly Canvas, **khoá kéo mặt trên**, **dây đeo vai dài** xám có khoá chỉnh, túi hông mini. Mặt sau và hông cùng màu mặt trước. Sim nhẹ cho thành túi hơi võng | `TUI_BAO_QUAN_-_03.jpg`, sales kit 32-33 | 0.36 × 0.28 × ~0.14 |
| `bag-handle` | Túi Quai Xách (sales kit 30, 34) | 2 tấm vải khâu mép + pressure nhẹ, 2 quai xám là dải vải có độ dày, **khoá kéo mặt sau**, mặt sau xám. Tham khảo tỉ lệ `public/models/hula_bag.glb` | `TUI_BAO_QUAN_-_01.jpg`, sales kit 30 | 0.48 × 0.40 × ~0.10 |
| `bag-drawstring` | Balo Rút (sales kit 29) | 2 tấm vải + pressure thấp, **vùng miệng bị kéo co (pin group + shrink)** để có nếp rút. Dây trắng là curve có bevel tròn, luồn qua kênh miệng xuống **2 tab đen** ở góc dưới. Mặt sau xám | `TUI_BAO_QUAN_-_00.jpg`, sales kit 29 | 0.40 × 0.50 × ~0.05 |

Kiểu chần (Q2, `05` mục 4): nệm và chăn trong cùng bộ dùng chung một kiểu. Vì vậy chăn build 2 biến thể, `blanket-std-thoi` (đi với Satin) và `blanket-std-song` (đi với Cara). Ô chần 14 × 15 cm, viền 3 cm, viền và mặt đáy màu xám cố định.

Cả 3 túi có `logo_zone`, `name_label` ("Name / Class") ở mặt trước, và nhãn dệt HULA (`brand_tag`) ở đường may hông. Chi tiết ở `05` mục 5.

Nếp vải phải đến từ **mô phỏng** (cloth, pressure, collision, pin), không được vẽ bằng hàm sin như bản cũ. Độ thật của bề mặt đến từ **texture vải chụp thật** (mục 4).

---

## 2. Hệ thống tự sinh GLB bằng Blender (D1)

### 2.1 Công cụ

- **Blender 5.2.2 LTS** đã cài tại `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`. Đường dẫn đọc từ biến môi trường `BLENDER_BIN`; không có biến thì dùng đường dẫn này. Luôn chạy với `-b --factory-startup` để addon hay cấu hình cá nhân không ảnh hưởng kết quả. **API Blender 5.x khác 4.x ở nhiều chỗ** (tên engine render, cloth/modifier, tham số exporter glTF). Tra theo đúng bản đã cài bằng `bpy.ops.export_scene.gltf.get_rna_type()` và tài liệu 5.2, không viết theo trí nhớ về 4.x.
- `@gltf-transform/cli` và `@gltf-transform/core` (npm, miễn phí), thêm vào devDependencies ở thư mục gốc.
- `sharp` (đã có trong backend) để xử lý ảnh texture.
- **Không** dùng dịch vụ tạo 3D trả phí hay API AI tạo mesh.

### 2.2 Cấu trúc script (commit vào repo)

```
scripts/product360/
  params.json              # kích thước, số ô lưới, tham số sim cho từng asset (lấy từ bảng mục 1)
  blender/
    common.py              # dựng hệ trục, material theo 3.2, empty hotspot/anchor, export GLB
    mattress.py  pillow.py  blanket.py  bag_box.py  bag_handle.py  bag_drawstring.py
  build-all.mjs            # chạy: "%BLENDER_BIN%" -b -P blender/<x>.py -- --asset <id> --out assets-src/product360/built/<id>.glb
  make-fabric-textures.mjs # ảnh vải D7 -> seamless basecolor (xám, mục 3.3) + normal + roughness
  optimize.mjs             # gltf-transform: simplify/weld/webp/meshopt -> public/models/product360/<id>.glb
  import-glb.mjs           # mục 2.5
  check-glb.mjs            # mục 3.5
```

Thêm `npm run product360:build` (build-all → optimize → check) và `npm run product360:import`.

Yêu cầu với script Blender:
- **Tất định:** cùng `params.json` phải ra cùng hình dáng. Seed cố định, số frame sim cố định. Sim xong thì **apply** modifier trước khi export, không export animation.
- UV unwrap có kiểm soát: mặt vải chính dùng UV theo **kích thước thật** (1 đơn vị UV = 0.30 m, trùng với mẫu vải 30×30 cm), nhờ vậy texture lặp đúng tỉ lệ sợi vải giữa nệm, gối và túi.
- Đường may: chuỗi mặt hẹp (edge loop lõm nhẹ) cộng normal map đường chỉ lặp. Không cần mô hình từng mũi chỉ.
- Mỗi script in ra số tam giác và bbox, `build-all` gom kết quả vào `evidence/build.txt`.
- Trong lúc chưa có ảnh vải D7, dùng texture tạm sinh bằng procedural noise trong Blender rồi bake. Asset dùng texture tạm ghi `"texture": "placeholder"` trong manifest. **Chưa được merge lên beta** khi còn texture tạm.

### 2.3 Tiêu chí "trông thật" (Claude audit bằng ảnh render)

Mỗi asset render 3 góc bằng `scripts/product360/render-preview.py`, Eevee, môi trường trắng: chính diện, 3/4 và cận cảnh 20 cm. Ảnh lưu vào `evidence/preview/`. Ảnh đặt cạnh ảnh catalogue để so. Không đạt nếu gặp một trong các lỗi sau:
- Cạnh sắc như hộp, hoặc mặt phẳng tuyệt đối không có nếp nào.
- Nếp lặp đều theo chu kỳ, kiểu hàm sin.
- Vải trông như nhựa bóng, hoặc sợi vải không đúng tỉ lệ (to như ô gạch).
- Túi rút không có nếp co ở miệng. Dây là thanh cứng thẳng.
- Có chữ hay logo nằm trong texture.

### 2.4 Tham khảo model Meshy chủ dự án gửi (chỉ để so chất lượng, không dùng)

| Đặc điểm | Áp vào script |
|---|---|
| Hình dáng mềm, nếp nhăn, dây rút, khoá dây, độ phồng | Đây là mức cần đạt. Làm bằng pressure và pin trong cloth sim |
| 716.336 mặt | Quá nặng cho web. Script giữ trong ngân sách ở 3.4 |
| Chữ "YOUR LOGO HERE" và nhãn tên in vào texture | Không làm như vậy. Logo đặt vào `logo_zone`, nhãn là mesh trắng trơn |
| Dây trắng, khoá đen tách khỏi màu vải | Làm như vậy: material `trim_rope`, `hardware` riêng |

### 2.5 Import GLB của chủ dự án (D1)

Chủ dự án có GLB từ bất kỳ nguồn nào (tự làm, mua, nhà cung cấp gửi) thì:
1. Chép file vào `assets-src/product360/import/`.
2. Chạy `npm run product360:import -- --file <tên.glb> --asset <asset-id> --source "<nguồn>" --license "<ghi chú bản quyền>"`.
3. Script làm tự động:
   - **Chuẩn hoá** tỉ lệ về `dimensions_m`, đặt gốc ở tâm đáy.
   - Đổi material có tên hoặc có màu chiếm diện tích lớn nhất thành `fabric_main` nếu thiếu, và **in ra để người dùng xác nhận**.
   - Khử màu base color của `fabric_main` (3.3).
   - Tối ưu (simplify, WebP, meshopt), rồi chạy `check-glb`.
   - Ghi đè asset trong manifest với `source: "import"`, giữ bản script sinh ra làm `fallback_file`.
4. Nếu thiếu `hotspot_*` hay `logo_zone`: **thêm tự động** từ vị trí trong `params.json` (chiếu lên bề mặt gần nhất theo hướng +Z hoặc +Y), rồi báo cảnh báo. Thiếu hẳn mặt vải, hoặc sai lệch hình dáng quá 3% sau chuẩn hoá: không ghi manifest, báo lỗi.

Trên CMS (P2), phần import chạy cùng logic đó ở backend hoặc trình duyệt. Xem `03`.

---

## 3. Hợp đồng GLB (bắt buộc, Antigravity kiểm bằng script)

### 3.1 Hệ trục và vị trí gốc

- Đơn vị mét, trục Y hướng lên, mặt trước sản phẩm quay về **+Z**.
- Gốc toạ độ nằm ở **tâm đáy** vật thể (y=0 là mặt tiếp đất).
- Kích thước bounding box lệch **≤ 3%** so với bảng mục 1. Ghi số đo thật (dạng `inspect`) vào REPORT.
- Không có camera, đèn hay animation trong file. Không có mesh nền hay mặt phẳng bóng đổ.

### 3.2 Tên node và material

Mỗi file có **một** node gốc tên `part_<asset-id>` (ví dụ `part_bag-box`). Bên dưới gồm:

| Material name | Dùng cho | Runtime làm gì |
|---|---|---|
| `fabric_main` | Mặt vải chính | Nhuộm theo màu khách chọn |
| `fabric_accent` | Vải phụ (mặt sau xám của túi, viền) | Giữ màu gốc. Manifest có thể cho nhuộm theo màu thứ 2 |
| `binding` | Dải vải bọc mép nệm, chăn, gối (khoảng 1,5 cm, phẳng; **không phải ống tròn**, xem 05) | Giữ màu gốc. Nếu Q4 = tuỳ chọn, nhận màu thứ 2 |
| `stitch` | Đường chỉ chần và chỉ may mép (mesh mảnh hoặc dải alpha) | Theo Q4 |
| `underside` | Mặt đáy nệm, vải xám chần ogee | Giữ màu gốc |
| `antislip_mesh` | Miếng lưới chống trượt màu be trên mặt đáy (alpha cutout + normal) | Giữ màu gốc |
| `strap_velcro`, `hang_loop` | Dây dán velcro, quai treo vòng ở mép nệm | Giữ màu gốc (xám) |
| `brand_tag` | Nhãn dệt HULA ở đường may hông túi | Giữ màu gốc |
| `trim_rope`, `hardware` | Dây, khoá, khoen | Giữ màu gốc |
| `logo_zone` | Mesh mỏng riêng, UV phủ kín 0..1 theo hình vuông, nổi khỏi mặt vải 0.5-1 mm | Nhận texture logo của khách. Không có logo thì ẩn |
| `name_label` | Nhãn satin trắng trên mặt đáy (ảnh `…7642`) | Texture dựng lại bằng chữ vector "Tên ___ / Lớp ___". Không dùng pixel ảnh chụp |

Node rỗng (Empty) để code đọc toạ độ:

| Node | Ý nghĩa |
|---|---|
| `hotspot_1` … `hotspot_5` | Theo nội dung thật của `HULA_HOTSPOTS` (`Product360Studio.tsx` L38-79): **1** Móc/đai cố định gối, đặt tại `strap_velcro` trên nệm. **2** Lớp lót mặt sau logo, đặt sau `logo_zone` của nệm. **3** Mặt đáy chống trượt, đặt tại `antislip_mesh`. **4** Dây kéo giấu và khoá tháo rời chăn, đặt ở mép chăn. **5** Nhãn tên lớp, đặt tại `name_label`. Mỗi node nằm trong file của đúng vật thể đó |
| `anchor_logo` | Tâm vùng logo. Trục +Z của node hướng ra ngoài mặt vải |
| `cam_closeup` (tuỳ chọn) | Vị trí camera cho góc "Cận cảnh vải" |

### 3.3 Texture và vật liệu

- Base color của `fabric_main` phải là **ảnh xám trung tính đã khử màu**: độ sáng trung bình ≈ 0.80 (khoảng 204/255 sRGB), giữ nguyên chi tiết sợi vải, nếp và bóng đổ nhỏ. `baseColorFactor = [1,1,1,1]`. Runtime nhân màu swatch vào nên cần nền sáng. Nền tối sẽ làm mọi màu bị đục.
- Mỗi material có đủ `baseColor`, `normal` và `metallicRoughness` (metallic = 0 với vải). Có ambient occlusion thì gộp vào kênh R của map ORM.
- Kích thước tối đa: `fabric_main` 2048², còn lại 1024². Nén WebP (`EXT_texture_webp`) chất lượng 85-90 (normal map dùng 95).
- **Không dùng Draco và KTX2** ở P1. Dùng **meshopt** (`EXT_meshopt_compression`). Decoder đi kèm three (`three/examples/jsm/libs/meshopt_decoder.module.js`), không cần host file wasm riêng.

### 3.4 Ngân sách hiệu năng

| Hạng mục | Giới hạn |
|---|---|
| Tam giác mỗi file | nệm ≤ 20k, chăn ≤ 25k, gối ≤ 12k, mỗi túi ≤ 30k |
| Dung lượng mỗi file `.glb` sau tối ưu | ≤ 2.5 MB |
| Tổng một cảnh (nệm + gối + chăn + 1 túi) | ≤ 8 MB |
| Số material mỗi file | nệm ≤ 10 (nhiều chi tiết, xem 3.2), còn lại ≤ 6 |

### 3.5 Hậu xử lý (Antigravity chạy, có evidence)

Dùng `@gltf-transform/cli` (cài devDependency ở thư mục gốc hoặc chạy `npx`). Lệnh mẫu, tham số chỉnh theo từng file:
```bash
# 1. Đo file gốc
npx @gltf-transform/cli inspect assets-src/product360/built/bag-drawstring.glb > evidence/bag-drawstring.raw.txt
# 2. Giảm lưới (hoặc làm trong Blender: Decimate + giữ UV), hàn đỉnh, bỏ dư
npx @gltf-transform/cli simplify in.glb s.glb --ratio 0.05 --error 0.001
# 3. Resize + WebP + meshopt
npx @gltf-transform/cli optimize s.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048
# 4. Đo lại
npx @gltf-transform/cli inspect out.glb > evidence/bag-drawstring.opt.txt
```
Những việc cần làm trong **Blender 5.2** (có thể chạy bằng script `scripts/product360/*.py`):
- Đặt tỉ lệ và gốc toạ độ theo 3.1.
- Đổi tên material và node theo 3.2.
- Tách `logo_zone` và `trim_rope`/`hardware` ra material riêng (chọn mặt, gán material).
- Tạo các Empty `hotspot_*` và `anchor_logo`.
- Khử màu base color của `fabric_main`: chuyển sang ảnh xám rồi chỉnh levels về trung bình ≈ 0.80. Làm bằng node rồi bake, hoặc bằng `sharp`/ImageMagick trên file texture đã tách.
- Xoá vết chữ đã nướng vào texture (nếu có) bằng clone/inpaint ở vùng đó.

Script kiểm hợp đồng `scripts/product360/check-glb.mjs` (bắt buộc viết). Script đọc từng GLB trong manifest bằng `@gltf-transform/core`, rồi in PASS/FAIL cho từng mục:
- có node `part_<id>`;
- đủ material bắt buộc (`fabric_main`; `logo_zone` với túi và nệm);
- bbox lệch ≤ 3% so với `dimensions_m` trong manifest;
- số tam giác và dung lượng trong ngân sách;
- có `hotspot_*` đúng với danh sách `hotspots` trong manifest;
- texture ≤ kích thước cho phép;
- không có camera, light hay animation.

Exit code 1 nếu có FAIL. Lưu đầu ra vào `evidence/check-glb.txt`.

---

## 4. Chụp mẫu vải thật (chủ dự án, D7)

> **Đã nhận 22 ảnh ngày 2026-09-26.** Phân loại và câu hỏi còn mở nằm ở `05_FABRIC-PHOTOS.md` và `fabric-photos.json`. Hướng dẫn chụp dưới đây chỉ dùng khi cần chụp bổ sung (Q3, Q6).

Texture chụp thật là yếu tố lớn nhất làm nệm trông thật.
- Mỗi loại vải cắt hoặc trải phẳng 30×30 cm: Satin HQ, Cotton Cara, vải viền, đáy chống trượt.
- Chụp ban ngày gần cửa sổ, không có nắng gắt chiếu thẳng, **không bật flash**. Máy ảnh đặt song song với mặt vải, thẳng góc 90°. Mỗi mẫu chụp thêm 1 ảnh xiên 45° để thấy độ bóng satin.
- Đặt một tờ giấy A4 trắng ở góc khung để cân trắng.
- Gửi file gốc chất lượng cao nhất (không gửi qua Zalo vì Zalo nén ảnh). Để vào `assets-src/product360/fabric/`.

Antigravity biến ảnh thành texture lặp (seamless) 2048². Có thể dùng Blender hoặc công cụ tạo normal/roughness từ ảnh, **không bắt buộc công cụ trả phí**. Ghi rõ công cụ đã dùng trong REPORT.

---

## 5. Manifest

File `hula-web/website/public/models/product360/manifest.json`, theo mẫu `product360-models.example.json`. Mỗi asset ghi: `id`, `file`, `dimensions_m`, `hotspots`, `recolor` (material nào nhuộm), `material_preset` (`satin` | `cara` | `foam` | `bag`), `modelingAssumptions`, `source` (`blender` | `import`), `fallback_file` (khi là import), `texture` (`real` | `placeholder`), và `license_note` (D2).

Mỗi dòng sản phẩm trong CMS map tới asset bằng `lines[].match`. P1 so theo `subcategory.id`. Không so theo tên (tránh lỗi B7).
