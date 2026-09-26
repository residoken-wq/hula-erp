# AUDIT P2.0 — rbac_v2

---

## VÒNG 2 — 2026-09-26 — **AUDIT_PASS**

Đối tượng: `rbac/p2` @ `014711f`. So với vòng 1 có thêm 3 commit: F1 `89711c6`, F2 `2983de2`, F3 `014711f`.

| Lỗi vòng 1 | Kết quả | Claude kiểm chứng |
|---|---|---|
| F1 lưới an toàn | ✅ | Matrix giờ là spec bắt buộc. Công cụ độc lập của Claude đọc metadata **sau build**: 631 route, **0 lệch** code↔matrix (cả tier lẫn perm), 0 trùng, 0 cặp cũ/mới mâu thuẫn |
| F2 `poId` | ✅ | `ParseIntPipe`; evidence `abc` → 400 |
| F3 REPORT | ✅ | Mục "Lệch" ghi đúng |

Đột biến Claude tự chạy trên `014711f`. Mỗi lần xong đều hoàn tác và kiểm tree sạch:

| Đột biến | `check-rbac` |
|---|---|
| M3: `@Public` → `@Perm('CMS','view')` trong code, giữ matrix | **exit 1** (`TIER_MISMATCH R540`) ✅ |
| M4: đổi action `SALES:view` → `update` của route có decorator cũ | **exit 1** (`PERM_MISMATCH`) ✅ |
| M5: thêm route mới không decorator | **exit 1** (`UNCLASSIFIED`) ✅ |
| M6: gắn thêm `@Public()` lên route đang có guard (`/finance/summary`) | **exit 1** (`MULTI`) ✅ |
| M1, M2 (vòng 1: đột biến matrix, đột biến lời gọi portal) | `check-public-callers` exit 1 ✅ |

Ghi chú: lần chạy M3 đầu tiên của Claude báo exit 0 là **do regex của Claude không khớp CRLF**, nên đột biến không được áp vào file. Chạy lại đúng thì exit 1.

### Ảnh hưởng vận hành khi deploy P2.0

- **Không chặn thêm ai.** Có thêm 2 đường public an toàn: watermark B2B (chỉ GET) và NPL portal NCC theo `uuid` (kiểm đúng PO thuộc NCC).
- Portal NCC chuyển sang route mới; nhà cung cấp không thấy khác gì.
- Từ giờ `npm run qa` **fail** khi code và `route-matrix.csv` lệch nhau. Ai thêm hay sửa API phải sửa matrix cùng lúc (xem `technical-rules.md`, Claude sẽ đề xuất bổ sung).

---

## VÒNG 1

- Người audit: Claude · Ngày: 2026-09-26
- Đối tượng: `rbac/p2` @ `41f644b` (4 commit so với `main`, working tree sạch)
- Môi trường: `nest build`; boot backend trên test-env vừa reset (dump 23/08 + sanitize); dữ liệu NCC thật

## Kết luận: **AUDIT_FAIL**, vòng 1/3

Có **1 MAJOR** và 2 MINOR. Các route E5 và E6 làm **đúng và an toàn**, đã test thật. Lỗi nằm ở lưới an toàn P2.0-c: nó không bắt được trường hợp code lệch khỏi matrix.

## 1. Claude đã tự kiểm tra gì

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit`, `nest build` | ✅ |
| Diff chỉ gồm E5, E6, script và docs; không đụng phạm vi cấm | ✅ |
| **E5** `GET /upload/watermark/b2b/config` không token | ✅ 200, không ghi log DENY |
| E5: `POST /upload/watermark/b2b/config` vẫn bảo vệ | ✅ Ghi log `DENY_NO_AUTH`, sẽ chặn khi ENFORCE |
| **E6** NCC #17 xem NPL của PO #596 (PO của chính NCC này) | ✅ 200 |
| E6: NCC #17 đổi `poId` sang PO #589 của NCC #5 | ✅ **404** |
| E6: `uuid` không tồn tại | ✅ 404 |
| E6: route cũ `GET /purchasing/:id/outsourcing-materials` không token | ✅ Ghi log `DENY_NO_AUTH`, sẽ chặn khi ENFORCE |
| E6: dashboard portal NCC liệt kê PO theo `supplier_id`, route mới kiểm cùng điều kiện | ✅ Mọi PO NCC thấy đều mở được; PO gộp dùng chung hàm lấy NPL như trước |
| `check-rbac.js` | ✅ exit 0 |
| `check-public-callers.js` trên code hiện tại | ✅ exit 0 |
| **Đột biến 1:** đổi matrix R540 về `PERM CMS:view` | ✅ checker báo 2 lời gọi lệch, **exit 1** |
| **Đột biến 2:** đưa `PortalSupplierDashboard` về route cũ | ✅ checker báo lệch |
| **Đột biến 3:** đổi decorator **trong code** (`@Public` → `@Perm('CMS','view')`), giữ nguyên matrix | ❌ `check-rbac` chỉ in `TIER_MISMATCH` và **exit 0**; `check-public-callers` **exit 0**. `npm run qa` vẫn qua |

## 2. Danh sách lỗi

| ID | Mức | Vị trí | Mô tả | Yêu cầu sửa |
|---|---|---|---|---|
| **F1** | **MAJOR** | [check-public-callers.js](../../scripts/rbac/check-public-callers.js), [check-rbac.js](../../scripts/check-rbac.js) | **Lưới an toàn có lỗ.** Instruction P2.0-c yêu cầu đối chiếu với hạng route **đọc metadata sau build**, nhưng script đọc **`route-matrix.csv`**. `check-rbac` chỉ *cảnh báo* khi code lệch matrix. Hệ quả (đột biến 3): ai đó đổi decorator một route public trong code mà không sửa matrix thì QA vẫn xanh, và website/portal sẽ hỏng lúc bật ENFORCE. Đúng loại lỗi P2.0-c được đặt ra để chặn | Chọn **một** trong hai cách: **(a, đề xuất)** biến matrix thành spec bắt buộc. Trước hết đồng bộ matrix với code cho các chỗ lệch có chủ đích (21 route designs → `PRODUCT:x \| PRODUCTION:x`; R022 `GET /api/test` → `PUBLIC`; `POST /api/hr/check-in\|check-out` → `HR:create`). Sau đó `check-rbac.js` **exit 1 khi có bất kỳ lệch tier/perm nào** giữa code và matrix. **(b)** `check-public-callers.js` đọc hạng route từ decorator trong code (như `check-rbac` đang làm), không đọc matrix |
| F2 | MINOR | [purchasing.controller.ts](../../src/purchasing/purchasing.controller.ts) route mới | `poId` không phải số (`abc`) trả **500** | `@Param('poId', ParseIntPipe)`, trả 400 |
| F3 | MINOR | REPORT_P2.0 mục 2 | Ghi "Lệch: Không có" trong khi script đọc matrix thay vì metadata (mục 1 của REPORT có tả đúng) | Ghi đúng điểm lệch nếu còn |

## 3. Nghiệm thu bổ sung

- **P2-00d** (F1): lặp lại **đột biến 3** (đổi `@Public()` của `GET /upload/watermark/b2b/config` thành `@Perm('CMS','view')` trong code, không sửa matrix) → `npm run qa` **FAIL**. Hoàn tác thì QA xanh lại. Lưu log cả hai lần.
- **P2-00e** (F2): `GET /purchasing/supplier-portal/<uuid>/outsourcing-materials/abc` → 400.

## 4. Ảnh hưởng vận hành khi deploy P2.0 (sau khi sửa)

- **Không chặn thêm ai.** E5 và E6 chỉ mở thêm hai đường public an toàn; đổi quyền chỉ ảnh hưởng SHADOW.
- Portal NCC dùng route mới để xem danh sách NPL: nhà cung cấp không thấy khác gì.
- Ghi nhận thêm (đã có trên production, sẽ đóng khi ENFORCE): **hiện ai cũng `POST` được cấu hình watermark B2B mà không cần đăng nhập** (test trả 201). Lỗi này nằm trong log SHADOW và tự hết khi bật ENFORCE.
