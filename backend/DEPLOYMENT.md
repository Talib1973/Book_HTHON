# FastAPI Backend Deployment Guide

This guide explains how to deploy the FastAPI backend to make the chatbot work on the Vercel-hosted Docusaurus site (https://book-hthon.vercel.app/).

## Why Deploy the Backend?

Currently, the backend runs on `localhost:8000`, which only works when:
- You're running it locally on your machine
- You're testing on `localhost:3000`

For the chatbot to work on the **production Vercel site**, the backend needs to be deployed to a publicly accessible URL.

---

## Quick Deployment Options

### Option 1: Railway.app (Recommended - Free Tier Available)

**Steps**:

1. **Create a Railway account**: https://railway.app/

2. **Create a new project** from GitHub repo:
   - Connect your GitHub account
   - Select the `Book_HTHON` repository
   - Railway will auto-detect the Python app in `/backend`

3. **Configure environment variables** in Railway dashboard:
   ```
   OPENAI_API_KEY=your_openai_key
   COHERE_API_KEY=your_cohere_key
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_key
   PORT=8000
   ```

4. **Add a `Procfile`** in `/backend` directory:
   ```
   web: uvicorn api:app --host 0.0.0.0 --port $PORT
   ```

5. **Deploy**: Railway will automatically deploy when you push to your GitHub repo

6. **Get your URL**: Railway will provide a URL like `https://your-app.railway.app`

7. **Update Vercel environment variable**:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `BACKEND_API_URL` = `https://your-app.railway.app`
   - Redeploy the Vercel site

---

### Option 2: Render.com (Free Tier Available)

**Steps**:

1. **Create a Render account**: https://render.com/

2. **Create a new Web Service**:
   - Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt` (you'll need to create this)
   - Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT`

3. **Add environment variables** in Render dashboard (same as Railway)

4. **Deploy**: Render will build and deploy automatically

5. **Get your URL**: Render provides `https://your-app.onrender.com`

6. **Update Vercel** (same as Railway step 7)

---

### Option 3: Vercel Serverless Functions (More Complex)

Vercel can host the backend as serverless functions, but this requires:
- Converting FastAPI to Vercel's serverless format
- Using Vercel's Python runtime
- More complex setup

**Not recommended** for this use case due to complexity.

---

## Creating requirements.txt

Before deploying to Railway or Render, create `backend/requirements.txt`:

```bash
cd backend
pip freeze > requirements.txt
```

Or manually create with these dependencies:
```
fastapi>=0.115.0
uvicorn>=0.32.0
beautifulsoup4>=4.14.3
cohere>=5.20.1
lxml>=6.0.2
openai-agents>=0.6.7
python-dotenv>=1.2.1
qdrant-client>=1.16.2
requests>=2.32.5
tenacity>=9.1.2
tiktoken>=0.12.0
```

---

## Testing Your Deployment

1. **Test the backend directly**:
   ```bash
   curl -X POST https://your-deployed-backend.com/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What is ROS 2?"}'
   ```

2. **Check CORS**: The backend is already configured to accept requests from `https://book-hthon.vercel.app`

3. **Test on Vercel**: Visit https://book-hthon.vercel.app/, click the chat button, and ask a question

---

## Local Development vs Production

| Environment | Backend URL | How ChatWidget Detects |
|-------------|-------------|------------------------|
| Local Dev (localhost:3000) | http://localhost:8000 | Checks `window.location.hostname === 'localhost'` |
| Vercel Production | Your deployed URL | Reads `BACKEND_API_URL` from `docusaurus.config.ts` |

---

## Troubleshooting

### Chatbot shows "Backend API not configured"

**Solution**:
1. Deploy the backend to Railway/Render
2. Add `BACKEND_API_URL` environment variable in Vercel
3. Redeploy the Vercel site

### CORS errors on Vercel

**Solution**: The backend `api.py` is already configured to allow `https://book-hthon.vercel.app`. Verify it's in the `allow_origins` list.

### Backend startup fails on Railway/Render

**Solution**:
1. Check environment variables are set correctly
2. Verify Qdrant cluster is accessible from the deployed backend
3. Check build logs for missing dependencies

---

## Cost Considerations

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| Railway | 500 hours/month | Generous free tier, auto-sleeps when idle |
| Render | 750 hours/month | Free tier available, may be slower |
| Vercel Functions | Limited executions | Free tier has time limits per request |

**Recommendation**: Start with Railway for easy setup and good free tier.

---

## Next Steps After Deployment

1. Deploy backend to Railway/Render
2. Get the public URL
3. Set `BACKEND_API_URL` in Vercel environment variables
4. Redeploy Vercel site
5. Test chatbot on https://book-hthon.vercel.app/

The chatbot will now work on all pages of your Vercel site! 🎉
