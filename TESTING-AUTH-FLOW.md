# Testing Authentication Flow - Step by Step Guide

**Status**: Ready for Testing
**Date**: 2026-01-25

---

## 🎯 What We Built

- ✅ **Signup Page**: `/auth/sign-up` - Create new account
- ✅ **Login Page**: `/auth/sign-in` - Sign in to existing account
- ✅ **Navbar Integration**: Shows "Sign In/Sign Up" when logged out, "Profile/Log Out" when logged in
- ✅ **Auth Service**: Deployed at https://auth-service-one-eta.vercel.app

---

## 🚀 How to Test Locally

### Step 1: Start the Development Server

```bash
# From project root
npm run start
```

This will start Docusaurus on `http://localhost:3000`

### Step 2: Test Signup Flow

1. **Navigate to signup page**: http://localhost:3000/auth/sign-up

2. **Fill out the form**:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `testpass123`
   - Confirm Password: `testpass123`

3. **Click "Sign Up"**

4. **Expected Results**:
   - ✅ Form submits successfully
   - ✅ You're redirected to home page (`/`)
   - ✅ Navbar changes to show "Profile" and "Log Out"
   - ✅ Session cookie is set (check DevTools > Application > Cookies)

**If signup fails**:
- Check browser console (F12) for errors
- Check that auth service is reachable: https://auth-service-one-eta.vercel.app/api/health
- Verify database connection in Neon dashboard

### Step 3: Test Logout

1. **Click "Log Out" in navbar**

2. **Expected Results**:
   - ✅ You're redirected to home page
   - ✅ Navbar changes back to "Sign In" / "Sign Up"
   - ✅ Session cookie is cleared

### Step 4: Test Login Flow

1. **Navigate to login page**: http://localhost:3000/auth/sign-in

2. **Fill out the form**:
   - Email: `test@example.com` (use the account you just created)
   - Password: `testpass123`

3. **Click "Sign In"**

4. **Expected Results**:
   - ✅ Form submits successfully
   - ✅ You're redirected to home page
   - ✅ Navbar shows "Profile" and "Log Out"
   - ✅ Session persists across page navigations

### Step 5: Test Session Persistence

1. **While logged in, navigate to different pages**:
   - Go to `/docs/introduction`
   - Go to `/blog`
   - Go back to home (`/`)

2. **Expected Results**:
   - ✅ Navbar still shows "Profile" and "Log Out" on all pages
   - ✅ No need to log in again

3. **Refresh the page** (F5 or Cmd+R)

4. **Expected Results**:
   - ✅ Still logged in after refresh
   - ✅ Navbar still shows authenticated state

### Step 6: Test Error Handling

1. **Test wrong password**:
   - Go to `/auth/sign-in`
   - Enter correct email but wrong password
   - **Expected**: Error message: "Invalid email or password"

2. **Test duplicate email**:
   - Log out
   - Go to `/auth/sign-up`
   - Try to sign up with same email again
   - **Expected**: Error message about email already existing

3. **Test password validation**:
   - Go to `/auth/sign-up`
   - Try password with less than 8 characters
   - **Expected**: Error message: "Password must be at least 8 characters"

4. **Test password mismatch**:
   - Enter different passwords in Password and Confirm Password
   - **Expected**: Error message: "Passwords do not match"

---

## 🔍 Debugging Tips

### Check Browser Console

Press F12 and look in the Console tab for:
- Network errors (auth API calls)
- JavaScript errors
- Auth responses

### Check Network Tab

In DevTools > Network:
1. Filter by "Fetch/XHR"
2. Look for calls to `/api/auth/*`
3. Check request/response details

### Check Cookies

In DevTools > Application > Cookies > `http://localhost:3000`:
- Look for Better Auth session cookie
- Should be set after successful login
- Should be cleared after logout

### Check Auth Service Health

Test the auth service directly:

```bash
# Health check
curl https://auth-service-one-eta.vercel.app/api/health

# Should return:
# {"status":"healthy","timestamp":"...","service":"better-auth"}
```

### Common Issues & Solutions

**Issue**: "Failed to sign up"
- **Solution**: Check Neon database is active and accessible
- **Solution**: Verify `DATABASE_URL` environment variable in auth service

**Issue**: Navbar doesn't update after login
- **Solution**: Check if session hook is working
- **Solution**: Refresh the page
- **Solution**: Check browser console for React errors

**Issue**: CORS errors in console
- **Solution**: Verify `ALLOWED_ORIGINS` in auth service includes `http://localhost:3000`
- **Solution**: Check auth service is sending correct CORS headers

**Issue**: Session doesn't persist
- **Solution**: Verify cookies are being set (check DevTools)
- **Solution**: Ensure `credentials: 'include'` is set in auth client
- **Solution**: Check cookie domain and path settings

---

## 📊 Test Checklist

Use this checklist to verify everything works:

### Basic Flow
- [ ] Can access signup page at `/auth/sign-up`
- [ ] Can access login page at `/auth/sign-in`
- [ ] Signup form validates input (password length, matching passwords)
- [ ] Can create new account successfully
- [ ] Redirected to home after signup
- [ ] Navbar updates to show authenticated state

### Authentication
- [ ] Can log out successfully
- [ ] Can log in with created account
- [ ] Session persists across page navigation
- [ ] Session persists after page refresh
- [ ] Can log out and state updates correctly

### Error Handling
- [ ] Invalid credentials show error message
- [ ] Duplicate email shows error message
- [ ] Short password shows validation error
- [ ] Mismatched passwords show error
- [ ] Error messages are user-friendly

### UI/UX
- [ ] Forms are styled correctly
- [ ] Loading states show during submission
- [ ] Error messages are visible and clear
- [ ] Links between sign-in/sign-up work
- [ ] Navbar auth buttons work correctly

---

## 🎉 Success Criteria

**Authentication is working correctly if**:

1. ✅ Users can sign up with email/password
2. ✅ Users can log in with credentials
3. ✅ Session persists across pages and refreshes
4. ✅ Users can log out
5. ✅ Navbar updates based on auth state
6. ✅ Cookies are set and cleared properly
7. ✅ Error messages display correctly
8. ✅ No console errors during normal flow

---

## 📝 Next Steps After Testing

Once testing is complete:

### If Everything Works:
1. Deploy to production (Vercel will auto-deploy from master)
2. Test on production URL
3. Continue with User Profile features (Phase 3-7 in tasks.md)

### If Issues Found:
1. Document the issue
2. Check the debugging tips above
3. Review auth service logs in Vercel
4. Fix and retest

---

## 🔗 Useful Links

- **Local App**: http://localhost:3000
- **Signup Page**: http://localhost:3000/auth/sign-up
- **Login Page**: http://localhost:3000/auth/sign-in
- **Auth Service**: https://auth-service-one-eta.vercel.app
- **Auth Health**: https://auth-service-one-eta.vercel.app/api/health

---

**Happy Testing!** 🚀

Report any issues you find and I'll help fix them!
