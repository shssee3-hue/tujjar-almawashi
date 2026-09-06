import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check — attests that requests come from this real app before Firebase
// will serve Firestore/Auth, blocking scripted abuse (mass sign-ups, spam
// ads, scraping). It only initialises when a reCAPTCHA v3 site key is set
// (NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY); enforcement per-API is toggled in
// the Firebase Console — see docs/app-check-setup.md. For local development,
// set NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN to a token registered under
// App Check → Manage debug tokens (never in production).
if (typeof window !== "undefined") {
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (debugToken) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
// Cloud Functions require the Blaze plan and are not currently deployed;
// this export is kept only so functions/ code stays wired for a future upgrade.
export const functions = getFunctions(app, "us-central1");
