# P1 — Dữ liệu, tri thức và quy trình duyệt

**Điều kiện:** P0 AUDIT_PASS, đã chốt Q-02. Nhánh `chatbot/p1`.
**Sau deploy:** người có `CHATBOT_KB` thấy menu "Trợ lý AI → Tri thức" trong ERP. Khách không thấy gì.
**Nguyên tắc:** mọi dữ liệu nhập từ SPEC mặc định ở trạng thái `draft` hoặc `needs_review`, `public_allowed=false`. **Không** tự đặt `approved_by`. **Không** có giá thật.

---

## P1.1 Bảng P1
Tạo `chatbot_sources`, `chatbot_knowledge_items`, `chatbot_conflicts`, `chatbot_product_facts`, `chatbot_bundles`, `chatbot_bundle_items`, `chatbot_price_rules`, `chatbot_eval_cases` theo 01 §3.2. Cách làm như P0.1 (DDL, đăng ký entity, loại trừ `shouldLog`).

- `search_text`: cột text đã bỏ dấu tiếng Việt và chữ thường, tính bằng JS khi lưu (`normalizeVi()`: NFD, bỏ dấu, `đ→d`).
- Index GIN `to_tsvector('simple', search_text)`. Không cần extension `unaccent`.

## P1.2 Vòng đời tri thức (áp dụng cho knowledge item, product fact, price rule, bundle)
`draft → needs_review → approved → published → retired`
- Soạn/sửa: `CHATBOT_KB:create/update`. Sửa một bản `published` thì tạo **phiên bản mới** ở `draft`, bản cũ vẫn chạy tới khi bản mới được xuất bản.
- Duyệt / xuất bản / thu hồi: `CHATBOT_KB:delete` (Q-05). Ghi `approver_id`, `approved_at`, audit.
- Chặn ở server:
  - Không xuất bản được item có `conflict_code` mà conflict còn `open`, hoặc item thuộc `locked_topics` của conflict `open`.
  - Price rule phải có đủ `valid_from`, `tax_included`, `qty_scope`. `is_fixture=true` thì **không bao giờ** xuất bản được khi `NODE_ENV=production`.
  - Hai price rule `published` trùng target + phạm vi số lượng + thời gian thì từ chối xuất bản bản thứ hai và báo xung đột.
- Nội dung public chỉ gồm bản `published` + `public_allowed=true` + đang trong `effective_from/to`. Viết **một** hàm `KnowledgeQuery.publicScope()` dùng chung cho mọi truy vấn phía khách, để không chỗ nào lọc thiếu (T33).
- `kb_version`: số tăng mỗi lần có xuất bản hoặc thu hồi, lưu `system_configs.CHATBOT_KB_VERSION`. Cache phía khách được khoá theo `kb_version`.

## P1.3 Seed từ SPEC (idempotent, key `CHATBOT_KB_SEED_V1`)
| Nguồn SPEC | Đích | Trạng thái |
|---|---|---|
| §1 bảng S1–S4, A1 | `chatbot_sources` (không chép URL Google Docs vào cột public; lưu ở `internal_ref`) | — |
| §3 D01–D16 | `chatbot_conflicts`, `status=open`, `locked_topics` theo bảng dưới | open |
| §4.2 thông số | `chatbot_knowledge_items` topic `product.spec.*`, kèm `source_refs` và ghi chú lưu ý của SPEC | `needs_review` |
| §6.7 mẫu câu | `chatbot_knowledge_items` topic `script.*` (không chứa dữ kiện thương mại) | `draft` |
| §5 31 tình huống + §16 T01–T40 | `chatbot_eval_cases` (input nhiều lượt do Antigravity viết thành hội thoại mẫu, kết quả bắt buộc chép từ SPEC) | — |

`locked_topics` tối thiểu: D01/D02/D13 → `price.*`; D03/D04 → `product.thickness.*`; D05/D06 → `service.logo.*`, `moq.*`; D07 → `leadtime.*`; D08 → `product.label.*`; D09 → `bundle.bag_fit.*`; D10 → `shipping.*`; D11 → `tax.*`; D12 → `policy.return.*`, `policy.warranty.*`; D15 → `product.material_claim.*`; D16 → `payment.*`, `contact.*`.

**Kiểm PII trước khi lưu eval case và knowledge seed:** chạy `scanPii()` (regex SĐT VN `(\+84|0)(3|5|7|8|9)\d{8}`, email, STK 9–14 chữ số liền). Có kết quả thì dừng seed và báo lỗi. Evidence ghi số kết quả = 0.

## P1.4 Facts sản phẩm và bộ
- `chatbot_product_facts` gắn với `products.sku` **đã có** và `show_on_website=true`. Không tạo sản phẩm mới, không sửa bảng `products`.
- Admin chọn SKU từ danh sách sản phẩm website, rồi thêm facts: `size`, `structure`, `finished_thickness`, `material_per_layer`, `care_instruction`, `age_guidance`, `anti_slip`, `bag_fit`.
- Bộ (`chatbot_bundles`): mã bộ, tên, danh sách SKU + số lượng. Thẻ sản phẩm phía khách lấy `name`, `image_url`, `website_display_name` từ `products` (read-only).

## P1.5 Công cụ đọc (dùng ở P3, viết và test ở P1)
`ChatbotToolsService`, mọi hàm chỉ đọc `publicScope()`:
- `searchCatalog({purpose, age_band, surface, components, keywords})` → tối đa 5 SKU/bộ có facts `published`, kèm `fact_ids`.
- `getProductDetails(sku)` → facts `published` + ảnh + `source_refs` + `version`.
- `compareProducts(skus[2..3])` → cùng bộ tiêu chí. Thiếu fact thì ghi `chưa xác nhận`.
- `searchKnowledge(query, intent)` → FTS trên `search_text`, tối đa 5 item.
- `getPriceEstimate({target, quantity, fabric, services[], customer_scope:'PUBLIC'})` → `{status: 'available'|'needs_clarification'|'needs_sales'|'disabled', lines[], total?, missing[], rule_ids[]}`:
  - `features.price_estimate=false` → `disabled`.
  - Chỉ dùng rule `published`, còn hiệu lực, `customer_scope='PUBLIC'`. Rule riêng của khách **không bao giờ** dùng cho phiên public (T06).
  - Không có rule đúng số lượng → `needs_sales`, không nội suy (T04). Hai rule xung đột → `needs_sales` (T05).
  - Tính tiền bằng số nguyên VND. `tax_included=true` thì không cộng thuế (T08). Thiếu dòng dịch vụ (túi, logo) → không trả `total`, liệt kê `missing` (T09).
  - Yêu cầu ưu đãi (ví dụ 70 bộ muốn giá 100) → `needs_sales` với `reason='discount_request'` (T07).

Unit test bằng rule `is_fixture=true` cho T04–T09, lưu output vào `evidence/P1/`.

## P1.6 Admin ERP (Q-02 = ERP frontend)
Trong `frontend/src/pages/chatbot/`, dùng `utils/api` và antd, theo mẫu trang có Table + Drawer + Form:

| Route | Nội dung | Quyền (menu **và** `<Route>` cùng điều kiện) |
|---|---|---|
| `/chatbot/knowledge` | Danh sách, lọc theo trạng thái/topic, soạn, diff giữa hai phiên bản, nút Gửi duyệt / Duyệt / Xuất bản / Thu hồi | `hasPerm('CHATBOT_KB')`; các nút duyệt chỉ hiện khi có `CHATBOT_KB` delete |
| `/chatbot/products` | Facts theo SKU, bộ | `hasPerm('CHATBOT_KB')` |
| `/chatbot/prices` | Rule giá; cảnh báo xung đột; nhãn FIXTURE đỏ | `hasPerm('CHATBOT_KB')` |
| `/chatbot/conflicts` | D01–D16, người phụ trách, giải quyết (ghi resolution, không tự đổi dữ liệu khác) | `hasPerm('CHATBOT_KB')` |
| `/chatbot/settings` | Sửa `CHATBOT_CONFIG` (không có ô bí mật) | `hasPerm('CHATBOT')` + update |

- Menu nhóm "Trợ lý AI" đặt cạnh CMS/Website trong `App.tsx`.
- Backend controller `chatbot/admin/knowledge|facts|bundles|prices|conflicts|eval-cases` theo mẫu P0.8, mọi route có dòng `CB-NNN` trong matrix.
- Kiểm quyền duyệt **ở server**: frontend ẩn nút không phải là kiểm soát.

## Không làm ở P1
- Không widget. Không LLM.
- Không đọc/sửa `price_list_rules`, `sales_orders`.
- Không nhập giá thật: giá thật do sales tự nhập và duyệt sau P5.

## Tự kiểm
- Draft/needs_review/hết hạn/retired **không** xuất hiện ở bất kỳ tool nào (CB1-02, CB1-03).
- User không có `CHATBOT_KB` delete gọi API duyệt → 403 (kể cả khi RBAC SHADOW).
- `pgenv.sh reset` + boot 2 lần: seed không nhân đôi.
