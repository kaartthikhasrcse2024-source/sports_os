# Sports OS Production Deployment Guide

This guide details configuring the robust React+Express codebase spanning explicitly onto completely **Free-Tier Cloud Architecture** (Frontend on Vercel, Backend on Render).

## 1. Hosting the Repository
Ensure all code adjustments (including `client/vercel.json` and `server/render.yaml`) are committed locally and safely pushed natively tracking your target GitHub or GitLab repository!

## 2. Frontend Configuration (Vercel)
Vercel integrates inherently optimizing SPAs smoothly capturing routing structures cleanly via standard endpoints.

1. Navigate to **Vercel.com** -> Add New Project -> Import your mapped GitHub Repository.
2. Configure **Root Directory**: `client` 
3. Select **Framework Preset**: `Vite` (Vercel typically detects this recursively).
4. Verify **Build Command**: `npm run build`
5. Verify **Output Directory**: `dist`
6. Click **Deploy**. Vercel will naturally parse the injected `vercel.json` rewriting variables securely avoiding 404 boundaries natively!

## 3. Backend Configuration (Render)
We have configured standard `render.yaml` descriptors automatically generating architecture configurations mapping health routines dynamically natively bypassing typical standard timeouts!

1. Navigate to **Render.com** -> New -> Blueprint (or Web Service).
2. Connect your Repository natively.
3. Configure the Root directory tracking mapping specifically referencing `server` explicitly (if utilizing Web Services specifically).
4. Assign build mapping: `npm install && npm run build` securely matching Node output bounds.
5. Setup the execution start mapping: `npm run start`.
6. Define standard health boundaries checking explicitly on `/health` avoiding incorrect failing builds!

> **⚠️ RENDER FREE-TIER ARCHITECTURE WARNING**
> Render specifically operates inactive Free instances recursively putting endpoints to "Sleep" after 15 minutes of inactivity natively. **The initial request targeting the server natively upon awakening will observe up to a 50-second delay.** This exact latency boundary is explicitly deliberate and NOT a fault logically.

## 4. Secure Environment Variables (Backend)
Navigate strictly to Render's **Environment** tracking tab and manually bind the following properties cleanly avoiding explicit hardcoded configurations mapping into public origins:

- `DATABASE_URL`: Your PostgreSQL external connection URI (mapped accurately, optionally specifying `?sslmode=require`)
- `SUPABASE_JWT_SECRET`: The exact JSON Web Token authentication mapping matching Supabase!
- `REDIS_URL`: The Redis URI tracking exactly the instance (Upstash or Redis Cloud etc).
- `RAZORPAY_KEY_ID`: Payment gateway identification.
- `RAZORPAY_KEY_SECRET`: Secret gateway hooks identifying checkouts accurately.
- `FRONTEND_URL`: **IMPORTANT** explicitly map the deployed Vercel domain mapping exclusively bounding CORS domains securely limiting payload distributions safely.
