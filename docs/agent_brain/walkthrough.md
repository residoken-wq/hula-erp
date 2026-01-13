# Session Walkthrough - 13/01/2026

## Overview
This session focused on fixing bugs in ProfilePage and enhancing the upload service.

## Changes Made

### 1. ProfilePage Money Formatting Fix
**Problem**: Numbers displayed without thousand separators (9000000 instead of 9.000.000)
**Solution**: Updated `formatMoney` to use `Number()` before `toLocaleString('vi-VN')`

```typescript
const formatMoney = (v: any) => {
    const num = Number(v) || 0;
    return num.toLocaleString('vi-VN');
};
```

### 2. Deduction Calculation Bug Fix
**Problem**: "Tổng khấu trừ" showed "-720000135000090000" (string concatenation)
**Solution**: Wrapped values with `Number()` for proper addition

### 3. Leave Balance UI Enhancement
- Added 3 main stat columns: Tổng phép năm, Đã duyệt, Còn lại
- Added progress bar showing usage percentage
- Fallback calculation when API returns null

### 4. Upload Service Improvements

#### Image Compression (using sharp)
- Auto-resize to max 1920x1920px
- JPEG quality 80%
- Only compress files >50KB
- Only use compressed if smaller than original

#### File Serving Fix
- Replaced `res.sendFile()` with `fs.createReadStream().pipe()`
- Added headers:
  - `Content-Length`
  - `Cache-Control: public, max-age=86400`
  - `Access-Control-Allow-Origin: *`
  - `X-Content-Type-Options: nosniff`

## Commands to Apply Changes
```bash
docker-compose build app
docker restart hula_app
```
