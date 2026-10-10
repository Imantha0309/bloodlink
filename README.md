<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:B91C1C,50:DC2626,100:7F1D1D&height=200&section=header&text=BloodLink&fontSize=68&fontColor=ffffff&fontAlignY=36&desc=Every%20drop%20counts.%20Every%20second%20matters.&descAlignY=56&descSize=18" width="100%" alt="BloodLink — every drop counts, every second matters" />

<a href="#-what-it-does">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=900&color=DC2626&center=true&vCenter=true&width=760&lines=Request+blood+without+an+account;Match+to+compatible+donors+instantly;Triage+queue+for+hospitals+and+admins;Built+for+Sri+Lanka" alt="What BloodLink does" />
</a>

<br/>

<!-- Stack -->
<img src="https://img.shields.io/badge/Expo-57-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
<img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
<img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/expo--router-57-4630EB?style=for-the-badge&logo=expo&logoColor=white" alt="expo-router" />

<br/>

<!-- Backend -->
<img src="https://img.shields.io/badge/Node.js-22.5+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
<img src="https://img.shields.io/badge/Zod-3-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
<img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />

<br/><br/>

<sub><b>Zero-login emergency requests</b> · <b>Blood-group compatibility matching</b> · <b>Four role-based dashboards</b></sub>

</div>

---

## 📖 Contents

| | |
|---|---|
| **About** | [What it does](#-what-it-does) · [Technologies](#-technologies) |
| **Run it** | [Prerequisites](#prerequisites) · [Setup](#setup) · [Everyday start](#everyday-start) |
| **Use it** | [Signing in](#signing-in) · [Pointing the app at the API](#pointing-the-app-at-the-api) |
| **Reference** | [What works](#what-works) · [Layout](#layout) · [Checks](#checks) · [Troubleshooting](#troubleshooting) |

> Looking to get running fast? Jump to **[Setup](#setup)** — five steps, then
> `npm start -- --clear` and press `a`.

---

## 🩸 What it does

BloodLink connects people who need blood with people who can give it — in a
country where the difference is often measured in minutes.

When someone is bleeding out, filling in a registration form is not an option.
So the emergency path needs **no account at all**: name the patient, pick the
blood group, give a contact number, submit. That request lands immediately in
front of every compatible donor who has marked themselves available.

<table>
<tr>
<td width="50%" valign="top">

### 🚨 Emergency request
Submit a request in seconds, **signed out**. No account, no email confirmation,
no friction between a patient and a donor.

</td>
<td width="50%" valign="top">

### 🧬 Compatibility matching
A donor only sees requests their blood group can actually serve, resolved
against a real compatibility table — not a naive group-equality check.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🏥 Hospital triage queue
Hospitals see incoming requests grouped by pending vs. verified, so the ones
awaiting a decision never get lost in the pile.

</td>
<td width="50%" valign="top">

### 🎚️ Donor availability
Donors flip themselves available or paused, and the choice persists. Paused
donors drop out of the available-donor counts that hospitals and admins see —
they are never silently counted as reachable.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔐 Revocable sessions
Opaque bearer tokens, stored server-side as SHA-256 hashes. Signing out really
kills the session, and a database leak does not hand over usable tokens.

</td>
<td width="50%" valign="top">

### 🇱🇰 Built for Sri Lanka
All 25 districts mapped to their 9 provinces, local mobile formats
(`07XXXXXXXX` / `+947XXXXXXXX`), and blood-group-aware donor counts.

</td>
</tr>
</table>

## 🔧 Technologies

### App

| Technology | Version | Role |
|---|---|---|
| [Expo](https://expo.dev) | SDK 57 | Build tooling, native modules, dev server |
| [React Native](https://reactnative.dev) | 0.86.3 | The UI runtime |
| [React](https://react.dev) | 19.2.3 | Components |
| [TypeScript](https://www.typescriptlang.org) | 6.0 | Types, `strict` |
| [expo-router](https://docs.expo.dev/router/introduction/) | 57 | File-based routing + typed routes |
| [expo-router `Stack.Protected`](https://docs.expo.dev/router/advanced/protected/) | — | Route guards that make a signed-out user's dashboard unreachable, not merely hidden |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | 2.2 | Session persistence across launches |
| [@expo/vector-icons](https://icons.expo.fyi) | 15 | Feather icon set throughout |
| [ESLint](https://eslint.org) + `eslint-config-expo` | 9 | Lint |

### Backend — Firebase

| Technology | Role |
|---|---|
| [Firebase JS SDK](https://firebase.google.com/docs/web/setup) 13 | Client SDK — Auth and callable Functions |
| [Firebase Authentication](https://firebase.google.com/docs/auth) | Sign-in, registration, password reset, token lifecycle |
| [Data Connect](https://firebase.google.com/docs/data-connect) | All domain data — donors, requests, donations, inventory, alerts — through generated GraphQL types |
| [Cloud Functions](https://firebase.google.com/docs/functions) (Node 20) | FCM fan-out: `savePushToken`, `notifyDonors`, `updateTokenAvailability` |
| [Cloud Firestore](https://firebase.google.com/docs/firestore) | Server-side-only `push_tokens` registry that the fan-out queries |
| Postgres via Cloud SQL, `us-east4` | The database behind Data Connect |

`src/dataconnect-generated/` is generated from `dataconnect/`. After changing the
schema or a connector, regenerate it:

```bash
npx firebase-tools dataconnect:sdk:generate
```

### Design decisions worth knowing

- **Auth belongs to Firebase, not the app.** `AuthService` wraps Firebase Auth
  behind an interface, so screens never touch the SDK directly and Firebase owns
  credentials, token refresh and revocation.
- **Domain data goes through Data Connect, not Firestore.** Firestore appears
  exactly once and only server-side, for `push_tokens` — see
  [`firestore.rules`](firestore.rules) and the composite index in
  [`firestore.indexes.json`](firestore.indexes.json) that the fan-out query
  depends on.
- **No hardcoded data in screens.** Everything goes through `src/services`;
  components never call `fetch`.
- **No API base URL.** The app talks to Firebase services directly, so there is
  nothing to point at a LAN address.

---

## Prerequisites

Install these before anything else:

| Tool | Version | Needed for |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.13 or newer** | the app and the Cloud Functions toolchain |
| npm | bundled with Node | |
| [Firebase CLI](https://firebase.google.com/docs/cli) | latest | Data Connect, the emulator suite, deploys |
| [Android Studio](https://developer.android.com/studio) + an AVD | any recent | the default run target (emulator) |
| JDK 17 | | required by the Android build tooling |

Verify before you start:

```bash
node -v          # must be v22.13.0 or higher
npm -v
firebase --version
```

## Setup

Everything below is first-time setup. Once it is done, day-to-day running is
just `npm start` — see [Everyday start](#everyday-start).

### 1. Install the app's dependencies

From the repository root:

```bash
npm install
```

The Cloud Functions package installs separately:

```bash
cd functions && npm ci
```

### 2. Create the environment file

The app reads its Firebase config from `.env`, which is gitignored, so it does
not exist on a fresh clone. Copy the template:

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Fill in the Firebase Web App values. Get them with:

```bash
firebase apps:sdkconfig WEB <appId>
```

The `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` value is required for push
notifications — Firebase console → Project Settings → Cloud Messaging.

Only non-secret values belong in this file: anything prefixed `EXPO_PUBLIC_` is
compiled into the shipped bundle and is readable by anyone with the app.

### 3. Deploy the backend (only if it is not already up)

The app talks to the **deployed** Firebase project — it has no emulator wiring,
so nothing in this step is needed when the backend is already published. For
`bloodlink-c75d7` the Data Connect schema and the `default` connector are
already deployed.

Cloud Functions are **not** deployed yet, so push notifications stay inert
until you publish them:

```bash
cd functions && npm ci
cd .. && firebase deploy --only functions
```

After changing anything under `dataconnect/`, publish the schema as well:

```bash
firebase deploy --only dataconnect
```

Deploying needs Blaze billing. This project already has it — it is backed by a
Cloud SQL instance.

### 4. Start the app

From the repository root:

```bash
npm start -- --clear
```

Then press `a` to launch the Android emulator, or scan the QR code with Expo
Go.

Metro uses port `8082` so Expo Go does not accidentally connect to another
service occupying the default port `8081`.

> `--clear` matters: `EXPO_PUBLIC_*` values are inlined by Metro at build time,
> so a change to `.env` is invisible until the cache is reset.

## Everyday start

One command, from the repository root:

```bash
npm start
```

Metro serves on port `8082`. Nothing else needs to be running — the app reads
the deployed Firebase project, not a local server.

## Signing in

The app ships four demo accounts as fixtures in
`src/services/auth/demo-accounts.ts`, and the sign-in screen has a **Dev
credentials** panel — tap an account to fill the form.

| Identifier | Password | Lands on |
|---|---|---|
| `0771234567` | `Donor@123` | Donor dashboard |
| `0779876543` | `Hospital@123` | Hospital dashboard |
| `0775551234` | `Recipient@123` | Recipient dashboard |
| `admin@bloodlink.lk` | `Admin@123` | Admin dashboard |

**These accounts do not exist yet.** They are fixtures, not seeded identities:
`scripts/seed.sql` states outright that it never creates Firebase Auth
identities or user profiles. The phone numbers are also mapped to derived
emails by the app — `0771234567` signs in as `71234567@bloodlink.lk`
(`resolveEmail` in `src/services/auth/firebase-auth-service.ts`).

So the **Dev credentials** panel fills the form but sign-in will fail until you
create those users. Use **Register** instead on a fresh project — `signUp`
creates the Firebase Auth identity *and* the Data Connect profile row in one
step, which makes a new account fully self-provisioning.

## Talking to Firebase

The app reaches Firebase over the public internet, so the same build works on an
emulator, a simulator and a physical device with no per-target configuration.
There is no LAN IP to discover and no host firewall to open.

Everything comes from `.env` (see [Setup step 2](#2-create-the-environment-file)).
`.firebaserc` selects the project — currently `bloodlink-c75d7`. Run
`firebase use` to switch.

**The app does not talk to the Firebase emulators.** There are no
`connectAuthEmulator`, `useEmulator` or `*_EMULATOR_HOST` calls anywhere in
`src/`, so the bundle always targets the deployed project even while the
emulator suite is running. `firebase.json` configures emulators for functions,
firestore and dataconnect — but no auth emulator at all, so there would be no
local users to sign in as either. Pointing the app at the emulators is a code
change in `src/services/firebase.ts`, not a configuration flag.

Cloud Functions are **not** deployed yet, so `savePushToken` and the donor
fan-out will not resolve. Push registration is wrapped in a non-blocking
`try/catch`, so sign-in still succeeds — you just get no notifications. See
[Setup step 3](#3-deploy-the-backend-only-if-it-is-not-already-up).

## What works

- **Auth** — sign-in, multi-step registration, sign-out, and a session restored
  on launch without re-authenticating
- **Password recovery** — request a reset by identifier. Firebase Auth emails the
  link; the client never sees a code, and delivery depends on SMTP being
  configured for the project
- **Emergency requests** — the zero-login form itself, plus a confirmation with
  a reference number
- **Donor CRUD** — create/read/update/remove availability, create/read/update/
  withdraw emergency responses, and see response status history
- **Four role dashboards** — each backed by a Data Connect query, with donor
  availability and emergency-response controls

## Layout

```
src/
  app/            expo-router routes; guards live in _layout.tsx
  components/
    auth/         sign-in flow pieces
    dashboard/    shell, stat grid, request list, availability toggle
    emergency/    multi-step emergency request flow
    hospital/     hospital-facing screens
    motion/       shared entrance animations
    ui/           text field, option chips, select, async states
  constants/      colours, type scale, blood groups, districts, routes
  providers/      auth provider (session + sign-in/sign-up/sign-out)
  services/
    api/          the shared ApiError contract
    auth/         AuthService interface + the Firebase Auth adapter
    dataconnect/  DataConnectError to ApiError mapping
    donors/       active-donor stats, directory, donor workflow
    hospital/     blood bank, inventory, transmission
    requests/     emergency requests
    dashboard/    dashboard aggregate
    alerts/       alert feed and unread counts
  utils/          validators and contact normalisation
dataconnect/      schema, connector queries/mutations, seed data
functions/        Cloud Functions (FCM fan-out)
```

Data access goes through `src/services`; screens never call `fetch` and never
import the Firebase SDK directly. `src/services/firebase.ts` is the single place
the Firebase app is constructed and exported.

## Checks

```bash
npx tsc --noEmit          # app
npm run lint              # app
cd functions && npm run typecheck
```

## Troubleshooting

**Reads fail immediately after the app starts** — the backend is unreachable, or
`.env` is incomplete. The app always hits the deployed project, so check that
`.firebaserc` selects the project you think and that all six
`EXPO_PUBLIC_FIREBASE_*` values in `.env` are populated. The emulator suite is
irrelevant here — the app never connects to it.

**Sign-in fails with "This account has no profile yet"** — the Firebase Auth
user exists but has no matching Data Connect `users` row. Registering through
the app creates both; if you created the user by hand in the Firebase console
you will also need to insert the profile row yourself.

**Dev credentials panel fills the form but sign-in fails** — those four
accounts are fixtures, not real Auth identities. See
[Signing in](#signing-in).

**`users.push_token` is missing from the deployed database** — the live Postgres
is behind `dataconnect/schema/schema.gql`, which declares `pushToken: String`.
`firebase dataconnect:sql:diff` reports the pending delta as a single
`ALTER TABLE "public"."users" ADD COLUMN "push_token" text NULL`.

This is dormant rather than broken: no query in `queries.gql` selects the
column and the `UpdatePushToken` mutation is not called from app code, so
sign-in and every read are unaffected. Close the drift whenever you like with
`firebase deploy --only dataconnect` (Blaze already active on this project).

**Changed `.env` and nothing happened** — Metro inlines `EXPO_PUBLIC_*` at build
time. Restart with `npm start -- --clear`.

**`Cannot query field "..." on type "..._KeyOutput"`** — a Data Connect schema and
connector have drifted apart. Publish the schema with
`firebase deploy --only dataconnect`, then regenerate the SDK with
`npx firebase-tools dataconnect:sdk:generate`.

**Data Connect queries fail at runtime with a type error** — `src/dataconnect-generated/`
is stale. Regenerate it rather than hand-editing; it is build output.

**Expo Go will not load the bundle** — check that Expo Go is on SDK 57. It only
supports the current SDK. `npx eas go` fetches a matching build if the store
version lags.

**Type errors after `npm install` in `functions/`** — run `npm ci` there; the two
packages have independent lockfiles.

## Before deploying anything

- [ ] Regenerate `src/dataconnect-generated/` and confirm it is committed in
      step with `dataconnect/`, or a fresh clone will not typecheck
- [ ] `src/services/auth/demo-accounts.ts` ships four accounts with public
      passwords and a tap-to-fill panel on the sign-in screen. If you ever create
      those Auth identities, remove both before shipping
- [ ] Password reset has no SMS provider wired up. Wire one, or leave recovery
      disabled in production — do not ship a reset flow that reveals codes
- [ ] Review `firestore.rules` and `firestore.indexes.json`. The composite index
      on `push_tokens` is required by the `notifyDonors` fan-out query and will
      only fail at runtime in production, not in the emulator
- [ ] The emulator suite is configured in `firebase.json` but the app is not
      wired to it, so nothing you test against the emulators reflects what the
      app actually does. Treat deployed behaviour as the only source of truth
      until that wiring exists
- [ ] Nothing in `firebase.json` should be deployed without a deliberate review
      of `dataconnect.yaml` and the connector permissions in
      `dataconnect/default/`
