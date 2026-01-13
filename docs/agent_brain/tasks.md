# Session Tasks - 13/01/2026

## Completed Tasks

### ProfilePage UI Upgrades
- [x] Fix `formatMoney` function to handle string values properly
- [x] Fix "Tổng khấu trừ" calculation bug (string concatenation instead of addition)
- [x] Upgrade Leave Tab UI with gradient header and 3 main stats
- [x] Add fallback leave balance calculation when API returns null

### Upload Service Improvements
- [x] Replace `res.sendFile()` with `fs.createReadStream().pipe()` for proxy compatibility
- [x] Add Content-Length, Cache-Control headers
- [x] Add image compression on upload using sharp library
- [x] Fix ERR_BLOCKED_BY_ORB with CORS headers

### Docker Configuration Review
- [x] Verify database connection uses container name `hula_db` (not static IP)
- [x] Explain NPM proxy configuration for `/api` and `/uploads`

## Key Files Modified
- `frontend/src/pages/ProfilePage.tsx` - UI fixes, formatMoney, leave balance
- `src/upload/upload.service.ts` - Image compression, file serving, CORS headers
- `package.json` - Added sharp dependency
