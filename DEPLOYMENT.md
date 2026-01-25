# Deployment Guide for Better Auth on Vercel

## Quick Deploy to Railway (Auth Service)

### 1. Push auth-service to GitHub

**If you haven't already, initialize git in auth-service:**

```bash
cd auth-service
git init
git add .
git commit -m "Add Better Auth service"
```

**Then push to your GitHub repository** (create a separate repo or add to existing):

```bash
# Option 1: Create new repo on GitHub called "book-hthon-auth"
git remote add origin https://github.com/talib1973/book-hthon-auth.git
git branch -M main
git push -u origin main

# Option 2: Add to existing repo as a subdirectory (skip if using Option 1)
# Already handled if your auth-service is in the main Book_HTHON repo
```

---

### 2. Deploy to Railway

1. **Go to:** https://railway.app
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository** (book-hthon-auth or Book_HTHON)
5. **Configure:**
   - **Root Directory:** `auth-service` (if using main repo)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

6. **Add Environment Variables in Railway:**

```env
DATABASE_URL=postgresql://neondb_owner:npg_OSKY5dWG4juf@ep-broad-haze-ahgtlett-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

BETTER_AUTH_SECRET=ygjlgiMqjIelYurcazqBaNhik4jjklfR6YGRS4Euhko=

BETTER_AUTH_URL=https://YOUR-AUTH-SERVICE.up.railway.app

ALLOWED_ORIGINS=http://localhost:3000,https://book-hthon.vercel.app

PORT=3001

NODE_ENV=production
```

**Replace `YOUR-AUTH-SERVICE` with your actual Railway domain after deployment**

7. **Deploy!** Railway will build and deploy automatically

8. **Copy the Railway URL** (e.g., `https://book-hthon-auth.up.railway.app`)

---

### 3. Update Vercel Environment Variables

1. **Go to:** https://vercel.com/talib1973s-projects/book-hthon
2. **Click "Settings" → "Environment Variables"**
3. **Add:**

```env
AUTH_SERVICE_URL=https://YOUR-AUTH-SERVICE.up.railway.app

BACKEND_API_URL=https://victorious-presence-production.up.railway.app
```

**Replace `YOUR-AUTH-SERVICE` with your Railway auth-service URL**

4. **Click "Save"**
5. **Redeploy your Vercel site** (go to "Deployments" → click "..." → "Redeploy")

---

### 4. Update Railway FastAPI Backend

**In your Railway FastAPI backend, update environment variables:**

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://book-hthon.vercel.app,https://YOUR-AUTH-SERVICE.up.railway.app

DATABASE_URL=postgresql://neondb_owner:npg_OSKY5dWG4juf@ep-broad-haze-ahgtlett-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Redeploy the backend after updating**

---

## Testing Production

1. **Go to:** https://book-hthon.vercel.app
2. **You should see "Log In" and "Sign Up" buttons** in the navbar
3. **Click "Sign Up"** and create an account
4. **Complete your profile**
5. **Test login/logout**

---

## Summary

**3 Services in Production:**

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | https://book-hthon.vercel.app |
| **Auth Service** | Railway | https://YOUR-AUTH-SERVICE.up.railway.app |
| **Backend API** | Railway | https://victorious-presence-production.up.railway.app |

All three need to have matching CORS/trusted origins configured!

---

## Troubleshooting

**If login doesn't work on Vercel:**

1. Check browser console for errors
2. Verify Railway auth-service is running
3. Verify environment variables in Vercel
4. Check CORS settings in both Railway services
5. Ensure `BETTER_AUTH_URL` in Railway auth-service matches its own URL
