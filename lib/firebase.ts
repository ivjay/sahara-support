import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Validate required Firebase environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing required variables (only check if we're not in a build environment or if we actually need them)
const requiredKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
];

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    console.warn(
        `Firebase warning: Missing required environment variables: ${missingKeys.join(', ')}. ` +
        'Authentication and other Firebase services may not function correctly.'
    );
}

// Only initialize if we have the minimum requirements, otherwise export null/dummy
const app = (getApps().length === 0 && firebaseConfig.apiKey)
    ? initializeApp(firebaseConfig)
    : (getApps().length > 0 ? getApp() : null);

export const auth = app ? getAuth(app) : null;
export default app;
