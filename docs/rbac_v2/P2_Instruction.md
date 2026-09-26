# P2 — Chạy SHADOW, dọn quyền, bật ENFORCE

**Điều kiện bắt đầu:** P1 audit PASS và đã deploy production.
**Hành vi:** đây là phase **duy nhất bắt đầu chặn người dùng**. Bật khi chủ dự án ký.

> **Changelog 2026-09-26:** thêm P2.0 (việc code bắt buộc trước ENFORCE, rút ra từ AUDIT_P1 vòng 2: E5, E6, I-18).
> **Changelog 2026-09-26 (2):** thêm P2.0-d **E7**, hotfix P2.0.1 trên nhánh `rbac/e7`: vá khẩn cấu hình hệ thống/SMTP, chặn thật khi deploy (D13). Điền thêm dòng `P2-00f..k`.

## P2.0 Việc code bắt buộc trước khi được bật ENFORCE (Antigravity, nhánh `rbac/p2`)

**Trạng thái:** READY từ 2026-09-26. Làm **song song** trong lúc SHADOW chạy. Tạo nhánh `rbac/p2` từ `main`.
- Không được gỡ chặn ENFORCE trong `RbacModeService` ở P2.0. Việc đó là P2.3, chỉ làm sau khi checklist P2.2 đã ký.
- Test trên `test-env` (reset trước khi test). Nộp `REPORT_P2.0.md`, điền dòng `P2-00a..c` trong ACCEPTANCE.
- Mọi đổi quyền ở P2.0 chỉ ảnh hưởng tới SHADOW. Sau khi deploy P2.0, không có ai bị chặn thêm.

| # | Việc | Chi tiết | Nghiệm thu |
|---|---|---|---|
| P2.0-a | E5: watermark B2B | `GET /upload/watermark/b2b/config`: bỏ `@Perm('CMS','view')`, gắn `@Public()`. Chỉ route GET này; các route POST watermark giữ `CMS` | Không token → 200; `rbac_access_logs` không còn `DENY_NO_AUTH` cho route này |
| P2.0-b | E6: NPL trên portal NCC | Thêm `GET /purchasing/supplier-portal/:uuid/outsourcing-materials/:poId` (`@Public()`). Tìm NCC theo `uuid` như route `supplier-portal/:uuid` hiện có; **PO `poId` phải thuộc NCC đó**, không thì 404. Gọi service `outsourcing-materials` có sẵn. `PortalSupplierDashboard.tsx` đổi sang route mới. Route cũ `:id/outsourcing-materials` giữ `PURCHASE:view` | Portal NCC A xem NPL PO của mình → 200; đổi `poId` sang PO của NCC B → 404; route cũ không token → vẫn ghi `DENY_NO_AUTH` (chặn khi ENFORCE) |
| P2.0-c | Quét bề mặt ẩn danh | Thêm `scripts/rbac/check-public-callers.js`: quét lời gọi API trong `hula-web/website/src`, `frontend/src/pages/Portal*.tsx`, `frontend/src/components/b2b`, đối chiếu với hạng route (đọc metadata sau build). Exit 1 nếu có lời gọi tới route không `PUBLIC`. Nhớ xử lý `baseURL = /public` của `hula-web/website/src/lib/api.ts`. Đưa vào `scripts/qa.js` | 0 lời gọi lệch |

### P2.0-d — E7: vá cấu hình hệ thống và SMTP (KHẨN, chặn thật ngay khi deploy — D13)

> Bổ sung 2026-09-26. P2.0 (a–c) đã merge ở main @ 59a7d90, nên E7 là **hotfix P2.0.1**: nhánh `rbac/e7` tạo từ `main`, nộp `REPORT_P2.0.1.md`, deploy ngay sau AUDIT_PASS, không đợi ENFORCE (D13).

**Lỗ hổng (Claude đọc code):**
- `GET /system/config/:key` gắn `@Public()` và trả **mọi** key trong `system_configs`, kể cả `SMTP_PASS` (`system.service.ts` L141).
- `GET /system/smtp`, `POST /system/smtp`, `POST /system/smtp/test`, `POST /system/config` chỉ gắn `@Perm`. Trong SHADOW (tới 2026-10-26), **người chưa đăng nhập** vẫn đọc được mật khẩu SMTP, đổi được SMTP, và ghi được **bất kỳ key nào**: `SITE_MODE=maintenance` làm sập website, `RBAC_MODE`, các key seed.

**Nguyên tắc:** chặn thật ngay lúc deploy, không đợi ENFORCE (ngoại lệ luật 2, giống D12). Không đổi `JWT_SECRET`, không đổi cách đăng nhập.

| # | Route | Làm | Nghiệm thu |
|---|---|---|---|
| E7-a | `GET /system/config/:key` | Giữ route và `@Public()` (để website đọc `SITE_MODE` từ middleware server-side, không token). Trong handler, xét theo 3 nhóm key (hằng số trong `src/system/system-config-access.ts`): **(1) `PUBLIC_READ_KEYS`**: đọc ẩn danh. Tối thiểu `SITE_MODE`; Antigravity quét `hula-web/website/src/**` và mọi trang/portal không đăng nhập để bổ sung, có liệt kê trong REPORT. **(2) `SECRET_KEYS`**: khớp regex `/(PASS|PASSWORD|SECRET|TOKEN|API_?KEY|PRIVATE|CREDENTIAL)/i` hoặc nằm trong danh sách cứng (`SMTP_PASS` + mọi key thông tin đăng nhập EasyInvoice/GHTK/ZNS/TikTok đang có trong `system_configs`, Antigravity liệt kê). Nhóm này **không bao giờ** trả qua route này: 403 kể cả khi là admin. **(3) Còn lại:** phải có Bearer JWT hợp lệ. Verify bằng `JwtService.verify` giống `RbacGuard.verifyBearer`; không có hoặc sai thì 401. Chặn **cả khi** `RBAC_MODE=SHADOW` | Không token: `SITE_MODE` → 200, `SMTP_PASS` → 403, `QUOTE_DEFAULT_TERMS` → 401. Có token user thường: `QUOTE_DEFAULT_TERMS` → 200, `SMTP_PASS` → 403 |
| E7-b | `GET /system/smtp` | Đổi thành cặp `@RequirePermission('SYSTEM','can_view')` + `@Perm('SYSTEM','view')`, và `@UseGuards(JwtAuthGuard, PermissionsGuard)` **ở method**, không gắn ở class vì `SITE_MODE` phải public. Response **che** `SMTP_PASS`: trả `''` và thêm `SMTP_PASS_SET: true/false` | Không token → 401; user không SYSTEM → 403; admin → 200 và không thấy mật khẩu |
| E7-c | `POST /system/smtp`, `POST /system/smtp/test` | Cặp `SYSTEM:create` + guard ở method như E7-b. `saveSmtpConfig`: nếu `SMTP_PASS` gửi lên rỗng hoặc bằng chuỗi che thì **giữ mật khẩu cũ** (hiện tại dòng L141 ghi đè thành rỗng, sau E7-b sẽ xoá mất mật khẩu khi admin bấm lưu). `SystemSettingsPage` tab Email: ô mật khẩu để trống kèm placeholder "Đã đặt — để trống nếu không đổi" | Không token → 401; lưu form SMTP không nhập mật khẩu → mật khẩu cũ còn nguyên (kiểm DB); gửi mail test vẫn chạy |
| E7-d | `POST /system/config` | Guard ở method: `JwtAuthGuard` (bắt đăng nhập ngay). Trong handler, xét theo key: **(1) `PROTECTED_KEYS`**: `RBAC_*`, `*_SEED_*`, `CHATBOT_LLM_USAGE_*`, `SECRET_KEYS` → 403, **không bao giờ** ghi qua route này. **(2) `CMS_WRITE_KEYS`**: danh sách key CMS đang ghi (quét `hula-web/cms/src/**`, gồm `SITE_MODE`, `hidden_pages`, `section_*`, `widget_360_*`, `product_tags_config`…) → cần `CMS:update` **hoặc** `SYSTEM:update`. **(3) Còn lại** → `SYSTEM:update`. Kiểm quyền bằng `PermissionCacheService.hasAny` (admin bypass như guard hiện tại); thiếu quyền → 403. Matrix R491 cập nhật ghi chú | Không token → 401; user có token nhưng không CMS/SYSTEM ghi `SITE_MODE` → 403; user CMS ghi `section_hero_text` → 200; user CMS ghi `QUOTE_DEFAULT_TERMS` → 403; admin ghi `RBAC_MODE` → 403 |
| E7-e | Kiểm tra caller | Liệt kê mọi lời gọi `/system/config*` và `/system/smtp*` trong `frontend/src`, `hula-web/cms/src`, `hula-web/website/src` (bảng: file:dòng, key, có token không, người dùng nào). Caller nào sẽ bị chặn khi dùng hợp lệ → **dừng, ghi REPORT**. Thêm test vào `check-public-callers` hoặc script riêng để về sau QA fail nếu website gọi key ngoài `PUBLIC_READ_KEYS` | Bảng caller trong REPORT; 0 caller hợp lệ bị chặn |

**Ảnh hưởng vận hành (I-21):**
- Website không đổi (`SITE_MODE` vẫn public).
- Trang Cấu hình hệ thống và CMS vẫn chạy với tài khoản đang có quyền. Admin và Planning Manager có CMS. Ai sửa giao diện website qua CMS mà **không có** quyền CMS/SYSTEM sẽ bị 403 ngay khi deploy, cần tick CMS cho họ.
- **Sau khi deploy:** Chủ dự án **đổi mật khẩu SMTP** (app password Gmail/nhà cung cấp mail) và nhập lại ở tab Email. Mật khẩu cũ phải coi là đã lộ.

Chủ dự án (không cần code), **trước ngày bật ENFORCE**:
- **I-18:** tick `FINANCE: create` + `PURCHASE: view` cho nhóm **Accounting_manager**, nếu kế toán tiếp tục ghi nhận thanh toán.
- Gán user vào nhóm **"Biên tập Website (CMS)"** cho ai sửa website. Sau ENFORCE, CMS chặn người không có quyền CMS.
- **D9:** chưa rõ; Claude lọc log `DENY_NO_AUTH` theo IP/user-agent không phải trình duyệt trong 30 ngày để Chủ dự án quyết (xem P2.1 loại C/D).

## P2.1 Giai đoạn quan sát (SHADOW **30 ngày** từ ngày deploy P1 — D8, chốt 2026-09-26)

Người làm: Claude (phân tích) + chủ dự án (quyết).

1. Mỗi 2–3 ngày xuất report `/system/rbac` ra Excel.
2. Phân loại từng dòng `DENY_*`:

| Loại | Dấu hiệu | Xử lý |
|---|---|---|
| A. Thiếu quyền nhóm | User nội bộ, `DENY_NO_PERM`, đúng nghiệp vụ của họ | Chủ dự án cấp quyền cho nhóm |
| B. Mapping sai | Nhiều nhóm khác nhau đều bị `DENY_NO_PERM` ở cùng route, route này là tra cứu dùng chung | Antigravity sửa decorator (PR nhỏ `rbac/p2-fix-n`), cập nhật `route-matrix.csv` |
| C. Gọi ẩn danh hợp lệ | `DENY_NO_AUTH` từ website, portal, webhook, thiết bị | Thêm `@Public()` (hoặc tích hợp đó phải dùng token) |
| D. Gọi ẩn danh lạ | `DENY_NO_AUTH` từ IP lạ, route nhạy cảm | Không làm gì. ENFORCE sẽ chặn đúng |
| E. Frontend thiếu token | `DENY_NO_AUTH` từ IP nội bộ, user-agent trình duyệt, route nội bộ | Tìm file còn gọi `axios`/`fetch` không token, sửa sang `api` |

3. Tab "Route chưa phân hạng" phải trống.

## P2.2 Go-live checklist (chủ dự án ký)

- [ ] 3 ngày liên tiếp gần nhất không còn dòng loại A, B, C, E mới.
- [ ] Nhóm ACCEPTANCE `PUB-*` (website, 4 portal, webhook) PASS trên production.
- [ ] Đã báo trước cho nhân viên: thời điểm bật, số hotline nội bộ khi bị "không có quyền".
- [ ] Người có tài khoản `admin` trực trong 2 giờ sau khi bật.
- [ ] Bật vào đầu giờ sáng ngày làm việc, **không** bật vào ngày chốt lương/công nợ.

## P2.3 Code cho P2 (Antigravity)

1. `RbacModeService.setMode`: gỡ chặn ENFORCE. **Chỉ được gỡ trong PR P2, sau khi checklist đã ký.**
2. Trang `/system/rbac`: bật lựa chọn ENFORCE, có hộp xác nhận ghi rõ "Người không có quyền sẽ bị chặn ngay".
3. Frontend `utils/api.ts`: 403 hiện hiển thị `message.error`. Thêm vào nội dung dòng "Liên hệ admin để được cấp quyền (mã: MODULE:action)", lấy từ message backend.
4. CMS: bật lại chặn ở `useAuth.tsx`, **cùng ngày bật ENFORCE**.

## P2.4 Rollback

- Có sự cố: vào `/system/rbac` chuyển về **SHADOW**, hiệu lực ≤ 30 giây.
- Không vào được UI: chạy SQL `UPDATE system_configs SET value='SHADOW' WHERE key='RBAC_MODE';`. Chủ dự án giữ lệnh này.

## P2.5 Sau 2 tuần ENFORCE ổn định

Mở ticket P3.
