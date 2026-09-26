# REPORT P2.0 — rbac_v2
Nhánh: `rbac/p2` · Commit: `fa14845` -> `8b6e3a4` -> `9b14688` -> `HEAD` · Ngày: 2026-09-26

## 1. Đã làm

| Mục instruction | File đổi | Ghi chú 1 dòng |
|---|---|---|
| **P2.0-a** (E5: watermark B2B) | `src/upload/upload.controller.ts` | Đổi decorator `GET /upload/watermark/b2b/config` từ `@Perm('CMS','view')` sang `@Public()`. Giữ nguyên `@Perm('CMS', ...)` cho các route POST. |
| **P2.0-a** (E5: route matrix) | `docs/rbac_v2/route-matrix.csv` | Cập nhật dòng R540: `proposed_tier = PUBLIC`, `change = KEEP_PUBLIC(@Public)`. |
| **P2.0-b** (E6: service NPL portal) | `src/purchasing/purchasing.service.ts` | Thêm method `getSupplierPortalOutsourcingMaterials(uuid, poId)`: tìm NCC theo uuid, ném 404 nếu PO không thuộc NCC đó, trả về danh sách NPL qua `getOutsourcingMaterials(poId)`. |
| **P2.0-b** (E6: controller NPL portal) | `src/purchasing/purchasing.controller.ts` | Thêm route `@Public() @Get('supplier-portal/:uuid/outsourcing-materials/:poId')`. Route cũ `:id/outsourcing-materials` giữ nguyên `@Perm('PURCHASE', 'view')`. |
| **P2.0-b** (E6: portal dashboard UI) | `frontend/src/pages/PortalSupplierDashboard.tsx` | Đổi lời gọi NPL từ `/purchasing/${poId}/outsourcing-materials` sang `/purchasing/supplier-portal/${uuid}/outsourcing-materials/${poId}`. |
| **P2.0-b** (E6: route matrix) | `docs/rbac_v2/route-matrix.csv` | Thêm dòng R631 cho route mới: tier `PUBLIC`, `change = ADDED_P2`. |
| **P2.0-c** (Quét bề mặt ẩn danh) | `scripts/rbac/check-public-callers.js` | Viết script quét 126 file trong `hula-web/website/src`, `frontend/src/pages/Portal*.tsx`, `frontend/src/components/b2b`; đối chiếu lời gọi API với route matrix; xử lý `baseURL = /public` của website api instance; exit 1 nếu có lời gọi tới route không PUBLIC. |
| **P2.0-c** (Tích hợp QA) | `scripts/qa.js` | Tích hợp bước 2.6 `RBAC Public Callers Check` vào pipeline QA. |
| **P2.0** (Nghiệm thu & Evidence) | `scripts/rbac/run-p2-acceptance.js` | Script tự động hóa kiểm thử nghiệm thu 3 ca P2-00a, P2-00b, P2-00c trên môi trường test sạch. |
| **P2.0** (Acceptance sheet) | `docs/rbac_v2/ACCEPTANCE.csv` | Điền kết quả PASS và đường dẫn file evidence cho P2-00a, P2-00b, P2-00c. |
| **P2.0** (Trạng thái phase) | `docs/rbac_v2/STATUS.md` | Cập nhật P2.0 = SUBMITTED. |

## 2. Lệch so với instruction

Không có. Làm chính xác theo yêu cầu P2.0-a, P2.0-b, P2.0-c trong `P2_Instruction.md`.

## 3. Kết quả kiểm tra

- **npm run qa:**
  - `[Backend TypeCheck] ✓ Passed`
  - `[Frontend (Admin) TypeCheck] ✓ Passed`
  - `[RBAC Route Check] ✓ Passed` (631 routes scanned, 631 in matrix, 0 unclassified, 0 multi-tier)
  - `[RBAC Public Callers Check] ✓ Passed` (126 files scanned, 61 public/anonymous calls, 0 mismatched calls across all 61 endpoints)
- **cd frontend && npm run build:**
  - `✓ built in 1m 18s` (OK, không lỗi)
- **ACCEPTANCE: 3/3 PASS**
  - **P2-00a (PASS):** Gọi `GET /api/upload/watermark/b2b/config` không token trả về HTTP 200 payload `{"enabled":true,"position":"center","opacity":0.4,"sizeRatio":1,"imageFile":"_watermark_b2b.png"}`; bảng `rbac_access_logs` không có bản ghi `DENY_NO_AUTH` nào. (evidence: `docs/rbac_v2/evidence/P2/P2-00a_watermark-b2b.txt`)
  - **P2-00b (PASS):** NCC A (Hưng Nguyên, ID 17, UUID `01d122d7-b9a2-42aa-b964-d64ce66f0cfc`) xem NPL PO 596 của mình trả về HTTP 200 (5 items NPL); đổi `poId` sang PO 595 của NCC B trả về HTTP 404 (`{"message":"Không tìm thấy đơn mua hàng hoặc đơn không thuộc nhà cung cấp này"}`); route cũ `/api/purchasing/596/outsourcing-materials` không có token trả về HTTP 200 (SHADOW) và ghi nhận `DENY_NO_AUTH` với `required = 'PURCHASE:view'` vào `rbac_access_logs`. (evidence: `docs/rbac_v2/evidence/P2/P2-00b_supplier-portal-npl.txt`)
  - **P2-00c (PASS):** `node scripts/rbac/check-public-callers.js` quét 126 file, tìm thấy 61 lời gọi ẩn danh, 0 lời gọi lệch so với route matrix, exit code 0. (evidence: `docs/rbac_v2/evidence/P2/P2-00c_check-public-callers.txt`)

## 4. Câu hỏi còn treo

Không có.

## 5. Việc ngoài phạm vi phát hiện được

- Trong `scripts/qa.js`, `Backend Lint` bị fail do thiếu file cấu hình `.eslintrc.js` ở root, `CMS TypeCheck` fail do thư mục `hula-web/cms` chưa install node_modules độc lập. Đây là hiện trạng sẵn có từ nhánh `main` và đã được ghi nhận ở P0/P1. Các phần liên quan trực tiếp tới RBAC (Backend TypeCheck, Frontend TypeCheck, RBAC Route Check, RBAC Public Callers Check, Frontend Build) đều PASS 100%.
