# AUDIT P1 — rbac_v2

---

## VÒNG 2 — 2026-09-26 — **AUDIT_PASS**

- Đối tượng: `rbac/p1` @ `796743c`, working tree sạch. Có 8 commit: R0 (wip), R1, R2, R3 (D6b), R4 (D12), R5 (E4), R6 (m1–m4), R7 (test).
- Claude tự chạy lại toàn bộ trên DB copy vừa reset. Bằng chứng: `evidence/P1/claude-runtime-audit-r2.txt`.

| Lỗi vòng 1 | Kết quả | Kiểm chứng |
|---|---|---|
| B1 chiếm đơn nghỉ | ✅ | Gửi `{id:1, status:APPROVED, approved_*}`: đơn #1 của sales01 **không đổi**; tạo đơn mới #10 của emp 5, `PENDING`, `approved_*` = null |
| M1 không commit | ✅ | 8 commit đúng một ý mỗi commit, tree sạch |
| M2 designs bị nới | ✅ | Part-time `/designs/logos` → 403; `lou` → 200 |
| M3 evidence | ✅ (còn 2 điểm nhỏ, xem dưới) | Các dòng PASS có status và dữ liệu thật |
| D6b | ✅ | Part-time `/products`, `/products/packing-specs` → 403; `lou` → 200 |
| D12 | ✅ | 64/64 route HR cũ có decorator cũ. Part-time → 403 với payslips/employees/leaves/by-user/check-in/employee-reviews. `admin`, `thuhang` → 200 |
| E4 đánh giá 360 | ✅ | Claude tạo đợt đánh giá thật (emp 1 và 5): sales01 thấy đúng bài `[1,4]`; part-time nộp bài #1 của sales01 → 403, trạng thái không đổi |
| m1–m4 | ✅ | Matrix đủ 630 route; mọi cặp decorator cũ/mới đều khớp module và action (154/154) |

Nhận xét nhỏ, không chặn PASS:
- P1-12 của Antigravity test "nộp bài người khác" bằng id `99999`, một id không tồn tại. Claude đã test lại bằng bài thật của người khác.
- REPORT mục 5 ghi "sales không có PRODUCT sẽ bị 403" là **sai**. Nhóm Sales có `PRODUCT=VCU--`; chỉ Part-time bị chặn.

### Errata mới của Claude (không phải lỗi của Antigravity; không gây hỏng khi deploy P1 vì vẫn SHADOW)

Claude quét toàn bộ lời gọi API từ các bề mặt ẩn danh (website, 6 trang Portal, `components/b2b`): 77 điểm gọi, 62 đúng route public.

- **E5:** `GET /api/upload/watermark/b2b/config` được website `dat-hang-si` và portal B2B gọi không token. Matrix lại gán `CMS:view`, vì luật "watermark → CMS" trong script của Claude đè lên danh sách public.
- **E6:** `GET /api/purchasing/:id/outsourcing-materials` được **portal NCC** gọi bằng **id số PO, không token**. Matrix gán `PURCHASE:view`, nên khi ENFORCE thì NCC không xem được danh sách NPL. Không được mở public theo id số, vì đoán id là xem được mọi PO.

Cả hai phải xử lý **trước khi bật ENFORCE**, đã đưa vào `P2_Instruction.md` mục P2.0.

### Ảnh hưởng vận hành khi deploy P1 (Chủ dự án đọc trước khi deploy)

1. **Chặn thật ngay** (D12, I-19): API HR cũ chỉ còn nhóm có quyền HR (`admin`, `thuhang`). Nhân viên không bị ảnh hưởng vì trang Hồ sơ và tab Đánh giá 360 đã dùng `/hr/me`. Ai đang mở ERP bản cũ cần **F5**.
2. **Không ai mất quyền đang có:** designs và products vẫn chặn như hôm nay, nhờ decorator cũ được giữ.
3. Menu Mua hàng / Marketing / Cài đặt đổi điều kiện theo mã mới. Nhờ seed nên menu của mọi người không đổi.
4. Màn hình phân quyền có thêm mã **MARKETING**, **SYSTEM** và nhóm mới **"Biên tập Website (CMS)"**. Mày tự gán user cho nhóm CMS.
5. Seed chạy **một lần** khi backend khởi động, ghi kết quả vào `system_configs.RBAC_SEED_V1`.
6. **Backend và frontend phải deploy cùng lúc.**

---

## VÒNG 1

- Người audit: Claude · Ngày: 2026-09-25
- Đối tượng: nhánh `rbac/p1` **ở trạng thái chưa commit** (0 commit so với `main` @ `d376665`; 56 file sửa + 7 file mới trong working tree). Claude chụp toàn bộ bằng patch và áp vào worktree audit (hash file khớp).
- Môi trường: build `nest build`, boot backend trên **bản copy DB production đã sanitize** (`test-env`, dump 23/08), gọi HTTP thật dưới vai **6 user thật** thuộc 6 nhóm.

## Kết luận: **AUDIT_FAIL**, vòng 1/3

Có **1 BLOCKER**, **4 MAJOR** (trong đó 1 MAJOR là yêu cầu mới từ quyết định của Chủ dự án) và 4 MINOR.

Phần lõi làm tốt:
- Đọc metadata thật của **628 route**: không có decorator gắn nhầm method, không route trùng, khớp matrix trừ các chỗ lệch có chủ đích.
- Seed khớp Phụ lục A **đúng từng ô**.
- `/hr/me/*` chạy đúng với nhân viên thật.
- Mọi endpoint public/webhook/file không bị chặn.
- Guard cũ ở các module khác vẫn chặn như trước.

## 1. Claude đã tự kiểm tra gì

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit`, `nest build` | ✅ |
| **Metadata thật** của 628 route (đọc `Reflect` trên `dist/`, không dùng regex) so với `route-matrix.csv` | ✅ 0 route UNCLASSIFIED, 0 trùng. 24 route lệch matrix, đều có chủ đích: 21 designs (D5), `GET /test`, `POST /hr/check-in\|check-out` (P1.4). 47 route không có trong matrix, đều hợp lý (xem E2) |
| Thêm `@UseGuards` mới / thêm `@RequirePermission` mới / gắn `ApiKeyGuard` lên webhook | ✅ Không có. `ApiKeyGuard` vẫn chỉ ở Agent API. REPORT mục 4 ghi "webhooks có ApiKeyGuard" là **sai**, code đúng |
| Seed trên dữ liệu thật | ✅ MARKETING `1=VCU-- 2=VCUD$ 3=VCUD- 4=V---- 5=----- 6=-----`; SYSTEM chỉ `2=VCUD$`; PURCHASE không đổi; nhóm CMS id 7, 0 user, `VCUD-`; tổng 109 dòng |
| `/hr/me/*` với user part-time `cattuong` (employee 5) | ✅ profile, attendances, leaves (0 đơn, không lộ 6 đơn của emp 1), payslips (4, đều của mình), assets, balance. `check-in` gửi `employee_id: 1` vẫn ghi cho emp 5 |
| Public: `/public/settings\|products\|policies`, `/system/config/SITE_MODE`, webhook GHTK, webhook TikTok, `/upload/files/*`, watermark B2B, portal OTP, `/test` | ✅ không 401/403, không có log DENY |
| Guard cũ còn chặn (`sales01` → `/finance/summary`) | ✅ 403 |

Bằng chứng: `evidence/P1/claude-runtime-audit.txt`.

## 2. Danh sách lỗi

| ID | Mức | Vị trí | Mô tả (đã tái hiện bằng dữ liệu thật) | Yêu cầu sửa |
|---|---|---|---|---|
| **B1** | **BLOCKER** | [hr-me.controller.ts:112-122](../../src/hr/hr-me.controller.ts#L112-L122) | **Chiếm đơn nghỉ của người khác.** `createMyLeave` truyền `...rest` từ body vào `createLeave`, rồi `leaveRepo.create()` + `save()`. User part-time gửi `{id: 1, approved_at: ...}` và **chiếm được đơn #1 (đã duyệt) của sales01**: `employee_id` 1→5, `approved_at` do client tự đặt. Endpoint mở cho mọi user đăng nhập ngay khi deploy | Chỉ nhận **whitelist** `type, start_date, end_date, days, reason`. Không bao giờ truyền `id`, `approved_*`, `reject_reason`, `created_at` |
| **M1** | MAJOR | cả nhánh | **Không commit gì.** 63 file nằm trong working tree, REPORT không có commit hash. Vi phạm collaboration-rules mục 3.7 và mục 5. Không truy vết được, không rollback theo từng ý được | Commit toàn bộ hiện trạng ngay (1 commit "wip P1 as submitted"), rồi mỗi yêu cầu sửa dưới đây là 1 commit riêng |
| **M2** | MAJOR | [designs.controller.ts](../../src/designs/designs.controller.ts) (21 route) | **Nới quyền ngay khi deploy.** Xoá `@RequirePermission('PRODUCT', …)` và thay bằng `@AnyPerm`. `PermissionsGuard` cũ của controller không đọc `AnyPerm`, nên **mọi user đăng nhập đều vào được**. Tái hiện: part-time `GET /designs/logos` → **200** (prod hiện tại: 403). Nguyên nhân một phần từ instruction của Claude (E3) | Giữ **cả hai**: `@RequirePermission('PRODUCT', 'can_x')` (guard cũ tiếp tục chặn như hôm nay) **và** `@AnyPerm(['PRODUCT',x],['PRODUCTION',x])` (guard mới, dùng từ ENFORCE). Trên dữ liệu thật không nhóm nào chỉ có PRODUCTION mà không có PRODUCT, nên không ai mất gì |
| **M3** | MAJOR | `evidence/P1/*`, REPORT | **Lặp lại A1 (P0).** (1) `P1-HR-ME`: cả 6 endpoint `/hr/me` trả **404** mà vẫn ghi **PASS**, vì test bằng user không liên kết hồ sơ nhân viên; tính năng chính chưa từng được chứng minh. (2) `P1-02`: tính 404/500 là PASS, dùng route không tồn tại (`/marketing/promotions`, `/shipping/logs`, `/qc/inspections` → khớp nhầm `/qc/:id`). (3) REPORT sai sự thật: "webhooks có ApiKeyGuard", test bằng user `planning_manager`/`sales1` (không tồn tại, thật là `lou`/`sales01`), "10/10 ACCEPTANCE" (P1 có 8 dòng P1-xx + 9 dòng PUB-xx) | PASS chỉ khi **kết quả mong đợi** xảy ra (status đúng **và** dữ liệu đúng). Test `/hr/me` bằng user có hồ sơ (`cattuong`, `sales01`, `lou`). Test SHADOW bằng route có thật, status phải là 200. REPORT chỉ ghi điều đã kiểm |
| **M4** | MAJOR (yêu cầu mới) | xem mục 3 | Chủ dự án chốt **D6b** và **D12** sau khi Claude báo kết quả test. Claude phát hiện thêm **E4** (đánh giá 360) | Làm R3, R4, R5 ở mục 4 |
| m1 | MINOR | `hula-web/cms/tsconfig.tsbuildinfo` | File build bị sửa theo | `git checkout` lại, không commit |
| m2 | MINOR | `scripts/apply-p1-decorators.js`, `scripts/run-p1-acceptance.js` | Script dùng một lần nằm lẫn trong `scripts/` | Chuyển vào `scripts/rbac/`, thêm dòng comment đầu file ghi mục đích và "one-off P1" |
| m3 | MINOR | `route-matrix.csv` | Chưa thêm 47 route bị thiếu (E2) | Thêm đủ, `change = ADDED_P1`. Sau đó `check-rbac` không còn cảnh báo lệch ngoài danh sách có chủ đích |
| m4 | MINOR | `scripts/check-rbac.js` | Sau khi sửa M2 và R4, một route sẽ có `@RequirePermission` + `@Perm/@AnyPerm` | Cho phép **cặp chuyển tiếp** này khi module của decorator cũ nằm trong tập của decorator mới. Mọi tổ hợp khác vẫn báo multi-tier |

## 3. Quyết định mới của Chủ dự án (2026-09-25) và errata

- **D6b:** API **sản phẩm** giữ `PRODUCT:view`, không mở cho mọi user. Lý do: test thật cho thấy `GET /products` trả **803 sản phẩm kèm giá vốn** cho user part-time. D6 vẫn áp dụng cho vật tư, NCC, công đoạn, danh mục; các route này trước đây mở hoàn toàn nên đổi sang cần đăng nhập là siết lại.
- **D12:** **Vá ngay ở P1** lỗ xem lương/chấm công/nghỉ phép/hồ sơ người khác qua API HR cũ. Test thật: part-time đọc được **8 phiếu lương của sales01** qua `GET /hr/payslips?employee_id=1`. Lỗ này đang tồn tại trên production. Sau P1 mọi màn hình của nhân viên thường đều dùng `/hr/me`, nên các route HR cũ chỉ còn nhóm có quyền HR (chỉ Admin) dùng.
- **E2 (lỗi của Claude):** script tạo `route-matrix.csv` dùng regex nên bỏ sót 47 route viết trên một dòng. Antigravity phân hạng đủ 47 route, Claude đã duyệt và thấy hợp lý.
- **E3 (lỗi của Claude):** D5 ghi "AnyPerm cho designs" mà không nhắc phải giữ decorator cũ. Đây là nguyên nhân M2.
- **E4 (lỗi của Claude):** matrix gán `GET /hr/employee-reviews` và `POST /hr/employee-reviews/:id/submit` cần HR. Nhưng hai route này do **nhân viên tự dùng** ở tab Đánh giá 360 trong trang Hồ sơ (`EmployeeReviewTab`, gọi `?reviewer_id=`). Hệ quả: (a) ENFORCE sẽ làm nhân viên không đánh giá được; (b) đổi `reviewer_id` là xem được bài đánh giá người khác.

## 4. Yêu cầu sửa (mỗi mục một commit)

| # | Việc | Chi tiết |
|---|---|---|
| R0 | Commit hiện trạng | `git add -A` (trừ `tsconfig.tsbuildinfo`), commit `wip(rbac): P1 as submitted for audit round 1` |
| R1 | B1 | Whitelist cho `POST /hr/me/leaves` |
| R2 | M2 | Designs: khôi phục 21 `@RequirePermission('PRODUCT', …)`, giữ `@AnyPerm` |
| R3 | D6b | `GET /products`, `GET /products/:id`, `GET /products/packing-specs`: khôi phục `@RequirePermission('PRODUCT','can_view')`, gắn thêm `@Perm('PRODUCT','view')` thay cho `@AuthOnly()`. Cập nhật matrix |
| R4 | D12 | Mọi route trong `hr.controller.ts` (trừ route recruitment đã có decorator cũ) gắn thêm `@RequirePermission('HR', 'can_<action>')` **cùng action với `@Perm`**. Controller đã có `PermissionsGuard` nên **chặn ngay** khi deploy. Không đụng `/hr/me/*`, không đụng route `@Public` của recruitment trong `public.controller` |
| R5 | E4 | Thêm `GET /hr/me/reviews` (bài đánh giá mà mình là **người đánh giá**) và `POST /hr/me/reviews/:id/submit`: **reviewer phải là employee của mình**, không thì 403. Kiểm quyền sở hữu không cần query mới: `findEmployeeReviews(myEmpId)` rồi kiểm `id` có trong danh sách, sau đó gọi `submitEmployeeReview(id, answers)`. Chỉ nhận `answers` từ body. `EmployeeReviewTab` đổi sang 2 route này. Route cũ `employee-reviews*` cần HR như R4 |
| R6 | m1–m4 | Như bảng mục 2 |
| R7 | M3 | Chạy lại toàn bộ ACCEPTANCE P1 + PUB theo đúng tiêu chí; thêm 4 dòng mới ở mục 5 |

## 5. Nghiệm thu bổ sung (thêm vào ACCEPTANCE.csv)

- **P1-09** (R1): part-time gửi `{id: <đơn của người khác>, approved_at}` lên `POST /hr/me/leaves` → tạo **đơn mới** PENDING của mình; đơn của người khác không đổi.
- **P1-10** (R2, R3): part-time gọi `GET /designs/logos` và `GET /products` → **403** (guard cũ). `lou` → 200.
- **P1-11** (R4): part-time gọi `GET /hr/payslips?employee_id=1`, `GET /hr/employees`, `POST /hr/check-in` → **403**. `admin`, `thuhang` → 200/201.
- **P1-12** (R5): `sales01` mở tab Đánh giá 360 → thấy đúng bài mình cần chấm; submit bài của người khác qua `/hr/me/reviews/:id/submit` → 403.

## 6. Ảnh hưởng vận hành khi deploy P1 (sau khi sửa) — báo Chủ dự án

- **Chặn thật ngay khi deploy** (theo D12): API HR cũ chỉ còn nhóm có quyền HR (Admin: `admin`, `thuhang`) dùng được. Nhân viên thường không bị ảnh hưởng vì trang Hồ sơ đã dùng `/hr/me`. Ai đang mở tab ERP bản cũ cần F5.
- Menu Mua hàng/Marketing/Cài đặt đổi điều kiện theo mã mới. Nhờ seed nên không ai mất menu.
- Thanh toán công nợ của kế toán **vẫn chạy** trong P1 (SHADOW). Phải xử lý I-18 trước P2.
- Nhóm mới "Biên tập Website (CMS)" xuất hiện trong màn hình phân quyền. Mày tự gán user.
