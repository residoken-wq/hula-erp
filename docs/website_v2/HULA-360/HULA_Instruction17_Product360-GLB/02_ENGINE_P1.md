# 02 — P1: Studio nạp GLB thật

**Điều kiện bắt đầu:** P0 audit PASS (có manifest và GLB đạt `check-glb`). D4 và D6 đã chốt.
**Nhánh:** `product360/p1` từ `main`.
**Phạm vi file:** `hula-web/website/src/app/dat-hang-si/` (`Product360Studio.tsx`, `B2B360ExperienceModal.tsx`, `page.tsx`, `ProductVisualizer.tsx`, `LogoMockupTool.tsx`, `types.ts`) và thư mục mới `dat-hang-si/studio3d/`. Không sửa backend, CMS hay `tour360/`.

---

## P1.1 Tách module

`Product360Studio.tsx` hiện dài 1121 dòng, vừa dựng mesh vừa lo UI. Tách phần 3D ra `dat-hang-si/studio3d/`:

| File | Trách nhiệm |
|---|---|
| `manifest.ts` | Tải `/models/product360/manifest.json`, kiểu dữ liệu, tìm asset cho `subcategory.id` |
| `loader.ts` | `GLTFLoader` + `MeshoptDecoder`. Cache theo URL (Promise), báo tiến trình, huỷ khi unmount |
| `materials.ts` | Nâng `fabric_main` thành `MeshPhysicalMaterial` theo `material_preset`, và hàm `setFabricColor(hex)` |
| `logo.ts` | Đặt texture logo lên `logo_zone` |
| `environment.ts` | Environment map và 3 preset ánh sáng |
| `hotspots.ts` | Đọc `hotspot_*` từ GLB, chiếu ra toạ độ màn hình |
| `procedural.ts` | **Chuyển nguyên** code hình khối hiện tại vào đây để làm fallback. Không sửa hình dáng |
| `dispose.ts` | Giải phóng geometry, material và texture của một cây Object3D |

Phần UI giữ nguyên trong `Product360Studio.tsx`: thanh trên, nút, popover hotspot, chế độ ảnh 360.

Chỉ tải `three` khi mở modal (dùng `dynamic(() => import(...), { ssr:false })` hoặc `import()` trong effect). Mục tiêu là trang `/dat-hang-si` lúc chưa mở modal không nặng thêm.

## P1.2 Nạp model và fallback

Luồng khi mở tab Studio:
1. Đọc manifest, lấy danh sách asset của `subcategory.id`, gồm nệm, gối, chăn và túi của kiểu đang chọn.
2. Hiện ngay bản **hình khối** (procedural) kèm thanh tiến trình "Đang tải mô hình thật… xx%".
3. Tải xong từng asset thì **thay đúng phần đó**, không đợi tải hết cả bộ. Chỉnh vị trí theo `layout` trong manifest.
4. Asset lỗi (404, parse lỗi, quá 15 giây) thì giữ bản hình khối của phần đó và ghi `console.warn('[product360] fallback', id, err)`. Không hiện lỗi đỏ cho khách.
5. Không có asset nào cho dòng này thì chạy như hiện nay.

Đổi kiểu túi: tải GLB túi mới ngay khi bấm (lần sau lấy từ cache). Trong lúc tải, giữ túi cũ.

Thứ tự hiển thị theo D6. Mặc định: có GLB thì mở 3D, đồng thời hiện nút "📷 Ảnh thật" nếu có `frames_360`.

## P1.3 Vật liệu và đổi màu

- Khi nạp, thay material `fabric_main` bằng `MeshPhysicalMaterial`. Giữ lại `map`, `normalMap`, `roughnessMap`, `aoMap` từ GLB và đặt các tham số theo preset:

  | preset | roughness | sheen | sheenRoughness | sheenColor | clearcoat |
  |---|---|---|---|---|---|
  | `satin` | 0.35 | 0.8 | 0.35 | trắng | 0.05 |
  | `cara` | 0.85 | 0.35 | 0.7 | trắng | 0 |
  | `foam` | 0.75 | 0.2 | 0.8 | trắng | 0 |
  | `bag` | 0.8 | 0.3 | 0.7 | trắng | 0 |

  Các con số này là điểm xuất phát. Antigravity được chỉnh, nhưng phải ghi giá trị cuối vào manifest (`material_overrides`), **không hard-code theo tên sản phẩm**.
- Đổi màu chỉ gán `material.color.set(hex)` và `sheenColor` (pha nhẹ về màu vải). **Không dựng lại mesh.** Thời gian từ lúc bấm tới khi thấy màu mới dưới 100 ms.
- Màu vào hàm đổi màu phải chuyển về không gian linear đúng cách (`color.setStyle(hex)` với `ColorManagement` bật mặc định của r163). Renderer giữ `outputColorSpace = SRGBColorSpace` và ACES.
- Material ngoài `fabric_main` giữ nguyên màu. Nếu manifest có `recolor_secondary`, `fabric_accent` nhận màu thứ 2.

## P1.4 Ánh sáng và môi trường (sửa B5)

- Dùng `RoomEnvironment` + `PMREMGenerator` làm `scene.environment`. Có sẵn trong three, không phải tải HDR. Đây là thay đổi làm vải trông thật nhiều nhất sau texture.
- Mỗi preset đổi **cả** background, `environmentIntensity` (hoặc `envMapIntensity` trên material), cường độ và màu đèn chính, và exposure:

  | Preset | Nền | Env | Đèn chính | Exposure |
  |---|---|---|---|---|
  | Studio | `#f5f7f7` | 1.0 | trắng 1.0, từ trên chếch trước | 1.0 |
  | Ban Ngày | trắng ấm nhạt | 1.2 | `#fff4e0` 1.3, chếch cửa sổ | 1.1 |
  | Giờ Ngủ | xanh đêm đậm | 0.35 | `#ffd9a8` 0.5, thấp, như đèn ngủ | 0.8 |

- Bóng: giữ bóng tiếp xúc giả hiện có, hoặc bóng đổ thật với `shadow.radius` mềm. Nếu dùng shadow map, giới hạn 1024 trên mobile.

## P1.5 Logo khách (sửa B1)

- `LogoMockupTool` thêm prop `onLogoChange?(url: string | null)`, gọi với `processedLogoUrl || logoUrl`. `ProductVisualizer` truyền callback đó lên `page.tsx`. `page.tsx` giữ state `customLogoUrl` và truyền vào `B2B360ExperienceModal` → `Product360Studio` (`logoUrl`), và cả `CampusSchoolPOV` (prop này đã có sẵn).
- Trên model: tạo texture từ ảnh logo (vẽ lên canvas vuông, giữ tỉ lệ, nền trong suốt) và gán vào `map` của material `logo_zone`, dùng `transparent: true`, `polygonOffset` để không nháy chồng lên mặt vải. Không có logo thì `logo_zone.visible = false`.
- Bỏ khung viền nét đứt vàng hiện tại. Logo phải trông như **in lên vải**: `roughness` bằng của vải và dùng chung normal map của vải để thấy sợi vải xuyên qua logo.
- Chế độ ảnh 360 giữ cách chồng logo bằng HTML như cũ.

## P1.6 Hotspot, bung linh kiện, camera

- Toạ độ hotspot lấy từ node `hotspot_n` (world position, tính mỗi frame). Asset nào đang dùng fallback thì lấy toạ độ cũ trong `HULA_HOTSPOTS`. Nội dung chữ vẫn lấy từ `HULA_HOTSPOTS`.
- **B2:** `viewMode` đọc qua `useRef`, không đọc từ closure. Vị trí bung đi theo node thật, nên hotspot tự đi theo.
- **B4:** không `setState` mỗi frame. Cập nhật `style.transform` của từng nút hotspot qua ref. Chỉ `setState` khi hotspot đổi trạng thái ẩn/hiện (bị che, ra sau vật thể).
- Khoảng bung (offset) của từng phần lấy từ `layout.exploded` trong manifest.
- **B6:** bỏ `'folded'` khỏi kiểu `viewMode`.
- Camera preset chuyển mượt 500-700 ms (lerp vị trí và target, ease-out). Góc "Cận cảnh vải" dùng `cam_closeup` nếu GLB có.

## P1.7 Bộ nhớ và hiệu năng (sửa B3)

- Đổi màu hay logo không dựng lại mesh. Đổi túi thì `dispose` túi cũ, trừ phần geometry/texture đang nằm trong cache dùng chung. Chỉ dispose bản clone, không dispose tài nguyên trong cache.
- Unmount modal: dispose toàn bộ, `renderer.dispose()`, `pmrem.dispose()`, huỷ `requestAnimationFrame`, gỡ listener.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))`.
- Chỉ render khi có thay đổi (controls, hoạt ảnh, đổi màu) hoặc khi đang auto-rotate. Không cần render liên tục khi đứng yên.
- Đo bằng DevTools: mở/đóng modal 10 lần, đổi màu 30 lần. `renderer.info.memory.geometries` và `.textures` không được tăng dần. Lưu số liệu vào evidence.

## P1.8 Không làm ở P1

- Không sửa backend hay upload. Không sửa CMS.
- Không sửa cảnh Lớp Học (`tour360/`), trừ việc truyền `logoUrl` đã có prop sẵn.
- Không đổi nội dung chữ hotspot, giá hay luồng lead.

## Nộp

`REPORT_P1.md` gồm: danh sách file đổi, bảng ACCEPTANCE đã chạy kèm evidence, ảnh chụp **cùng góc** trước/sau cho 3 preset × 2 dòng × 3 túi, số đo fps (desktop và mobile thật hoặc giả lập 4× CPU throttle), số đo bộ nhớ ở P1.7, và danh sách chỗ lệch so với instruction kèm lý do.
