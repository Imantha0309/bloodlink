# BloodLink API

Local backend for the BloodLink Expo app. Express 4 + SQLite, TypeScript run
directly through `tsx` — there is no build step.

It exists so the app has something real to talk to: registration, sign-in,
password recovery, emergency requests and the four role dashboards are all
served from here rather than from the in-app mock.

## Requirements

- **Node 22.5 or newer** (`better-sqlite3` v12 ships prebuilds for Node 24; on
  Node 20 it falls back to a source build and needs Visual Studio Build Tools)
- That is all — no database server, no Docker

## Run it

```bash
cd server
npm install
npm run seed     # wipes and repopulates the demo data
npm run dev      # watch mode on http://localhost:4000
```

| Script | What it does |
|---|---|
| `npm run dev` | Watch mode, restarts on save |
| `npm start` | Same, without watching |
| `npm run seed` | Drops every row and re-inserts the demo data |
| `npm run typecheck` | `tsc --noEmit` |

Check it is alive:

```bash
curl http://localhost:4000/health          # -> {"ok":true}
```

## Demo accounts

`npm run seed` creates these. They match the fixtures in the app's mock
adapter, so the same credentials work whether or not the backend is running.

| Identifier | Password | Role |
|---|---|---|
| `0771234567` | `Donor@123` | donor |
| `0779876543` | `Hospital@123` | hospital |
| `0775551234` | `Recipient@123` | recipient |
| `admin@bloodlink.lk` | `Admin@123` | admin |

The seed creates no fictional emergency requests or extra donor profiles. The
demo donor account starts paused; register real donor accounts and create real
emergency requests to populate the donor queue.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/auth/sign-in` | — | `{identifier, password}` → `{session}`. `401` bad credentials, `423` locked |
| `POST` | `/auth/register` | — | `{role, fullName, identifier, password, district?, bloodGroup?, ...}` → `201 {session}`. `409` if the identifier is taken |
| `GET` | `/auth/me` | Bearer | `{user}` — the app uses this to validate a stored token on launch |
| `POST` | `/auth/sign-out` | Bearer | `204`, revokes the session |
| `POST` | `/auth/forgot-password` | — | `{identifier}` → `{resetId, devCode}` |
| `POST` | `/auth/verify-otp` | — | `{resetId, code}` → `{resetToken}` |
| `POST` | `/auth/reset-password` | — | `{resetToken, newPassword}` → `{ok}` |
| `GET` | `/donors/stats` | — | `{total, provinces, avatarInitials, updatedAt}` for the sign-in card |
| `GET` | `/donors/me/availability` | Bearer | Read the donor's record; a missing record is returned as paused |
| `PUT` | `/donors/me/availability` | Bearer | Create or update availability; donor only |
| `DELETE` | `/donors/me/availability` | Bearer | Remove the donor's availability record; donor only |
| `GET` | `/donors/me/responses` | Bearer | Read all of the donor's emergency responses, including declines |
| `POST` | `/emergency-requests/:id/response` | Bearer | Create a donor response (`accepted` or `declined`); donor only |
| `PUT` | `/emergency-requests/:id/response` | Bearer | Update a response before transit starts; donor only |
| `DELETE` | `/emergency-requests/:id/response` | Bearer | Withdraw a response before transit starts; donor only |
| `POST` | `/emergency-requests` | optional | **Public** — the zero-login urgent path. Links to the user when a token is present |
| `GET` | `/emergency-requests` | Bearer | Role-filtered: recipients see their own, donors see what their group can serve, hospitals and admins see the whole open queue |
| `GET` | `/emergency-requests/:id` | optional | Includes `compatibleDonorGroups` |
| `GET` | `/dashboard/me` | Bearer | The per-role aggregate that feeds all four dashboards |

Errors are always `{"error": {"code": "...", "message": "..."}}`, with a
`fields` map on validation failures so a form can mark the offending input.

## How it is put together

```
src/
  index.ts        bootstrap: cors, json limit, routes, error handler, shutdown
  config.ts       port, host, DB path, TTLs
  db.ts           connection, pragmas, idempotent schema — the only file that
                  knows the SQLite driver
  seed.ts         demo data
  types.ts        row shapes and the row -> API mappers
  middleware/
    auth.ts       requireAuth / optionalAuth -> request.user
  routes/
    auth.ts, password-reset.ts, donors.ts, emergency.ts, dashboard.ts
  lib/
    errors.ts     ApiError + the JSON envelope
    passwords.ts  scrypt hash/verify
    tokens.ts     opaque token issue + SHA-256 hashing
    validate.ts   zod schemas
    sessions.ts, users.ts, geo.ts, contact.ts, async-handler.ts
```

A few decisions worth knowing:

- **Passwords** use `scrypt` from `node:crypto`, stored as
  `scrypt$N$r$p$salt$hash` and compared with `timingSafeEqual`. Chosen over
  bcrypt so there is no native build step on Windows.
- **Sessions are opaque tokens**, not JWTs. Only the SHA-256 hash is stored, so
  a database leak does not hand over usable tokens — and sign-out can actually
  revoke.
- **`db.ts` is the only module that touches the driver.** If `better-sqlite3`
  will not install, swapping it for the built-in `node:sqlite` (`DatabaseSync`)
  is a change to that one file.

## Development shortcuts — do not ship these

Two deliberate departures from production behaviour, both there because this
server runs locally with no SMS or email provider:

1. **`POST /auth/forgot-password` returns the reset code in `devCode`.** A real
   deployment sends it out of band and never echoes it.
2. **The same endpoint reveals whether an account exists** (`404` if not). Real
   deployments return an identical response either way, to avoid an
   account-enumeration oracle.

Both must be removed before this is exposed to anyone.

## Resetting

```bash
npm run seed                                  # wipe and repopulate
rm -rf data                                   # delete the database outright
BLOODLINK_DB_PATH=./data/scratch.db npm run dev   # use a different file
```
