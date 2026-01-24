# Job Sense - Development Progress

## Overview
Job Sense combines Rule Tool (satellite map estimating, blueprint AI analysis) with Site Sense (job costing, bid pipeline management) into a unified construction estimating and job management platform.

---

## Completed Features

### 1. Landing Page & Branding
- Glass-effect styling with hero background
- Job Sense branding throughout
- Dark theme with accent colors

### 2. Rule Tool Features Ported
- **Map Estimating** (`/site`)
  - Satellite imagery with Mapbox
  - Drawing tools (polygon, line, rectangle, circle)
  - Real-time area and perimeter calculations
  - Service-based pricing
  - AI feature detection
  - Blueprint overlay alignment

- **Blueprint Analysis** (`/blueprint`, `/blueprint/[id]`)
  - PDF upload and processing
  - Client-side PDF.js rendering
  - Claude Vision AI analysis for:
    - Area/room detection
    - Dimension extraction (OCR)
    - Material callout parsing
    - Scale detection
  - Export to map overlay

- **Quote Builder** (`/quote/map`, `/quote/new`)
  - Industry-specific service templates
  - Live pricing calculations
  - Bid builder modal

### 3. Site Sense Features
- **Dashboard** (`/dashboard`)
  - Kanban-style bid pipeline
  - Stages: Lead → Qualifying → Proposal → Submitted → Negotiation → Won → Lost → Archived
  - Bid cards with customer info, estimated value, due dates
  - Pipeline statistics (total value, win rate, overdue count)

- **Jobs Page** (`/jobs`, `/jobs/[id]`)
  - Jobs created automatically when bids marked as "Won"
  - Budget vs actual cost tracking
  - Cost code assignment
  - Job status management

- **Bid-to-Job Conversion**
  - When bid stage changes to "won", automatically creates:
    - Estimate record in database
    - Job linked to estimate
    - Default job phases (Pre-Job, Mobilization, Execution, Quality Check, Closeout)

### 4. Data Stores (Zustand)
- `useQuoteStore` - Quote/measurement state
- `usePricingStore` - Pricing calculations
- `useSiteStore` - Site objects and trades
- `useBlueprintStore` - Blueprint documents
- `useConcreteStore` - Concrete-specific measurements
- `useDashboardStore` - Bid pipeline state
- `useJobsStore` - Jobs and phases

### 5. API Routes
- `/api/bids/*` - Bid CRUD operations
- `/api/pdf/*` - PDF upload, processing, pages
- `/api/blueprint/analyze` - Claude Vision analysis
- `/api/site-media/*` - Photo/video uploads
- `/api/google-tiles/session` - Google satellite tiles
- `/api/health` - Health check

### 6. Database Schema (Drizzle + Neon PostgreSQL)
- `users` - Authentication
- `sites` - Site/property records
- `site_objects` - Map geometries
- `estimates` - Estimate records
- `estimate_line_items` - Line item details
- `jobs` - Job records
- `job_budgets` - Budget allocations
- `job_costs` - Actual cost entries
- `cost_codes` - Cost code definitions
- `change_orders` - Change order tracking

---

## Recent Fixes

### Build & Deployment
- Fixed Supabase client lazy-loading to prevent Vercel build failures
- Fixed Neon database connection lazy-loading
- All environment variables now loaded at runtime, not build time

### Dashboard & Navigation
- Added Site Address field to bid creation modal
- Fixed modal font colors (were too light on white background)
- Fixed dashboard layout overflow (was too big for viewport)
- Bid clicks now navigate to `/site?address=...` for map centering
- Bid cards now display address in green when set

### Site Estimator
- Added Photos button to header (matching Rule Tool)
- Address from URL parameter triggers geocoding and map fly-to

---

## Known Issues / TODO

### High Priority
- [ ] Photos panel not yet implemented (button shows "coming soon")
- [ ] Existing bids don't have addresses (need to add via edit or create new)
- [ ] Blueprint analysis results stored in sessionStorage (not persistent)

### Medium Priority
- [ ] Edit bid functionality (to add address to existing bids)
- [ ] Persistent storage for blueprint analysis results
- [ ] Site media gallery integration
- [ ] Export estimates to PDF

### Low Priority
- [ ] Drag-and-drop bid cards between pipeline stages
- [ ] Bid notifications and reminders
- [ ] Team collaboration features
- [ ] Mobile responsive improvements

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# Supabase (for storage)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=...

# AI Analysis
ANTHROPIC_API_KEY=...
```

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **State**: Zustand with persistence
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Storage**: Supabase Storage
- **Maps**: Mapbox GL JS
- **AI**: Anthropic Claude (Vision API)
- **PDF**: PDF.js (client-side rendering)
- **Deployment**: Vercel

---

## File Structure
```
job_sense/
├── app/
│   ├── (app)/           # Authenticated routes
│   │   ├── dashboard/   # Bid pipeline
│   │   ├── jobs/        # Job management
│   │   ├── sites/       # Site list
│   │   └── estimates/   # Estimates list
│   ├── site/            # Map estimator
│   ├── quote/           # Quote flow
│   ├── blueprint/       # Blueprint viewer
│   └── api/             # API routes
├── components/          # React components
├── lib/
│   ├── db/              # Database config
│   ├── auth/            # Authentication
│   ├── quote/           # Quote logic
│   ├── site/            # Site store
│   ├── dashboard/       # Dashboard store
│   ├── jobs/            # Jobs store
│   ├── blueprint/       # Blueprint store
│   └── supabase/        # Supabase client & types
└── public/              # Static assets
```

---

## Deployment
The app auto-deploys to Vercel on push to `main` branch.

**Production URL**: https://job-sense.vercel.app

---

*Last updated: January 2026*
