/**
 * Firebase bootstrap for the BloodLink app.
 *
 * One entry point owns the Firebase App instance so the Data Connect generated
 * SDK (which binds to the *default* app when no instance is passed) and the
 * auth service always share the same project. Configuration is inlined by
 * Metro from the `EXPO_PUBLIC_FIREBASE_*` variables in `.env`.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, type FirebaseApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getAuth, initializeAuth, type Auth, type Persistence } from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** The default app: generated SDK calls resolve against it automatically. */
export const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase v13 keeps `getReactNativePersistence` off the shared type
 * declarations, but the runtime still exports it under Metro's react-native
 * condition — so the helper is read off the module with an explicit type.
 */
const { getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

/**
 * Email/password auth with React Native persistence, so a cold start restores
 * the Firebase session without the user signing in again. On web the standard
 * browser-persisted auth is used instead.
 */
export const auth: Auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });