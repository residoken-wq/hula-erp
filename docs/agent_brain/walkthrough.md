# Hula ERP - Project Walkthrough

## Overview

Hula ERP is a comprehensive Enterprise Resource Planning system built with:
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + Ant Design
- **Website**: Next.js website + Payload CMS

## Project Structure

```
hula-erp/
├── src/                    # NestJS Backend (24 modules)
│   ├── auth/              # JWT Authentication
│   ├── users/             # User & Group management
│   ├── products/          # Product catalog
│   ├── materials/         # Raw materials
│   ├── bom/               # Bill of Materials
│   ├── sales/             # Sales orders, quotations, deliveries
│   ├── inventory/         # Stock, shipping carriers
│   ├── production/        # Production orders
│   ├── purchasing/        # Purchase orders
│   ├── finance/           # Transactions, categories
│   ├── hr/                # Employees, attendance, leave, payslip
│   ├── customers/         # CRM
│   ├── suppliers/         # Supplier management
│   ├── upload/            # File upload with compression
│   └── ...
├── frontend/              # React Frontend
│   └── src/
│       ├── pages/         # 32 page components
│       └── components/    # Reusable components
├── hula-web/              # Public website
│   ├── website/           # Next.js site
│   └── cms/               # Payload CMS
└── docs/
    └── agent_brain/       # Development logs
```

## Recent Development (Week 02-03/2026)

### HR Module
- Leave Balance System with entitlements
- Attendance Calendar view
- Mobile-responsive UI
- Payslip management with status tracking

### Sales Module
- Quotation History tab
- Copy from old quotations
- Sample Images approval workflow
- Shipping Carrier management

### Upload Service
- Image compression using Sharp
- CORS headers for proxy compatibility
- Streaming file response

## Running the Project

### Development
```bash
# Backend
npm run start:dev

# Frontend
cd frontend && npm run dev
```

### Production (Docker)
```bash
docker compose up -d --build
```

## Key Configurations

- **Database**: PostgreSQL (hula_db container)
- **Uploads**: `/uploads` volume mount
- **API Proxy**: NPM proxy `/api` → :3000, `/uploads` → :3000

---

*Last updated: 14/01/2026*
