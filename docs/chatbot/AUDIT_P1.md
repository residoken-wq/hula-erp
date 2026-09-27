# AUDIT P1 — Chatbot: tri thức, facts, giá (CMS)

## VÒNG 1 — 2026-09-27 — **AUDIT_PASS**

- **Đối tượng:** `chatbot/p1` @ `0adfcf4`
- **Môi trường:** `pgenv.sh reset`, boot `NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true` ở cổng 4999
- **Script:** `scripts/chatbot/accept-p1.js` không bị sửa (diff so với `756ffb2` rỗng)

| Kiểm | Kết quả | Evidence |
|---|---|---|
| `accept-p1.js` do Claude chạy lại | **16/16 PASS** | `evidence/P1/claude-audit-r1-accept-p1.txt` |
| Chặn FIXTURE khi thiếu env (ngoài script) | Boot lại không có `CHATBOT_ALLOW_FIXTURES`: publish fixture → 400 `FIXTURE_NOT_ALLOWED`; rule thật → 200 | `claude-audit-r1-extra.txt` |
| DDL khi synchronize tắt | Seed KB chạy, không lỗi schema | log boot |
| check-rbac / public-callers | exit 0 / exit 0 (13 dòng CB-1xx) | extra |
| 2 script chatbot (đã phủ `hula-web/cms/src/app/chatbot`) | sạch (53 file / 46 file) | extra |
| jest chatbot / tsc backend / tsc CMS | 44/44 / 0 / 0 | extra |
| Phạm vi file | Chỉ `src/chatbot`, CMS chatbot + `AdminLayout` + `lib/api.ts`, route-matrix, 2 script. Không đụng ERP, `price_list_rules`, `src/ai` | diff |

**Errata của Claude:** P1.3 cho D03 và D04 cùng khoá `product.thickness.*`, như vậy giải quyết D03 vẫn bị D04 khoá, mâu thuẫn với CB1-05. Antigravity đổi D04 thành `product.thickness.foam*`: đúng ý SPEC D04 (foam). Chấp nhận.

**MINOR, chuyển thành việc tồn P2 (không chặn):**
- m1: `hula-web/cms/tsconfig.tsbuildinfo` là file build, bị commit. Xoá khỏi git, thêm vào `.gitignore` của CMS.
- m2: thiếu 3 ảnh CMS (P1.6.7). **WAIVED**, Chủ dự án kiểm trên prod: menu "Trợ lý AI" hiện với `admin`, ẩn với user không có `CHATBOT_KB`; so sánh phiên bản; giá FIXTURE báo lỗi khoá.
- m3: REPORT gọi bảng audit là `chatbot_audit_logs`, tên đúng là `chatbot_audit_events`.

**Ảnh hưởng vận hành khi deploy P1:**
- Khách không thấy gì.
- CMS có menu "Trợ lý AI" cho `admin`. Người khác cần được tick `CHATBOT_KB` (tick xoá = được duyệt).
- Backend tạo thêm 6 bảng và seed 16 conflict, 19 mục tri thức nháp.
- Không cần env mới. **Không đặt** `CHATBOT_ALLOW_FIXTURES` trên VPS.
