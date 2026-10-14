# BloodLink

A blood-donation platform: recipients raise emergency requests, donors accept
them, and hospital staff take the donation through intake, screening and
collection. Sri Lanka–focused (nine provinces, district-scoped hospital stock).

Two folders, one repository:

| Folder | What it is |
| --- | --- |
| `backend/` | Express 5 + MongoDB Atlas API. Holds the connection string and every business rule. |
| `frontend/` | Expo / React Native app (expo-router). Talks to the API over HTTP and holds no credentials. |

## Running it

You need Node 20+ and a MongoDB Atlas cluster (the free M0 tier is enough).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGODB_URI and JWT_SECRET
npx tsc --noEmit          # typecheck
npm run seed              # demo accounts, blood banks, inventory
npm run dev               # http://localhost:4000
```

Sanity check, no token required:

```bash
curl localhost:4000/health
curl localhost:4000/blood-banks
```

`npm run seed` is idempotent — run it again after pulling, and it re-syncs the
indexes and refreshes the fixtures without duplicating anything.

### 2. Frontend

```bash
cd frontend
npm install
npx tsc --noEmit
npm run web               # or: npm start
```

`frontend/.env` is **optional in development**. With no `EXPO_PUBLIC_API_URL`
set, the app calls the API on the host Metro served the bundle from, so a
physical device and an Android emulator both work without anyone having to look
up this machine's IP — `localhost` would have meant the phone, not the machine.
Set it only to override that, e.g. pointing the app at a deployed API.

Metro inlines `EXPO_PUBLIC_*` at build time, so a change to that value needs
`npx expo start --clear`.

### 3. Demo accounts

Seeded by `backend/scripts/seed.ts`, and listed on the sign-in screen in dev
builds:

| Role | Identifier | Password |
| --- | --- | --- |
| Donor | `0771234567` | `Donor@123` |
| Hospital | `0779876543` | `Hospital@123` |
| Recipient | `0775551234` | `Recipient@123` |
| Admin | `admin@bloodlink.lk` | `Admin@123` |

## Credentials: where they live

- The MongoDB connection string lives in **`backend/.env` only**.
- Never put it in `frontend/.env`, and never under an `EXPO_PUBLIC_*` name.
  Metro compiles those into the shipped bundle — anyone with the app could read
  the cluster admin password out of it.
- `.env` is gitignored in both folders. `.env.example` is the template and holds
  no real values.

Password-reset links are **printed to the backend console** rather than emailed.
Real delivery needs an email provider and a verified sending domain, which is out
of scope here; saying plainly where the link went is better than pretending to
send mail.

## Architecture notes

**Business rules live on the server, not in queries.** Every rule that used to be
a `WHERE` clause is now TypeScript under `backend/src/domain/`. Two things are
worth knowing before changing anything there:

- **Two inverse blood-compatibility maps.** `DONORS_FOR_RECIPIENT` answers "the
  patient needs X — who can give?" and `REQUESTS_FOR_DONOR` answers "this donor
  has Y — what may they serve?". They are not each other's inverse, and getting
  them the wrong way round is the easiest bug to write here.
- **Uniqueness is enforced by indexes, not by checks.** In particular the partial
  unique index on `donor_request_responses` where `response: "accepted"` is the
  only thing stopping two donors claiming the same request under a race. An
  application-level check cannot do that job.

**The request lifecycle** is `pending → {verified, fulfilled, cancelled}` and
`verified → {fulfilled, cancelled}`; terminal states never reopen. **A donation**
is `accepted → en_route → arrived → completed`, and a response is only mutable
while it is still `accepted`.

**Intake tickets are hashed.** The donor's device generates a secret, sends only
its SHA-256 hash, and the hash is cleared the moment it is used or the decision
changes. A stolen ticket is useless after fifteen minutes and cannot be replayed.

**One list route, three audiences.** `GET /emergency` branches on the caller: a
donor gets the open requests their blood can serve, staff get the triage queue
for their own district (admins get the whole country), and a recipient gets the
requests they raised. A recipient who has set a blood group is also
donor-eligible and would otherwise be handed the donor feed — so the recipient
screens ask for their own list explicitly, with `?mine=true`.

**Auth is a self-hosted session JWT.** Sign-out deletes the session row, so it
takes effect immediately rather than whenever the token expires. Tokens are
long-lived by design — the app has no refresh flow and discards a session the
moment it expires, so a short access token would sign the user out mid-session.

**Live updates are polled, not pushed.** React Native has no built-in
`EventSource`, so `frontend/src/data/use-polling-query.ts` refetches on an
interval while a screen is focused. App-foreground refetching is global, in
`QueryCacheProvider`.

## Adding a route

The app validates every payload field by field before rendering, and rejects a
row whose `createdAt` is not a string or whose `id` is missing. So a new endpoint
should build its response with the helpers in `backend/src/domain/serialize.ts`
rather than returning a Mongoose document's `toJSON` — those helpers produce
exactly the keys the client's readers expect.
