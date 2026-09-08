# Báo Cáo Hiện Trạng Kiến Trúc & Asset HULA 360 (Prompt 01 Audit)

*Thời điểm lập: 08/09/2026 · Căn cứ theo Instruction 04 (`02_AI-IDE_Prompts.md`)*

---

## 1. Luồng dữ liệu và Điều khiển: CMS → API → Viewer

### A. Cấu hình tại CMS (Quản trị)
- **Tệp nguồn**: [`hula-web/cms/src/app/appearance/page.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/cms/src/app/appearance/page.tsx#L254-L302)
- **Các tham số cấu hình**:
  - `widget_360_enabled` (boolean): Bật/tắt nút kích hoạt trải nghiệm 360 trên toàn website.
  - `widget_360_tooltip` (string): Nội dung tooltip khi rê chuột vào nút nổi (mặc định: `'Khám phá Lớp học 360°'`).
  - `widget_360_badge` (string): Nhãn dán trên nút (mặc định: `'360°'`).
  - `widget_360_panorama_url` (string): URL ảnh panorama tùy biến từ CMS (nếu để trống sẽ dùng ảnh mặc định trong seed data).
  - `widget_360_renderer_mode` (string): Chế độ renderer (`'guided2d'` hoặc `'panorama360'`).
  - `hidden_pages` (string[]): Danh sách route bị ẩn widget (chính sách loại trừ theo route).
- **Lưu trữ backend**: Được ghi vào bảng `SystemConfig` trong cơ sở dữ liệu qua `systemApi.setConfig(...)` ([page.tsx#L394-L432](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/cms/src/app/appearance/page.tsx#L394-L432)).

### B. Public API Endpoint (Backend NestJS)
- **Tệp nguồn**: [`src/public/public.controller.ts`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/src/public/public.controller.ts#L91-L189)
- **Endpoint**: `GET /public/settings`
- **Xử lý**: Đọc danh sách khóa cấu hình từ `configRepo.find({ where: { key: In(cmsKeys) } })` và trả về JSON chuẩn hóa chứa các trường `widget_360_*` cho website tiêu thụ.

### C. Website Consumer (Client Next.js)
- **Context**: [`hula-web/website/src/contexts/SettingsContext.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/contexts/SettingsContext.tsx) nạp cài đặt từ API và cung cấp qua hook `useSettings()`.
- **Nút bấm kích hoạt (Entry Point)**: [`hula-web/website/src/components/FloatingActionWidgets.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/FloatingActionWidgets.tsx#L29-L59).
  - Điều kiện hiển thị: Được kiểm tra qua hàm `computeTourEligibility(settings)` trong [`tourConfig.ts`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourConfig.ts#L22-L42).
  - Khi người dùng nhấn nút: Kích hoạt state `isOpen360 = true`, thực hiện lazy-load component `Tour360Shell` (hoặc wrapper kế thừa [`Classroom360Modal.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/Classroom360Modal.tsx)).

### D. Hệ thống State Điều khiển trong Viewer
- **Provider Quản lý**: [`hula-web/website/src/components/tour360/Tour360Provider.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/Tour360Provider.tsx)
  - Quản lý `state.activeRole` (`'CHAR-AN'` | `'CHAR-LINH'` | `'CHAR-MAY'`).
  - Quản lý `state.currentStepIndex` (vị trí bước trong lộ trình 6 bước của vai).
  - Quản lý `state.camera` (`yaw`, `pitch`, `zoom`, `isDragging`, `isAutoPanning`).
  - Quản lý `state.productState` (vật thể đơn lẻ: `{ holder, status, location }`).
  - Quản lý `state.isChildMode` (chuyển đổi UI người lớn vs UI trẻ em).
  - Quản lý `state.isInspectorOpen` và nội dung panel chi tiết.
- **Renderer thực tế**: [`hula-web/website/src/components/tour360/TourViewport.tsx`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/TourViewport.tsx)
  - Hiện tại sử dụng cơ chế **Guided 2D Pan**: Một ảnh phẳng tỉ lệ siêu rộng được đặt làm `background-image`, tính toán tọa độ dịch chuyển theo góc quay camera:
    ```typescript
    const panPercent = 50 + (state.camera.yaw * 0.4);
    const pitchOffsetPx = state.camera.pitch * 3;
    ```
  - Hoàn toàn **chưa có renderer 3D WebGL** (chưa nạp file `.glb`, chưa dựng equirectangular sphere).

---

## 2. Kiểm kê Asset Thực tế Đang Tải (Asset Inventory)

Dưới đây là toàn bộ asset đang được nạp tại runtime từ thư mục [`hula-web/website/public/images/tour360/`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/public/images/tour360/):

| Asset ID trong code | Đường dẫn tệp | Loại asset | Độ phân giải / Dung lượng | Nội dung thực tế quan sát được | Đánh giá so với yêu cầu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `scene_classroom` | `/images/tour360/classroom_wide.jpg` | Ảnh tĩnh JPEG 2D phẳng | 881.6 KB | Phòng học có kệ đồ chơi, **dưới sàn trải nhiều nệm xanh và có nhiều trẻ em đang nằm ngủ say** | ⚠️ **Mâu thuẫn**: Dùng chung cho cả mốc EV-01, EV-02 và EV-06 (giờ đón). Khi đón trẻ mà phòng vẫn đầy trẻ ngủ là sai logic. |
| `scene_cubby` | `/images/tour360/cubby_nap.jpg` | Ảnh tĩnh JPEG 2D phẳng | 799.5 KB | Góc kệ tủ cá nhân dán ký hiệu chiếc lá; tiền cảnh có 1 nệm và gối | Dùng cho bước EV-03 (cất tủ cá nhân). |
| `scene_macro` | `/images/tour360/mattress_macro.jpg` | Ảnh tĩnh JPEG 2D phẳng | 715.7 KB | Cận cảnh chất liệu vải cotton chần bông, viền chỉ may | Dùng cho bước EV-02 (xem chất liệu vải tại bàn demo). |

> [!CRITICAL]
> **Hiện trạng 3D Model & Animation**:
> - **File GLB / GLTF**: Hoàn toàn **KHÔNG TỒN TẠI** (0 file) trong toàn bộ repository.
> - **Skeleton Rig**: Không có.
> - **Animation Clip (Handover / Reach / Hold)**: Không có.
> - Các nhân vật trong cảnh hiện chỉ là:
>   1. **NPC**: Khối tròn chứa emoji đại diện (`👩‍🏫`, `👧`, `👩`) đặt ở tọa độ giả lập `absolute top-1/3 left-1/2` ([TourViewport.tsx#L202-L227](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/TourViewport.tsx#L202-L227)).
>   2. **Góc nhìn thứ nhất (POV Hands)**: Hai khối thẻ HTML/CSS div bo tròn màu vàng/cam được xoay góc `-12deg` và `+12deg` để tượng trưng cho cánh tay ([TourViewport.tsx#L257-L302](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/TourViewport.tsx#L257-L302)).

---

## 3. Đối chiếu 4 Vấn đề Quan sát được trên Screenshot (`Current-UI.png`)

| # | Hiện tượng trên Screenshot | Kết quả Audit Code thực tế | Phân loại |
|---|---|---|---|
| **1** | **NPC hiển thị bằng Emoji** (vòng tròn có emoji Cô An `👩‍🏫` và nhãn `Cô An (1.55m)` bay lơ lửng) | Tại [TourViewport.tsx#L215-L223](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/TourViewport.tsx#L215-L223), NPC được render bằng: `<div>{npc.avatar}</div>` với avatar là ký tự emoji từ [tourSeed.ts#L14](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L14) (`CHARACTERS['CHAR-AN'].avatar = '👩‍🏫'`). Nhãn `(1.55m)` được render cứng từ `npc.cameraHeight`. | **Xác nhận 100% là code hiện tại**, là giải pháp placeholder tạm thời khi chưa có asset 3D. |
| **2** | **Hình tay màu vàng/cam đơn sơ** ở hai góc dưới màn hình | Tại [TourViewport.tsx#L265-L300](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/TourViewport.tsx#L265-L300), bàn tay được dựng bằng 2 thẻ `div` bo tròn (`rounded-t-full`), màu nền `activeCharacterInfo.armStyle.sleeveColor`, đầu ngón tay là `div` màu da `#fed7aa`. Hoàn toàn không có ngón tay, khớp bàn tay hay hoạt ảnh đón nhận vật thể. | **Xác nhận 100% là code hiện tại**, thiếu cấu trúc giải phẫu bàn tay. |
| **3** | **Cảnh đón trẻ vẫn chứa hình trẻ ngủ** (Nhãn "Sau giờ nghỉ" hoặc "Giờ đón", nhưng ảnh nền bên dưới có nhiều bé đang ngủ) | [tourSeed.ts#L147](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L147), [L244](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L244), [L270](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L270) đều trỏ chung về `scene_classroom` (`classroom_wide.jpg`). Trong ảnh `classroom_wide.jpg`, trẻ em đang ngủ trưa đã bị **bake cứng vào pixel ảnh**. | **Xác nhận 100% là hạn chế của asset ảnh**, thiếu ảnh bối cảnh lớp học khi đã dọn nệm. |
| **4** | **Thẻ kịch bản che khuất hành động chính** | Thẻ [JourneyCard.tsx](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/JourneyCard.tsx) mặc định hiển thị cả tiêu đề, đoạn độc thoại dài, lời thoại, timeline và nút CTA (chiều cao ~220px-260px). Ở lượt vừa qua, đã bổ sung nút "Thu gọn ▾" và sửa lỗi căn giữa, nhưng theo Prompt 04 của Instruction 04, thẻ kịch bản cần được tối ưu: **mặc định tinh gọn cao <= 112px** trên desktop (hoặc chuyển thành Side Panel bên phải 320-360px), dành toàn bộ vùng nhìn trung tâm cho thao tác bàn giao túi. | **Đã cải thiện 1 phần (căn giữa + toggle), cần tiếp tục tinh gọn theo chuẩn Instruction 04**. |

---

## 4. Bản đồ Định Danh (ID Mapping) Hiện Tại Trong Repo

Codebase hiện tại đã được cấu trúc bài bản theo chuẩn mã nhận diện, hoàn toàn tương thích và không bị trùng lặp với bộ Instruction 04:

### A. Vai Nhân Vật (Role IDs)
- `CHAR-AN`: Cô An — Giáo viên mầm non (Tầm mắt: 1.55m, áo polo xanh ngọc).
- `CHAR-LINH`: Mẹ Linh — Phụ huynh học sinh (Tầm mắt: 1.60m, áo kem cổ bẻ, quần xanh).
- `CHAR-MAY`: Bé Mây — Trẻ 5 tuổi (Tầm mắt: 0.95m, áo thun vàng nhạt, kẹp lá xanh bên phải).

### B. Dòng Thời Gian & Sự Kiện (Timeline Events)
- `EV-01`: Đón trẻ & Bàn giao buổi sáng (Cửa lớp).
- `EV-02`: Bàn demo giới thiệu cấu tạo nệm (Bàn trưng bày).
- `EV-03`: Cất vào ngăn tủ cá nhân chiếc lá (Góc tủ cá nhân).
- `EV-04`: Chuẩn bị giờ nghỉ trưa — Trải nệm (Sàn gỗ).
- `EV-05`: Sau giờ nghỉ — Thu dọn, gấp nệm vào túi (Góc lớp).
- `EV-06`: **Giờ đón cuối tuần — Bàn giao lại túi nệm cho phụ huynh** (Tương đương chính xác với mã `EV06_PICKUP` trong tài liệu Instruction 04).

### C. Các Bước Của Cảnh Mẫu Giờ Đón Cuối Tuần (`EV-06`)
- **Vai Mẹ Linh (`CHAR-LINH`)**:
  - `PH-05` ([tourSeed.ts#L335-L353](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L335-L353)): "Đón Mây & Nhận lại túi nệm cuối tuần" — CTA: *"Nhận túi mang về"* (Đang giữ trạng thái handover với Cô An).
  - `PH-06` ([tourSeed.ts#L355-L368](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L355-L368)): "An tâm cuối tuần" — CTA: *"Hoàn thành hành trình"*.
- **Vai Cô An (`CHAR-AN`)**:
  - `CA-06` ([tourSeed.ts#L235-L253](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/hula-web/website/src/components/tour360/data/tourSeed.ts#L235-L253)): "Bàn giao lại cho mẹ cuối tuần" — CTA: *"Trao túi cho Mẹ"*.
- **Vai Bé Mây (`CHAR-MAY`)**:
  - `BE-06`: Chào cô An để ra về cùng mẹ.

---

## 5. Danh Sách Asset Còn Thiếu Để Hoàn Thiện Cảnh Mẫu Mẹ Linh Nhận Túi

Căn cứ theo mục 3 của [`01_Character-Spec.md`](file:///home/nt.nhan@pace.edu.vn/Documents/Github/hula-erp/docs/website_v2/HULA-360/HULA-360_Character-Angles_Instruction04/01_Character-Spec.md#L27-L44):

| Asset Cần Có | Trạng thái kỹ thuật | Mô tả chi tiết yêu cầu | Tác động nếu thiếu |
| :--- | :--- | :--- | :--- |
| `co-an.glb` | ❌ **BLOCKED_ASSET** | Mesh 3D kín, tỉ lệ chuẩn, trang phục polo xanh ngọc, tóc buộc thấp, rig humanoid có xương ngón tay để cầm túi. | Không thể hiện được NPC Cô An thật đang đứng đối diện trao túi; buộc phải dùng avatar/sprite phẳng tạm thời. |
| `me-linh.glb` / Rig tay Mẹ Linh | ❌ **BLOCKED_ASSET** | Model hoặc rig 2 cánh tay POV của Mẹ Linh: áo kem ngắn tay, màu da tự nhiên, có ngón tay cử động để đón túi. | Vẫn phải dùng 2 khối chữ nhật bo tròn màu vàng/cam giả lập bàn tay. |
| `be-may.glb` | ❌ **BLOCKED_ASSET** | Model bé 5 tuổi đứng cạnh cô An, kẹp lá xanh bên phải, trang phục áo vàng quần xanh, tư thế đã thức sẵn sàng về. | Không thể hiện được bé Mây đang đứng cùng cô trong cảnh đón. |
| Handover Animation Clips | ❌ **BLOCKED_ANIMATION** | Bộ clip: `idle`, `reach_handover` (Cô An đưa túi), `receive_handover` (Mẹ Linh đón túi), `hold_bag` (Mẹ Linh giữ túi). | Không thể diễn hoạt chuyển động đưa/nhận mượt mà; chỉ có thể chuyển đổi state vật thể theo trigger sự kiện. |
| Background cảnh đón trẻ | ⚠️ **THIẾU ẢNH CHUẨN** | Ảnh panorama phòng học vào giờ tan trường: sàn gỗ trống, nệm đã cất gọn gàng vào ngăn tủ, không còn trẻ ngủ bake trong ảnh. | Hiện tại đang phải dùng tạm `classroom_wide.jpg` (bị dính trẻ đang ngủ). |
| Vật thể túi HULA 3D (`hula_bag.glb`) | ⚠️ **Chưa có 3D** | Object 3D túi vải kem hình chiếc lá có quai xách và điểm gắn (socket anchor) để snap vào tay Cô An rồi chuyển sang tay Mẹ Linh. | Hiện tại đang mô phỏng bằng huy hiệu `state.productState` trên thanh điều hướng. |

---

## 6. Kết luận Đợt Audit (Prompt 01 Acceptance)

- **Kiến trúc dữ liệu & State**: Đạt yêu cầu sẵn sàng. Các model state trong `Tour360Provider` đã hỗ trợ đầy đủ `productState` độc lập, hỗ trợ 3 vai và 6 sự kiện nhất quán.
- **Renderer & 3D Assets**: Bị chặn (`BLOCKED_ASSET`) do dự án chưa được cấp các tệp GLB và rig animation thật. Tuy nhiên, 12 ảnh PNG tham chiếu trong `references/` đã sẵn sàng để trích xuất chân dung Avatar thật thay cho Emoji.
- **Giao diện (UI Shell)**: Có thể tiến hành tối ưu hóa độc lập ngay lập tức theo Prompt 04 để giải quyết triệt để vấn đề che khuất hành động và tinh gọn thẻ kịch bản.
