# Authentication Flow Guide

## Current Issue: 401 "Not authenticated" Error

You're getting this error because the user hasn't completed the Spotify OAuth flow yet. Here's how to fix it:

## 🔄 **Complete Authentication Flow:**

### Step 1: Firebase Authentication ✅
- User logs in with email/password or creates account
- Firebase user is created and stored in Redux state

### Step 2: Spotify OAuth (Missing) ❌
- User needs to connect their Spotify account
- This is what's causing the 401 error

### Step 3: Token Storage ✅
- Spotify tokens are stored in cookies and Firestore
- App can now make API calls to Spotify

## 🛠️ **How to Fix the 401 Error:**

### Option 1: Complete the Spotify OAuth Flow
1. **Go to `/login`** in your app
2. **Click "🎵 Подключить Spotify"** button
3. **Complete Spotify authorization** in the popup
4. **You'll be redirected back** with tokens set
5. **The app should now work** without 401 errors

### Option 2: Use the Debug Page
1. **Go to `/debug-auth`** in your app
2. **Click "Check Auth Status"** to see current state
3. **Click "Go to Login"** to start OAuth flow
4. **Complete Spotify authorization**
5. **Check auth status again** to confirm tokens are set

## 🔍 **Debugging Steps:**

### 1. Check Current Status
Visit `/debug-auth` and click "Check Auth Status" to see:
- `authenticated`: true/false
- `hasAccessToken`: true/false  
- `hasRefreshToken`: true/false
- `hasUserId`: true/false

### 2. Expected Results After OAuth:
```json
{
  "authenticated": true,
  "hasAccessToken": true,
  "hasRefreshToken": true,
  "hasUserId": true,
  "accessTokenLength": 83,
  "refreshTokenLength": 43
}
```

### 3. Current State (Before OAuth):
```json
{
  "authenticated": false,
  "hasAccessToken": false,
  "hasRefreshToken": false,
  "hasUserId": true,
  "accessTokenLength": 0,
  "refreshTokenLength": 0
}
```

## 🚀 **Quick Fix:**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit your app** (e.g., `http://localhost:3000`)

3. **You should see:** "Please connect your Spotify account to view your library"

4. **Click "Connect Spotify"** button

5. **Complete Spotify authorization**

6. **The app should now work!**

## 🔧 **If Still Having Issues:**

### Check Environment Variables:
Make sure these are set in your `.env.local`:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
```

### Check Firebase Configuration:
Make sure Firebase is properly configured and the user can log in.

### Check Console Logs:
Look for any errors in the browser console or server logs.

## 📋 **Authentication Flow Summary:**

```
User Login → Firebase Auth → Spotify OAuth → Token Storage → API Access
     ↓              ↓              ↓              ↓              ↓
   ✅ Done       ✅ Done       ❌ Missing      ✅ Ready       ❌ 401 Error
```

**The missing piece is Spotify OAuth.** Once completed, the 401 error will be resolved! 