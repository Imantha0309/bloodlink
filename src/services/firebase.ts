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
import { connectDataConnectEmulator, getDataConnect } from "firebase/data-connect";
import { Platform } from "react-native";

import { connectorConfig } from "@dataconnect/generated";

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

/**
 * Emulator wiring.
 *
 * Off by default: with no flag the bundle talks to the deployed project. Turn it
 * on with `EXPO_PUBLIC_USE_EMULATORS=true` to run entirely on the local
 * emulator suite, which needs no Blaze plan.
 *
 * `connectAuthEmulator` throws if called twice, which is why this lives at module
 * scope right after `auth` is built rather than behind a helper.
 *
 * One `connectDataConnectEmulator` call redirects the whole connector: every
 * generated operation resolves its DataConnect instance through
 * `validateArgs(connectorConfig, ...)`, which falls back to this same cached
 * singleton. No service module needs to know the emulators exist.
 */
export const USE_EMULATORS = process.env.EXPO_PUBLIC_USE_EMULATORS === "true";

if (USE_EMULATORS) {
  // Android emulators reach the host loopback as 10.0.2.2; simulators and web
  // use localhost; a physical device needs the machine's LAN IPv4.
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? "localhost";

  FirebaseAuth.connectAuthEmulator(auth, `http://${host}:9099`, {
    disableWarnings: true,
  });
  connectDataConnectEmulator(getDataConnect(connectorConfig), host, 9399);
}