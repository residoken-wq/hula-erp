---
description: Quy tắc kỹ thuật khi tạo module/tính năng mới để tránh lỗi lặp lại
---

# Technical Rules - HULA ERP

> Các quy tắc dưới đây được rút ra từ các lỗi thực tế đã xảy ra trong quá trình phát triển.
> AI assistant **PHẢI** tuân theo tất cả các quy tắc này khi tạo hoặc chỉnh sửa code.

---

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

## 🔴 CRITICAL: Import Path & Library Convention

> **Nguyên nhân:** Commits `0aabf67`, `0969c18` - Import sai đường dẫn và dùng thư viện đã deprecated.

### CMS Frontend (`frontend/src/`)

```typescript
// ✅ ĐÚNG - Đường dẫn import chuẩn
import api from '../../utils/api';                          // API utility
import RichTextEditor from '../../components/common/RichTextEditor';  // RichTextEditor
import useMobile from '../../hooks/useMobile';              // Custom hooks

// ❌ SAI - Đường dẫn sai hoặc thiếu /common/
import api from '../../../utils/api';                       // Sai depth
import RichTextEditor from '../../components/RichTextEditor'; // Thiếu /common/
```

### Thư viện Date/Time

```typescript
// ✅ ĐÚNG - Project sử dụng dayjs
import dayjs from 'dayjs';
dayjs(date).format('HH:mm DD/MM/YYYY');

// ❌ SAI - moment đã bị loại bỏ khỏi project
import moment from 'moment';
moment(date).format('...');
```

### RichTextEditor trong Ant Design Form

```tsx
// ✅ ĐÚNG - Thêm ts-expect-error vì Ant Design tự inject value/onChange
<Form.Item name="description" label="Mô tả">
    {/* @ts-expect-error Ant Design injects value and onChange automatically */}
    <RichTextEditor placeholder="Nhập mô tả..." />
</Form.Item>
```

---

## 🔴 CRITICAL: NestJS Module & Entity Registration

> **Nguyên nhân:** Lỗi `EntityMetadataNotFoundError: No metadata for "..." was found.` (Commits `55eb470`, `9c96fff`, `e4e5487`, `ab796f2`) do quên đăng ký entity gây crash.

### Khi tạo Entity mới - PHẢI làm đủ 4 bước:

1. Tạo entity file trong `src/[module]/`
2. **Khai báo trong `app.module.ts`** → Thêm vào mảng `entities: [...]` của `TypeOrmModule.forRootAsync`. **Đây là nguyên nhân chính gây lỗi EntityMetadataNotFoundError.**
3. **Khai báo trong feature module** (VD: `public.module.ts`) → Thêm vào `TypeOrmModule.forFeature([...])`.
4. Thêm try-catch để xử lý graceful khi table chưa tồn tại (nếu query lúc startup).

```typescript
// Bước 2: Đăng ký root trong app.module.ts
import { NewEntity } from './module/new-entity.entity';

TypeOrmModule.forRootAsync({
    useFactory: () => ({
        // ...
        entities: [
            // ... existing entities,
            NewEntity,  // ← KHÔNG ĐƯỢC QUÊN ĐỂ TRÁNH LỖI EntityMetadataNotFoundError
        ]
    })
})

// Bước 3: Đăng ký feature module (ví dụ: public.module.ts)
TypeOrmModule.forFeature([
    NewEntity,
])
```

### Khi tạo Service mới để dùng ở Module khác:

```typescript
// ✅ ĐÚNG - Export service để module khác inject được
@Module({
    imports: [...],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService]  // ← KHÔNG ĐƯỢC QUÊN khi cần dùng ở module khác
})
export class AiModule { }
```

### Khi dùng TypeORM decorators:

```typescript
// ✅ ĐÚNG - Import đầy đủ tất cả decorators sử dụng
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, 
         UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

// ❌ SAI - Quên import ManyToOne, JoinColumn khi có relation
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, 
         UpdateDateColumn, OneToMany } from 'typeorm';
```

### Graceful handling khi entity mới chưa có table:

```typescript
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

## 🟡 TypeORM QueryBuilder: Column Name Convention

> **Nguyên nhân:** Commit `962ef6e` - Dùng sai tên column gây query trả về 0.

Khi viết QueryBuilder, **phải dùng property name của Entity** (TypeScript), **KHÔNG** dùng tên cột DB:

```typescript
// ✅ ĐÚNG - Dùng entity property name có đuôi _id nếu đó là relation column
.where('o.assigned_to_id = :uid', { uid: user.id })

// ❌ SAI - Property không tồn tại, query sẽ fail silently hoặc trả 0
.where('o.assigned_to = :uid', { uid: user.id })
```

### Quy tắc:
- Kiểm tra Entity file để xác định chính xác tên property trước khi viết query
- Với relation columns, tên thường có đuôi `_id` (VD: `assigned_to_id`, `customer_id`)
- **Luôn test query trước khi commit** bằng cách gọi API endpoint

---

## 🟡 Public API Data Contract

> **Nguyên nhân:** Commits `b69a196`, `bfdd1c8`, `1deebd5`, `eb2cb53` - Thiếu field trong API response khiến frontend render sai/trống.

### Khi thêm field mới vào Entity, PHẢI kiểm tra và cập nhật:

1. **`public.controller.ts`** - API public cho website (nếu entity hiển thị trên web)
2. **Settings/Config keys** - Thêm key mới vào danh sách `cmsKeys` trong `getSettings()`
3. **Response mapping** - Thêm field vào object return với default value

```typescript
// Trong public.controller.ts → getSettings()
const cmsKeys = [
    // ... existing keys
    'new_banner_title', 'new_banner_desc', 'new_banner_image',  // ← Thêm key mới
];

// Trong response mapping
return {
    // ... existing fields
    new_banner_title: result.new_banner_title || '',   // ← Thêm với default
    new_banner_desc: result.new_banner_desc || '',
    new_banner_image: result.new_banner_image || '',
};
```

### Khi truyền props cho Component:

```tsx
// ✅ ĐÚNG - Truyền đủ tất cả props cần thiết
<HeroBanner
    images={heroImages}
    heroTitle1={config.hero_title_1}
    heroTitle2={config.hero_title_2}
    heroDescription={config.hero_description}  // ← KHÔNG QUÊN prop mới
/>

// ❌ SAI - Thiếu prop heroDescription → render trống
<HeroBanner
    images={heroImages}
    heroTitle1={config.hero_title_1}
    heroTitle2={config.hero_title_2}
/>
```

---

## 🟡 Type Safety & Number Formatting

> **Nguyên nhân:** Commits `2d5c19e`, `65d7c40`, `f9098ad` - Crash do `.toLocaleString()` trên string hoặc tính toán cộng string.

### Luôn wrap `Number()` trước khi tính toán hoặc format:

```typescript
// ✅ ĐÚNG
const total = Number(item.total_amount || 0).toLocaleString('vi-VN');
const subtotal = items.reduce((sum, item) => 
    sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);

// ❌ SAI - item.unit_price có thể là string từ DB
const total = (item.total_amount || 0).toLocaleString('vi-VN');  // Crash nếu string
const subtotal = items.reduce((sum, item) => 
    sum + item.quantity * item.unit_price, 0);  // NaN nếu undefined
```

### Template literal trong HTML string:

```typescript
// ✅ ĐÚNG - Backtick đơn giản
${vatTax ? `<div>MST: <b>${vatTax}</b></div>` : ''}

// ❌ SAI - Escape sai khi lồng template literal
${vatTax ? \`<div>MST: <b>\${vatTax}</b></div>\` : ''}
```

### Payload gửi lên API phải đầy đủ required fields:

```typescript
// ✅ ĐÚNG - Bao gồm tất cả required fields
items: cart.map(item => ({
    sku: item.sku,           // ← KHÔNG QUÊN
    product_id: item.id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
}))
```

---

## 🟡 Docker Build & Deployment

> **Nguyên nhân:** Commit `6718d9f` - Build fail do `npm ci` khi lock file chưa sync.

### Dockerfile best practices:

```dockerfile
# ✅ ĐÚNG - Dùng npm install (tolerant với lock file)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ❌ SAI - npm ci sẽ fail nếu package-lock.json không khớp chính xác
RUN npm ci
```

### Quy tắc:
- Dùng `npm install` trong Dockerfile (không dùng `npm ci`) vì lock file thường không sync
- Wildcard `package-lock.json*` để tránh lỗi COPY khi file không tồn tại
- Luôn rebuild image khi thay đổi dependencies: `docker compose build --no-cache [service]`

---

## 🟡 Ant Design Tabs: forceRender

> **Nguyên nhân:** Commit `1f4ce29` - Tab ẩn không render data → mất form values.

```tsx
// ✅ ĐÚNG - Thêm forceRender cho tab có form data cần giữ
<Tabs items={[
    { key: 'general', label: 'Tổng quan', children: <GeneralForm /> },
    { key: 'footer', label: 'Footer', forceRender: true, children: <FooterForm /> },
]} />

// ❌ SAI - Tab footer chỉ render khi active → mất data khi submit
<Tabs items={[
    { key: 'general', label: 'Tổng quan', children: <GeneralForm /> },
    { key: 'footer', label: 'Footer', children: <FooterForm /> },
]} />
```

---

## 🟢 Responsive CSS Convention

> **Nguyên nhân:** Commits `3410731`, `5c6cd96`, `8d86149`, `0b75dee` - Phải fix logo/header 4-5 lần vì thiếu breakpoints.

### Luôn thêm đủ 3 breakpoints khi style phần tử responsive:

```tsx
// ✅ ĐÚNG - 3 breakpoints: mobile → tablet → desktop
className="h-14 md:h-[4rem] lg:h-[6rem] w-auto max-w-[220px] md:max-w-[260px] lg:max-w-[300px]"

// ❌ SAI - Chỉ có mobile và desktop, bỏ qua tablet
className="h-10 lg:h-[6rem] w-auto max-w-[200px] lg:max-w-[300px]"
```

### CSS Sticky Positioning (CKEditor, Toolbar):

Khi cần `position: sticky`, phải reset `overflow` trên **tất cả parent containers**:

```css
/* Tất cả parent phải có overflow: visible */
.parent-layout,
.parent-content,
.parent-wrapper {
    overflow: visible !important;
}
```

---

## 🟢 Upload Multiple Images

> **Nguyên nhân:** Commits `4e3f019`, `90e4664` - Upload nhiều ảnh bị race condition.

```tsx
// ✅ ĐÚNG - Dùng beforeUpload để xử lý batch tuần tự
<Upload 
    multiple 
    beforeUpload={handleBatchUpload}   // Sequential upload
    showUploadList={false}
    accept="image/*"
/>

// ❌ SAI - customRequest gây race condition khi upload nhiều file cùng lúc
<Upload 
    multiple 
    customRequest={handleMultipleUpload}  // Concurrent → state bị override
    showUploadList={false}
/>
```

---

## 📋 Checklist Khi Tạo Feature Mới

### Frontend CMS (React/Ant Design):
- [ ] Import path đúng depth (`../../utils/api`, `../../components/common/...`)
- [ ] Sử dụng `dayjs` (KHÔNG dùng `moment`)
- [ ] Wrap với `AdminLayout`
- [ ] Thêm menu item trong `AdminLayout.tsx` nếu cần
- [ ] Sử dụng API functions từ `@/lib/api.ts` (CMS) hoặc `../../utils/api` (frontend)
- [ ] Thêm `{/* @ts-expect-error */}` khi dùng RichTextEditor trong Form.Item
- [ ] Thêm `forceRender: true` cho Tabs có form data cần giữ
- [ ] Wrap `Number()` cho mọi giá trị tính toán/format
- [ ] Dùng `beforeUpload` (không `customRequest`) cho multi-upload

### Frontend Website (Next.js):
- [ ] Sử dụng `getApiUrl()` helper cho SSR fetch
- [ ] Validate response type (kiểm tra `Array.isArray` nếu expect array)
- [ ] Thêm error handling với try-catch
- [ ] Truyền đủ tất cả props cho component (không bỏ sót prop mới)
- [ ] Responsive: luôn có 3 breakpoints (`base`, `md:`, `lg:`)

### Backend (NestJS):
- [ ] **Import entity** vào mảng `entities` của `TypeOrmModule.forRootAsync` trong `app.module.ts`
- [ ] **Khai báo entity** trong `TypeOrmModule.forFeature([...])` của Feature Module
- [ ] **Export service** trong module nếu cần dùng ở nơi khác
- [ ] Import đầy đủ TypeORM decorators (`ManyToOne`, `JoinColumn`, etc.)
- [ ] Dùng **entity property name** trong QueryBuilder (kiểm tra file `.entity.ts`)
- [ ] Thêm try-catch cho database operations
- [ ] Trả về default values khi không có data
- [ ] Cập nhật `public.controller.ts` nếu field mới cần hiển thị trên website
- [ ] Thêm key mới vào `cmsKeys` array trong `getSettings()`

### Deploy:
- [ ] Commit và push code
- [ ] Rebuild container nếu thay đổi code: `docker compose build --no-cache [service]`
- [ ] Chỉ restart nếu thay đổi env var: `docker compose up -d [service]`
- [ ] Dùng `npm install` (KHÔNG `npm ci`) trong Dockerfile

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

---

## 🔒 Permission & Authorization Convention

### Quy tắc bắt buộc khi tạo Controller mới (Backend)

Mọi Controller có dữ liệu cần bảo mật **PHẢI** sử dụng:

```typescript
// ✅ ĐÚNG - Luôn có 2 guards + decorator
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@Controller('example')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExampleController {
  @Get() @RequirePermission('MODULE_CODE', 'can_view') findAll() { ... }
  @Post() @RequirePermission('MODULE_CODE', 'can_create') create() { ... }
  @Put(':id') @RequirePermission('MODULE_CODE', 'can_update') update() { ... }
  @Delete(':id') @RequirePermission('MODULE_CODE', 'can_delete') remove() { ... }
}

// ❌ SAI - Chỉ dùng JwtAuthGuard (không check quyền CRUD)
@UseGuards(JwtAuthGuard)
export class ExampleController { ... }
```

### Danh sách MODULE_CODE hợp lệ

| Module Code | Module | Ghi chú |
|---|---|---|
| SALES | Bán hàng + Khách hàng + CRM | Customers controller cũng dùng SALES |
| PRODUCT | Sản phẩm + BOM | |
| INVENTORY | Kho + Vật tư | |
| FINANCE | Tài chính | |
| PRODUCTION | Sản xuất + Kế hoạch | |
| HR | Nhân sự | |
| USERS | Quản lý User/Group | Chỉ admin mới nên access |
| CASHFLOW | Dòng tiền | Sub-module của Finance |

### Quy tắc bắt buộc khi tạo Page mới (Frontend)

Mọi Page có nút CRUD **PHẢI** sử dụng `usePermission` hook:

```tsx
// ✅ ĐÚNG
import usePermission from '../hooks/usePermission';

const ExamplePage = () => {
  const { canCreate, canUpdate, canDelete } = usePermission('MODULE_CODE');

  return (
    <>
      {canCreate && <Button>Thêm mới</Button>}
      {canUpdate && <Button>Sửa</Button>}
      {canDelete && <Button>Xóa</Button>}
    </>
  );
};

// ❌ SAI - Hiển thị nút CRUD không check quyền
<Button>Thêm mới</Button>
<Button>Xóa</Button>
```

### Lưu ý quan trọng
- **Admin user** (username = 'admin') bypass tất cả permission checks
- Backend guard query trực tiếp DB (`GroupPermission`) mỗi request → quyền cập nhật real-time
- Frontend hook đọc từ `localStorage.user.permissions` → chỉ cập nhật sau khi login lại
- Khi thêm module mới, phải thêm module_code vào bảng `UserGroupsPage.tsx` (danh sách ALL_MODULES)
