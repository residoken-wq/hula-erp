# Sync Rule: hula-erp → erp4u-demo

> **Mục đích**: Đảm bảo mọi tính năng, sửa lỗi hoặc cải tiến mới trên `hula-erp` có thể đồng bộ sang repository demo public `erp4u-demo` một cách an toàn, tự động hóa và tuân thủ giấy phép mã nguồn mở AGPL-3.0.

---

## 📌 Quy Tắc Bắt Buộc Đối Với AI Assistant & Developers

1. **Sau khi hoàn thành tính năng hoặc sửa lỗi trên `hula-erp`**:
   - Chạy lệnh kiểm tra đồng bộ:
     ```bash
     node scripts/sync_to_demo.js
     ```
   - Xác nhận log báo cáo: `✨ AUDIT PASSED: Demo repo is 100% clean of sensitive strings and ready to push.`

2. **Nếu bổ sung Module hoặc Entity mới**:
   - Kiểm tra xem Entity mới có chứa thông tin khách hàng, số điện thoại, email, tài chính, CCCD/CMND hay thông tin cá nhân (PII) hay không.
   - Nếu có, đảm bảo cập nhật `scripts/sync_to_demo.js` để tự động đính kèm `EncryptionTransformer` cho các cột nhạy cảm đó.
   - Bổ sung dữ liệu mẫu vào bộ seeder tại `erp4u-demo/src/database/seeds/` (nếu cần minh họa cho người dùng demo).

3. **Không bao giờ push trực tiếp file secret sang demo**:
   - Tuyệt đối không commit file `.env`, `firebase-service-account.json`, hoặc tài khoản production vào repo `erp4u-demo`.
   - Mọi cấu hình kết nối DB, API URL trên demo phải trỏ về localhost hoặc đọc từ biến môi trường của `docker-compose.demo.yml`.

4. **Đồng bộ định kỳ & Release**:
   - Khi tạo release tag trên `hula-erp`, chạy `node scripts/sync_to_demo.js --commit` và push sang `erp4u-demo` để cộng đồng có thể trải nghiệm phiên bản mới nhất.
