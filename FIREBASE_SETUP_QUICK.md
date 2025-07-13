# Quick Firebase Setup Guide

## Issue
The Spotify token retrieval from Firestore is not working because Firebase is not properly configured. This is why you're seeing "No Spotify token found" messages even though the user ID is being set correctly.

## Solution

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or select an existing project
3. Enable Firestore Database in your project

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → "Web" (</>) 
4. Register your app with a nickname (e.g., "spotify-clone")
5. Copy the configuration object

### 3. Create Environment File
Create a `.env.local` file in your project root with the following content:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

Replace the values with your actual Firebase configuration.

### 4. Test Configuration
1. Restart your development server: `npm run dev`
2. Go to `/debug-auth` page
3. Check the "Firebase Configuration Test" section
4. All configuration items should show ✅
5. Click "Test Firestore Connection" to verify it works

### 5. Enable Authentication (Optional)
If you want to use Firebase Authentication:
1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Enable the authentication methods you want (Email/Password, Google, etc.)

## What This Fixes
- ✅ Spotify tokens will be stored in Firestore when users connect their Spotify account
- ✅ Tokens will be retrieved from Firestore when users log in from another device
- ✅ The "No Spotify token found" message will disappear once tokens are properly stored
- ✅ Cross-device authentication will work properly

## Troubleshooting
If you still see issues after setup:
1. Check the browser console for Firebase-related errors
2. Verify all environment variables are set correctly
3. Make sure your Firebase project has Firestore enabled
4. Check the `/debug-auth` page for detailed error messages

## Next Steps
After Firebase is configured:
1. Connect your Spotify account through the app
2. Tokens will be automatically stored in Firestore
3. You can now log in from other devices and your tokens will be retrieved automatically 