# REPORT P2.0 — rbac_v2 (Vòng 2)
Nhánh: `rbac/p2` · Commit: `fa14845` -> `8b6e3a4` -> `9b14688` -> `89711c6` -> `2983de2` -> `HEAD` · Ngày: 2026-09-26

## 1. Đã làm

| Mục | File đổi | Ghi chú 1 dòng |
|---|---|---|
| **P2.0-a** (E5: watermark B2B) | `src/upload/upload.controller.ts` | Đổi decorator `GET /upload/watermark/b2b/config` từ `@Perm('CMS','view')` sang `@Public()`. Giữ nguyên `@Perm('CMS', ...)` cho các route POST. |
| **P2.0-a** (E5: route matrix) | `docs/rbac_v2/route-matrix.csv` | Cập nhật dòng R540: `proposed_tier = PUBLIC`, `change = KEEP_PUBLIC(@Public)`. |
| **P2.0-b** (E6: service NPL portal) | `src/purchasing/purchasing.service.ts` | Thêm method `getSupplierPortalOutsourcingMaterials(uuid, poId)`: tìm NCC theo uuid, ném 404 nếu PO không thuộc NCC đó, trả về danh sách NPL qua `getOutsourcingMaterials(poId)`. |
| **P2.0-b** (E6: controller NPL portal) | `src/purchasing/purchasing.controller.ts` | Thêm route `@Public() @Get('supplier-portal/:uuid/outsourcing-materials/:poId')`. Route cũ `:id/outsourcing-materials` giữ nguyên `@Perm('PURCHASE', 'view')`. |
| **P2.0-b** (E6: portal dashboard UI) | `frontend/src/pages/PortalSupplierDashboard.tsx` | Đổi lời gọi NPL từ `/purchasing/${poId}/outsourcing-materials` sang `/purchasing/supplier-portal/${uuid}/outsourcing-materials/${poId}`. |
| **P2.0-b** (E6: route matrix) | `docs/rbac_v2/route-matrix.csv` | Thêm dòng R631 cho route mới: tier `PUBLIC`, `change = ADDED_P2`. |
| **P2.0-c** (Quét bề mặt ẩn danh) | `scripts/rbac/check-public-callers.js` | Viết script quét 126 file trong `hula-web/website/src`, `frontend/src/pages/Portal*.tsx`, `frontend/src/components/b2b`; đối chiếu lời gọi API với route matrix; xử lý `baseURL = /public` của website api instance; exit 1 nếu có lời gọi tới route không PUBLIC. |
| **P2.0-c** (Tích hợp QA) | `scripts/qa.js` | Tích hợp bước 2.6 `RBAC Public Callers Check` vào pipeline QA. |
| **F1** (Đồng bộ matrix spec) | `docs/rbac_v2/route-matrix.csv` | Đồng bộ 23 điểm khác biệt có chủ đích: R022 (`GET /api/test` -> `PUBLIC`), 21 route designs R046-R066 (`PRODUCT:x \| PRODUCTION:x`), R104-R105 HR check-in/out (`HR:create`). |
| **F1** (Lưới an toàn bắt buộc spec) | `scripts/check-rbac.js` | Nâng cấp checker kiểm tra nghiêm ngặt cả tier lẫn perm (chuẩn hoá sort multi-perm), exit code 1 khi có bất kỳ sai khác nào giữa code và matrix. |
| **F2** (Validate poId portal NCC) | `src/purchasing/purchasing.controller.ts` | Thêm `ParseIntPipe` cho tham số `poId` ở route supplier portal NPL; trả HTTP 400 Bad Request khi truyền chuỗi không phải số. |
| **F3** (Cập nhật báo cáo & sheet) | `docs/rbac_v2/REPORT_P2.0.md`, `ACCEPTANCE.csv` | Ghi nhận chi tiết kết quả sửa lỗi audit vòng 2, kết quả nghiệm thu P2-00d, P2-00e. |
| **Trạng thái phase** | `docs/rbac_v2/STATUS.md` | Cập nhật P2.0 = SUBMITTED. |

## 2. Lệch so với instruction

Không có. Đã khắc phục triệt để theo lựa chọn **(a)** trong `AUDIT_P2.0.md`:
- Biến `route-matrix.csv` thành **spec bắt buộc** (enforced specification).
- Toàn bộ 631 route trong code đã được đồng bộ 100% với spec (0 unclassified, 0 mismatch về cả tier lẫn permission).
- Bất kỳ thay đổi decorator nào trong code hoặc spec mà không sửa nơi còn lại sẽ khiến `check-rbac.js` báo lỗi và **exit 1** ngay lập tức, chặn QA và build.
- Lưới an toàn `check-public-callers.js` bảo vệ toàn diện các caller public trên website và frontend.

## 3. Kết quả kiểm tra

- **RBAC Checkers & QA:**
  - `node scripts/check-rbac.js` -> ✅ **PASS (exit 0)**: 631 routes scanned, 631 matrix routes, 0 unclassified, 0 multi-tier, 0 diffs.
  - `node scripts/rbac/check-public-callers.js` -> ✅ **PASS (exit 0)**: 126 files scanned, 61 public/anonymous calls, 0 mismatched calls across all 61 endpoints.
  - `npx tsc --noEmit` -> ✅ **PASS (exit 0)**: Backend TypeScript biên dịch sạch, không lỗi type.
  - `nest build` -> ✅ **PASS (exit 0)**: Build backend thành công.
- **ACCEPTANCE: 5/5 PASS (kèm đầy đủ evidence .txt)**
  - **P2-00a (PASS):** Không token gọi `GET /api/upload/watermark/b2b/config` trả về HTTP 200 payload `{"enabled":true,"position":"center","opacity":0.4,"sizeRatio":1,"imageFile":"_watermark_b2b.png"}`; `rbac_access_logs` không có bản ghi `DENY_NO_AUTH` nào. (evidence: `docs/rbac_v2/evidence/P2/P2-00a_watermark-b2b.txt`)
  - **P2-00b (PASS):** NCC A (Hưng Nguyên, ID 17, UUID `01d122d7-b9a2-42aa-b964-d64ce66f0cfc`) xem NPL PO 596 của mình trả về HTTP 200 (5 items NPL); đổi `poId` sang PO 595 của NCC B trả về HTTP 404 (`{"message":"Không tìm thấy đơn mua hàng hoặc đơn không thuộc nhà cung cấp này"}`); route cũ `/api/purchasing/596/outsourcing-materials` không có token trả về HTTP 200 (SHADOW) và ghi nhận `DENY_NO_AUTH` với `required = 'PURCHASE:view'` vào `rbac_access_logs`. (evidence: `docs/rbac_v2/evidence/P2/P2-00b_supplier-portal-npl.txt`)
  - **P2-00c (PASS):** `node scripts/rbac/check-public-callers.js` quét 126 file, tìm thấy 61 lời gọi ẩn danh, 0 lời gọi lệch so với route matrix, exit code 0. (evidence: `docs/rbac_v2/evidence/P2/P2-00c_check-public-callers.txt`)
  - **P2-00d (PASS - Nghiệm thu F1):** Thử nghiệm Đột biến 3: Đổi `@Public()` của `GET /upload/watermark/b2b/config` thành `@Perm('CMS', 'view')` trong code mà không sửa matrix -> `check-rbac.js` phát hiện `TIER_MISMATCH` và lập tức **FAIL (exit 1)**. Hoàn tác lại code -> **PASS (exit 0)**. Đã chặn đứng hoàn toàn lỗ hổng của lưới an toàn. (evidence: `docs/rbac_v2/evidence/P2/P2-00d_mutation3_fail_and_pass.txt`)
  - **P2-00e (PASS - Nghiệm thu F2):** Gọi `GET /api/purchasing/supplier-portal/01d122d7-b9a2-42aa-b964-d64ce66f0cfc/outsourcing-materials/abc` -> trả về **HTTP 400 Bad Request** (`{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}`), không bị ném lỗi 500. (evidence: `docs/rbac_v2/evidence/P2/P2-00e_poId_parse_int.txt`)

## 4. Câu hỏi còn treo

Không có.

## 5. Việc ngoài phạm vi phát hiện được

- Trong `scripts/qa.js`, `Backend Lint` báo lỗi do thiếu file cấu hình `.eslintrc.js` ở root, `CMS TypeCheck` báo lỗi do thư mục `hula-web/cms` chưa install node_modules độc lập. Đây là hiện trạng sẵn có từ nhánh `main` và đã được ghi nhận ở P0/P1. Các phần liên quan trực tiếp tới RBAC (Backend TypeCheck, Frontend TypeCheck, RBAC Route Check, RBAC Public Callers Check, Backend Build) đều PASS 100%.
