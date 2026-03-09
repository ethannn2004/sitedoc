# SiteDoc — Website Uptime Monitoring & SMS Alerts

Monitor your websites 24/7 and get instant SMS alerts when they go down, with diagnosis and suggested fixes.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Prisma** + SQLite (dev) / PostgreSQL (prod)
- **NextAuth.js v5** for authentication
- **Twilio** for SMS alerts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your values. For development, the defaults work — Twilio credentials are optional (alerts will log to console).

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Landing page** with pricing, features, and FAQ
- **Authentication** (signup, login, logout, protected routes)
- **Dashboard** with stats, monitored sites, and incident history
- **Site management** (add, edit, delete, check now)
- **Monitoring engine** with timeout, DNS, SSL, and HTTP error detection
- **Diagnosis engine** that identifies issues and suggests fixes
- **SMS alerts** via Twilio (state-change only, no spam)
- **Recovery alerts** when sites come back online
- **Plan enforcement** (Free: 1 site, Starter: 5, Pro: 20)

## Monitoring

### Development

Use the "Check Now" button on any site in the dashboard, or call:

```bash
curl -X POST http://localhost:3000/api/monitor -H "Authorization: Bearer dev-cron-secret"
```

### Production (Vercel)

The `vercel.json` includes a cron job that runs `/api/monitor` every 5 minutes. Vercel Cron Jobs handle this automatically.

### Production (Self-hosted)

Set up a cron job:

```bash
*/5 * * * * curl -X POST https://your-domain.com/api/monitor -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Data Model

- **User** — account with plan, phone number
- **MonitoredSite** — URL, label, current status, diagnosis
- **CheckResult** — individual check records with response times
- **Incident** — outage records with diagnosis and resolution
- **AlertLog** — SMS alert delivery tracking

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    login/page.tsx              # Login
    signup/page.tsx             # Signup
    dashboard/
      page.tsx                  # Dashboard overview
      layout.tsx                # Sidebar layout
      sites/                    # Site management
      incidents/                # Incident history
      settings/                 # Account settings
    api/
      auth/                     # Auth endpoints
      dashboard/                # Dashboard data
      sites/                    # Sites CRUD
      incidents/                # Incidents list
      settings/                 # User settings
      monitor/                  # Cron monitoring endpoint
  lib/
    auth.ts                     # NextAuth config
    db.ts                       # Prisma client
    monitor.ts                  # Monitoring engine
    diagnosis.ts                # Failure diagnosis
    sms.ts                      # Twilio SMS
    plans.ts                    # Plan definitions
    utils.ts                    # Utilities
  components/
    ui/                         # Reusable UI components
    status-badge.tsx            # Status badge component
prisma/
  schema.prisma                 # Database schema
```
