# 🔐 Authentication Testing Guide

## 🚀 Your Development Server is Running!

**URL:** http://localhost:5173

## 📋 Testing Checklist

### ✅ **1. Basic Navigation Test**

- [ ] Open http://localhost:5173
- [ ] Verify the landing page loads correctly
- [ ] Check that the header shows "Sign In" and "Get Started" buttons
- [ ] Click "Sign In" - should navigate to `/login`
- [ ] Click "Get Started" - should navigate to `/register`

### ✅ **2. Registration Flow Test**

#### **Test Case A: Development Mode (Email Confirmation OFF)**

1. Go to `/register`
2. Fill out the registration form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
   - ZIP Code: `12345` (optional)
   - Check "I agree to terms"
3. Click "Create Account"
4. **Expected Result:**
   - Success message: "Welcome to ReBin Pro! Your account has been created successfully. Redirecting to dashboard..."
   - Automatic redirect to `/dashboard` after 1.5 seconds
   - User should be authenticated and see the dashboard

#### **Test Case B: Production Mode (Email Confirmation ON)**

1. Go to `/register`
2. Fill out the registration form with a different email
3. Click "Create Account"
4. **Expected Result:**
   - Success message: "Account Created! Please check your email and click the verification link to complete your registration."
   - Automatic redirect to `/login?message=verify-email` after 2 seconds
   - Login page should show: "Check Your Email - Please check your email and click the verification link to complete your registration."

### ✅ **3. Login Flow Test**

1. Go to `/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPass123!`
3. Click "Sign In"
4. **Expected Result:**
   - Success message: "Welcome back! You have successfully logged in. Redirecting to dashboard..."
   - Automatic redirect to `/dashboard` after 1.5 seconds

### ✅ **4. Protected Routes Test**

#### **Test Unauthenticated Access:**

1. **Without being logged in**, try to access:

   - http://localhost:5173/dashboard
   - http://localhost:5173/sorting
   - http://localhost:5173/leaderboard
   - http://localhost:5173/challenges
   - http://localhost:5173/achievements

2. **Expected Result:**
   - Should automatically redirect to `/login`
   - Should see loading spinner briefly before redirect

#### **Test Authenticated Access:**

1. **After logging in**, try to access the same URLs
2. **Expected Result:**
   - Should load the protected pages successfully
   - Should see the actual content (dashboard, sorting page, etc.)

### ✅ **5. Email Verification Test (If Enabled)**

1. Register with a new email address
2. Check your email inbox
3. Look for an email from Supabase
4. Click the verification link
5. **Expected Result:**
   - Should redirect to `/auth/callback`
   - Should show "Email Verified! Your account has been successfully verified. Welcome to ReBin Pro!"
   - Should redirect to `/dashboard`

### ✅ **6. Error Handling Test**

#### **Test Invalid Login:**

1. Go to `/login`
2. Enter invalid credentials:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`
3. Click "Sign In"
4. **Expected Result:**
   - Should show error message: "Invalid email or password. Please try again."

#### **Test Registration Validation:**

1. Go to `/register`
2. Try to submit with invalid data:
   - Weak password: `123`
   - Mismatched passwords
   - Invalid email format
   - Missing required fields
3. **Expected Result:**
   - Should show appropriate validation errors
   - Form should not submit

### ✅ **7. Session Persistence Test**

1. Log in successfully
2. Refresh the page
3. **Expected Result:**
   - Should remain logged in
   - Should not redirect to login page
   - Should maintain authentication state

### ✅ **8. Logout Test**

1. While logged in, find the logout option (usually in navigation)
2. Click logout
3. **Expected Result:**
   - Should redirect to landing page or login page
   - Should clear authentication state
   - Protected routes should redirect to login

## 🔧 **Troubleshooting**

### **If Registration Doesn't Work:**

1. Check browser console for errors
2. Verify Supabase environment variables are set
3. Check Supabase project is active
4. Verify database schema is applied

### **If Email Verification Doesn't Work:**

1. Check Supabase Auth settings
2. Verify email confirmation is enabled/disabled as expected
3. Check spam folder for verification emails
4. Verify redirect URLs are configured in Supabase

### **If Protected Routes Don't Work:**

1. Check browser console for authentication errors
2. Verify user is actually authenticated
3. Check if session is being maintained

### **If Redirects Don't Work:**

1. Check browser console for navigation errors
2. Verify React Router is working
3. Check if there are any JavaScript errors

## 📊 **Expected Behavior Summary**

| Action             | Development Mode                       | Production Mode                             |
| ------------------ | -------------------------------------- | ------------------------------------------- |
| Register           | Immediate auth + redirect to dashboard | Email sent + redirect to login with message |
| Login              | Redirect to dashboard                  | Redirect to dashboard                       |
| Protected Routes   | Redirect to login if not auth          | Redirect to login if not auth               |
| Email Verification | Not required                           | Required via email link                     |

## 🎯 **Success Criteria**

✅ **All tests pass when:**

- Registration works in both modes
- Login redirects properly
- Protected routes guard correctly
- Email verification works (if enabled)
- Error handling shows appropriate messages
- Session persistence works
- Logout clears authentication

## 🚨 **If Something Doesn't Work**

1. **Check Browser Console** - Look for JavaScript errors
2. **Check Network Tab** - Look for failed API calls
3. **Check Supabase Dashboard** - Verify project status and settings
4. **Check Environment Variables** - Ensure they're properly set
5. **Restart Dev Server** - Sometimes needed after environment changes

---

**Happy Testing! 🎉**

If you encounter any issues, check the browser console and let me know what errors you see.
