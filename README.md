# Bid-Master Marketing Platform

> 🚀 The Growth Engine for Bid-Master - An AI-powered content and lead generation platform for government contractors.

## Overview

This marketing platform is a standalone, high-performance website designed to generate qualified leads for the main Bid-Master SaaS application. Unlike a traditional brochure site, it functions as an **automated media company** that:

- 📡 Monitors government sources for compliance updates
- ✍️ Generates timely, expert content using AI (Gemini 3.0)
- 📢 Broadcasts opportunities to social channels
- 🎯 Drives high-intent traffic into the sales funnel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKETING PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   Sanity     │  │   Resend     │      │
│  │   Frontend   │  │   CMS        │  │   Email      │      │
│  │   (Vercel)   │  │   (Content)  │  │   (Leads)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐       │
│  │              AWS PARAMETER STORE                 │       │
│  │         (Centralized Secrets Management)         │       │
│  │   /bidmaster/marketing/{env}/{parameter}         │       │
│  └──────────────────────────────────────────────────┘       │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐       │
│  │           AUTOMATION ENGINE (GitHub Actions)     │       │
│  │                                                   │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │       │
│  │  │Topic Radar  │  │Blog Writer  │  │Social    │ │       │
│  │  │(RSS Scan)   │  │(Gemini 3.0) │  │Poster    │ │       │
│  │  └─────────────┘  └─────────────┘  └──────────┘ │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 15 + Tailwind | SEO-optimized, fast-loading pages |
| CMS | Sanity.io | Structured content management |
| Email | Resend | Newsletter & lead capture |
| AI | Gemini 3.0 Flash | Content generation |
| Secrets | AWS Parameter Store | Centralized secrets management |
| Hosting | Vercel | Edge deployment |
| Automation | GitHub Actions | Scheduled content pipelines |

## 🔐 Secrets Management with AWS Parameter Store

All secrets are managed through AWS Systems Manager Parameter Store, providing:

- **Encryption at rest** using AWS KMS for SecureString parameters
- **Centralized management** across environments
- **Audit trail** via CloudTrail
- **IAM-based access control**

### Parameter Naming Convention

```
/bidmaster/marketing/{environment}/{parameter-name}

Examples:
/bidmaster/marketing/production/sanity-project-id
/bidmaster/marketing/production/resend-api-key (SecureString)
/bidmaster/marketing/development/gemini-api-key (SecureString)
```

### Parameter Categories

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sanity-project-id` | String | ✅ | Sanity.io project ID |
| `sanity-dataset` | String | ✅ | Sanity dataset name |
| `sanity-api-token` | SecureString | ✅ | Sanity write token |
| `resend-api-key` | SecureString | ✅ | Resend API key |
| `gemini-api-key` | SecureString | ✅ | Google Gemini API key |
| `sam-api-key` | SecureString | ❌ | SAM.gov API key |
| `linkedin-access-token` | SecureString | ❌ | LinkedIn API token |
| `posthog-key` | String | ❌ | PostHog analytics key |

### Setup Parameters

```bash
# Interactive setup (prompts for values)
npm run setup:params:interactive

# Production setup (reads from environment variables)
npm run setup:params:prod

# Development setup
npm run setup:params
```

### IAM Policies

Two IAM policies are provided in `infrastructure/`:

1. **`iam-policy-read.json`** - For application runtime (Vercel, GitHub Actions)
   - Read-only access to parameters
   - KMS decrypt for SecureStrings

2. **`iam-policy-admin.json`** - For setup and management
   - Full CRUD on parameters
   - KMS encrypt/decrypt

### Vercel Integration

For Vercel deployments, set these environment variables:

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

The application will automatically load secrets from Parameter Store at runtime.

### Local Development

For local development, you can either:

1. **Use environment variables** (`.env.local`) - The app falls back to env vars
2. **Use AWS credentials** - Configure `~/.aws/credentials` with appropriate access

## 3-Tier Audience Strategy

| Tier | Persona | Content Focus | Lead Magnet |
|------|---------|---------------|-------------|
| **Enterprise** | Proposal Manager at Defense Prime | FAR/DFARS compliance, risk reduction | 2026 Compliance Matrix Template |
| **SMB** | Founder ($2M-$10M contractor) | Scale proposal capacity, win more bids | Bid/No-Bid Decision Matrix |
| **Set-Aside** | 8(a)/Indigenous business owner | Certification guidance, prime partnering | Certification Roadmap |

## Key Features

### 🔍 Topic Radar

Monitors Federal Register, Canada Gazette, and government sources for relevant regulatory updates.

### ✍️ AI Content Factory

- Generates blog drafts using Gemini 3.0
- Includes anti-hallucination validation
- Human-in-the-loop approval workflow

### 🍯 Honey Pot Pages

Dynamic opportunity teaser pages that capture leads from contractors researching specific RFPs.

### 📢 Social Broadcasting

- LinkedIn Company Page integration
- Twitter via Buffer (cost bypass)
- Reddit "Whisper Mode" monitoring

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Sanity.io account (free tier)
- Vercel account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bidmaster-marketing.git
cd bidmaster-marketing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Sanity Setup

```bash
# Initialize Sanity (from project root)
npx sanity init --create-project "Bid-Master Marketing" --dataset production

# Deploy Sanity Studio
npx sanity deploy
```

## Project Structure

```
bidmaster-marketing/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Homepage
│   │   ├── blog/             # Blog section
│   │   ├── opportunities/    # Honey pot pages
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── layout/           # Header, Footer
│   │   ├── sections/         # Page sections
│   │   ├── blog/             # Blog components
│   │   └── ui/               # Shared UI components
│   ├── lib/                  # Utilities & Sanity client
│   ├── sanity/               # CMS schema
│   └── types/                # TypeScript types
├── automation/
│   ├── scripts/              # Python automation
│   │   ├── topic_radar.py    # RSS monitoring
│   │   └── blog_writer.py    # AI content generation
│   └── templates/            # Email & social templates
├── public/                   # Static assets
└── .github/
    └── workflows/            # GitHub Actions
```

## Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Vercel)

Set these in Vercel project settings:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `RESEND_API_KEY`
- `GEMINI_API_KEY`

### GitHub Secrets (Automation)

Set these in repository settings:

- `GEMINI_API_KEY`
- `REVIEWER_EMAIL`
- `SAM_API_KEY`
- `LINKEDIN_ACCESS_TOKEN`
- `SLACK_WEBHOOK`

## Content Workflow

1. **Topic Radar** runs daily, scanning for relevant regulatory updates
2. **Blog Writer** generates drafts on Monday mornings
3. **Human Review** - team receives email, approves or edits
4. **Publish** - content goes live on Sanity → Next.js
5. **Social** - automatic posting to LinkedIn/Twitter

## Analytics & KPIs

**North Star Metric:** Conversion rate from Honey Pot pages to "Sign Up to Analyze"

Track in PostHog:

- Blog → Signup conversions
- Lead magnet downloads
- Time on page by tier
- Social referral traffic

## Security Considerations

- Marketing platform is **completely decoupled** from main SaaS
- No access to customer data
- Read-only Sanity API for frontend
- Signed redirects to app.bidmaster.com

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Test locally with `npm run dev`
4. Submit PR for review

## License

Proprietary - Bid-Master Inc.
