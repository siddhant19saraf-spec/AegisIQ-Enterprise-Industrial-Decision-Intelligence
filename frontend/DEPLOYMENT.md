# AegisIQ — Vercel Deployment Guide

## Prerequisites

- **GitHub repository** with the AegisIQ frontend code pushed
- **Vercel account** (free tier works)
- **FastAPI backend** deployed separately (Railway, Render, AWS, etc.)

## Project Structure

```
aegisiq/
├── frontend/          ← Deploy this folder on Vercel
│   ├── src/
│   ├── package.json
│   ├── next.config.ts
│   └── vercel.json
├── backend/           ← Deploy separately (NOT on Vercel)
│   ├── app/
│   └── requirements.txt
```

## Step 1 — GitHub Setup

1. Initialize a Git repository (if not already done):
   ```bash
   cd aegisiq
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a repository on GitHub.

3. Push the code:
   ```bash
   git remote add origin https://github.com/your-org/aegisiq.git
   git branch -M main
   git push -u origin main
   ```

## Step 2 — Vercel Import

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your **GitHub repository**
3. Configure the project:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `frontend/` (select from dropdown) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

> ⚠️ **Important:** Select `frontend/` as the Root Directory — this is a monorepo.

## Step 3 — Environment Variables

Add the following environment variable in Vercel → Project Settings → Environment Variables:

| Name | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com` | Production, Preview, Development |

Replace `https://your-backend-url.com` with your deployed FastAPI backend URL.

### How to find your backend URL

- **Railway**: `https://your-app.up.railway.app`
- **Render**: `https://your-app.onrender.com`
- **Custom domain**: `https://api.yourdomain.com`

## Step 4 — Deploy

1. Click **Deploy**
2. Vercel will build and deploy the frontend
3. Once complete, you'll get a URL like: `https://aegisiq.vercel.app`

## Step 5 — Verify

1. Open the deployment URL
2. You should see the **Login** page
3. Click **Continue as Demo**
4. All pages should load with data from your backend API

## Redeployment

Vercel auto-deploys on every push to the default branch.

To manually redeploy:

```bash
git commit --allow-empty -m "redeploy"
git push
```

Or from Vercel Dashboard → Deployments → Three dots → Redeploy.

## Troubleshooting

### Build fails: "Module not found"
- Ensure all dependencies are installed: `npm install`
- Check that the root directory is set to `frontend/`

### Build fails: "TypeScript errors"
- Run locally: `npm run typecheck`
- Fix all type errors and push again

### Login works but pages show no data
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Ensure the backend is running and accessible from Vercel
- Check CORS settings on the backend (must allow your Vercel domain)

### CORS errors in browser console
- Update the backend's `CORS_ORIGINS` to include: `https://your-app.vercel.app`
- For local dev: `http://localhost:3000`

### 404 on page refresh
- This indicates a routing issue. Ensure `vercel.json` exists with the Next.js framework preset (auto-detected).

### "Application error: a client-side exception" on dashboard
- Open browser DevTools → Console
- Look for network request failures (likely `NEXT_PUBLIC_API_URL` pointing to wrong backend URL)

## Backend Deployment (Reference)

The backend (FastAPI) should be deployed independently. Recommended platforms:

| Platform | Notes |
|---|---|
| **Railway** | Easy, `requirements.txt` auto-detected |
| **Render** | Web Service, `uvicorn app.main:app` |
| **Fly.io** | Dockerfile support |
| **AWS ECS** | Production-scale |

Backend environment variables needed:

```env
ENVIRONMENT=production
SECRET_KEY=<generate-a-secure-random-key>
DATABASE_URL=postgresql://user:pass@host:5432/aegisiq
CORS_ORIGINS=https://your-app.vercel.app
```

## Vercel Production Checklist

- [ ] `NEXT_PUBLIC_API_URL` set to production backend URL
- [ ] Backend CORS allows the Vercel domain
- [ ] Backend `DATABASE_URL` uses PostgreSQL (not SQLite)
- [ ] `SECRET_KEY` is a strong random value
- [ ] Custom domain configured (optional)
