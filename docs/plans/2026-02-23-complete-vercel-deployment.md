# Complete Vercel Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish deploying the Bid-Master Marketing platform to Vercel production, verify it works end-to-end, and commit all outstanding changes.

**Architecture:** Next.js 16 SSR marketing site with Sanity CMS for content, Resend for lead capture email, and geo-routing middleware for data residency. Deploys to Vercel with environment variables for Sanity and Resend credentials. AWS Parameter Store is optional (production secrets fallback).

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript 5.9, Tailwind CSS v4, Sanity CMS, Resend, Vercel, pnpm

---

## Current State

| Item | Status |
|------|--------|
| Build passes locally | Yes (18.2s) |
| TypeScript errors | 0 |
| Vercel project linked | Yes (`prj_7XGuasPF63nVSnYA0FjP3QDV3PMF`) |
| Vercel framework detected | `null` (needs fix) |
| Latest deployment | `READY` (production target) |
| Production domain | `bid-master-marketing.vercel.app` |
| Environment vars configured | Unknown — needs verification |
| Uncommitted local changes | `.gitignore`, `README.md`, deleted `package-lock.json`, new `.env.example`, `SETUP.md`, `docs/` |
| Branch divergence | 8 local commits ahead, 2 remote commits behind |

---

### Task 1: Verify Current Deployment Health

**Files:** None (verification only)

**Step 1: Check if the production URL loads**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" https://bid-master-marketing.vercel.app
```

Expected: `200` (site loads) or `404`/`500` (deployment exists but broken)

**Step 2: Check security headers on production**

Run:
```bash
curl -sI https://bid-master-marketing.vercel.app | grep -iE "(x-frame|x-content-type|referrer-policy|server)"
```

Expected: Security headers present if next.config.ts was deployed:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Step 3: Check Vercel build logs for errors**

Use the Vercel MCP tool `get_deployment_build_logs` with:
- `idOrUrl`: `dpl_9E2UPZNX4gPzxL7x3wVTq2damrGD`
- `teamId`: `team_8QWGxLy9SDihQfzmL1jPZvpN`

Look for: framework detection, build command, environment variable warnings.

**Step 4: Record findings**

Document what works and what's broken. This determines which subsequent tasks are needed.

---

### Task 2: Fix Vercel Framework Configuration

**Files:** None (Vercel dashboard/CLI)

The Vercel project shows `"framework": null` despite `vercel.json` specifying `"framework": "nextjs"`. This may cause incorrect build settings.

**Step 1: Verify current Vercel project settings**

Run:
```bash
npx vercel inspect dpl_9E2UPZNX4gPzxL7x3wVTq2damrGD
```

Check that Framework Preset is "Next.js", Build Command is `next build`, Output Directory is `.next`.

**Step 2: If framework is wrong, fix via Vercel CLI**

Run:
```bash
npx vercel project ls
```

If the framework preset is not Next.js, go to Vercel Dashboard → Project Settings → General → Framework Preset → select "Next.js".

Alternatively, redeploy with explicit settings:
```bash
npx vercel --build-env FRAMEWORK_PRESET=nextjs
```

**Step 3: Verify the fix**

After updating, confirm the project settings show `framework: "nextjs"`.

---

### Task 3: Configure Vercel Environment Variables

**Files:** None (Vercel dashboard/CLI)

**Step 1: List current environment variables**

Run:
```bash
npx vercel env ls
```

Expected: See what's already configured.

**Step 2: Add required Sanity CMS variables (if missing)**

These are required for the site to render content:

```bash
npx vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production preview development
# Enter value: (the Sanity project ID from .env.local — qqkx51rw)

npx vercel env add NEXT_PUBLIC_SANITY_DATASET production preview development
# Enter value: production

npx vercel env add NEXT_PUBLIC_SITE_URL production
# Enter value: https://bid-master-marketing.vercel.app
```

**Step 3: Add Sanity API token (if missing)**

```bash
npx vercel env add SANITY_API_TOKEN production preview development
# Enter value: (the token from .env.local — SENSITIVE)
```

**Step 4: Add Resend variables (optional — for lead capture)**

```bash
npx vercel env add RESEND_API_KEY production preview development
# Enter value: (Resend API key if available)

npx vercel env add RESEND_AUDIENCE_ID production preview development
# Enter value: (Resend audience ID if available)
```

If Resend keys are not available yet, skip this step. The lead capture API will return a 500 gracefully.

**Step 5: Verify all variables are set**

Run:
```bash
npx vercel env ls
```

Expected: At minimum, see `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SITE_URL`.

---

### Task 4: Deploy Preview and Verify

**Files:** None

**Step 1: Trigger a fresh preview deployment**

This ensures the latest code + environment variables are deployed:

```bash
npx vercel
```

Expected: Deployment starts, builds successfully, returns a preview URL.

**Step 2: Verify preview build succeeds**

Watch the deployment output. Expected:
```
✓ Build Completed
✓ Deployment complete
```

If the build fails, check the error and fix before proceeding.

**Step 3: Open preview URL and verify homepage**

Visit the preview URL in a browser. Verify:
- [ ] Page loads without blank screen
- [ ] Hero section renders with text and CTA button
- [ ] How It Works section shows process steps
- [ ] Tier Features section shows Enterprise/SMB/Set-Aside tiers
- [ ] Testimonials section renders
- [ ] CTA section with email form renders
- [ ] Header navigation is present
- [ ] Footer renders

**Step 4: Verify Sanity Studio loads**

Visit `{preview-url}/studio`

Expected: Sanity Studio interface loads (may show login prompt — this is correct).

**Step 5: Check browser console for errors**

Open DevTools → Console tab. Look for:
- Red errors (critical)
- Sanity connection errors (missing env vars)
- Hydration mismatches (SSR issues)

---

### Task 5: Deploy to Production

**Files:** None

**Step 1: Deploy to production**

Run:
```bash
npx vercel --prod
```

Expected: Production deployment succeeds with output like:
```
✓ Production deployment complete
```

**Step 2: Verify production URL loads**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" https://bid-master-marketing.vercel.app
```

Expected: `200`

---

### Task 6: Post-Deployment Verification

**Files:** None (verification only)

**Step 1: Verify security headers**

Run:
```bash
curl -sI https://bid-master-marketing.vercel.app | grep -iE "(x-frame|x-content-type|referrer-policy)"
```

Expected:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

**Step 2: Test the lead capture API**

Run:
```bash
curl -X POST https://bid-master-marketing.vercel.app/api/lead \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "tier": "smb"}'
```

Expected (if Resend configured): `{"message":"Lead captured successfully","success":true}`
Expected (if Resend NOT configured): `{"error":"Internal server error"}` with status 500 — this is OK for now.

**Step 3: Test geo-routing middleware**

Run:
```bash
curl -sI https://bid-master-marketing.vercel.app/signup
```

Expected: `302` or `307` redirect to `https://auth.bidmaster.us/signup` (or `.ca` for Canadian IPs). Note: this redirect target (`auth.bidmaster.us`) may not exist yet — the redirect itself working is what we verify.

**Step 4: Verify all homepage sections render**

Visit `https://bid-master-marketing.vercel.app` and confirm:
- [ ] Hero section with CTA
- [ ] How It Works process steps
- [ ] Tier Features (Enterprise/SMB/Set-Aside)
- [ ] Testimonials
- [ ] Footer CTA
- [ ] Mobile responsive (resize browser to 375px width)

**Step 5: Check Vercel deployment analytics**

Use Vercel MCP tool `get_deployment` to confirm:
- `readyState`: `READY`
- No build warnings or errors

---

### Task 7: Commit Outstanding Local Changes

**Files:**
- Modify: `.gitignore` (already modified — adds `.vercel`)
- Modify: `README.md` (already modified — simplified)
- Delete: `package-lock.json` (already deleted — project uses pnpm)
- Create (stage): `.env.example`
- Create (stage): `SETUP.md`
- Create (stage): `docs/plans/2026-02-23-deploy-to-production.md`
- Create (stage): `docs/plans/2026-02-23-complete-vercel-deployment.md`

**Step 1: Review all uncommitted changes**

Run:
```bash
git status
git diff
```

Verify nothing unexpected is staged or modified.

**Step 2: Stage the documentation and config files**

```bash
git add .gitignore README.md .env.example SETUP.md docs/plans/
```

Do NOT stage:
- `.claude/` — IDE/tool config, should stay local
- `.vercel/` — already in .gitignore
- `.env.local` — secrets, already in .gitignore

**Step 3: Remove deleted package-lock.json from tracking**

```bash
git rm --cached package-lock.json 2>/dev/null || true
```

**Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs: add deployment documentation and clean up README

- Simplify README with focused quick-start and architecture
- Add .env.example template for new contributors
- Add SETUP.md with Sanity CMS configuration guide
- Add deployment plans to docs/plans/
- Ignore .vercel directory in .gitignore
- Remove stale package-lock.json (project uses pnpm)
EOF
)"
```

---

### Task 8: Push to Remote and Create PR

**Files:** None (git operations only)

**Step 1: Check branch divergence**

Run:
```bash
git log --oneline HEAD...origin/update-next-16-air-gap-1376236411467861849 --left-right
```

This shows which commits are local-only (`<`) vs remote-only (`>`).

**Step 2: Rebase on remote to incorporate remote changes**

Run:
```bash
git fetch origin
git rebase origin/update-next-16-air-gap-1376236411467861849
```

If conflicts occur, resolve them and continue:
```bash
git rebase --continue
```

**Step 3: Push to remote**

Run:
```bash
git push origin update-next-16-air-gap-1376236411467861849
```

If push is rejected due to rebase, force push (safe since this is a feature branch):
```bash
git push --force-with-lease origin update-next-16-air-gap-1376236411467861849
```

**Step 4: Create pull request to master**

Run:
```bash
gh pr create \
  --base master \
  --head update-next-16-air-gap-1376236411467861849 \
  --title "feat: Next.js 16 upgrade, Air-Gap protocols, and Vercel deployment" \
  --body "$(cat <<'EOF'
## Summary

- Upgrade to Next.js 16.1.6 + React 19 + Tailwind CSS v4
- Implement Air-Gap lead capture protocol (Resend integration)
- Implement Sovereign Handoff geo-routing middleware
- Add AWS Parameter Store integration for production secrets
- Add security headers (X-Frame-Options, CSP, Referrer-Policy)
- Deploy to Vercel production at bid-master-marketing.vercel.app
- Add Sanity CMS schemas (Post, Author, Category, Opportunity)
- Add documentation (SETUP.md, .env.example, deployment plans)

## Test plan

- [ ] Production build passes (`pnpm build`)
- [ ] TypeScript compiles with zero errors (`pnpm type-check`)
- [ ] Homepage renders all 5 sections (Hero, How It Works, Tiers, Testimonials, CTA)
- [ ] Sanity Studio loads at /studio
- [ ] Lead capture API responds at POST /api/lead
- [ ] Geo-routing middleware redirects /signup based on country
- [ ] Security headers present on all responses
- [ ] Vercel production deployment is READY

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 5: Verify PR was created**

Run:
```bash
gh pr view --web
```

---

## Summary of Tasks

| Task | What | Time Est. |
|------|------|-----------|
| 1 | Verify current deployment health | 3 min |
| 2 | Fix Vercel framework configuration | 3 min |
| 3 | Configure Vercel environment variables | 5 min |
| 4 | Deploy preview and verify | 5 min |
| 5 | Deploy to production | 3 min |
| 6 | Post-deployment verification | 5 min |
| 7 | Commit outstanding local changes | 3 min |
| 8 | Push to remote and create PR | 5 min |

**Total:** ~32 minutes

## Notes

- Tasks 1-6 focus on getting the Vercel deployment fully working
- Tasks 7-8 focus on committing and pushing all changes
- Task 2 may not be needed if the framework is correctly detected (check in Task 1)
- Task 3 requires the user to provide Sanity/Resend API keys interactively
- If Resend keys aren't available, skip those env vars — lead capture will gracefully fail
- The PR in Task 8 merges all work from the upgrade branch into master
