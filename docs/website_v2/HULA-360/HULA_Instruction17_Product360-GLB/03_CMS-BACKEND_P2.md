# 03 — P2: Quản lý model 3D trong CMS

**Điều kiện bắt đầu:** P1 audit PASS. Chủ dự án đã duyệt mục P2.1 (đụng `upload.service` dùng chung, xem I-03).
**Nhánh:** `product360/p2` từ `main`.

Mục tiêu: nhân viên CMS tự gắn GLB cho một dòng sản phẩm, không cần commit code. Manifest tĩnh của P1 vẫn giữ làm mặc định.

---

## P2.1 Backend: nhận và phục vụ `.glb`

Hiện trạng (Claude đã kiểm):
- `POST /upload/file` (`@AuthOnly`) không lọc loại file, không giới hạn dung lượng.
- `GET /upload/files/:filename` trả `.glb` với MIME `application/octet-stream` và `Content-Disposition: attachment` (`upload.service.ts` L240-259).
- CORS đã cho phép `beta.`, `www.` và `cms.nemmamnon.com` (`main.ts:43-54`). Website `fetch` GLB qua domain API được, không cần sửa CORS.

Làm (chỉ **thêm**, không sửa nhánh xử lý ảnh):
1. Bảng `mimeTypes` ở hàm serve file: thêm `.glb → model/gltf-binary`. `.glb` được trả `inline`, vì loader chỉ `fetch` nên không cần `attachment`. Không đổi hành vi với loại file khác.
2. Endpoint mới `POST /upload/model3d`, gắn `@Perm('CMS','update')` theo luật RBAC mới. Không dùng `@RequirePermission`.
   - Chỉ nhận đuôi `.glb`, và kiểm **magic bytes** 4 byte đầu = `glTF` (0x46546C67). Sai thì trả 400.
   - Giới hạn 10 MB (`limits.fileSize` của multer, chỉ ở endpoint này).
   - Lưu vào `uploads/models/`. Không qua sharp, không watermark.
   - Trả `{ url, size, sha256 }`.
3. `GET /upload/list` **không** cần hiện `.glb`. CMS lấy danh sách model từ wizard config.
4. Không sửa `POST /upload/image` hay `POST /upload/file`.

Việc lọc loại file và giới hạn dung lượng cho **các endpoint upload cũ** là việc bảo mật riêng. Claude ghi vào backlog, **không làm ở gói này**.

## P2.2 Dữ liệu

Thêm field tuỳ chọn vào `WizardCategoryL2`. Sửa đồng bộ ở `hula-web/website/src/app/dat-hang-si/types.ts`, ở type phía CMS, và ở interface trong `src/public/entities/wizard-config.entity.ts`. Interface đó hiện cũng thiếu `frames_360`, bổ sung luôn cho khớp:
```ts
models_3d?: {
  enabled: boolean;
  material_preset: 'satin' | 'cara' | 'foam';
  parts: { mattress?: string; pillow?: string; blanket?: string };   // URL .glb
  bags?: { box?: string; handle?: string; drawstring?: string };
  material_overrides?: Record<string, number>;                        // roughness, sheen...
};
```
Cột vẫn là `value jsonb`, nên **không đổi schema DB và không cần migration**.

Thứ tự ưu tiên ở website:
1. `models_3d.parts.x` (CMS);
2. manifest tĩnh (P1);
3. hình khối.

`models_3d.enabled = false` thì bỏ qua CMS, dùng manifest.

## P2.3 CMS: tab "Mô hình 3D" trong `SubcategoryConfigModal`

- Thêm tab mới, cạnh tab ảnh 360. Tab `Frames360Editor` giữ nguyên.
- Mỗi phần (nệm, gối, chăn, túi hộp, túi quai xách, balo rút) có ô upload `.glb` gọi `POST /upload/model3d`, và nút "Dùng model mặc định" (xoá URL).
- Xem trước bằng `@google/model-viewer` (thêm vào `hula-web/cms`, cùng version 3.5.0 với website). Có bộ chọn màu thử để kiểm đổi màu, bằng cách dùng API material của model-viewer đổi `baseColorFactor` của `fabric_main`.
- Trước khi gửi lên server, **chuẩn hoá ngay trên trình duyệt** bằng `@gltf-transform/core` + `functions`, dùng chung module với `import-glb.mjs`: chuẩn tỉ lệ và gốc, khử màu `fabric_main`, nén meshopt/WebP. Chủ dự án chỉ cần kéo file GLB vào, không phải chạy lệnh.
- Khi upload, **kiểm hợp đồng ngay trên trình duyệt**. Dùng lại logic của `check-glb.mjs` bản rút gọn: đủ material `fabric_main`, có node `part_*`, dung lượng dưới 10 MB. Trả cảnh báo vàng nếu thiếu `hotspot_*` hay `logo_zone`, và báo lỗi đỏ (không cho lưu) nếu thiếu `fabric_main`.
- Chọn `material_preset` bằng dropdown, **không suy từ tên** (B7).

## P2.4 Không làm ở P2

- Không làm công cụ đặt hotspot bằng click trên model. Ghi backlog P3.
- Không gọi dịch vụ tạo 3D bên ngoài từ CMS.
- Không đổi quyền của các endpoint upload cũ.

## Ảnh hưởng vận hành

- Nhân viên CMS có quyền `CMS:update` mới upload được model. Theo seed RBAC D4, đó là nhóm "Biên tập Website (CMS)", Admin và Planning Manager.
- Model upload sai hợp đồng (ví dụ màu nướng sẵn, chưa khử màu) sẽ đổi màu sai trên website. Preview trong CMS có ô đổi màu thử để phát hiện trước khi lưu.
