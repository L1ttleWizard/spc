# Firebase Setup Guide

This guide will help you set up Firebase Firestore for the Spotify Clone app to resolve "missing or insufficient permissions" errors.

## Prerequisites

1. **Firebase Project**: You need a Firebase project with Firestore enabled
2. **Firebase CLI**: Install the Firebase CLI globally

## Step-by-Step Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### 3. Initialize Firebase in Your Project

```bash
firebase init
```

When prompted:
- Select **Firestore** and **Hosting** (optional)
- Choose your Firebase project
- Use the default file names for rules and indexes
- Don't overwrite existing files if prompted

### 4. Configure Environment Variables

Add your Firebase configuration to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Firestore Rules

For production use:

```bash
firebase deploy --only firestore:rules
```

### 6. Start Firebase Emulators (Development)

For local development and testing:

```bash
npm run firebase:emulators
```

This will start:
- Auth emulator on port 9099
- Firestore emulator on port 8080
- Emulator UI on port 4000

## Testing the Setup

1. **Start the emulators** (if in development mode)
2. **Login to your app** with Firebase authentication
3. **Visit `/debug-firebase`** to test the Firestore integration
4. **Run the Firebase tests** to verify everything works

## Troubleshooting

### Permission Denied Errors

If you get "missing or insufficient permissions" errors:

1. **Check if emulators are running** (for development)
2. **Verify Firestore rules are deployed** (for production)
3. **Ensure you're logged in to Firebase CLI**
4. **Check your Firebase project configuration**

### Common Issues

- **Emulators not running**: Start with `npm run firebase:emulators`
- **Rules not deployed**: Deploy with `firebase deploy --only firestore:rules`
- **Wrong project**: Check your Firebase project ID in environment variables
- **Authentication issues**: Ensure user is properly authenticated before testing

## Security Rules

The Firestore security rules allow:
- Users to read/write their own Spotify tokens
- Users to read/write their own user data
- No access to other users' data

Rules are located in `firestore.rules` and should be deployed to production.

## Production Deployment

When deploying to production:

1. **Deploy Firestore rules**: `firebase deploy --only firestore:rules`
2. **Set up proper authentication** in Firebase Console
3. **Configure your domain** in Firebase Console
4. **Test the integration** thoroughly

## Support

If you continue to have issues:
1. Check the Firebase Console for any error messages
2. Verify your Firebase project settings
3. Ensure all environment variables are correctly set
4. Test with the debug page at `/debug-firebase` 