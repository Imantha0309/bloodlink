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
| [React](https://react.dev) | 19.2.3 | Components. React Compiler is **on** |
| [TypeScript](https://www.typescriptlang.org) | 6.0 | Types, `strict` |
| [expo-router](https://docs.expo.dev/router/introduction/) | 57 | File-based routing + typed routes |
| [expo-router `Stack.Protected`](https://docs.expo.dev/router/advanced/protected/) | — | Route guards that make a signed-out user's dashboard unreachable, not merely hidden |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | 2.2 | Session persistence across launches |
| [@expo/vector-icons](https://icons.expo.fyi) | 15 | Feather icon set throughout |
| [ESLint](https://eslint.org) + `eslint-config-expo` | 9 | Lint, including the React Compiler rules |

### Server — [`server/`](server/README.md)

| Technology | Version | Role |
|---|---|---|
| [Node.js](https://nodejs.org) | 22.5+ | Runtime |
| [Express](https://expressjs.com) | 4 | HTTP layer |
| [SQLite](https://sqlite.org) via `better-sqlite3` | 12 | Storage — a single file, no database server to run |
| [Zod](https://zod.dev) | 3 | Request validation, one schema per endpoint |
| [`node:crypto`](https://nodejs.org/api/crypto.html) | — | `scrypt` password hashing, SHA-256 token hashing |
| [tsx](https://tsx.is) | 4 | Runs TypeScript directly — **no build step** |

### Design decisions worth knowing

- **Two interchangeable auth adapters.** `AuthService` has an HTTP implementation
  and an in-memory mock, and `EXPO_PUBLIC_API_URL` decides which one is built.
  With it unset the app still runs end to end against fixtures, which is why
  swapping backends touched no screen code.
- **No hardcoded data in screens.** Everything goes through `src/services`;
  components never call `fetch`.
- **Sessions over JWTs.** Opaque tokens need no dependency and can be revoked
  on sign-out, which matters more than statelessness for medical data.

---

## Prerequisites

Install these before anything else:

| Tool | Version | Needed for |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.5 or newer** (24.x tested) | both the app and the server. The server uses a SQLite driver that will not install on older Node |
| npm | bundled with Node | |
| [Android Studio](https://developer.android.com/studio) + an AVD | any recent | the default run target (emulator) |
| JDK 17 | | required by the Android build tooling |

No Java SDK is needed for the **server** — it is plain Node.

Verify before you start:

```bash
node -v      # must be v22.5.0 or higher
npm -v
```

If `node -v` reports anything below 22.5, upgrade before continuing;
`npm install` inside `server/` will fail on a native module with a confusing
node-gyp error rather than telling you the version is the problem.

## Setup

Everything below is first-time setup. Once it is done, day-to-day running is
just the two `dev` / `start` commands — see [Everyday start](#everyday-start).

### 1. Install the app's dependencies

From the repository root:

```bash
npm install
```

### 2. Create the environment file

The app reads its API location from `.env`, which is gitignored, so it does not
exist on a fresh clone. Copy the template:

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

The default works as-is for the Android emulator. See
[Pointing the app at the API](#pointing-the-app-at-the-api) for the other
targets.

### 3. Install and seed the backend

`server/` is a separate package with its own dependencies. The API must be
seeded at least once or there will be no accounts to sign in with:

```bash
cd server
npm install
npm run seed
```

### 4. Start the backend

```bash
npm run dev
```

Leave this running. It should print:

```
  BloodLink API listening on http://localhost:4000
  Android emulator reaches it at http://10.0.2.2:4000
  Health check: http://localhost:4000/health
```

Confirm it is actually serving, from a second terminal:

```bash
curl http://localhost:4000/health     # -> {"ok":true}
```

Do this before starting the app. If it fails here, the app cannot work either.

### 5. Start the app

In a **second** terminal, from the repository root:

```bash
npm start -- --clear
```

Then press `a` to launch the Android emulator.

Metro uses port `8082` so Expo Go does not accidentally connect to another
service occupying the default port `8081`.

> `--clear` matters: `EXPO_PUBLIC_*` values are inlined by Metro at build time,
> so a change to `.env` is invisible until the cache is reset. Without it you
> can end up running a bundle built before `.env` existed, which silently falls
> back to the mock backend.

## Everyday start

After setup, running the project is two commands in two terminals. The
directory matters — `npm run dev` only exists inside `server/`:

```bash
# terminal 1 — from the repository root
cd server
npm run dev
```

```bash
# terminal 2 — from the repository root
npm start
```

Running `npm run dev` from the repository root fails with
`Missing script: "dev"`, because the root `package.json` is the Expo app. The
one in `server/` is a separate package.

`npm run seed` is only needed once, or when you want to reset the database back
to the demo state — it clears every table.

## Signing in

`npm run seed` creates four accounts that also exist as fixtures in the app's
mock adapter, so the same credentials work either way. On a development build
the sign-in screen has a **Dev credentials** panel — tap an account to fill the
form.

| Identifier | Password | Lands on |
|---|---|---|
| `0771234567` | `Donor@123` | Donor dashboard |
| `0779876543` | `Hospital@123` | Hospital dashboard |
| `0775551234` | `Recipient@123` | Recipient dashboard |
| `admin@bloodlink.lk` | `Admin@123` | Admin dashboard |

## Pointing the app at the API

`.env` holds one value:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

`10.0.2.2` is the **Android emulator's** alias for the host machine's loopback.
Change it depending on where the app runs:

| Where the app runs | Use |
|---|---|
| Android emulator | `http://10.0.2.2:4000` |
| iOS simulator / web | `http://localhost:4000` |
| Physical device (Expo Go) | `http://<your-machine-lan-ip>:4000` |

To find the LAN IP for a physical device:

```bash
ipconfig          # Windows — read the IPv4 Address of the active adapter
ifconfig | grep inet      # macOS / Linux
```

The phone must be on the same Wi-Fi network, and the host firewall must allow
port 4000 — `curl http://<that-ip>:4000/health` from another machine is the
quickest way to tell whether the problem is the address or the firewall.

Edit `.env` with the value for your target, then restart the app with
`npm start -- --clear`.

If `EXPO_PUBLIC_API_URL` is unset the app falls back to an in-memory mock
adapter, so it still navigates and demos — but nothing persists and the
dashboards show fixture data. To confirm the app is really talking to the
backend, stop the server and try to sign in: you should get
*"Unable to connect. Please try again."*

## What works

- **Auth** — sign-in, multi-step registration, sign-out, and a session that is
  validated against `GET /auth/me` on launch (an expired or revoked token no
  longer survives)
- **Password recovery** — request a code, verify it, set a new password. The
  code is shown on screen because the local backend has no SMS provider
- **Emergency requests** — the zero-login form itself, plus a confirmation with
  a reference number
- **Four role dashboards** — fed by `GET /dashboard/me`, with a working donor
  availability toggle

## Layout

```
src/
  app/            expo-router routes; guards live in _layout.tsx
  components/
    auth/         sign-in flow pieces
    dashboard/    shell, stat grid, request list, availability toggle
    ui/           text field, option chips, select, async states
  constants/      colours, type scale, blood groups, districts, routes
  providers/      auth provider (session + sign-in/sign-up/sign-out)
  services/
    api/          the single HTTP client
    auth/         AuthService interface + HTTP and mock adapters
    dashboard/    dashboard aggregate
    donors/       active-donor stats
    requests/     emergency requests
  utils/          validators and contact normalisation
server/           the backend — see server/README.md
```

Data access goes through `src/services`; screens never call `fetch`. The
`AuthService` interface has two implementations and `EXPO_PUBLIC_API_URL`
decides which one is constructed, so swapping backends touches no call site.

## Checks

```bash
npx tsc --noEmit          # app
npm run lint              # app
cd server && npm run typecheck
```

## Troubleshooting

**"Unable to connect" on every request** — the server is not running, or
`EXPO_PUBLIC_API_URL` is wrong for your target. Check `/health` from the same
machine, then confirm the host alias for your target (`10.0.2.2` only works on
the Android emulator).

**Changed `.env` and nothing happened** — Metro inlines `EXPO_PUBLIC_*` at build
time. Restart with `npm start -- --clear`.

**`npm install` fails in `server/`** on `better-sqlite3` — it is a native
module. Confirm you are on Node 22.5+ (`node -v`); on Node 24 the prebuild is
used and no toolchain is needed. If you cannot upgrade Node, `server/src/db.ts`
is the only file that would change to use the built-in `node:sqlite` instead.

**Port 4000 already in use** — `PORT=4001 npm run dev`, and update `.env` to
match.

**Physical device cannot reach the server** — the server binds `0.0.0.0` by
default, so this is usually the host firewall rather than the bind address.
Confirm with `curl http://<lan-ip>:4000/health` from another machine.

## Before deploying anything

- [ ] `server/` has no authentication on its admin surface, no rate limiting and
      no HTTPS — it is a local development server, not a production one
- [ ] `POST /auth/forgot-password` returns the reset code in the response and
      reveals whether an account exists. Both are deliberate local-only
      shortcuts (see `server/README.md`) and must be removed
- [ ] The seeded passwords are public. Do not run `npm run seed` against
      anything real
- [ ] Replace the SQLite file with a real database; `server/src/db.ts` is the
      only module that would need to change
