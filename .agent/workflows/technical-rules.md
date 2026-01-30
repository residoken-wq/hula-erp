---
description: Quy tắc kỹ thuật khi tạo module/tính năng mới để tránh lỗi lặp lại
---

# Technical Rules - HULA ERP

## 🔴 CRITICAL: API URL Configuration

### Website Frontend (Next.js SSR)

Khi tạo trang mới có fetch data phía server:

```typescript
// ✅ ĐÚNG - Logic thống nhất cho tất cả server-side fetch
const getApiUrl = () => {
    if (process.env.API_URL) {
        return `${process.env.API_URL}/api`;  // Internal: http://hula_app:3000/api
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
};

// Sử dụng
const apiUrl = getApiUrl();
const res = await fetch(`${apiUrl}/public/your-endpoint`, { cache: 'no-store' });
```

```typescript
// ❌ SAI - Không dùng trực tiếp NEXT_PUBLIC_API_URL cho SSR
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/policies`);
```

### Lý do:
- `API_URL` = `http://hula_app:3000` (không có `/api`) - dùng cho internal Docker network
- `NEXT_PUBLIC_API_URL` = `https://erp.nemmamnon.com/api` (đã có `/api`) - dùng cho client-side

### Docker Compose Environment:
```yaml
environment:
  - API_URL=http://hula_app:3000           # Không có /api
  - NEXT_PUBLIC_API_URL=https://erp.nemmamnon.com/api  # Có /api
```

---

## 🟡 CMS (Ant Design) 

### Layout Wrapper
Mọi trang CMS **phải** wrap với `AdminLayout`:

```tsx
// ✅ ĐÚNG
import AdminLayout from '@/components/AdminLayout';

export default function NewPage() {
    return (
        <AdminLayout>
            <div style={{ padding: 24 }}>
                {/* content */}
            </div>
        </AdminLayout>
    );
}
```

### API Functions
Sử dụng api functions từ `@/lib/api.ts`:

```typescript
import { productsApi, wizardApi } from '@/lib/api';

// Không tự viết fetch, sử dụng các hàm đã định nghĩa
const data = await wizardApi.getConfig();
```

---

## 🟢 Backend (NestJS)

### Khi tạo Entity mới:
1. Tạo entity file trong `src/[module]/entities/`
2. **Import và đăng ký** trong module's `TypeOrmModule.forFeature([...])`
3. Thêm try-catch để xử lý graceful khi table chưa tồn tại

```typescript
// Ví dụ: Xử lý entity mới chưa có table
@Get('wizard/config')
async getWizardConfig() {
    try {
        const config = await this.wizardConfigRepo.findOne({ where: { key: 'wizard_products' } });
        if (!config) {
            return { main: [], accessory: [], service: [] };  // Default empty
        }
        return config.value;
    } catch (error) {
        console.error('Table may not exist:', error);
        return { main: [], accessory: [], service: [] };  // Graceful fallback
    }
}
```

---

## 📋 Checklist Khi Tạo Feature Mới

### Frontend Website:
- [ ] Sử dụng `getApiUrl()` helper cho SSR fetch
- [ ] Validate response type (kiểm tra Array.isArray nếu expect array)
- [ ] Thêm error handling với try-catch

### CMS:
- [ ] Wrap với `AdminLayout`
- [ ] Thêm menu item trong `AdminLayout.tsx` nếu cần
- [ ] Sử dụng API functions từ `@/lib/api.ts`

### Backend:
- [ ] Đăng ký entity trong module
- [ ] Thêm try-catch cho database operations
- [ ] Trả về default values khi không có data

### Deploy:
- [ ] Commit và push code
- [ ] Rebuild container nếu thay đổi code: `docker compose build --no-cache [service]`
- [ ] Chỉ restart nếu thay đổi env var: `docker compose up -d [service]`

---

## 🖼️ Quy định kích thước ảnh

Khi thêm trường upload ảnh mới, luôn thêm ghi chú kích thước trong prop `extra`:

| Loại ảnh | Kích thước | Tỷ lệ | Ghi chú |
|----------|-----------|-------|---------|
| Hero Slider | 1920x800px | 2.4:1 | Trang chủ, full-width |
| Ảnh đại diện Blog | 1200x630px | 1.91:1 | Tối ưu SEO & social share |
| Ảnh sản phẩm | 800x800px | 1:1 | Vuông, hiển thị grid |
| Thumbnail | 400x400px | 1:1 | Danh sách nhỏ |
| Banner | 1200x400px | 3:1 | Quảng cáo, CTA |

### Ví dụ:
```tsx
<Form.Item 
    name="image_url" 
    label="Ảnh đại diện"
    extra="📐 Kích thước: 1200x630px (tỷ lệ 1.91:1) - Tối ưu cho SEO"
>
    <Input placeholder="URL hình ảnh" />
</Form.Item>
```
