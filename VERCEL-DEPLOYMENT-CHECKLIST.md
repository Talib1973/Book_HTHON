# Vercel Deployment Checklist - Better Auth Integration

**Feature**: 005-better-auth-personalization
**Status**: Ready for Vercel Deployment

---

## 🎯 Deployment Overview

You have **TWO** Vercel deployments to configure:

1. **Auth Service** (Better Auth) - New deployment
2. **Frontend** (Docusaurus) - Existing deployment, needs update

---

## Part 1: Deploy Better Auth Service to Vercel

### Step 1: Create New Vercel Project for Auth Service

1. **Go to Vercel Dashboard**: https://vercel.com/new

2. **Import from GitHub**
   - Select your `Book_HTHON` repository
   - **IMPORTANT**: Set **Root Directory** to `auth-service`
   - Project name: `book-hthon-auth` (or similar)

3. **Configure Build Settings** (should auto-detect)
   - Framework Preset: Other
   - Build Command: (leave empty - using serverless functions)
   - Output Directory: (leave empty)

### Step 2: Add Environment Variables for Auth Service

In the Vercel project settings, add these environment variables:

```bash
# Database (copy from your Neon dashboard)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Generate a strong secret (run in terminal: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-generated-secret-here

# Will be your Vercel URL (update after first deployment)
BETTER_AUTH_URL=https://book-hthon-auth.vercel.app

# Your frontend URL
ALLOWED_ORIGINS=https://book-hthon.vercel.app,http://localhost:3000

# Environment
NODE_ENV=production
```

### Step 3: Deploy Auth Service

1. Click **"Deploy"**
2. Wait for deployment to complete
3. **Copy your deployment URL** (e.g., `https://book-hthon-auth.vercel.app`)

### Step 4: Update BETTER_AUTH_URL

⚠️ **CRITICAL STEP**:

1. Go to Settings > Environment Variables
2. Update `BETTER_AUTH_URL` with your actual Vercel URL from Step 3
3. Click **"Redeploy"** to apply changes

### Step 5: Test Auth Service

```bash
# Test health endpoint
curl https://your-auth-service.vercel.app/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"better-auth"}

# Test CORS
curl -H "Origin: https://book-hthon.vercel.app" \
     -X OPTIONS \
     https://your-auth-service.vercel.app/api/auth/sign-in/email
```

---

## Part 2: Update Frontend Deployment

### Step 1: Add Environment Variable to Frontend

In your **existing** Docusaurus Vercel project:

1. Go to Settings > Environment Variables
2. Add:
   ```bash
   AUTH_SERVICE_URL=https://book-hthon-auth.vercel.app
   ```
   (Use the URL from Part 1, Step 3)

### Step 2: Update Backend Environment Variable

If you have a separate backend deployment (Railway), update:

```bash
AUTH_SERVICE_URL=https://book-hthon-auth.vercel.app
CORS_ORIGINS=http://localhost:3000,https://book-hthon.vercel.app
```

### Step 3: Commit and Deploy

```bash
# From project root
git add .
git commit -m "Configure Better Auth for Vercel deployment"
git push origin 005-better-auth-personalization
```

Vercel will auto-deploy both projects.

---

## Part 3: Verification & Testing

### ✅ Pre-Flight Checks

- [ ] Auth service deployed successfully
- [ ] `BETTER_AUTH_URL` updated to actual Vercel URL
- [ ] Frontend has `AUTH_SERVICE_URL` environment variable
- [ ] Backend has `AUTH_SERVICE_URL` environment variable (if applicable)
- [ ] All CORS origins configured correctly

### ✅ Functional Testing

1. **Test Health Endpoint**
   ```bash
   curl https://your-auth-service.vercel.app/health
   ```

2. **Test Signup Flow**
   - Go to `https://book-hthon.vercel.app/auth/sign-up`
   - Fill out signup form
   - Verify account created in Neon database
   - Check browser console for errors

3. **Test Login Flow**
   - Go to `https://book-hthon.vercel.app/auth/sign-in`
   - Login with created account
   - Verify session cookie is set
   - Check navbar shows user name

4. **Test Session Persistence**
   - Navigate to different pages
   - Refresh page
   - Verify session persists (still logged in)

5. **Test Logout**
   - Click "Sign Out" in navbar
   - Verify redirected to home
   - Verify session cleared

### ✅ CORS Verification

Open browser dev tools on `https://book-hthon.vercel.app`:

```javascript
// In browser console
fetch('https://your-auth-service.vercel.app/api/auth/session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);
```

Should return session data without CORS errors.

---

## Part 4: Environment Variables Reference

### Auth Service (book-hthon-auth)

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | Neon Dashboard > Connection String |
| `BETTER_AUTH_SECRET` | 32+ char secret | Run: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your auth service URL | Vercel deployment URL |
| `ALLOWED_ORIGINS` | Frontend URL(s) | Your Docusaurus deployment URL |
| `NODE_ENV` | `production` | Hardcoded |

### Frontend (book-hthon)

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `AUTH_SERVICE_URL` | Your auth service URL | Vercel auth deployment URL |

### Backend (Railway, if applicable)

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `AUTH_SERVICE_URL` | Your auth service URL | Vercel auth deployment URL |
| `CORS_ORIGINS` | Frontend + auth URLs | Both Vercel deployment URLs |

---

## Part 5: Troubleshooting

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
1. Verify `ALLOWED_ORIGINS` includes your frontend URL (no trailing slash)
2. Check that `credentials: 'include'` is set in frontend fetch calls
3. Ensure auth service is returning proper CORS headers

**Debug**:
```bash
# Check CORS headers
curl -v -H "Origin: https://book-hthon.vercel.app" \
  https://your-auth-service.vercel.app/api/auth/session
```

### Issue: Database Connection Failed

**Symptoms**: 500 errors, "database connection" in logs

**Solutions**:
1. Verify `DATABASE_URL` is correct (copy from Neon)
2. Ensure `?sslmode=require` is at the end
3. Check Neon database is active (not paused)
4. Verify Neon allows connections from Vercel IPs

### Issue: Sessions Not Persisting

**Symptoms**: User logged out on page refresh

**Solutions**:
1. Verify `credentials: 'include'` in auth client
2. Check cookies are being set (dev tools > Application > Cookies)
3. Ensure `BETTER_AUTH_URL` matches actual deployment URL
4. Check SameSite cookie settings in Better Auth config

### Issue: 404 on Auth Endpoints

**Symptoms**: `/api/auth/*` returns 404

**Solutions**:
1. Verify `vercel.json` is in auth-service root
2. Check Vercel build logs for errors
3. Ensure `api/auth.ts` file exists in auth-service
4. Try redeploying with `vercel --prod --force`

---

## Part 6: Monitoring & Logs

### View Auth Service Logs

1. Go to Vercel Dashboard
2. Select auth service project
3. Click "Deployments"
4. Click latest deployment
5. Click "Functions" tab
6. Click on `/api/auth` function
7. View real-time logs

### Check Database Activity

1. Go to Neon Dashboard
2. Click "Monitoring"
3. View connection count, queries

### Frontend Console Errors

- Open browser dev tools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

## Part 7: Security Checklist

- [ ] `BETTER_AUTH_SECRET` is strong (32+ characters, random)
- [ ] No secrets committed to Git (check .env files are in .gitignore)
- [ ] `ALLOWED_ORIGINS` only includes trusted domains
- [ ] Database credentials secured in Vercel environment variables
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Session expiration configured (7 days)
- [ ] Cookie security settings enabled

---

## Part 8: Post-Deployment Tasks

- [ ] Test complete user flow (signup → login → navigate → logout)
- [ ] Verify database entries in Neon (users, sessions, profiles)
- [ ] Update documentation with production URLs
- [ ] Monitor Vercel logs for errors (24-48 hours)
- [ ] Set up Vercel alerts for failures
- [ ] Test from different devices/browsers
- [ ] Verify mobile responsiveness

---

## Part 9: Rollback Plan

If deployment fails:

### Rollback Auth Service
1. Go to Vercel > Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Rollback Frontend
1. Revert `AUTH_SERVICE_URL` environment variable
2. Redeploy previous commit

### Emergency: Disable Auth
- Remove auth routes from frontend
- Show "Authentication temporarily unavailable" message

---

## Quick Reference

### Deployment URLs Structure

```
Frontend:  https://book-hthon.vercel.app
Auth:      https://book-hthon-auth.vercel.app
Backend:   https://victorious-presence-production.up.railway.app
```

### Key Files Modified

```
auth-service/
├── api/
│   ├── auth.ts          # Serverless Better Auth handler
│   └── health.ts        # Health check endpoint
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to exclude from deployment
└── package.json         # Dependencies (updated)

src/lib/auth-client.ts   # Already configured (no changes needed)
docusaurus.config.ts     # Already configured (no changes needed)
```

### Important Commands

```bash
# Test locally
cd auth-service && npm run dev

# Deploy via CLI
cd auth-service && vercel --prod

# View logs
vercel logs <deployment-url>

# Generate secret
openssl rand -base64 32
```

---

## Success Criteria

✅ **Deployment is successful when**:

1. Auth service health endpoint returns 200
2. Users can sign up on production site
3. Users can log in and see their name in navbar
4. Sessions persist across page refreshes
5. Users can log out successfully
6. No CORS errors in browser console
7. Database records created in Neon
8. Vercel logs show no errors

---

## Next Steps After Deployment

1. **Implement Profile Features** (Phase 3-7 in tasks.md)
2. **Add Personalization Engine**
3. **Test with Real Users**
4. **Monitor Usage Metrics**
5. **Optimize Performance**

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Better Auth Docs**: https://better-auth.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Project Tasks**: `/specs/005-better-auth-personalization/tasks.md`
- **Deployment Guide**: `/auth-service/README-VERCEL-DEPLOY.md`

---

**Last Updated**: 2026-01-24
**Branch**: 005-better-auth-personalization
**Status**: ✅ Ready for Deployment
