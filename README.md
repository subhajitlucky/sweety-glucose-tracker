# Sweety — Blood Glucose Tracker

A calm, focused glucose journal built for the **Kenpath Junior Full Stack Developer – JavaScript & AI** assignment.

Patients can record up to four readings a day, edit or delete them, and review a daily report, a month-to-date report and a report for the whole previous month. The app is a Node.js + Express API, a PostgreSQL database and a React frontend.

**Demo account:** `demo@sweety.app` / `Demo@1234`

---

## Screenshots

### Dashboard

![Sweety dashboard](docs/screenshots/02-dashboard.png)

### Logging a reading

![Log a reading dialog](docs/screenshots/03-add-reading.png)

### Sign in

![Sweety login screen](docs/screenshots/01-login.png)

### Mobile

<img src="docs/screenshots/04-mobile-dashboard.png" alt="Sweety dashboard on a mobile screen" width="390" />

---

## Features

### Required

- Register and log in with name, email and password.
- Passwords are hashed with **bcrypt** and never returned by the API.
- JWT session stored in an `HttpOnly`, `SameSite=Lax` cookie.
- Each user can only read and change their own readings.
- Add, list, edit and delete readings for the four fixed slots:
  Morning (fasting), After breakfast, After lunch, After dinner.
- Server-side and client-side validation with clear messages:
  - empty value
  - whole number between 40 and 600
  - one reading per slot per day
  - maximum four readings per day
  - date cannot be in the future
- Daily, month-to-date and monthly (previous month) reports with highest, lowest, average (one decimal) and count.
- Friendly empty states and a detailed daily list of readings.
- Responsive, accessible UI with keyboard-friendly dialog handling.
- Seed script with a demo user and realistic sample readings.
- `.env.example`, Docker setup and documented test commands.

### Bonus work completed

- [x] Pagination on `GET /api/readings?page=1&limit=20`.
- [x] Month-to-date line chart with Recharts.
- [x] Dockerfile and `docker-compose.yml` for PostgreSQL + the app.
- [x] Frontend tests with React Testing Library for the reading form.

Not attempted: Redis caching, BullMQ reminders and the doctor role.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Recharts |
| Backend | Node.js 22+, Express, Zod, JWT, bcrypt |
| Database | PostgreSQL 16, plain SQL (no ORM) |
| Tests | Vitest, Supertest, React Testing Library |
| Runtime | Docker / Docker Compose |

The frontend and API are separate during development. In Docker and production the Express server serves the built React app too, so the session cookie is always same-origin.

---

## Project structure

```text
sweety/
├── client/                     # React app
│   ├── src/
│   │   ├── api/                # fetch wrapper
│   │   ├── components/         # forms, report cards, chart, dialogs
│   │   ├── context/            # auth state
│   │   ├── lib/                # dates, validation, glucose helpers
│   │   ├── pages/              # login, register, dashboard
│   │   └── styles/
│   └── tests/                  # React Testing Library tests
├── server/
│   ├── db/                     # schema.sql, migrate.js, seed.js
│   ├── src/
│   │   ├── middleware/         # auth, error handling
│   │   ├── routes/             # auth, readings, reports
│   │   ├── services/           # database-facing business logic
│   │   └── utils/              # dates, validation, errors
│   └── tests/                  # API integration tests
├── docs/screenshots/
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Quick start (local development)

### Prerequisites

- Node.js **22.12+** and npm
- Docker (recommended for PostgreSQL)

### 1. Install dependencies and create your environment file

```bash
npm install
cp .env.example .env
```

Generate a strong session secret and put it in `.env` as `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The example database settings expect PostgreSQL on **port 5433** (to avoid clashing with a local PostgreSQL on 5432).

### 2. Start PostgreSQL

```bash
docker compose up -d db
```

### 3. Create the tables and seed the demo data

```bash
npm run db:migrate
npm run db:seed
```

The seed is safe to run again. It resets the demo user's readings and recreates a useful mix of current-month and previous-month data.

### 4. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000
- Health check: http://localhost:4000/api/health

Vite proxies `/api` to the Express server, so the browser sees one origin and the session cookie works normally.

### Demo credentials

```text
Email:    demo@sweety.app
Password: Demo@1234
```

---

## Database setup without Docker

If you already have PostgreSQL installed, create a database and user, then point `DATABASE_URL` at it:

```sql
CREATE ROLE sweety WITH LOGIN PASSWORD 'sweety';
CREATE DATABASE sweety OWNER sweety;
```

```dotenv
DATABASE_URL=postgresql://sweety:sweety@localhost:5432/sweety
```

Then run:

```bash
npm run db:migrate
npm run db:seed
```

The schema lives in [`server/db/schema.sql`](server/db/schema.sql). It is idempotent and uses a unique constraint on `(user_id, reading_date, slot)` as a final guard against duplicate slots.

---

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test` or `production`. |
| `PORT` | Yes | API port. Default `4000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the app database. |
| `DATABASE_SSL` | No | `true` for hosted PostgreSQL providers that require SSL. |
| `JWT_SECRET` | Yes | Long random string used to sign session tokens. Production requires at least 32 characters and blocks placeholder values. |
| `BCRYPT_ROUNDS` | No | bcrypt cost factor. Default `12`; tests use `4` for speed. |
| `COOKIE_SECURE` | No | `true` behind HTTPS. Must be `false` for the local HTTP Docker demo. Defaults to `true` in production. |
| `CLIENT_URL` | No | Frontend origin if API and client are deployed separately. |
| `TEST_DATABASE_URL` | No | Separate database for API tests. Defaults to `sweety_test` on port 5433. |
| `POSTGRES_USER` | Docker | PostgreSQL container user. |
| `POSTGRES_PASSWORD` | Docker | PostgreSQL container password. |
| `POSTGRES_DB` | Docker | PostgreSQL container database. |
| `VITE_API_URL` | No | Optional custom API origin. Leave blank for the Vite proxy/same-origin Docker setup. |

> If the API and frontend are deployed on different sites (not just different ports), set `COOKIE_SECURE=true` and adjust the cookie's `sameSite` behaviour for your domain. The included setup recommends same-origin deployment to keep sessions simple and safe.

---

## Running server and client separately

```bash
npm run dev:server   # Express with node --watch on :4000
npm run dev:client   # Vite on :5173
```

Inside Docker, the production app is a single origin: Express serves `client/dist` and the API from port 4000.

---

## Tests

Make sure the PostgreSQL container is running first:

```bash
docker compose up -d db
```

Then run everything:

```bash
npm test
```

Or run each side:

```bash
npm run test:server
npm run test:client
```

What the tests cover:

- **API (11 integration tests, real PostgreSQL):** registration, bcrypt hashes, duplicate emails, login/logout, session-required routes, all validation messages, duplicate slot, the four-reading limit, ownership isolation, edit/delete, report calculations and labels, empty reports, report-date validation, pagination.
- **Frontend (5 tests):** required value, range/non-integer validation, future-date validation, successful submit payload, and rendering the server's duplicate-slot error.

The API tests create the separate `sweety_test` database if it does not exist, rebuild the schema, and truncate between tests. They never touch development data. This requires the PostgreSQL user to have permission to create databases; the Docker user does.

---

## Docker (PostgreSQL + app)

The included compose setup runs the database and a production build of the app.

```bash
# .env must contain a real JWT_SECRET
docker compose up --build -d

# seed the demo account once
docker compose exec app node db/seed.js
```

Open http://localhost:4000.

Notes:

- The app runs the idempotent schema migration on startup.
- The database is persisted in the `sweety-db-data` Docker volume.
- `COOKIE_SECURE` is set to `false` in `docker-compose.yml` so login works over local HTTP. Set it to `true` when serving over HTTPS.
- Stop the stack with `docker compose down` (add `-v` if you also want to delete the database volume).

---

## API overview

All routes return JSON. Reading and report routes require a valid session cookie.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database-backed health check. |
| `POST` | `/api/auth/register` | Create account and start a session. |
| `POST` | `/api/auth/login` | Log in. |
| `POST` | `/api/auth/logout` | Clear the session cookie. |
| `GET` | `/api/auth/me` | Current user. |
| `GET` | `/api/readings?page=1&limit=20` | Paginated readings for the current user. |
| `POST` | `/api/readings` | Create a reading. |
| `GET` | `/api/readings/:id` | Get one owned reading. |
| `PUT` / `PATCH` | `/api/readings/:id` | Replace/update one owned reading. |
| `DELETE` | `/api/readings/:id` | Delete one owned reading. |
| `GET` | `/api/reports?date=YYYY-MM-DD` | Daily, month-to-date and previous-month reports. |

### Reading payload

```json
{
  "date": "2026-11-06",
  "slot": "after_lunch",
  "value": 142
}
```

Valid slots: `morning`, `after_breakfast`, `after_lunch`, `after_dinner`.

### Validation messages

| Rule | Message |
| --- | --- |
| Value required | `Please enter a glucose value.` |
| Whole number 40–600 | `Value must be between 40 and 600 mg/dl.` |
| One reading per slot per day | `You already have an After lunch reading for this date.` |
| Maximum four per day | `You can add only 4 readings per day.` |
| Date not in future | `Date cannot be in the future.` |

### Report shape

`GET /api/reports?date=2026-10-15` returns all three reports so the dashboard can load them in one request:

```json
{
  "reports": {
    "selectedDate": "2026-10-15",
    "daily": {
      "type": "daily",
      "title": "Daily",
      "range": { "start": "2026-10-15", "end": "2026-10-15" },
      "label": "15 Oct 2026",
      "stats": { "highest": 154, "lowest": 98, "average": 126.5, "count": 2 },
      "readings": []
    },
    "monthToDate": {
      "type": "month-to-date",
      "range": { "start": "2026-10-01", "end": "2026-10-15" },
      "label": "1 Oct – 15 Oct 2026",
      "stats": {},
      "trend": []
    },
    "monthly": {
      "type": "monthly",
      "range": { "start": "2026-09-01", "end": "2026-09-30" },
      "label": "1 Sep – 30 Sep 2026",
      "stats": {}
    }
  }
}
```

`trend` contains one daily average point per date with readings; it powers the chart.

---

## Design and implementation notes

- **Session security:** the JWT lives in an `HttpOnly` cookie rather than `localStorage`, reducing exposure to JavaScript. Cookies are `SameSite=Lax`; logout clears the cookie server-side. Helmet adds standard security headers and auth routes are rate limited.
- **Password security:** bcrypt with a configurable cost (12 by default). The password hash is never selected into responses.
- **Ownership:** every reading query includes `user_id` from the verified session. Another user receives `404` rather than a hint that a reading exists.
- **Race safety:** create/update operations lock the user row for the transaction, then check the daily count and slot. The database unique constraint is the final protection if two requests race anyway.
- **Dates:** dates are stored as PostgreSQL `DATE` and parsed as strings to avoid UTC offset bugs. "Today" is the server's local calendar date. The app assumes a single household timezone; user-specific timezones would be a future improvement.
- **Reports:** computed live with SQL aggregates (`MAX`, `MIN`, `AVG`, `COUNT`) and rounded to one decimal. The previous month is calculated relative to the selected date, exactly as in the brief.
- **Chart reference band:** the 70–180 mg/dL band is a common general reference only. The UI explicitly notes that it is not medical advice and that a clinician's target should take precedence.
- **Pagination:** API limits are clamped, the UI shows page counts, and deleting the last item on the final page moves back gracefully.
- **Accessibility:** labelled fields, visible focus states, `aria-live` errors, a focus-trapped dialog with Escape support, reduced-motion support, and semantic tables/buttons.

---

## Assumptions

1. The four time slots are fixed by the brief; users cannot create custom slots.
2. A day contains at most four readings because there are four unique slots. The API still checks the count explicitly to return the requested "only 4 readings per day" message when a fifth attempt is made.
3. "Month-to-date" means the 1st of the selected date's month through the selected date. "Monthly" means the full calendar month immediately before the selected date.
4. Future dates are blocked for readings and report selection.
5. The seed script is for demonstrations; it intentionally resets the demo user's readings on each run.
6. The bundled Docker setup runs over HTTP for local review. Production requires HTTPS and `COOKIE_SECURE=true`.
7. Only one account role is implemented (patient), as the doctor role was optional.

---

## What I would improve with more time

- Doctor accounts and a patient/doctor relationship model with scoped report access.
- Redis caching for report aggregates, invalidated on reading changes, plus a BullMQ daily reminder job.
- A proper migration tool (node-pg-migrate or Prisma Migrate) instead of the single idempotent schema file.
- End-to-end Playwright tests for the full add → report → edit → delete flow.
- User-level timezone support instead of server-local dates.
- Email verification, password reset, session revocation and refresh-token rotation.
- More granular chart filtering (per slot, 7/30/90 days) and CSV export.
- CI (GitHub Actions) running API tests against a PostgreSQL service and frontend checks.
- A formal accessibility and performance audit (axe + Lighthouse) in CI.

---

## Assignment checklist

- [x] Sign up, log in, bcrypt hashing and private per-user data
- [x] Add, view, edit and delete readings
- [x] All five required validation rules with clear messages
- [x] Daily, month-to-date and monthly reports with empty states
- [x] Daily report reading list with slots
- [x] README with setup, database, server/client and test instructions
- [x] `.env.example` with no real secrets
- [x] Seed script with demo user and sample readings
- [x] Screenshots of the working app
- [x] Bonus: pagination, chart, Docker, frontend tests
