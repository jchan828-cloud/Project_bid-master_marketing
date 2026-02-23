# Sanity CMS Setup Guide

## Prerequisites

- Node.js 20+
- A Sanity.io account (free at sanity.io)
- This repo cloned locally

## Step 1: Create Sanity Project

Go to [sanity.io/manage](https://www.sanity.io/manage) and create a new project:

- **Name**: `Bid-Master Marketing`
- **Plan**: Free tier is fine to start
- **Dataset**: `production`

Note your **Project ID** from the dashboard.

## Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_SANITY_DATASET=production
```

## Step 3: Generate API Token

In Sanity dashboard → Settings → API → Tokens:

1. Click "Add API token"
2. Name: `Marketing Platform`
3. Permissions: **Editor**
4. Copy the token

Add to `.env.local`:
```
SANITY_API_TOKEN=your-token-here
```

## Step 4: Add CORS Origin

In Sanity dashboard → Settings → API → CORS origins:

- Add `http://localhost:3000` (with credentials)
- Add your production URL when ready

## Step 5: Start Development

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Studio: http://localhost:3000/studio

## Step 6: Seed Initial Content

In the Studio (`/studio`), create:

1. **Author** — Your name and bio
2. **Categories** — e.g., "Compliance", "AI & Automation", "Set-Aside Programs"
3. **Blog Posts** — At least 1 per tier to populate the blog page
4. **Opportunities** — 2-3 sample opportunities for the honey pot pages

## Step 7: Deploy to Vercel

```bash
# Option A: Vercel CLI
npm i -g vercel
vercel --prod

# Option B: GitHub integration
# Push to GitHub → Import in Vercel dashboard
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SITE_URL` (e.g., https://www.bid-master.com)
- `SANITY_API_TOKEN`
- `RESEND_API_KEY` (when ready for email)
- `RESEND_AUDIENCE_ID` (when ready for email)
