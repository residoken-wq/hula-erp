# Môi trường test local cho RBAC v2 (bắt buộc từ P1)

Claude dựng và kiểm chứng ngày 2026-09-25. Dùng Git Bash, chạy từ thư mục gốc repo.

## Thành phần (đều nằm NGOÀI repo)

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| PostgreSQL 15.18 portable | `C:\pg15\pgsql` | Khớp phiên bản VPS. Data ở `C:\pg15\data`, cổng **5432**, user `hula_user` / `hula_password` |
| `pg_restore` 17.6 | `C:\pg17tools\pgsql\bin` | Dump được tạo bằng pg_dump 17 nên bắt buộc dùng bản này |
| Dump production 23/08 | `backups/dump-hula_db-202608232001.sql` | **Dữ liệu thật.** Đã gitignore; không commit, không gửi ra ngoài |

## Lệnh

```bash
bash docs/rbac_v2/test-env/pgenv.sh start    # bật DB
bash docs/rbac_v2/test-env/pgenv.sh reset    # restore dump + sanitize (mỗi lần muốn DB sạch như prod)
bash docs/rbac_v2/test-env/pgenv.sh stop     # tắt DB khi xong
```

`reset` in ra `users=9 groups=6 perms=96 sanitized=<giờ>`. Lỗi `transaction_timeout` khi restore là bình thường.

## Chạy backend trên bản copy

```bash
npx nest build
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=hula_user DB_PASSWORD=hula_password DB_DATABASE=hula_db \
  PORT=3999 NODE_ENV=development node dist/main.js
```

- **Phải dùng `NODE_ENV=development`.** Schema trong dump cũ hơn code; `synchronize` sẽ tự bổ sung cột thiếu. Chạy `production` thì `/sales`, `/purchasing`, `/planning`, `/finance/summary` trả 500 vì thiếu cột (xem mục Phát hiện).
- Đăng nhập **mọi tài khoản** bằng mật khẩu `test-local`. `sanitize.sql` đã đặt lại mật khẩu.
- Cổng 3999, để không đụng app khác. Frontend dev: `cd frontend && VITE_API_URL=http://localhost:3999/api npm run dev`.

## An toàn: vì sao phải chạy `sanitize.sql`

Bản copy chứa token và mật khẩu thật. Không làm sạch thì backend local sẽ:
- **Gửi mail thật** cho khách, nhân viên, ứng viên qua SMTP thật.
- **Xoay refresh token Zalo/TikTok** (cron 4 giờ/lần), làm production mất token.

`sanitize.sql` xoá SMTP, token tích hợp, token social, phiên portal; đặt mật khẩu `test-local`; ghi mốc `TEST_ENV_SANITIZED`. **Chưa thấy mốc này thì không được chạy backend.**

## Phát hiện khi dựng môi trường (cho Chủ dự án)

- Code hiện tại dùng các cột `sales_orders.vat_invoice_data`, `transactions.status`, `purchase_orders.expected_delivery_date`, nhưng không có lệnh tạo trong `onModuleInit`, còn dump 23/08 thì chưa có các cột này. Production vẫn chạy bình thường, nên **gần như chắc chắn production đang chạy với `synchronize` BẬT** (`NODE_ENV` ≠ `production`): TypeORM tự sửa schema DB thật mỗi lần deploy.
- Hệ quả cho RBAC: DDL trong `onModuleInit` vẫn cần viết (phòng khi sau này tắt synchronize), nhưng hiện chưa phải là cơ chế tạo bảng chính.
- Việc này thuộc cấu hình bảo mật, **ngoài phạm vi**. Chỉ ghi nhận để Chủ dự án biết, không sửa.
