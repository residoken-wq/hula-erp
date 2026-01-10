# ERP Development Changelog

## Session: 2026-01-10

### Features Implemented

---

## 1. Shipping Carrier Feature (Đơn vị vận chuyển)

### Backend
- **New Entity:** `ShippingCarrier` - Quản lý đơn vị vận chuyển
  - Fields: `code`, `name`, `phone`, `website`, `tracking_url`, `is_active`
  - File: `src/inventory/entities/shipping-carrier.entity.ts`

- **Updated:** `SalesDelivery` entity with 3 new fields:
  - `shipping_carrier`: Mã ĐVVC
  - `tracking_code`: Mã vận đơn
  - `shipping_cost`: Chi phí vận chuyển

- **API Endpoints:** `/inventory/shipping-carriers`
  - GET, POST, PUT, DELETE

### Frontend
- **InventoryPage:** New tab "Đơn vị vận chuyển" for CRUD management
- **SalesDeliveries:** Modal updated with shipping carrier dropdown, tracking code, and shipping cost inputs

---

## 2. Quotation History Tab (Lịch sử Báo giá)

### Frontend
- **New Component:** `QuotationHistoryTab.tsx`
  - Displays confirmed quotation info and revision history
  - Expandable rows to view full snapshot details

- **SalesOrderDetail:** Added tab "7. Lịch sử Báo giá" (for non-quotation orders)

---

## 3. Copy Old Quotation Feature

### Frontend
- **SalesOrderDetail:** When creating quotation:
  - On customer selection → fetches customer's old quotations
  - Shows button "Copy từ N BG cũ" when quotes exist
  - Modal to select quotation → copies all items to current form

---

## Files Modified

| File | Changes |
|------|---------|
| `src/inventory/entities/shipping-carrier.entity.ts` | NEW - ShippingCarrier entity |
| `src/sales/sales-delivery.entity.ts` | Added shipping fields |
| `src/inventory/inventory.module.ts` | Registered ShippingCarrier |
| `src/inventory/inventory.controller.ts` | Added carrier CRUD endpoints |
| `src/inventory/inventory.service.ts` | Added carrier CRUD methods |
| `frontend/src/pages/InventoryPage.tsx` | Added carrier management tab |
| `frontend/src/components/sales/SalesDeliveries.tsx` | Added shipping fields to modal |
| `frontend/src/components/sales/QuotationHistoryTab.tsx` | NEW - Quotation history component |
| `frontend/src/components/SalesOrderDetail.tsx` | Added quotation history tab + copy quotation feature |
