-- RBAC v2 test env: BẮT BUỘC chạy ngay sau mỗi lần restore dump production vào máy local.
-- Mục đích: chặn bản copy gọi ra dịch vụ thật (gửi mail thật, xoay token Zalo/TikTok làm hỏng production)
-- và cho phép đăng nhập thử bằng mọi tài khoản.

BEGIN;

-- 1. Cấu hình tích hợp trong system_configs: xoá giá trị bí mật
UPDATE system_configs SET value = ''
WHERE key ~* '^SMTP_(HOST|USER|PASS)$'
   OR key ~* '(EASYINVOICE|GHTK|LALAMOVE|ZALO|ZNS|TIKTOK|GEMINI)'
   OR key ~* '(TOKEN|SECRET|PASSWORD|API_KEY)';

-- 2. Token kênh social / TikTok
UPDATE social_channels SET access_token = NULL, refresh_token = NULL;

-- 3. Phiên portal khách hàng đang mở
DELETE FROM portal_sessions;

-- 4. Zalo ZNS (bảng có thể chưa tồn tại trong dump cũ)
DO $$
BEGIN
  IF to_regclass('public.zalo_api_configs') IS NOT NULL THEN
    EXECUTE 'UPDATE zalo_api_configs SET access_token = NULL, refresh_token = NULL, secret_key = NULL';
  END IF;
END $$;

-- 5. Mật khẩu: đặt mọi tài khoản về mật khẩu test (login hiện chấp nhận so khớp plaintext — hành vi có sẵn)
UPDATE users SET password = 'test-local';

-- 6. Đánh dấu DB là bản test
INSERT INTO system_configs (key, value, description)
VALUES ('TEST_ENV_SANITIZED', to_char(now(), 'YYYY-MM-DD HH24:MI'), 'Bản copy local đã làm sạch')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;

-- Kiểm tra nhanh (phải ra 0 dòng có giá trị)
SELECT key FROM system_configs WHERE key ~* '(PASS|TOKEN|SECRET)' AND coalesce(value, '') <> '';
