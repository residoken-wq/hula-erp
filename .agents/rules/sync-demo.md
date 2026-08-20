---
description: Quy trình và lệnh đồng bộ cập nhật từ hula-erp sang repo public erp4u-demo
---

# Quy Trình Đồng Bộ: hula-erp → erp4u-demo

Workflow này hướng dẫn chi tiết cách đồng bộ các thay đổi từ repository nội bộ `hula-erp` sang repository demo public `erp4u-demo`.

---

## ⚡ Lệnh Thực Hiện Nhanh

### 1. Đồng bộ source code (kiểm tra thay đổi)
```bash
node scripts/sync_to_demo.js
# hoặc: npm run sync:demo (cmd / bash)
```

### 2. Đồng bộ và tự động tạo Git Commit trong repo demo
```bash
node scripts/sync_to_demo.js --commit
# hoặc: npm run sync:demo:commit
```

### 3. Đẩy thay đổi lên GitHub demo repository
```bash
cd ../erp4u-demo
git push origin main
```

---

## 🛡️ Nguyên Tắc An Toàn (Sync Rules)

Tập lệnh đồng bộ `scripts/sync_to_demo.js` tự động đảm bảo:

1. **Khử dữ liệu nhạy cảm (Sanitization)**:
   - Thay thế toàn bộ domain production (`nemmamnon.com`, `erp.nemmamnon.com`, IP thật) thành `demo.erp4u.local` / `localhost`.
   - Rebrand tự động toàn bộ `Hula ERP` / `Hula` / `hula_db` thành `ERP4U` / `erp4u` / `erp4u_db`.

2. **Bảo vệ PII (Mã hóa cột AES-256-GCM)**:
   - Các entity nhạy cảm (`Customer`, `CustomerContact`, `Supplier`, `SupplierContact`, `Employee`, `User`) luôn được tự động duy trì decorator `transformer: new EncryptionTransformer()` khi copy sang repo demo.

3. **Bảo tồn các file demo đặc thù**:
   - Không ghi đè các file cấu hình demo: `LICENSE` (AGPL-3.0), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docker-compose.demo.yml`, `vercel.json`, `src/common/encryption/`, `src/database/seeds/`.

4. **Tách biệt Firebase Backend**:
   - Repo demo sử dụng cơ chế Server-Sent Events (SSE) nội bộ, không yêu cầu hay mount file `firebase-service-account.json`.

5. **Tự động Audit sau mỗi lần Sync**:
   - Quét regex toàn bộ codebase `erp4u-demo` để phát hiện rò rỉ domain hay credentials. Nếu có cảnh báo, script sẽ thông báo ngay lập tức.
