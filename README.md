# Sistem eAduan Kerosakan ICT — ADTEC JTM Kampus Pasir Gudang

> **AI-Powered ICT Damage Complaint Management System** for Jabatan Tenaga Manusia (JTM), Malaysia.
> Built per PRD v1.0 with modern Glassmorphism UI, Supabase backend, and GLM 5.2 AI integration.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Quick Start](#quick-start)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Sistem eAduan Kerosakan ICT replaces the manual WhatsApp/paper-based complaint process at ADTEC JTM Kampus Pasir Gudang with a unified digital platform. Staff can submit ICT equipment damage reports, technicians get auto-assigned tickets, and management gets real-time dashboards plus monthly PDF reports — all enhanced with AI for auto-classification and trend analysis.

### User Roles (RBAC)
| Role | Access |
|------|--------|
| **Pelapor** (Reporter) | Submit complaints, track own tickets, rate service, send suggestions |
| **Juruteknik ICT** (Technician) | View assigned tickets, update status, log work & costs |
| **Admin ICT** | Full access: dashboard, all complaints, manage users/assets/equipment, reports, audit logs |
| **Pengurusan** (Management) | Read-only dashboard and monthly reports |

---

## Features

### Core Modules (per PRD)
- ✅ **Complaint Module** — 3-step wizard (Equipment → Damage → Reporter Info)
- ✅ **Ticket System** — Auto-generated ticket no `ADT-PG-YYYYMM-XXXX`, status timeline
- ✅ **Equipment & Damage Classification** — 7 equipment types (EQ-01 to EQ-07), 6 damage categories
- ✅ **Real-time Dashboard** — Stats cards, charts (trend, cost, pie, bar), top 5 damages
- ✅ **Monthly Reports** — PDF print-ready, CSV export, AI-generated narrative summary
- ✅ **Admin Module** — Manage users, equipment types, damage categories, assets, audit log
- ✅ **AI Integration** — Auto-classification, solution suggestions, monthly trend summary

### Status Workflow
`Baru → Ditugaskan → Dalam Tindakan → On Hold → Selesai → Ditutup`

### Security Features
- 🔐 bcrypt password hashing (10 rounds)
- 🔐 JWT sessions with HTTP-only cookies (8h expiry)
- 🔐 Role-Based Access Control (RBAC) on every API endpoint
- 🔐 Account lockout after 5 failed login attempts (15-min lock)
- 🔐 Rate limiting on AI endpoints (10/min classify, 5/min summary)
- 🔐 Input validation & sanitization on all forms
- 🔐 Audit logging of all sensitive actions (LOGIN, CREATE_COMPLAINT, UPDATE_STATUS, etc.)
- 🔐 Row Level Security (RLS) policies for database-level protection
- 🔐 Data isolation: reporters see only own tickets; technicians see assigned + own

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (Glassmorphism theme) |
| Database | Supabase (PostgreSQL) via Prisma ORM |
| Auth | NextAuth.js v4 (Credentials provider, JWT) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| AI | GLM 5.2 via z.ai SDK (with intelligent fallback) |
| Validation | Zod, react-hook-form |

---

## Quick Start

### Prerequisites
- Node.js 20+ or Bun 1.3+
- A Supabase account (free tier works)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/hairulazwani83-ui/e-aduanBPSM.git
cd e-aduanBPSM
```

### 2. Install dependencies
```bash
bun install
# or
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials (see Database Setup below)
```

### 4. Set up the database
```bash
bun run db:push      # Creates all 10 tables + enums in Supabase
bun run db:generate  # Generates Prisma Client
```

### 5. Seed dummy data
```bash
bun run scripts/seed.ts
```

### 6. Start the dev server
```bash
bun run dev
```

Open http://localhost:3000 in your browser.

---

## Database Setup (Supabase)

### Create a Supabase project
1. Go to https://supabase.com and create a new project
2. Note your **Project Reference** (e.g., `mrkyumzjcdcegpgbaroo`) and **Database Password**
3. Go to Project Settings → Database → Connection string

### Get the connection string
Use the **pooler** connection (recommended for serverless/edge):
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Configure `.env`
```env
DATABASE_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### (Optional) Enable Row Level Security
For defense-in-depth at the database level, run the SQL in `download/supabase_rls_policies.sql` via Supabase Dashboard → SQL Editor.

---

## Demo Accounts

All accounts use password: **`Password@123`**

| Role | Email |
|------|-------|
| Admin ICT | `admin@adtecpg.edu.my` |
| Juruteknik | `tech1@adtecpg.edu.my` |
| Pelapor | `staff1@adtecpg.edu.my` |
| Pengurusan | `mgmt@adtecpg.edu.my` |

---

## Project Structure

```
e-aduanBPSM/
├── prisma/
│   └── schema.prisma              # PostgreSQL schema with 10 models + 8 enums
├── scripts/
│   └── seed.ts                    # Comprehensive seed script (15 users, 95 complaints, etc.)
├── src/
│   ├── app/
│   │   ├── api/                   # 18 API route files
│   │   │   ├── auth/              # NextAuth + register
│   │   │   ├── complaints/        # CRUD + status + work-logs + rating + search
│   │   │   ├── ai/                # classify + summary (GLM 5.2)
│   │   │   ├── dashboard/stats/   # Aggregated dashboard data
│   │   │   ├── reports/monthly/   # Monthly report data
│   │   │   ├── equipment-types/   # Equipment type CRUD (admin)
│   │   │   ├── damage-categories/ # Damage category CRUD (admin)
│   │   │   ├── assets/            # Asset CRUD (admin)
│   │   │   ├── users/             # User management (admin)
│   │   │   ├── suggestions/       # Suggestion + response
│   │   │   ├── notifications/     # User notifications
│   │   │   ├── audit-log/         # Audit logs (admin)
│   │   │   └── me/                # Current user profile
│   │   ├── globals.css            # Glassmorphism design system
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main app entry (auth + shell router)
│   ├── components/
│   │   ├── auth/AuthView.tsx      # Login + Register
│   │   ├── shared/
│   │   │   ├── AppShell.tsx       # Sidebar + topbar + notifications
│   │   │   └── Glass.tsx          # Glass card, stat card, badges
│   │   └── views/                 # 13 view components
│   │       ├── DashboardView.tsx
│   │       ├── NewComplaintView.tsx       # 3-step wizard with AI
│   │       ├── ComplaintListView.tsx
│   │       ├── ComplaintDetailModal.tsx
│   │       ├── TrackTicketView.tsx
│   │       ├── SuggestionsView.tsx
│   │       ├── ReportsView.tsx            # Monthly report + AI summary
│   │       ├── ProfileView.tsx
│   │       ├── ManageEquipmentView.tsx
│   │       ├── ManageDamageView.tsx
│   │       ├── ManageAssetsView.tsx
│   │       ├── ManageUsersView.tsx
│   │       └── AuditLogView.tsx
│   └── lib/
│       ├── auth.ts                # NextAuth config + bcrypt
│       ├── security.ts            # RBAC, rate limiting, audit logging
│       ├── db.ts                  # Prisma client
│       ├── enum-converters.ts     # Malay-string ↔ enum conversion
│       └── ui-utils.ts            # Formatters, status colors
├── .env.example                   # Template for environment variables
├── prisma/schema.prisma           # Database schema
└── package.json
```

---

## API Reference

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new reporter | Public |
| POST | `/api/auth/callback/credentials` | Login (NextAuth) | Public |
| GET | `/api/auth/session` | Get current session | Public |
| GET | `/api/me` | Current user profile | Authenticated |

### Complaints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/complaints` | List complaints (with filters) | Auth (RBAC-scoped) |
| POST | `/api/complaints` | Create new complaint | Reporter, Admin |
| GET | `/api/complaints/:id` | Get complaint details | Auth (RBAC-scoped) |
| PATCH | `/api/complaints/:id/status` | Update status / assign technician | Technician, Admin |
| POST | `/api/complaints/:id/work-logs` | Add work log entry | Technician, Admin |
| POST | `/api/complaints/:id/rating` | Rate resolved complaint | Reporter |
| GET | `/api/complaints/search?ticketNo=` | Search by ticket no | Auth |

### Dashboard & Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats?months=6` | Aggregated dashboard data | Admin, Management, Technician |
| GET | `/api/reports/monthly?month=YYYY-MM` | Monthly report data | Admin, Management |

### AI (GLM 5.2)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/ai/classify` | Auto-classify complaint description | Authenticated |
| POST | `/api/ai/summary` | Generate monthly narrative summary | Admin, Management |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET/POST/PATCH | `/api/equipment-types` | Equipment type CRUD | Admin (write) |
| GET/POST/PATCH | `/api/damage-categories` | Damage category CRUD | Admin (write) |
| GET/POST/PATCH | `/api/assets` | Asset CRUD | Admin (write) |
| GET/PATCH | `/api/users` | User management | Admin |
| GET | `/api/audit-log` | Audit logs | Admin |

### Other
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET/PATCH | `/api/notifications` | User notifications | Authenticated |
| GET/POST | `/api/suggestions` | Suggestions | Authenticated |
| PATCH | `/api/suggestions/:id/response` | Admin response | Admin |

---

## Deployment

### Deploy to Vercel (recommended for Next.js)
1. Push your code to GitHub
2. Go to https://vercel.com and import the repo
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Set `NEXTAUTH_URL` to your production URL (e.g., `https://eaduan-bpsm.vercel.app`)
5. Deploy

### Deploy to Netlify
1. Connect your GitHub repo to Netlify
2. Build command: `bun run build` (or `npm run build`)
3. Add the same environment variables
4. Deploy

### Post-Deployment Checklist
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate strong `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Run `bun run db:push` to verify schema is in sync
- [ ] Run `bun run scripts/seed.ts` if you need demo data
- [ ] Run the RLS SQL (`download/supabase_rls_policies.sql`) in Supabase SQL Editor
- [ ] Test login with demo accounts
- [ ] Configure proper backup schedule in Supabase

---

## Database Schema

10 tables with PostgreSQL native types:
- `Profile` — Users with RBAC roles
- `EquipmentType` — ICT equipment categories (EQ-01 to EQ-07)
- `DamageCategory` — Damage types (Hardware, Software, Network, etc.)
- `Asset` — Individual ICT asset records
- `Complaint` — Tickets with auto-generated ticket no
- `WorkLog` — Maintenance work records with cost
- `StatusHistory` — Audit trail of status changes
- `Suggestion` — User feedback/suggestions
- `Notification` — In-app notifications
- `ComplaintRating` — User ratings for resolved complaints
- `AuditLog` — Security audit trail

See `prisma/schema.prisma` for full schema details.

---

## License

MIT License — © 2026 Jabatan Tenaga Manusia (JTM), ADTEC Kampus Pasir Gudang.

---

## Acknowledgments

- Built per PRD v1.0 by Unit ICT, ADTEC JTM Kampus Pasir Gudang
- AI powered by GLM 5.2 via z.ai
- Backend by Supabase
- UI framework: Next.js + shadcn/ui + Tailwind CSS

**SULIT / TERHAD** — For internal use of ADTEC JTM Kampus Pasir Gudang only.
