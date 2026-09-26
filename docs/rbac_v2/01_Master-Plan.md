# RBAC v2 — Kế hoạch quản trị phân quyền HULA ERP

> Người đọc: chủ dự án (duyệt) và Antigravity (thi công theo từng Instruction).
> Trạng thái: **DRAFT — chờ chủ dự án chốt các quyết định ở mục 6**.
> Ngày lập: 2026-09-24. Nguồn số liệu: `02_Current-State-Audit.md`, `route-matrix.csv`.

## 1. Mục tiêu

1. **Mặc định là đóng**: mọi API đều bắt đăng nhập, trừ danh sách ngoại lệ được khai báo rõ (website, portal khách/NCC/ứng viên, webhook, file ảnh).
2. **Một nguồn sự thật cho quyền**: danh mục module/quyền khai báo một lần ở backend, màn hình phân quyền và menu frontend đọc từ đó.
3. **Chuyển đổi không làm gãy vận hành**: chạy chế độ "ghi nhận" (SHADOW) trước để biết ai đang dùng gì, xong mới chặn thật (ENFORCE), và tắt lại được ngay không cần deploy.
4. **Quản trị được**: biết ai đổi quyền của nhóm nào, ai bị từ chối ở đâu, admin là một cờ chứ không phải tên đăng nhập.

## 2. Ngoài phạm vi (theo chỉ đạo chủ dự án)

Không đụng trong kế hoạch này:
- `JWT_SECRET`, thời hạn token, cơ chế mật khẩu (kể cả việc login đang chấp nhận mật khẩu plaintext), `NODE_ENV`/`synchronize`.
- Port Docker, mật khẩu DB, secret webhook.
- Logic nghiệp vụ (sales, kho, sản xuất, tài chính).

Các mục này để dành cho bản thương mại erp4u. Riêng những điểm có liên quan được ghi ở mục 8 để khi cần thì có sẵn.

## 3. Mô hình đích

```
User ──(n:1)── UserGroup ──(1:n)── GroupPermission(module_code, can_view, can_create, can_update, can_delete, view_cost_price)
                  │
                  └── is_super_admin (MỚI, thay cho username === 'admin')
```

Mỗi endpoint thuộc đúng **một trong 4 hạng**, khai báo bằng decorator:

| Hạng | Decorator | Ý nghĩa | Số endpoint |
|---|---|---|---|
| PUBLIC | `@Public()` | Không cần đăng nhập (website, portal, webhook, file) | 53 |
| AUTH | `@AuthOnly()` | Chỉ cần đăng nhập (task, project, thảo luận, thông báo, tra cứu danh mục) | 56 |
| PERM | `@RequirePermission('SALES','view')` hoặc `@RequireAnyPermission(...)` | Cần quyền module + hành động | 458 |
| APIKEY | `@UseGuards(ApiKeyGuard)` | Agent API bằng API key | 5 |

Endpoint không khai báo hạng nào thì guard toàn cục xử lý như AUTH, đồng thời ghi log `UNCLASSIFIED`. Script QA sẽ báo lỗi, để route mới không lọt.

### 3.1 Danh mục module (đề xuất)

| Mã | Tên | Trạng thái |
|---|---|---|
| DASHBOARD | Tổng quan | Có sẵn ở UI, backend chưa dùng |
| PRODUCT | Sản phẩm, BOM, danh mục, thiết kế in thêu | Có |
| SALES | Bán hàng, CRM, khách hàng, bảng giá, khuyến mãi | Có |
| INVENTORY | Kho, vật tư, NCC, mẫu, giao hàng | Có |
| PURCHASE | Mua hàng (PO), gia công | **Có ở UI nhưng backend chưa dùng**, menu đang gate bằng PRODUCTION |
| PRODUCTION | Kế hoạch (PFO), sản xuất, công đoạn, QC | Có |
| FINANCE | Thu chi, dòng tiền, công nợ | Có |
| HR | Nhân sự | Có |
| MARKETING | Marketing, kênh social, TikTok | **Mới**, hiện đi chung với SALES |
| CMS | Website CMS: blog, dự án, chính sách, wizard, 360, watermark | Có ở UI, backend chưa dùng, CMS login đang bỏ qua check |
| SYSTEM | Cấu hình hệ thống: SMTP, EasyInvoice, vận chuyển, ZNS, API token | Backend có dùng (ZNS), **UI phân quyền chưa có** |
| USERS | User, nhóm quyền, thông báo nội bộ, nhật ký | Có |
| FUP_* (6 mã) | Cột BOD FollowUp | Giữ nguyên (chỉ UI), backend làm ở Phase 4 |

Hành động giữ nguyên 4 cờ CRUD cộng `view_cost_price`. Chưa thêm `approve`/`export`: để Phase 4, cần quyết định nghiệp vụ.

## 4. Lộ trình

| Phase | Tên | Thay đổi hành vi? | Điều kiện qua phase |
|---|---|---|---|
| **P0** | Chuẩn bị: danh mục quyền, `/auth/me`, frontend dùng chung `api`, guard toàn cục ở chế độ SHADOW + nhật ký | **Không chặn gì**, trừ I-08 (nút thanh toán công nợ gộp PO bắt đầu chạy được) | Audit P0 pass |
| **P1** | Gắn hạng cho 572 endpoint, thêm mã PURCHASE/MARKETING/SYSTEM/CMS, seed quyền tự động, menu frontend theo mã mới | Chưa chặn (vẫn SHADOW). Menu có thể đổi chỗ gate | Audit P1 pass + script check-rbac = 0 lỗi |
| **P2** | Chạy SHADOW ≥ 10 ngày làm việc, đọc báo cáo, chỉnh quyền nhóm, rồi bật ENFORCE | **CÓ, đây là lúc bắt đầu chặn** | Chủ dự án ký go-live |
| **P3** | Quản trị tài khoản: `is_super_admin`, chặn user bị khoá, siết `/users`, log thay đổi quyền | Có (xem I-10…I-13) | Audit P3 pass |
| **P4** | Quyền chi tiết: giá vốn ở API, phạm vi dữ liệu (của tôi/phòng ban/tất cả), cột FUP, quyền công cụ AI | Có, **cần quyết định nghiệp vụ trước, chưa code** | Chủ dự án duyệt thiết kế |
| **P5** | Siết các ngoại lệ public: comment portal, `config/:key`, `company`, `proxy-image`, analytics | Có (nhỏ) | Audit P5 pass |

Mỗi phase là một nhánh/PR riêng. Antigravity **không** làm phase sau khi audit phase trước chưa pass.

### Cơ chế bật/tắt (để rollback ngay)

Khoá `RBAC_MODE` trong bảng `system_configs`: `OFF` | `SHADOW` | `ENFORCE`.
- Mặc định sau khi deploy P0 là `SHADOW`: guard mới chỉ ghi log, không chặn. Các guard đang có trên từng controller vẫn chạy như cũ.
- Đổi mode trên màn hình **Hệ thống → Phân quyền → Chế độ** (chỉ super admin), có hiệu lực trong ≤ 30 giây, không cần deploy.
- Có sự cố sau khi bật ENFORCE thì chuyển về SHADOW là hệ thống quay lại như trước.

## 5. Đăng ký ảnh hưởng vận hành

> Cột "Khi nào" là phase mà ảnh hưởng xảy ra. Mục có ⚠ cần chủ dự án biết trước hoặc chốt.

| ID | Khi nào | Ai bị ảnh hưởng | Ảnh hưởng | Mức | Giảm thiểu |
|---|---|---|---|---|---|
| I-01 ⚠ | P2 ENFORCE | Mọi user có nhóm quyền **không có** module tương ứng | 229 endpoint đang mở sẽ bắt đăng nhập + quyền. Ví dụ: nhóm không có PRODUCTION sẽ không vào được Kế hoạch/Sản xuất/QC qua API (menu vốn đã ẩn) | CAO | SHADOW ≥ 10 ngày, báo cáo "ai sẽ bị chặn" theo user/route, chỉnh quyền trước khi bật |
| I-02 ⚠ | P1 | Nhóm đang dùng Mua hàng qua quyền PRODUCTION | Mua hàng chuyển sang mã PURCHASE | TB | Seed tự động: nhóm nào có PRODUCTION thì được chép y nguyên sang PURCHASE. Không ai mất quyền ngày đầu |
| I-03 ⚠ | P1 | Nhóm đang dùng Marketing/Social/TikTok qua quyền SALES | Chuyển sang mã MARKETING | TB | Seed chép từ SALES sang MARKETING |
| I-04 ⚠ | P1 | Người vào Cài đặt hệ thống, ZNS | Cài đặt chuyển sang mã SYSTEM | TB | Seed chép từ USERS sang SYSTEM (nhóm đã có SYSTEM thì giữ nguyên) |
| I-05 ⚠ | P2 | Người dùng **CMS website** (cms.nemmamnon.com) | Ghi nội dung CMS cần quyền CMS. Hiện CMS cho mọi tài khoản ERP đăng nhập | CAO | Chủ dự án cho danh sách nhóm dùng CMS (D4); seed CMS cho các nhóm đó |
| I-06 | P0 | Không ai | 22 file frontend đổi từ `axios` sang `api`. Chỉ thêm token, không đổi dữ liệu | THẤP | Test các trang Kế hoạch, NCC, Vật tư, Danh mục, Marketing, TikTok, Social, Công đoạn |
| I-07 ⚠ | P1–P2 | Website, portal khách/NCC/ứng viên, webhook GHTK/Lalamove/TikTok | **Phải giữ public**. Nếu sót, website mất dữ liệu hoặc trạng thái vận đơn không cập nhật | CAO | Whitelist 53 route; test website + 4 portal + webhook trước ENFORCE (ACCEPTANCE nhóm PUB) |
| I-08 ⚠ | P0 | Kế toán/mua hàng | Nút **Thanh toán công nợ gộp PO** ở trang Nhà cung cấp **hiện đang lỗi 401** (gọi `axios` không kèm token). Sau P0 nút sẽ chạy thật | TB | Báo người dùng biết; test một lần với số tiền nhỏ |
| I-09 ⚠ | P2 | Thiết bị/script ngoài gọi API không token (máy chấm công, Google Sheet, n8n, server khác…) | Bị chặn | CAO nếu có | Chủ dự án xác nhận (D9); log SHADOW sẽ lộ ra IP/route gọi ẩn danh |
| I-10 ⚠ | P3 | User bị khoá (`is_active=false`) | Hiện vẫn dùng được đến khi token hết hạn (1 ngày). Sau P3 bị đẩy ra trong ≤ 60 giây | TB | Thông báo cho HR/admin |
| I-11 | P3 | Tài khoản `admin` | Chuyển từ nhận diện bằng tên sang cờ `is_super_admin`. Giữ fallback theo tên trong suốt P3 | THẤP | Migration tự set cờ cho `admin` |
| I-12 ⚠ | P3 | Người đang sửa user (UsersPage) | `PUT /users/:id` không cho đổi `password`/`group_id` nếu không có USERS:update; đổi mật khẩu người khác cần USERS:update | TB | Tự đổi mật khẩu của mình vẫn được |
| I-13 | P0 | Mọi user | Quyền đổi xong có hiệu lực khi user tải lại trang (qua `/auth/me`), không cần đăng xuất/đăng nhập | THẤP (tích cực) | — |
| I-14 ⚠ | P4 | Người đang xem giá vốn | Nếu bật lọc giá vốn ở API, ai không có `view_cost_price` sẽ không thấy giá vốn ở mọi màn hình (hiện chỉ ẩn ở UI, API vẫn trả) | CAO | Chưa làm cho đến khi chủ dự án duyệt |
| I-15 | P1 | Nhân viên dùng trang Hồ sơ (chấm công, xin nghỉ, xem lương của mình) | Trang Hồ sơ chuyển sang API `/hr/me/*`, chỉ trả dữ liệu của chính mình. Nhân viên không thấy thay đổi; hết lỗi xem được lương/nghỉ phép của người khác | THẤP (tích cực) | Theo D7 (đã chốt) |
| I-16 | P5 | Khách xem báo giá trên portal | Comment/xoá comment chuyển sang theo `uuid` báo giá, không theo id số | THẤP | Link đã gửi khách vẫn giữ nguyên |
| I-17 ⚠ | P2 ENFORCE | Nhân sự **không phải admin** đang làm lương, chấm công hộ, duyệt phép | Theo D7 chỉ Admin thao tác hồ sơ người khác. Nhóm nào đang có quyền HR mà Chủ dự án bỏ đi thì mất các thao tác này | CAO nếu có | REPORT P1 liệt kê nhóm đang có HR; Chủ dự án quyết bỏ hay giữ trước ENFORCE |
| I-18 ⚠ | P2 ENFORCE | Kế toán (nhóm Accounting_manager: FINANCE=xem, PURCHASE=không) | Hiện vẫn ghi thanh toán được vì route chỉ kiểm đăng nhập. Sau P1 cần FINANCE:create + PURCHASE:view. Không tick thêm thì mất quy trình thanh toán công nợ NCC | CAO | Chủ dự án tick quyền trước ENFORCE (P1 Phụ lục B) |
| I-19 ⚠ | **P1 deploy** (chặn thật, không qua SHADOW — D12) | Người không có quyền HR gọi API HR cũ (hồ sơ, chấm công, nghỉ phép, lương, tài sản, đánh giá) | 403 ngay khi deploy P1. Chỉ nhóm Admin (admin, thuhang) dùng được; nhân viên dùng /hr/me | THẤP (không ai đang dùng hợp lệ) | Ai đang mở ERP bản cũ cần F5 |
| I-20 ⚠ | P2 ENFORCE | Nhà cung cấp dùng portal PO (xem danh sách NPL gia công) và khách xem cấu hình B2B trên website | Hai route ẩn danh bị matrix gán nhầm (E5, E6): nếu bật ENFORCE trước khi sửa, NCC không xem được NPL và watermark B2B mất | CAO | P2.0-a, P2.0-b bắt buộc trước ENFORCE |

## 6. Quyết định cần chủ dự án chốt

| ID | Câu hỏi | Đề xuất của tao | Chặn phase |
|---|---|---|---|
| D1 | Tách Mua hàng ra mã **PURCHASE** riêng (thay vì dùng PRODUCTION)? | Có, seed chép từ PRODUCTION — **Chốt 2026-09-25: Tách PURCHASE** | P1 |
| D2 | Tách **MARKETING** khỏi SALES? | Có, seed chép từ SALES — **Chốt 2026-09-25: Tách MARKETING** | P1 |
| D3 | Tách **SYSTEM** (cấu hình tích hợp, SMTP, hoá đơn) khỏi USERS? | Có, seed chép từ USERS — **Chốt 2026-09-25: Tách SYSTEM** | P1 |
| D4 | Nhóm nào đang dùng **CMS website**? | Cho tao danh sách nhóm để seed quyền CMS — **Chốt 2026-09-25: Tạo nhóm quyền CMS riêng, Chủ dự án tự gán user** | P1 |
| D5 | Thiết kế in/thêu (`/designs`) thuộc PRODUCT (backend) hay PRODUCTION (menu)? | Tạm cho **một trong hai** (any-of), sau chốt một — **Chốt 2026-09-25: Tạm cả hai (PRODUCT hoặc PRODUCTION)** | P1 |
| D6 | Tra cứu danh mục (sản phẩm, vật tư, NCC, công đoạn, danh mục) cho **mọi user đã đăng nhập** xem? | Có. Giá vốn xử lý ở P4 — **Chốt 2026-09-25: Mọi user đã đăng nhập xem** | P1 |
| D7 | Chấm công, nghỉ phép, phiếu lương **của chính mình**: mọi nhân viên tự làm được? | Có (AUTH + kiểm tra đúng chủ hồ sơ) — **Chốt 2026-09-25: Chỉ hồ sơ của mình; hồ sơ người khác chỉ Admin** | P1 |
| D6b | API sản phẩm có mở cho mọi user (kèm giá vốn)? | Không — giữ PRODUCT:view — **Chốt 2026-09-25** | P1 |
| D12 | Vá ngay lỗ xem lương/HR người khác ở P1 hay chờ P2? | Vá ngay — **Chốt 2026-09-25** | P1 |
| D8 | SHADOW chạy bao lâu? | ≥ 10 ngày làm việc, có một kỳ cuối tháng (lương, công nợ) | P2 |
| D9 | Có thiết bị/script/hệ thống nào gọi API ERP **không đăng nhập** không? | Liệt kê giúp tao; nếu không rõ thì để log SHADOW tìm | P2 |
| D10 | Ngoài `admin`, ai là super admin? | Chỉ `admin` + 1 tài khoản dự phòng | P3 |
| D11 | Agent API (`/api/api/v1/agent`, dùng API key) đang được ai/hệ thống nào gọi? | Nếu không ai dùng thì tắt ở P3 | P3 |

## 7. Vai trò và quy trình

| Vai | Ai | Việc |
|---|---|---|
| Chủ dự án | Mày | Chốt D1–D11, ký go-live P2 |
| BA / Planning / Audit | Claude | Viết plan + instruction, audit từng PR theo `ACCEPTANCE.csv`, báo cáo rủi ro |
| Thợ code | Antigravity | Code theo `P*_Instruction.md`, điền `ACCEPTANCE.csv`, viết `REPORT_P*.md` |

Vòng mỗi phase: Antigravity code → điền `ACCEPTANCE.csv` + `REPORT_Pn.md` → Claude audit (đọc diff + chạy test) → pass thì merge/deploy, fail thì trả về với danh sách lỗi.

## 8. Ghi chú cho bản erp4u (không làm ở đây)

Để sẵn cho bản thương mại: JWT secret lấy từ env và fail khi thiếu, bỏ chấp nhận mật khẩu plaintext, rate limit OTP/login, chữ ký webhook GHTK/Lalamove/TikTok, bỏ publish port 5432/3000, image ghcr private, `trust proxy` đặt đúng số hop proxy (hiện `true` nên IP client giả được, xem AUDIT_P0 E1). Xem `02_Current-State-Audit.md` mục C.
