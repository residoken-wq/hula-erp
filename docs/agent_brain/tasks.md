# Session Tasks - 14/01/2026

## Active Tasks
- [x] Project review and self-learning from docs/agent_brain

## Pending Tasks
(Awaiting user instructions)

---

## Previous Session Summary (13/01/2026)

### ProfilePage UI Upgrades
- [x] Fix `formatMoney` function to handle string values properly
- [x] Fix "Tổng khấu trừ" calculation bug (string concatenation → addition)
- [x] Upgrade Leave Tab UI with gradient header and 3 main stats
- [x] Add fallback leave balance calculation when API returns null

### Upload Service Improvements
- [x] Replace `res.sendFile()` with `fs.createReadStream().pipe()` for proxy compatibility
- [x] Add Content-Length, Cache-Control headers
- [x] Add image compression on upload using sharp library
- [x] Fix ERR_BLOCKED_BY_ORB with CORS headers

---

## Key Project Files Reference

### Backend
- `src/app.module.ts` - Main module with all 24 feature modules
- `src/sales/` - Sales orders, deliveries, quotations
- `src/hr/` - Employees, attendance, leave, payslip
- `src/upload/upload.service.ts` - File handling with compression

### Frontend
- `frontend/src/App.tsx` - Main routing and layout
- `frontend/src/pages/ProfilePage.tsx` - User profile with payslip/leave
- `frontend/src/pages/SalesPage.tsx` - Sales order management
- `frontend/src/pages/HRPage.tsx` - HR module tabs

### Documentation
- `docs/agent_brain/logs/2026-W02.md` - Full Week 02 progress
- `docs/agent_brain/logs/2026-W03.md` - Current week (started)
- `docs/agent_brain/guides/deployment_vps.md` - VPS deployment guide
