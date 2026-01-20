# Job Sense

Job Sense is a single-app estimating + job-costing platform for asphalt, sealcoating, and striping.

## MVP Scope
- Site measurement on satellite maps
- Estimate builder with trade templates
- Convert estimate to job
- Budget vs actual tracking
- Profit reporting

## Tech Stack
- Next.js (App Router)
- TypeScript
- Vercel Postgres
- Drizzle ORM
- Auth.js (Credentials)
- Resend for verification/reset emails
- Mapbox GL + Mapbox Draw

## Environment Variables
Create a `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Required:
- `DATABASE_URL`
- `POSTGRES_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

## Development

```bash
npm install
npm run dev
```

## Database
Generate migrations and push to Vercel Postgres:

```bash
npm run db:generate
npm run db:push
```

## Notes
- Auth is credentials-based and uses the `users` table in `lib/db/schema.ts`.
- Mapbox tools are wired for measurements in `/sites/[id]`.

## Next Steps
Follow `docs/IMPLEMENTATION_CHECKLIST.md` for the remaining build phases.
