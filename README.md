# Bid-Master Marketing Platform

Lead generation engine for the Bid-Master AI-powered government contract management platform. Built with Next.js 15, Sanity CMS, and enterprise security headers.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
npm run dev
```

Visit `http://localhost:3000` for the site and `http://localhost:3000/studio` for the CMS.

## Architecture

| Component     | Technology      | Purpose                        |
|---------------|-----------------|--------------------------------|
| Frontend      | Next.js 15      | SSR marketing pages            |
| CMS           | Sanity.io       | Blog posts & opportunity data  |
| Email         | Resend          | Lead capture & newsletters     |
| Hosting       | Vercel          | Edge deployment                |
| SEO           | Dynamic sitemap | Automated search indexing      |

## Deployment to Vercel

1. Push this repo to GitHub
2. Import in Vercel dashboard → Connect your GitHub repo
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET` (usually `production`)
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
   - `RESEND_API_KEY` (optional — for email capture)
   - `RESEND_AUDIENCE_ID` (optional)
4. Deploy

## Sanity CMS Setup

See `SETUP.md` for detailed Sanity configuration instructions.

## Content Schemas

- **Post** — Blog articles tagged by tier (Enterprise/SMB/Set-Aside)
- **Author** — Content creator profiles
- **Category** — Topic classification
- **Opportunity** — Government contract teasers for honey pot lead capture
