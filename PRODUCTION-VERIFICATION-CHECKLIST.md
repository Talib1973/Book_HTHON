# Production Verification Checklist

**Site**: https://book-hthon.vercel.app
**Date**: 2026-01-25

---

## ✅ **How to Verify Both Features Work**

### **Part 1: Verify Better Auth (Login/Logout/Signup/Profile)**

#### **Step 1: Check if Auth Pages Are Deployed**

1. **Open your browser** and go to:
   - https://book-hthon.vercel.app/auth/sign-up
   - https://book-hthon.vercel.app/auth/sign-in

2. **What you should see:**
   - ✅ **GOOD**: Signup/Login form with styled input fields
   - ❌ **BAD**: 404 "Page Not Found" error

3. **If you see 404**:
   - The latest code may not be deployed yet
   - Go to https://vercel.com/dashboard
   - Check if deployment is in progress or failed
   - Look for the latest deployment with your auth commits

#### **Step 2: Check Navbar Authentication Buttons**

1. **Go to**: https://book-hthon.vercel.app

2. **Look at the top-right navbar**

3. **What you should see:**
   - ✅ **When logged out**: "Sign In" and "Sign Up" buttons
   - ✅ **When logged in**: "Profile" and "Log Out" buttons

4. **Test the buttons:**
   - Click "Sign Up" → Should go to signup page
   - Click "Sign In" → Should go to login page

#### **Step 3: Test Signup Flow**

1. **Go to**: https://book-hthon.vercel.app/auth/sign-up

2. **Fill out the form:**
   - Name: Your Name
   - Email: test@example.com
   - Password: testpass123 (at least 8 characters)
   - Confirm Password: testpass123

3. **Click "Sign Up"**

4. **Expected result:**
   - ✅ Success message or redirect to home
   - ✅ Navbar changes to show "Profile" and "Log Out"
   - ✅ No errors in browser console (F12)

5. **Check your browser cookies:**
   - Press F12 → Application → Cookies → https://book-hthon.vercel.app
   - ✅ You should see a Better Auth session cookie

#### **Step 4: Test Login Flow**

1. **Click "Log Out"** (if logged in)

2. **Go to**: https://book-hthon.vercel.app/auth/sign-in

3. **Enter credentials:**
   - Email: test@example.com
   - Password: testpass123

4. **Click "Sign In"**

5. **Expected result:**
   - ✅ Redirected to home page
   - ✅ Navbar shows "Profile" and "Log Out"
   - ✅ Session persists when you navigate to other pages

#### **Step 5: Test Session Persistence**

1. **While logged in, navigate to:**
   - https://book-hthon.vercel.app/docs/intro
   - https://book-hthon.vercel.app/blog

2. **Check navbar on each page:**
   - ✅ Should still show "Profile" and "Log Out"

3. **Refresh the page (F5)**
   - ✅ Should remain logged in
   - ✅ Navbar still shows authenticated state

#### **Step 6: Test Logout**

1. **Click "Log Out"** in navbar

2. **Expected result:**
   - ✅ Redirected to home page
   - ✅ Navbar changes to "Sign In" / "Sign Up"
   - ✅ Session cookie cleared

---

### **Part 2: Verify RAG Chatbot**

#### **Step 1: Check if Chat Widget Exists**

1. **Go to**: https://book-hthon.vercel.app

2. **Look for the floating chat button:**
   - ✅ Should see 💬 button in bottom-right corner

3. **Click the chat button**
   - ✅ Chat modal should open
   - ✅ Should see "Ask the Textbook" header
   - ✅ Input box and send button visible

#### **Step 2: Test Chat Functionality**

1. **In the chat modal, type a question:**
   - Example: "What is ROS 2?"
   - Example: "How do I install Isaac Sim?"

2. **Click send (→ button) or press Enter**

3. **Expected result:**
   - ✅ **WORKING**: You see a response from the chatbot
   - ✅ **WORKING**: Sources/citations appear below response
   - ❌ **NOT WORKING**: Error message about backend
   - ❌ **NOT WORKING**: "Unable to connect" message

#### **Step 3: Check Backend Status**

**If chatbot shows errors, check backend:**

1. **Open**: https://victorious-presence-production.up.railway.app/health

2. **What you should see:**
   - ✅ **GOOD**: `{"status":"healthy",...}` or similar
   - ❌ **BAD**: 502 error or timeout

3. **If backend is down:**
   - Go to Railway dashboard: https://railway.app
   - Check if your backend service is running
   - Look for deployment errors
   - Check logs for errors

#### **Step 4: Test Chat with Auth Integration**

1. **Log in to your account** (if not already)

2. **Open chat widget**

3. **Ask a question**

4. **Backend should:**
   - ✅ Receive your session cookie
   - ✅ Potentially personalize responses (future feature)
   - ✅ Track your chat history

---

## 🔧 **Troubleshooting**

### **Issue 1: Auth Pages Show 404**

**Cause**: Latest code not deployed to Vercel

**Solution**:
1. Go to https://vercel.com/dashboard
2. Find your "book-hthon" project
3. Click "Deployments"
4. Check latest deployment status
5. If failed, check error logs
6. If successful but old, trigger new deployment:
   - Go to Settings → Git
   - Click "Redeploy" or make a dummy commit

**Manual Redeploy**:
```bash
# From project root
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin master
```

### **Issue 2: Chatbot Shows "Unable to Connect"**

**Cause**: Railway backend is down or not responding

**Solution**:
1. Check backend health: https://victorious-presence-production.up.railway.app/health
2. Go to Railway dashboard
3. Check if service is running
4. Check logs for errors
5. Restart the service if needed
6. Verify environment variables are set

### **Issue 3: Navbar Doesn't Show Auth Buttons**

**Cause**: Auth component not rendering or JavaScript error

**Solution**:
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if React is loading
4. Verify auth-client.ts is configured correctly
5. Check docusaurus.config.ts has AUTH_SERVICE_URL

### **Issue 4: Session Doesn't Persist**

**Cause**: Cookies not being set or cleared

**Solution**:
1. Check browser cookies (F12 → Application → Cookies)
2. Verify auth service CORS settings
3. Ensure `credentials: 'include'` in fetch calls
4. Check auth service logs in Vercel
5. Verify ALLOWED_ORIGINS includes your frontend URL

### **Issue 5: CORS Errors in Console**

**Cause**: Auth service not allowing frontend origin

**Solution**:
1. Go to Vercel → auth-service project → Settings → Environment Variables
2. Check `ALLOWED_ORIGINS` includes:
   - `https://book-hthon.vercel.app`
   - `http://localhost:3000` (for local dev)
3. Redeploy auth service after changing

---

## 📊 **Quick Health Check Commands**

Run these in your terminal:

```bash
# Check auth service
curl https://auth-service-one-eta.vercel.app/api/health

# Check RAG backend
curl https://victorious-presence-production.up.railway.app/health

# Check if auth pages exist (should return 200, not 404)
curl -I https://book-hthon.vercel.app/auth/sign-up

# Check frontend homepage
curl -I https://book-hthon.vercel.app
```

---

## ✅ **Success Criteria**

**Everything is working when:**

### **Better Auth:**
- [ ] Signup page loads at /auth/sign-up
- [ ] Login page loads at /auth/sign-in
- [ ] Can create new account
- [ ] Can log in with credentials
- [ ] Navbar shows "Profile" and "Log Out" when logged in
- [ ] Navbar shows "Sign In" and "Sign Up" when logged out
- [ ] Session persists across page navigation
- [ ] Session persists after page refresh
- [ ] Can log out successfully
- [ ] Cookies are set and cleared correctly

### **RAG Chatbot:**
- [ ] Chat button (💬) visible in bottom-right
- [ ] Chat modal opens when clicked
- [ ] Can type and send messages
- [ ] Receives responses from chatbot
- [ ] Sources/citations appear (if available)
- [ ] No "unable to connect" errors
- [ ] Backend health check passes

### **Integration:**
- [ ] Both features work together
- [ ] Logged-in users can use chat
- [ ] Chat includes session cookie in requests
- [ ] No conflicts between auth and chat
- [ ] No console errors

---

## 📸 **What to Check Visually**

### **Homepage (Logged Out)**
- Navbar should show: "Sign In" | "Sign Up"
- Chat button (💬) in bottom-right corner
- No JavaScript errors in console

### **Homepage (Logged In)**
- Navbar should show: "Profile" | "Log Out"
- User name might be displayed
- Chat button (💬) still visible

### **Signup Page**
- Clean form with Name, Email, Password, Confirm Password
- Styled with Docusaurus theme colors
- Submit button says "Sign Up"
- Link to "Sign In" at bottom

### **Login Page**
- Form with Email and Password
- Submit button says "Sign In"
- Link to "Sign Up" at bottom
- Clean, centered design

### **Chat Modal**
- Header: "Ask the Textbook"
- Close button (×)
- Message area with empty state
- Input box at bottom
- Send button (→)

---

## 🎯 **Next Actions Based on Results**

### **If Auth Works ✅ but Chat Doesn't ❌:**
- Fix Railway backend
- Check backend deployment
- Verify environment variables
- Check backend logs

### **If Chat Works ✅ but Auth Doesn't ❌:**
- Redeploy frontend to Vercel
- Check Vercel deployment logs
- Verify auth-service is reachable
- Check environment variables in frontend

### **If Both Work ✅:**
- 🎉 Celebrate!
- Test thoroughly with different browsers
- Test on mobile devices
- Continue with user profile features

### **If Neither Works ❌:**
- Check Vercel dashboard for deployment status
- Check Railway dashboard for backend status
- Verify DNS/domain settings
- Check environment variables in both services

---

## 📞 **Get Help**

If you're stuck:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Click latest → Logs

2. **Check Railway Logs:**
   - Go to Railway Dashboard → Your Project → Logs

3. **Share These Details:**
   - What you see when you visit /auth/sign-up
   - What navbar shows (logged in vs out)
   - Any errors in browser console (F12)
   - Screenshots of any errors

---

**Last Updated**: 2026-01-25
**Status**: Ready for Verification
