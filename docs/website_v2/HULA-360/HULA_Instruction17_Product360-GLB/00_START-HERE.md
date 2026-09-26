# HULA Instruction17 — Nâng cấp Studio Sản Phẩm 360° sang model GLB thật

Ngày: 2026-09-26. Người viết: Claude (BA/Planning/Audit). Người code: Antigravity.
Phạm vi: `hula-web/website` trang `/dat-hang-si` (Studio Sản Phẩm 360°), CMS `wizard-config`, và backend upload (chỉ ở P2).
Gói này là instruction và hợp đồng asset. Chưa có code sản phẩm.

Đọc theo thứ tự:
1. File này: vì sao hình hiện tại không thật, mục tiêu, quyết định, các phase.
2. `01_ASSET-PIPELINE.md`: script Blender tự sinh GLB, import GLB ngoài, hậu xử lý, **hợp đồng GLB** (tên node, material, anchor, dung lượng).
3. `02_ENGINE_P1.md`: viết lại phần 3D của `Product360Studio.tsx` để nạp GLB.
4. `03_CMS-BACKEND_P2.md`: quản lý model trong CMS, backend nhận file `.glb`.
5. `04_ACCEPTANCE.csv`: nghiệm thu. Mọi dòng bắt đầu `NOT_RUN`.
6. `product360-models.example.json`: mẫu manifest.
7. `05_FABRIC-PHOTOS.md` + `fabric-photos.json`: phân loại 22 ảnh vải thật, những chi tiết hàng thật mà bản cũ thiếu, câu hỏi Q1-Q6.

---

## 1. Review bản hiện tại (Claude đã đọc code, 2026-09-26)

### 1.1 Vì sao hình không thật

Trong `Product360Studio.tsx` (1121 dòng), mọi vật thể đều dựng bằng hình khối three.js. Code không nạp file 3D nào.

| Vật thể | Cách dựng hiện tại | Hậu quả nhìn thấy |
|---|---|---|
| Nệm | `BoxGeometry` + ống viền `TubeGeometry` (L422-452) | Tấm hộp phẳng, cạnh sắc, không có độ phồng, đường may hay nếp vải |
| Gối | Hộp, đỉnh đẩy phồng lên giữa (L462-497) | Trông như cục xà phòng |
| Chăn | Hộp, bẻ mép xuống, gợn sóng `sin` (L504-539) | Nếp gấp lặp đều, nhìn ra ngay là toán học |
| Túi Hộp / Quai Xách / Balo Rút | Box, nửa torus, `CylinderGeometry` (L547-597) | Hộp xanh có 2 vạch đen (ảnh chủ dự án gửi). Balo rút là hình trụ |
| Vải | Normal map vẽ bằng canvas (ô waffle + chấm, L166-209). Không có ảnh vải thật | Bề mặt nhựa trơn |
| Ánh sáng | 4 đèn cố định. Không có environment map. Preset "Studio / Ban Ngày / Giờ Ngủ" chỉ đổi màu nền (L686-697) | Không có phản xạ mềm, vải thiếu độ sheen |

So với model Meshy chủ dự án gửi (balo rút xanh): Meshy có hình dáng mềm, nếp nhăn thật, dây rút, khoá dây, texture PBR. Khác biệt nằm ở **hình học và texture**. Chỉnh thông số vật liệu trên hình khối hiện có không bù được.

### 1.2 Lỗi phát hiện thêm (sửa luôn trong P1)

| ID | Lỗi | Vị trí |
|---|---|---|
| B1 | Logo khách tải lên **không bao giờ lên model**. `page.tsx` không truyền `logoUrl` vào `B2B360ExperienceModal` (L378-390). Logo bị giữ trong state riêng của `LogoMockupTool.tsx` | `dat-hang-si/page.tsx` |
| B2 | Hotspot không chạy theo linh kiện khi bung (exploded). Vòng `animate` đọc `viewMode` từ closure tạo lúc mount (effect deps `[]`, L336 và L372), nên luôn là `'assembled'` | `Product360Studio.tsx` |
| B3 | Rò bộ nhớ. Mỗi lần đổi màu, logo hay kiểu túi, code dựng lại toàn bộ mesh, nhưng không `dispose()` geometry, material hay texture cũ | L377-646 |
| B4 | `setHotspotScreenCoords` được gọi mỗi frame, nên React render lại 60 lần/giây. Máy yếu sẽ giật | L331-347 |
| B5 | Preset ánh sáng chỉ đổi màu nền | L686-697 |
| B6 | Kiểu `viewMode` có `'folded'` nhưng không có code xử lý | L104 |
| B7 | Satin hay Cara chỉ đoán theo tên sản phẩm (`name.includes('satin')`, L114-115). Đổi tên trong CMS là mất vật liệu đúng | L114 |

### 1.3 Những gì đã có và dùng lại được

- `three` 0.163.0 đã cài. `GLTFLoader` đã được dùng ở `tour360/engine/procedural/StorageBagMesh.ts:36-65`, có cache và fallback.
- `@google/model-viewer` 3.5.0 đã có, đang dùng cho trang chi tiết sản phẩm. P2 dùng nó để xem trước GLB trong CMS.
- Chế độ **ảnh chụp 360** (`frames_360`, cấu hình trong CMS bằng `Frames360Editor`) vẫn giữ, không đụng.
- `public/models/hula_bag.glb` (740 KB) là túi quai xách dựng bằng script ở Instruction05. Nó chưa được Studio dùng. Có thể coi là bản nháp cho `bag-handle`.

### 1.4 Ngoài phạm vi (ghi backlog)

- Cảnh 2 "Lớp Học Mầm Non 360°": `applyB2BCustomization` ghi `customColorHex`, nhưng không code nào đọc giá trị này. Vì vậy màu và logo khách chọn không hiện trong lớp học. Cảnh này cũng có bộ mesh thủ tục riêng (`engine/procedural/*`). **Sau P1** mới cho dùng chung GLB. Gói này không làm.
- `widget_360_renderer_mode` trong CMS (Appearance) lệch kiểu với website (`studio` so với `scene3d`). Trang `/dat-hang-si` không đọc giá trị này.

---

## 2. Mục tiêu

1. Studio hiển thị **model GLB thật** cho nệm, gối, chăn và 3 kiểu túi. Nhìn gần phải thấy nếp vải, đường may và viền.
2. Đổi màu vẫn tức thì (dưới 100 ms, không tải lại model), và màu hiển thị gần với swatch.
3. Logo khách tải lên nằm đúng vùng in trên túi và nệm.
4. Giữ nguyên UI: nút bung linh kiện, 4 góc camera, 3 preset ánh sáng, 5 hotspot, 3 kiểu túi.
5. Tải model lỗi thì tự quay về bản hình khối hiện tại. **Trang không bao giờ trắng.**
6. Mobile tầm trung (ví dụ Android 4 GB RAM) xoay mượt, trên 30 fps.

---

## 3. Quyết định đã chốt

| ID | Câu hỏi | Kết quả |
|---|---|---|
| D1 | Ai làm model? | ✅ **Không dùng Meshy hay dịch vụ trả phí** (2026-09-26). **Hệ thống tự làm:** Antigravity viết script Python chạy Blender ở chế độ headless (Blender miễn phí), sinh GLB từ tham số. Chủ dự án có file GLB (từ bất kỳ nguồn nào) thì **import** qua `scripts/product360/import-glb.mjs` (P0) hoặc qua CMS (P2). Model import được ưu tiên hơn model script sinh ra |
| D2 | Bản quyền model | ✅ Model do script sinh ra thuộc HULA, không vướng bản quyền. Với GLB chủ dự án import, chủ dự án tự chịu trách nhiệm bản quyền. Script import bắt buộc điền `source` và `license_note` |
| D3 | Làm vật thể nào bằng gì? | ✅ **Mọi vật thể** (nệm, gối, chăn, 3 túi) đều do script Blender dựng: mesh tham số, cộng mô phỏng vải (cloth sim) để tạo độ phồng và nếp tự nhiên, rồi bake. Texture lấy từ ảnh vải thật (D7) |
| D4 | Lưu model ở đâu (P1)? | ✅ **File tĩnh** trong `hula-web/website/public/models/product360/` kèm manifest JSON trong repo. Quản lý qua CMS ở P2 (2026-09-26) |
| D5 | Dòng sản phẩm làm trước | ✅ **Pilot:** 1 dòng Satin HQ, 1 dòng Cara, và 3 túi (2026-09-26) |
| D6 | Có cả ảnh 360 lẫn GLB thì hiện gì? | ✅ **GLB trước**, có nút "Ảnh thật". Không có GLB thì dùng ảnh 360. Không có cả hai thì dùng hình khối (2026-09-26) |
| D7 | Mẫu vải | ✅ **Đã nhận 22 ảnh + sales kit PDF** (2026-09-26). Q1-Q6 đã chốt, xem `05_FABRIC-PHOTOS.md` mục 4-5. **P0 đủ điều kiện bắt đầu** |

---

## 4. Các phase

| Phase | Nội dung | Người làm | Điều kiện bắt đầu |
|---|---|---|---|
| **P0 Asset** | Script Blender sinh GLB, script import GLB ngoài, hậu xử lý, kiểm theo hợp đồng GLB, viết manifest | Antigravity (script). Chủ dự án chụp vải | D1-D7 đã chốt. **Có ảnh vải (D7)** mới làm được bước texture. Trong lúc chờ ảnh, dựng mesh trước với texture tạm |
| **P1 Engine** | Nạp GLB trong Studio, đổi màu, logo, môi trường ánh sáng, hotspot từ anchor, fallback, sửa B1-B7 | Antigravity | P0 audit PASS, D4, D6 đã chốt |
| **P2 CMS** | Upload/chọn GLB cho từng dòng sản phẩm trong `wizard-config`, xem trước bằng model-viewer. Backend nhận `.glb` | Antigravity | P1 audit PASS. Chủ dự án duyệt phần sửa upload (mục 5) |
| P3 (backlog) | Dùng chung GLB cho cảnh Lớp Học, sửa màu/logo không áp dụng | chưa giao | |

Nhánh: `product360/p0`, `product360/p1`, `product360/p2`, tạo từ `main`. Mỗi phase nộp `REPORT_Pn.md` trong thư mục này và cập nhật `04_ACCEPTANCE.csv`. Claude audit trong worktree riêng, viết `AUDIT_Pn.md`. Chỉ chủ dự án merge.

Luật chung:
- **Không đổi UI** ngoài những gì gói này ghi. Không đổi luồng báo giá hay lead (`/public/wizard/submit`).
- Chỉ commit vào `public/` **bản GLB đã tối ưu**. File trung gian (`.blend`, bản trước khi tối ưu, ảnh vải gốc) để ở `assets-src/product360/`. File nào lớn hơn 20 MB thì thêm vào `.gitignore`. Script sinh model **phải commit**, để ai cũng chạy lại ra cùng kết quả.
- Mọi con số về kích thước, dung lượng, fps ghi trong REPORT phải có evidence: file `.txt` đầu ra lệnh `gltf-transform inspect`, screenshot, hoặc ghi hình DevTools Performance. **Không ghi PASS cho bước chưa chạy.**

---

## 5. Ảnh hưởng vận hành (báo chủ dự án)

| ID | Ảnh hưởng | Mức |
|---|---|---|
| I-01 | `/dat-hang-si` hiện chỉ chạy trên beta, nên P0 và P1 không ảnh hưởng khách thật | Thấp |
| I-02 | Mở modal 360 sẽ tải thêm khoảng 3-8 MB model. Chỉ tải khi mở modal (lazy), nên không làm chậm trang chính. Người dùng 4G chờ khoảng 2-4 giây, có thanh tiến trình | Trung bình |
| I-03 | P2 sửa `upload.service` để nhận `.glb`. Đây là service mà **ERP và CMS dùng chung**. Code sai là hỏng upload ảnh toàn hệ thống, nên chỉ được thêm nhánh riêng cho `.glb` và không đụng nhánh ảnh. Việc lọc loại file và giới hạn dung lượng là thay đổi gần với bảo mật, cần chủ dự án duyệt | Cao nếu làm sai |
| I-04 | Không tốn tiền dịch vụ. Chủ dự án đã cài **Blender 5.2.2 LTS** (2026-09-26) tại `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`. Claude đã chạy thử headless `-b`: chạy được, có addon `io_scene_gltf2`. Không commit Blender vào repo | Thấp |
| I-06 | Nếp vải do mô phỏng sinh ra nên nhìn thật hơn nhiều so với bản hình khối, nhưng không giống 100% ảnh chụp sản phẩm. Sản phẩm nào cần đúng tuyệt đối thì chủ dự án import GLB riêng | Thấp |
| I-05 | Khi đổi màu, mặt vải dùng texture thật đã khử màu. Màu hiển thị gần swatch hơn bản cũ, nhưng không trùng tuyệt đối vì còn phụ thuộc ánh sáng. Sales cần nói rõ với khách: "hình minh hoạ, màu thật theo mẫu vải" | Thấp |
