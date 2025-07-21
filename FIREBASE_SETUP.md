# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "mom-finance-app")
4. Disable Google Analytics (you can enable it later if needed)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project dashboard, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Email/Password"
5. Enable the first toggle "Enable" (not the passwordless sign-in)
6. Click "Save"

## Step 3: Create a Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we have security rules set up)
4. Select your preferred location (choose the closest to you)
5. Click "Enable"

## Step 4: Get Your Firebase Credentials

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the "</>" (Web) icon to add a web app
5. Register your app:
   - App nickname: "Mom Finance Web App"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

6. You'll see your Firebase configuration. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXX"
};
```

## Step 5: Add Credentials to Your App

1. In your app directory, create a `.env.local` file
2. Copy each value from the Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXX
```

## Step 6: Deploy Security Rules (Optional but Recommended)

If you have Firebase CLI installed:
```bash
npm install -g firebase-tools
firebase login
firebase init
# Select Firestore
# Use existing project
# Keep default file names
firebase deploy --only firestore:rules
```

## Important Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- These credentials are meant to be public (they're protected by security rules)
- Make sure your Firestore security rules are properly configured before going live

## Troubleshooting

If you see authentication errors:
1. Make sure Email/Password auth is enabled
2. Check that your domain is authorized (Authentication > Settings > Authorized domains)
3. Verify all environment variables are correctly copied

If you see Firestore errors:
1. Make sure the database is created
2. Check that security rules allow authenticated users
3. Verify the project ID matches exactly