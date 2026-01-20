# Job Sense Implementation Checklist

## Phase 0: Project Setup
- [ ] Initialize Next.js app (App Router, TypeScript, Tailwind)
- [ ] Add Drizzle + Vercel Postgres
- [ ] Configure Auth.js Credentials provider
- [ ] Wire up Resend for verification/reset emails

## Phase 1: Core Data Model
- [ ] Apply `db/schema.sql` to Vercel Postgres
- [ ] Seed `cost_codes` for asphalt, sealcoating, striping
- [ ] Add initial trade templates in `lib/templates`

## Phase 2: Site Measurement
- [ ] Port Mapbox map + drawing tools from Rule Tool
- [ ] Save `site_objects` with geometry + measurements
- [ ] Add site list and detail views

## Phase 3: Estimating
- [ ] Build estimate list + detail pages
- [ ] Line item editor with cost code mapping
- [ ] Totals + tax/markup inputs
- [ ] Estimate PDF export (optional)

## Phase 4: Job Costing
- [ ] Convert estimate -> job
- [ ] Budget vs actual view
- [ ] Cost entry UI
- [ ] Variance indicators (green/yellow/red)

## Phase 5: Reporting
- [ ] Profitability report
- [ ] Estimate accuracy report
- [ ] Close rate report (optional)

## Phase 6: Polish
- [ ] Onboarding
- [ ] Empty states
- [ ] Actionable tooltips
- [ ] Performance pass

## Page Map
- `/login`
- `/register`
- `/dashboard`
- `/sites`
- `/sites/[id]`
- `/estimates`
- `/estimates/[id]`
- `/jobs`
- `/jobs/[id]`
- `/reports`
