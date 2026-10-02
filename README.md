# BloodLink

A blood-donation coordination app for Sri Lanka: request blood in an emergency
without an account, match requests to compatible donors, and give hospitals and
administrators a triage queue.

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript
Backend: Express + SQLite, in [`server/`](server/README.md)

---

## Quick start

Two terminals. The API first, then the app.

```bash
# terminal 1 — backend
cd server
npm install
npm run seed
npm run dev
```

```bash
# terminal 2 — app
npm install          # first time only
npx expo start --clear
```

Then press `a` to launch the Android emulator.

> `--clear` matters: `EXPO_PUBLIC_*` values are inlined by Metro at build time,
> so a change to `.env` is invisible until the cache is reset.

`curl http://localhost:4000/health` should return `{"ok":true}` before you try
signing in.

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
time. Restart with `npx expo start --clear`.

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
