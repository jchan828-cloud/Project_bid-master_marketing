# Deploy Bid-Master Marketing to Production

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all build blockers and deploy the Bid-Master Marketing platform to Vercel production.

**Architecture:** The site is a Next.js SSR marketing platform with Sanity CMS, Resend email integration, and AWS Parameter Store for secrets. It uses Tailwind CSS v4 for styling and deploys to Vercel with geo-routing middleware for data residency compliance.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Sanity CMS, Resend, Zod, Vercel

---

## Current Blockers (3 issues preventing `npm run build`)

1. **Tailwind CSS v3/v4 mismatch** — `globals.css` and `postcss.config.mjs` use Tailwind v4 syntax, but `package.json` lists `tailwindcss@^3.4.0` and `@tailwindcss/postcss` is not installed at all.
2. **RxJS module resolution failure** — Sanity Studio bundles (`@sanity/bifur-client`) can't resolve `rxjs/operators`. Needs `next.config.ts` with proper webpack/transpile config.
3. **Missing `@aws-sdk/client-ssm` dependency** — `src/lib/aws-parameters.ts` imports from it but it's not in `package.json`.

**Bonus fix:** 4 TypeScript errors in `aws-parameters.ts` (`.default` property not typed on `as const` object).

---

### Task 1: Fix `package.json` Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Update package.json with corrected dependencies**

Replace the full `package.json` with:

```json
{
  "name": "bidmaster-marketing",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@aws-sdk/client-ssm": "^3.700.0",
    "@portabletext/react": "^3.2.0",
    "@sanity/client": "^6.24.0",
    "@sanity/image-url": "^1.1.0",
    "@sanity/vision": "^3.72.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "next": "^15.3.3",
    "next-sanity": "9.8.12",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "resend": "^4.1.0",
    "sanity": "^3.72.0",
    "styled-components": "^6.1.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

Changes from current:
- Added `@aws-sdk/client-ssm` (required by `src/lib/aws-parameters.ts`)
- Changed `tailwindcss` from `^3.4.0` to `^4.0.0` (matches v4 CSS syntax in `globals.css`)
- Added `@tailwindcss/postcss` `^4.0.0` (required by `postcss.config.mjs`)
- Removed `autoprefixer` (built into Tailwind v4)

**Step 2: Clean install**

Run: `rm -rf node_modules package-lock.json && npm install`
Expected: Clean install completes without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix: align dependencies with Tailwind v4 and add missing packages"
```

---

### Task 2: Create `next.config.ts` to Fix Sanity/RxJS Resolution

**Files:**
- Create: `next.config.ts`

The root cause of the "Can't resolve 'rxjs/operators'" error is that Next.js 15's webpack bundler doesn't properly resolve Sanity's transitive RxJS dependencies. The fix is to add Sanity packages to `serverExternalPackages` (so they aren't bundled by webpack on the server) and configure the webpack resolver.

**Step 1: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Exclude heavy Sanity Studio deps from server-side webpack bundling
  serverExternalPackages: ['sanity', '@sanity/vision', '@sanity/bifur-client'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Step 2: Attempt build to verify RxJS resolution is fixed**

Run: `npm run build`

If this still fails with RxJS errors, try alternate fix — add webpack resolve alias in next.config.ts:

```typescript
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    'rxjs/operators': require.resolve('rxjs/operators'),
  }
  return config
},
```

**Step 3: If build still fails, try `transpilePackages`**

Add to next.config.ts:
```typescript
transpilePackages: ['sanity', '@sanity/vision', '@sanity/bifur-client', 'rxjs'],
```

**Step 4: Commit once build passes**

```bash
git add next.config.ts
git commit -m "feat: add next.config.ts with Sanity resolution fix and security headers"
```

---

### Task 3: Fix TypeScript Errors in `aws-parameters.ts`

**Files:**
- Modify: `src/lib/aws-parameters.ts:34-135` (PARAMETERS definition)

**Step 1: Add proper typing for optional `default` field**

The `PARAMETERS` object uses `as const` but some entries have a `default` property and some don't. The code accesses `(config as any).default` which breaks type safety. Fix by adding a type that includes `default` as optional.

Replace the `PARAMETERS` definition (lines 34-135) with a properly typed version. Add this interface before `PARAMETERS`:

```typescript
interface ParameterConfig {
  name: string
  secure: boolean
  required: boolean
  public: boolean
  default?: string
}

export const PARAMETERS: Record<string, ParameterConfig> = {
  // Sanity CMS
  SANITY_PROJECT_ID: {
    name: 'sanity-project-id',
    secure: false,
    required: true,
    public: true,
  },
  SANITY_DATASET: {
    name: 'sanity-dataset',
    secure: false,
    required: true,
    public: true,
  },
  SANITY_API_VERSION: {
    name: 'sanity-api-version',
    secure: false,
    required: false,
    default: '2024-01-01',
    public: true,
  },
  SANITY_API_TOKEN: {
    name: 'sanity-api-token',
    secure: true,
    required: true,
    public: false,
  },

  // Email (Resend)
  RESEND_API_KEY: {
    name: 'resend-api-key',
    secure: true,
    required: true,
    public: false,
  },
  RESEND_AUDIENCE_ID: {
    name: 'resend-audience-id',
    secure: false,
    required: false,
    public: false,
  },

  // AI (Gemini)
  GEMINI_API_KEY: {
    name: 'gemini-api-key',
    secure: true,
    required: true,
    public: false,
  },

  // SAM.gov
  SAM_API_KEY: {
    name: 'sam-api-key',
    secure: true,
    required: false,
    public: false,
  },

  // Social Media
  LINKEDIN_ACCESS_TOKEN: {
    name: 'linkedin-access-token',
    secure: true,
    required: false,
    public: false,
  },
  LINKEDIN_ORG_ID: {
    name: 'linkedin-org-id',
    secure: false,
    required: false,
    public: false,
  },

  // Analytics
  POSTHOG_KEY: {
    name: 'posthog-key',
    secure: false,
    required: false,
    public: true,
  },
  POSTHOG_HOST: {
    name: 'posthog-host',
    secure: false,
    required: false,
    default: 'https://app.posthog.com',
    public: true,
  },

  // App Integration
  APP_URL: {
    name: 'app-url',
    secure: false,
    required: false,
    default: 'https://app.bidmaster.com',
    public: true,
  },
  APP_REDIRECT_SECRET: {
    name: 'app-redirect-secret',
    secure: true,
    required: false,
    public: false,
  },
}
```

Then update the `ParameterKey` type:

```typescript
export type ParameterKey = keyof typeof PARAMETERS
```

And remove all `(config as any).default` casts — replace with `config.default`:

- Line 177: `return response.Parameter?.Value || config.default || null`
- Line 184: `return config.default || null`
- Line 211: `result[key] = param?.Value || PARAMETERS[key].default || null`
- Line 356: `return PARAMETERS[key].default || null`

**Step 2: Run type check**

Run: `npm run type-check`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/lib/aws-parameters.ts
git commit -m "fix: add proper typing for PARAMETERS default field"
```

---

### Task 4: Verify Production Build Passes

**Files:** None (verification only)

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with output like:
```
✓ Creating an optimized production build
✓ Compiled successfully
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: 0 errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No critical errors (warnings are OK)

**Step 4: Test locally**

Run: `npm run start`
Expected: Site loads at http://localhost:3000 without errors

If build fails, debug the specific error before proceeding. Do NOT move to Task 5 until the build passes.

---

### Task 5: Clean Up Workspace

**Files:**
- Delete: `build-output.txt`
- Delete: `build-output-2.txt`
- Delete: `type-check-output.txt`
- Delete: `type-check-direct.txt`
- Review: `temp_updates/` (reference material, should not be deployed)

**Step 1: Remove stale build artifacts**

```bash
rm -f build-output.txt build-output-2.txt type-check-output.txt type-check-direct.txt
```

**Step 2: Add `temp_updates/` to `.gitignore`**

The `temp_updates/` directory is reference material from the pre-v4 migration. It should not be committed or deployed.

Add to `.gitignore`:
```
temp_updates/
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: clean up stale build logs and ignore temp_updates"
```

---

### Task 6: Deploy to Vercel

**Files:** None (Vercel CLI / Dashboard setup)

**Step 1: Verify Vercel CLI is available**

Run: `npx vercel --version`

If not installed: `npm install -g vercel`

**Step 2: Link project to Vercel**

Run: `npx vercel link`

Follow prompts:
- Select the appropriate Vercel team/account
- Link to an existing project or create a new one
- Project name: `bidmaster-marketing`
- Framework: Next.js (auto-detected)

**Step 3: Configure environment variables in Vercel**

Go to Vercel Dashboard → Project Settings → Environment Variables, or use CLI:

**Required for basic functionality:**
```bash
npx vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID     # Value: your Sanity project ID
npx vercel env add NEXT_PUBLIC_SANITY_DATASET         # Value: production
npx vercel env add SANITY_API_TOKEN                   # Value: your Sanity API token (sensitive)
npx vercel env add NEXT_PUBLIC_SITE_URL               # Value: https://your-domain.com
```

**Required for lead capture (can add later):**
```bash
npx vercel env add RESEND_API_KEY                     # Value: your Resend API key
npx vercel env add RESEND_AUDIENCE_ID                 # Value: your Resend audience ID
```

**Optional (AWS Parameter Store - only if using AWS secrets):**
```bash
npx vercel env add AWS_ACCESS_KEY_ID
npx vercel env add AWS_SECRET_ACCESS_KEY
npx vercel env add AWS_REGION                         # Value: us-east-1
```

**Step 4: Deploy preview**

Run: `npx vercel`
Expected: Successful deployment to preview URL. Verify the site loads.

**Step 5: Check preview deployment**

- Visit the preview URL
- Verify homepage loads with all sections (Hero, How It Works, Tiers, Testimonials, CTA)
- Verify `/studio` route loads Sanity Studio
- Check browser console for errors

**Step 6: Deploy to production**

Run: `npx vercel --prod`
Expected: Successful production deployment.

**Step 7: Commit Vercel project files**

```bash
git add .vercel/project.json
git commit -m "chore: add Vercel project configuration"
```

---

### Task 7: Post-Deployment Verification

**Step 1: Verify production URL**

- Visit the production URL
- All page sections render correctly
- No console errors
- Responsive design works on mobile viewport

**Step 2: Test the lead capture API**

```bash
curl -X POST https://your-domain.com/api/lead \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "tier": "smb"}'
```

Expected: `{"message":"Lead captured successfully","success":true}` (or graceful error if RESEND_API_KEY not set)

**Step 3: Test geo-routing middleware**

Visit `https://your-domain.com/signup`
Expected: Redirects to `https://auth.bidmaster.us/signup` (or `.ca` for Canadian IPs)

**Step 4: Verify security headers**

```bash
curl -I https://your-domain.com
```

Expected headers present:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Summary of Changes

| Task | What | Why |
|------|------|-----|
| 1 | Fix `package.json` deps | Tailwind v4 + missing `@aws-sdk/client-ssm` |
| 2 | Create `next.config.ts` | Fix RxJS/Sanity resolution + security headers |
| 3 | Fix `aws-parameters.ts` types | Eliminate `as any` casts and TS errors |
| 4 | Verify build | Gate: don't deploy broken code |
| 5 | Clean workspace | Remove stale logs, ignore temp_updates |
| 6 | Deploy to Vercel | Preview → verify → production |
| 7 | Post-deploy verification | Confirm all features work in production |
