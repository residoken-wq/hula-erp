# P1 — Tri thức, facts sản phẩm, giá (admin trong CMS)

**Điều kiện:** P0 đã merge (main @ `4210b60`). Q-02 chốt 2026-09-26: **màn quản trị đặt trong CMS** (`hula-web/cms`).
**Nhánh:** `chatbot/p1` (Claude đã tạo từ main, có sẵn instruction và script nghiệm thu). Làm tiếp trên nhánh này, không tạo nhánh mới.
**Sau deploy:**
- Khách không thấy gì (cờ tắt).
- CMS có thêm menu **"Trợ lý AI"** cho `admin` và cho người có quyền `CHATBOT_KB`.

> **Luật nghiệm thu P1 (mới, để rút ngắn thời gian):**
> - Claude đã viết sẵn `scripts/chatbot/accept-p1.js`. Đó là **hợp đồng**: code phải làm script chạy xanh, **không sửa script**.
> - Thấy script sai thì ghi vào REPORT mục 4, làm tiếp phần khác.
> - Evidence P1 chỉ cần: output của script, `npm run qa`, và 3 ảnh CMS (P1.6).
> - Không cần viết smoke riêng.

---

## P1.1 Bảng dữ liệu

Bốn loại nội dung có vòng đời duyệt dùng **chung khung cột**:

| Cột chung | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `item_key` | uuid | Giữ nguyên qua các phiên bản của cùng một mục |
| `version` | int | Tăng từ 1 |
| `status` | varchar(16) | `draft` / `needs_review` / `published` / `retired` |
| `topic` | varchar(80) | Dùng để khoá theo conflict. Chỉ loại `knowledge` do người nhập; loại khác tự sinh (xem dưới) |
| `source_refs` | jsonb default `[]` | |
| `conflict_code` | varchar(4) null | Ví dụ `D03` |
| `effective_from`, `effective_to` | date null | Với `prices` là `valid_from` / `valid_to` |
| `author_id`, `approver_id` | int null | |
| `approved_at`, `created_at`, `updated_at` | timestamptz | |

- Ràng buộc: `UNIQUE(item_key, version)`, và unique index **có điều kiện** `ON (item_key) WHERE status='published'` (mỗi mục tối đa một bản đang xuất bản).
- Tên index trong entity **phải trùng** DDL (bài học m4 của P0).

| Bảng | Cột riêng |
|---|---|
| `chatbot_knowledge_items` | `intent varchar(32) null`, `question text null`, `answer text not null`, `product_sku varchar(100) null`, `public_allowed boolean default false`, `search_text text` (bỏ dấu, chữ thường). Index GIN `to_tsvector('simple', search_text)` |
| `chatbot_product_facts` | `sku varchar(100)`, `fact_key varchar(32)`, `value text`, `unit varchar(16) null`. Topic tự sinh theo bảng `FACT_TOPIC` (P1.2) |
| `chatbot_bundles` | `code varchar(40)`, `name varchar(200)`, `items jsonb` (`[{sku, qty}]`). Topic = `bundle.<code>` |
| `chatbot_price_rules` | `target_type varchar(12)` (`sku/bundle/service`), `target_code varchar(100)`, `fabric varchar(40) null`, `qty_min int`, `qty_max int null`, `qty_scope varchar(12)` (`per_design/per_color/per_order`), `unit_price bigint` (VND), `currency varchar(3) default 'VND'`, `tax_rate numeric(5,2) null`, `tax_included boolean`, `shipping_included boolean default false`, `included_services jsonb default '[]'`, `excluded_services jsonb default '[]'`, `customer_scope varchar(40) default 'PUBLIC'`, `is_fixture boolean default false`. Topic = `price.<target_type>.<target_code>` |
| `chatbot_conflicts` | `code varchar(4) PK`, `title text`, `risk text`, `locked_topics text[]`, `owner_role varchar(40)`, `status varchar(10) default 'open'`, `resolution text null`, `resolved_by int null`, `resolved_at timestamptz null` |
| `chatbot_sources` | `code varchar(10) PK`, `title text`, `internal_ref text` (URL Google Docs, **chỉ trả cho admin**, không bao giờ vào tool), `sensitivity varchar(16)`, `imported_at` |

DDL trong `ChatbotSchemaService` (nối tiếp P0), đăng ký entity, loại trừ khỏi `shouldLog()` (tiền tố `Chatbot` đã được loại sẵn ở P0).

## P1.2 Luật nghiệp vụ (service `ChatbotKbService`, mọi thao tác ghi đều trong transaction + audit)

1. **Tạo:** status `draft`, `version=1`, `item_key` mới.
2. **Sửa:** nếu bản đang sửa là `draft`/`needs_review` thì sửa tại chỗ. Nếu là `published` thì tạo **bản mới** (`version+1`, cùng `item_key`, status `draft`), bản đang chạy giữ nguyên. Sửa bản `retired` → 400 `INVALID_STATE`.
3. **Gửi duyệt:** `draft` → `needs_review`.
4. **Xuất bản** (từ `draft` hoặc `needs_review`):
   - (a) Kiểm khoá: nếu `conflict_code` là conflict đang `open`, **hoặc** `topic` khớp một pattern trong `locked_topics` của conflict `open` bất kỳ (pattern `price.*` nghĩa là topic bắt đầu bằng `price.`), thì 409 `{code:'CONFLICT_LOCKED', conflicts:['D03',…]}`.
   - (b) `prices`: nếu `is_fixture=true` mà env `CHATBOT_ALLOW_FIXTURES` khác `'true'` thì 400 `{code:'FIXTURE_NOT_ALLOWED'}`. **Không bao giờ** đặt env này trên VPS.
   - (c) `prices`: đã có rule `published` **cùng** `target_type`, `target_code`, `fabric` (null coi như một giá trị), `customer_scope`, và **giao nhau** cả khoảng số lượng lẫn khoảng ngày, thì 409 `{code:'PRICE_CONFLICT', rule_ids:[…]}`.
   - (d) Bản `published` cũ cùng `item_key` chuyển sang `retired`, bản mới thành `published`. Ghi `approver_id`, `approved_at`. `CHATBOT_KB_VERSION` +1 (UPSERT nguyên tử như `LlmBudgetService`). Audit `kb.publish`.
5. **Thu hồi:** `published` → `retired`, `kb_version` +1, audit `kb.retire`.
6. **Giải quyết conflict:** `PUT conflicts/:code {status:'open'|'resolved', resolution}`. Ghi `resolved_by`, `resolved_at`. `kb_version` +1, audit `kb.conflict`.
7. **Validate theo loại:**
   - `knowledge`: `topic` và `answer` bắt buộc; `topic` khớp `^[a-z0-9_.]+$`.
   - `facts`: `sku` phải là sản phẩm có `show_on_website=true`, không thì 400 `SKU_NOT_ON_WEBSITE`. `fact_key` thuộc `FACT_TOPIC`.
   - `bundles`: `items` ≥ 1, mọi `sku` phải là sản phẩm website, `qty ≥ 1`.
   - `prices`: `qty_min ≥ 1`, `qty_max ≥ qty_min` nếu có, `unit_price ≥ 0` và là số nguyên, `valid_from` bắt buộc, `customer_scope` khớp `^(PUBLIC|CUSTOMER:\d+)$`.
   - Chặn trường lạ: 400.
8. **`FACT_TOPIC`:**
   - `size → product.spec.size`
   - `structure → product.spec.structure`
   - `finished_thickness → product.thickness.finished`
   - `material → product.material_claim`
   - `care_instruction → product.care`
   - `age_guidance → product.age`
   - `anti_slip → product.spec.anti_slip`
   - `bag_fit → bundle.bag_fit`
   - `other → product.other`
9. **`publicScope` (một hàm duy nhất, mọi tool đều dùng):** `status='published'` và ngày hôm nay (giờ VN) nằm trong `[effective_from, effective_to]` (null = không giới hạn). Riêng `knowledge` thêm điều kiện `public_allowed=true`; riêng `prices` thêm `customer_scope='PUBLIC'`.
10. **`normalizeVi(text)`:** NFD, bỏ dấu, `đ→d`, chữ thường, gộp khoảng trắng. Dùng để tính `search_text` và câu truy vấn.

## P1.3 Seed `CHATBOT_KB_SEED_V1` (idempotent, một transaction)

- `chatbot_sources`: S1, S2, S3, S4, A1, SPEC. `internal_ref` lấy URL từ SPEC §1.
- `chatbot_conflicts`: **đủ 16 dòng D01–D16** từ SPEC §3, `status='open'`. `locked_topics` tối thiểu:
  - D01, D02, D13 → `price.*`
  - D03, D04 → `product.thickness.*`
  - D05 → `service.logo.*`, `price.service.*`
  - D06 → `moq.*`
  - D07 → `leadtime.*`
  - D08 → `product.label.*`
  - D09 → `bundle.bag_fit*`
  - D10 → `shipping.*`
  - D11 → `tax.*`
  - D12 → `policy.return.*`, `policy.warranty.*`
  - D14 → `order.*`
  - D15 → `product.material_claim*`
  - D16 → `payment.*`, `contact.bank*`
- `chatbot_knowledge_items`:
  - 11 dòng từ SPEC §4.2: `topic='product.spec.<slug>'`, `needs_review`, `public_allowed=false`, `source_refs` và ghi chú lưu ý đặt trong `answer`.
  - 8 mẫu câu từ SPEC §6.7: `topic='script.<slug>'`, `draft`, `public_allowed=true`.
- Trước khi ghi: `scanPii()` (SĐT VN, email, chuỗi 9–14 chữ số). Có kết quả thì rollback và log lỗi.
- **Eval cases dời sang P3** (P1 không làm).

## P1.4 API quản trị (prefix `/api/chatbot/admin/kb`, mẫu cặp quyền như P0)

Controller `ChatbotKbController`, `@UseGuards(JwtAuthGuard, PermissionsGuard)` ở class, mỗi method một cặp `@RequirePermission('CHATBOT_KB','can_x')` + `@Perm('CHATBOT_KB','x')`. `:type` ∈ `knowledge|facts|bundles|prices`, giá trị khác → 400.

| id | Method | Route | Quyền | Trả về |
|---|---|---|---|---|
| CB-101 | GET | `/:type?status=&topic=&q=&sku=&page=&limit=` | view | `{items, total}` |
| CB-102 | GET | `/:type/:id` | view | item + `versions:[{id,version,status,updated_at}]` + `previous_published` (để CMS hiển thị so sánh) |
| CB-103 | POST | `/:type` | create | **201** item (`draft`) |
| CB-104 | PUT | `/:type/:id` | update | item (có thể là bản mới, xem P1.2.2) |
| CB-105 | POST | `/:type/:id/submit` | update | item |
| CB-106 | POST | `/:type/:id/publish` | **delete** | item, hoặc lỗi P1.2.4 |
| CB-107 | POST | `/:type/:id/retire` | **delete** | item |
| CB-108 | GET | `/conflicts` | view | `{items:[{code,title,risk,locked_topics,owner_role,status,resolution,resolved_by,resolved_at}]}` |
| CB-109 | PUT | `/conflicts/:code` | **delete** | conflict |
| CB-110 | GET | `/website-products?q=` | view | `{items:[{sku,name,display_name,image_url}]}` (chỉ `show_on_website=true`, tối đa 50) |
| CB-111 | GET | `/version` | view | `{kb_version:number, allow_fixtures:boolean}` |
| CB-112 | POST | `/preview` | view | `{result}`: chạy tool P1.5 bằng `publicScope`; body `{tool, args, ignore_feature_flag?:boolean}` |
| CB-113 | GET | `/sources` | view | `{items}` (có `internal_ref`, chỉ admin CMS thấy) |

- **Thứ tự route:** các route tĩnh (`conflicts`, `website-products`, `version`, `preview`, `sources`) phải khai báo **trước** `/:type`.
- Mỗi route có dòng `CB-1xx` trong `route-matrix.csv`, cùng commit.

Item trả về có đủ cột chung + cột riêng. Với `prices`, `effective_from/to` trả thêm dưới tên `valid_from/valid_to`, và create/update nhận **cả hai tên**.

## P1.5 Tool chỉ-đọc (`ChatbotToolsService`, P3 dùng lại; P1 truy cập qua `/preview`)

| tool | args | result |
|---|---|---|
| `searchKnowledge` | `{query, intent?, limit?≤5}` | `{items:[{id,item_key,version,topic,question,answer}]}`: FTS `simple` trên `search_text` bằng `plainto_tsquery` (**mọi từ phải khớp — AND**); không có kết quả thì `ILIKE` từng từ, cũng AND |
| `searchCatalog` | `{keywords?, skus?}` | `{items:[{sku,name,image_url,facts:[{fact_key,value,unit}]}]}`: chỉ sản phẩm website **có ≥ 1 fact** trong `publicScope`; tối đa 5 |
| `getProductDetails` | `{sku}` | `{product:{sku,name,image_url,facts:[…]}}`, hoặc `{product:null}` nếu không phải sản phẩm website |
| `compareProducts` | `{skus:[2..3]}` | `{skus, rows:[{fact_key, values:{<sku>: string}}]}`: giá trị = `value` + (` ` + `unit` nếu có), ví dụ `120x60 cm`; thiếu fact thì **`chưa xác nhận`**; ngoài khoảng 2–3 SKU → 400 |
| `getPriceEstimate` | `{target_type, target_code, quantity, fabric?, services?:[{code, quantity?}], requested_tier_qty?}` | `{status, reason?, lines:[…], total?, missing:[], currency:'VND'}` |

`getPriceEstimate`, tính bằng **số nguyên VND**:
1. `features.price_estimate=false` và không có `ignore_feature_flag` (chỉ `/preview` được truyền) → `{status:'disabled'}`.
2. `requested_tier_qty > quantity` → `{status:'needs_sales', reason:'discount_request'}`.
3. Lấy rule trong `publicScope` của đúng target, thỏa `qty_min ≤ quantity ≤ (qty_max ?? ∞)`, có `fabric` bằng giá trị truyền vào hoặc null. Nếu có cả rule fabric cụ thể lẫn rule null thì ưu tiên rule cụ thể. Còn lại 0 rule → `needs_sales`/`no_rule`; từ 2 rule cùng mức cụ thể trở lên → `needs_sales`/`conflicting_rules`.
4. Mỗi dòng: `subtotal = unit_price × quantity`.
   - `tax_included=true` → `tax=0`.
   - Không gồm thuế mà có `tax_rate` → `tax = round(subtotal × tax_rate / 100)`.
   - Không gồm thuế và `tax_rate` null → dòng đó bị ghi `missing:['tax:<code>']`.
   - `total = subtotal + tax`.
5. Mỗi `services[i]` tìm rule `target_type='service'`, `target_code=code` theo cùng cách. Không có thì ghi vào `missing`.
6. `missing` rỗng → `status:'available'`, có `total` = tổng các dòng. Ngược lại → `status:'partial'`, **không có** `total`.
7. Kết quả **không bao giờ** chứa `customer_scope`, id khách hay rule riêng.

## P1.6 CMS (`hula-web/cms`)

1. `src/lib/api.ts` thêm `chatbotKbApi` gọi các route P1.4 (dùng axios `api` có sẵn, kèm token).
2. `AdminLayout.tsx` thêm nhóm menu **"Trợ lý AI"** (icon `RobotOutlined`). Chỉ hiện khi `user.username === 'admin'` **hoặc** `hasPermission('CHATBOT_KB','view')`. Trang con:

   | Route CMS | Nội dung |
   |---|---|
   | `/chatbot/knowledge` | Bảng lọc theo status/topic/từ khoá; Drawer soạn (topic, câu hỏi, trả lời, SKU, cho phép công khai, nguồn, conflict, hiệu lực); tab **So sánh** với bản đang xuất bản (hiển thị từng trường, tô màu trường khác); nút Gửi duyệt / Xuất bản / Thu hồi |
   | `/chatbot/products` | Chọn SKU từ `website-products` (có ảnh), danh sách facts, thêm/sửa fact; tab **Bộ sản phẩm** |
   | `/chatbot/prices` | Bảng rule; form theo P1.1; **tag đỏ "FIXTURE"**; lỗi `PRICE_CONFLICT`/`CONFLICT_LOCKED` hiện rõ mã conflict |
   | `/chatbot/conflicts` | D01–D16: trạng thái, topic bị khoá, người phụ trách, ô giải quyết |
   | `/chatbot/tools` | Form "Thử công cụ" gọi `/preview` (5 tool), hiển thị JSON kết quả. Có checkbox "Bỏ qua cờ dự toán" |

3. Nút Xuất bản / Thu hồi / Giải quyết conflict chỉ hiện khi `username==='admin'` hoặc `hasPermission('CHATBOT_KB','delete')`. Server vẫn là nơi kiểm quyền.
4. Lỗi 401/403 dùng handler sẵn có. Hiển thị `message` và `code` từ server.
5. Không dùng `dangerouslySetInnerHTML`. Nội dung tri thức hiển thị dạng text (`white-space: pre-wrap`).
6. Không có chữ "Cừu Hula" cứng: tiêu đề menu là "Trợ lý AI". Đưa `hula-web/cms/src/app/chatbot/**` vào phạm vi `check-no-hardcoded-name.js` và `check-no-secrets.js`.
7. **3 ảnh evidence:** trang knowledge có tab so sánh; trang prices có một rule FIXTURE và thông báo lỗi `CONFLICT_LOCKED`; trang tools có kết quả `getPriceEstimate`.

## P1.7 Chạy nghiệm thu

```bash
bash docs/rbac_v2/test-env/pgenv.sh reset
npx nest build
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=hula_user DB_PASSWORD=hula_password DB_DATABASE=hula_db \
  PORT=3999 NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true node dist/main.js &
node scripts/chatbot/accept-p1.js > docs/chatbot/evidence/P1/accept-p1.txt
npm run qa
```

- `NODE_ENV=production` để chứng minh DDL chạy được khi synchronize tắt.
- Script tự cấp quyền `CHATBOT_KB` (VCU--) cho nhóm **Planning Manager** (user `lou`) bằng SQL để kiểm "soạn được nhưng không duyệt được". Đây chỉ là dữ liệu test-env.
- Script tạm giải quyết D01, D02, D03, D13 để test xuất bản giá và khoá, rồi mở lại. **Mỗi lần chạy script cần DB vừa `pgenv.sh reset`** (script tạo dữ liệu và đếm chính xác).
- **Tắt backend sau khi chạy xong** (P0: cổng 3999 bị giữ làm lệch audit).

## Không làm ở P1
- Không widget, không LLM, không eval cases.
- Không sửa ERP frontend.
- Không đọc/sửa `price_list_rules` hay `sales_orders`.
- Không nhập giá thật.
