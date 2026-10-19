<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:B91C1C,100:7F1D1D&height=160&section=header&text=BloodLink&fontSize=56&fontColor=ffffff&animation=fadeIn" width="100%" alt="BloodLink" />

**Every drop counts. Every second matters.**

Request blood without an account. Match to compatible donors instantly.

<a href="https://www.figma.com/design/2gpsKZkbtjpAxAqHiXh5fp/Untitled?node-id=0-1&t=punO9S48wM2eIGND-1">
  <img src="https://img.shields.io/badge/Figma-Design-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="View the design on Figma" />
</a>

</div>

---

## What it does

BloodLink connects people who need blood with people who can give it, in a
country where the difference is often measured in minutes.

- **Emergency requests** — submit in seconds, signed out. No account needed.
- **Compatibility matching** — donors only see requests their blood group can serve.
- **Hospital triage queue** — pending and verified requests, grouped.
- **Donor availability** — donors can pause themselves; paused donors are never counted as reachable.
- **Revocable sessions** — signing out really ends the session.
- **Built for Sri Lanka** — 25 districts, 9 provinces, local mobile formats.

## Tech

**App:** Expo 57, React Native 0.86, React 19, TypeScript, expo-router, AsyncStorage

**Server:** Node.js 22.5+, Express, SQLite (`better-sqlite3`), Zod

**Design:** [Figma](https://www.figma.com/design/2gpsKZkbtjpAxAqHiXh5fp/Untitled?node-id=0-1&t=punO9S48wM2eIGND-1)

## Requirements

- Node.js **22.5 or newer** (check with `node -v`)
- Android Studio with an emulator, and JDK 17

## Quick start

**1. Install the app**

```bash
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

**2. Install, seed and start the server** (keep this terminal open)

```bash
cd server
npm install
npm run seed
npm run dev
```

Check it works: `curl http://localhost:4000/health` should return `{"ok":true}`.

**3. Start the app** (in a second terminal, from the repository root)

```bash
npx expo start --clear
```

Press `a` to open the Android emulator.

> Use `--clear` whenever you change `.env`, because Expo bakes those values in at build time.

**Next time:** run `npm run dev` inside `server/`, and `npx expo start` in the root. Seeding is only needed once.

## Demo accounts

| Sign in with | Password | Role |
|---|---|---|
| `0771234567` | `Donor@123` | Donor |
| `0779876543` | `Hospital@123` | Hospital |
| `0775551234` | `Recipient@123` | Recipient |
| `admin@bloodlink.lk` | `Admin@123` | Admin |

## API address

Set `EXPO_PUBLIC_API_URL` in `.env` for where the app runs:

| Target | Value |
|---|---|
| Android emulator | `http://10.0.2.2:4000` |
| iOS simulator / web | `http://localhost:4000` |
| Physical device | `http://<your-computer-ip>:4000` (same Wi-Fi) |

If it is unset, the app uses fake in-memory data and nothing is saved.

## Project layout

```
src/
  app/          routes and route guards
  components/   UI pieces
  constants/    colours, blood groups, districts
  providers/    auth session
  services/     all API access (screens never call fetch)
  utils/        validators
server/         the backend (see server/README.md)
```

## Checks

```bash
npx tsc --noEmit
npm run lint
cd server && npm run typecheck
```

## Troubleshooting

- **"Unable to connect"** — the server isn't running, or `EXPO_PUBLIC_API_URL` is wrong for your target.
- **`.env` change ignored** — restart with `npx expo start --clear`.
- **`npm install` fails in `server/`** — check you are on Node 22.5 or newer.
- **Port 4000 in use** — run `PORT=4001 npm run dev` and update `.env`.
- **Phone can't reach the server** — usually a firewall; test `curl http://<ip>:4000/health` from another machine.

## Before deploying

This is a local development setup. Before going live:

- Add authentication to the admin surface, rate limiting and HTTPS.
- Remove the reset code from `POST /auth/forgot-password`, and stop it revealing whether an account exists.
- Never run `npm run seed` on real data. The demo passwords are public.
- Replace SQLite with a real database (only `server/src/db.ts` changes).
