# Deploying Better Auth to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Vercel CLI** (optional): `npm install -g vercel`
3. **Neon PostgreSQL Database**: Connection string ready

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   cd auth-service
   git add .
   git commit -m "Configure Better Auth for Vercel deployment"
   git push origin 005-better-auth-personalization
   ```

2. **Import Project in Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - **Root Directory**: Set to `auth-service`
   - Click "Continue"

3. **Configure Environment Variables**
   Add the following environment variables in Vercel dashboard:

   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
   BETTER_AUTH_SECRET=your-random-32-char-secret-here
   BETTER_AUTH_URL=https://your-auth-service.vercel.app
   ALLOWED_ORIGINS=https://book-hthon.vercel.app,http://localhost:3000
   NODE_ENV=production
   ```

   **Important**:
   - `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `BETTER_AUTH_URL`: Will be your Vercel deployment URL (e.g., `https://auth-service-xxx.vercel.app`)
   - `ALLOWED_ORIGINS`: Your frontend URL(s), comma-separated

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your deployment URL

5. **Update BETTER_AUTH_URL**
   - After first deployment, go to Settings > Environment Variables
   - Update `BETTER_AUTH_URL` with your actual Vercel URL
   - Redeploy the project

### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from auth-service directory**
   ```bash
   cd auth-service
   vercel
   ```

4. **Follow prompts**
   - Select your account
   - Link to existing project or create new
   - Configure environment variables when prompted

5. **Production deployment**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Frontend Configuration

Update your Docusaurus site's auth client to use the Vercel URL:

**File**: `src/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://your-auth-service.vercel.app", // Update this
});
```

### 2. Update FastAPI Backend

**File**: `backend/.env`
```bash
AUTH_SERVICE_URL=https://your-auth-service.vercel.app
```

### 3. Test CORS

```bash
# Test from your frontend origin
curl -H "Origin: https://book-hthon.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-auth-service.vercel.app/api/auth/sign-in/email
```

Should return CORS headers.

### 4. Verify Database Connection

Check health endpoint:
```bash
curl https://your-auth-service.vercel.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-24T...",
  "service": "better-auth"
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `BETTER_AUTH_SECRET` | Secret for signing tokens (32+ chars) | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your Vercel deployment URL | `https://auth-service.vercel.app` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs | `https://book-hthon.vercel.app,http://localhost:3000` |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### CORS Issues

- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that credentials are enabled in frontend requests
- Verify origin header is being sent

### Database Connection Errors

- Confirm `DATABASE_URL` is correct
- Ensure Neon PostgreSQL allows connections from Vercel IPs
- Check SSL mode is set correctly (`?sslmode=require`)

### Authentication Not Working

- Verify `BETTER_AUTH_URL` matches your actual deployment URL
- Check that `BETTER_AUTH_SECRET` is set and consistent
- Ensure database migrations have been run

## Monitoring

- **Vercel Logs**: https://vercel.com/your-username/auth-service/logs
- **Function Logs**: Check runtime logs for each API call
- **Analytics**: Monitor usage in Vercel dashboard

## Security Checklist

- [ ] `BETTER_AUTH_SECRET` is strong and random (32+ characters)
- [ ] `ALLOWED_ORIGINS` only includes trusted domains
- [ ] Database credentials are not exposed in logs
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Environment variables are set in Vercel, not committed to Git

## Updating After Deployment

```bash
# Make changes to code
git add .
git commit -m "Update auth service"
git push

# Vercel will auto-deploy on push (if enabled)
# Or manually trigger via CLI:
vercel --prod
```

## Rollback

If something goes wrong:

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "Promote to Production"

## Next Steps

After successful deployment:

1. Update frontend auth client with production URL
2. Test complete auth flow (signup, login, logout)
3. Verify session persistence across page loads
4. Test from actual frontend deployment
5. Monitor logs for any errors
