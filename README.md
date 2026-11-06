# Sweety

A full-stack blood glucose journal for recording four daily readings and understanding daily and monthly patterns.

Built with **React, Node.js, Express and PostgreSQL**.

**Demo account:** `demo@sweety.app` / `Demo@1234`

## Screenshots

![Sweety dashboard](docs/screenshots/02-dashboard.png)

![Log a reading dialog](docs/screenshots/03-add-reading.png)

<details>
<summary>Sign-in and mobile screenshots</summary>
<br />
<p>
  <img src="docs/screenshots/01-login.png" alt="Sweety login screen" width="720" />
</p>
<p>
  <img src="docs/screenshots/04-mobile-dashboard.png" alt="Sweety mobile dashboard" width="360" />
</p>
</details>

## Features

- Register and log in securely with bcrypt-hashed passwords and an `HttpOnly` JWT session cookie.
- Add, view, edit and delete readings across four fixed slots: Morning (fasting), After breakfast, After lunch and After dinner.
- Client-side and server-side validation for values, dates, duplicate slots and the four-reading daily limit.
- Daily, month-to-date and previous-month reports with highest, lowest, average (one decimal) and reading count.
- Friendly empty states, a daily reading list, pagination and a month-to-date chart.
- Responsive UI, accessible dialogs, keyboard navigation and a custom calendar date picker.
- Demo seed data, Docker support and automated tests.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Recharts |
| Backend | Node.js 22+, Express, Zod, JWT, bcrypt |
| Database | PostgreSQL 16 with plain SQL |
| Tests | Vitest, Supertest, React Testing Library |
| Runtime | Docker / Docker Compose |

## Getting started

### Prerequisites

- Node.js **22.12+**
- npm
- Docker (recommended for PostgreSQL)

### 1. Install dependencies

```bash
npm install
cp .env.example .env
```

Generate a secure session secret and set it as `JWT_SECRET` in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Start PostgreSQL

The included database runs on port **5433** to avoid conflicting with a local PostgreSQL instance on 5432.

```bash
docker compose up -d db
```

### 3. Create the schema and seed demo data

```bash
npm run db:migrate
npm run db:seed
```

The seed is safe to re-run. It resets only the demo user's readings.

### 4. Run the app

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/api/health |

Vite proxies `/api` to Express, so the frontend and API share an origin during development.

### Demo credentials

```text
Email:    demo@sweety.app
Password: Demo@1234
```

### Using an existing PostgreSQL installation

Create a database and user, then update `DATABASE_URL` in `.env`:

```sql
CREATE ROLE sweety WITH LOGIN PASSWORD 'sweety';
CREATE DATABASE sweety OWNER sweety;
```

```dotenv
DATABASE_URL=postgresql://sweety:sweety@localhost:5432/sweety
```

Then run `npm run db:migrate` and `npm run db:seed`.

The full schema is in [`server/db/schema.sql`](server/db/schema.sql). It is idempotent and includes a unique constraint on `(user_id, reading_date, slot)` as a final safeguard against duplicate slots.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test` or `production`. |
| `PORT` | Yes | API port. Defaults to `4000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the application. |
| `DATABASE_SSL` | No | Set `true` for hosted PostgreSQL providers that require SSL. |
| `JWT_SECRET` | Yes | Long random string used to sign sessions. Production requires at least 32 characters and rejects placeholders. |
| `BCRYPT_ROUNDS` | No | bcrypt cost factor. Defaults to `12`; tests use `4` for speed. |
| `COOKIE_SECURE` | No | Set `true` behind HTTPS. Must be `false` for the local HTTP Docker demo. Defaults to `true` in production. |
| `CLIENT_URL` | No | Frontend origin when the API and client run separately. |
| `TEST_DATABASE_URL` | No | Separate test database. Defaults to `sweety_test` on port 5433. |
| `POSTGRES_USER` | Docker | PostgreSQL container user. |
| `POSTGRES_PASSWORD` | Docker | PostgreSQL container password. |
| `POSTGRES_DB` | Docker | PostgreSQL container database. |
| `VITE_API_URL` | No | Optional API origin. Leave blank for the Vite proxy and same-origin Docker setup. |

> The recommended production setup serves the frontend and API from the same origin. If you deploy them separately, use HTTPS, set `COOKIE_SECURE=true`, and adjust the cookie's `SameSite` policy for your domains.

## Running server and client separately

```bash
npm run dev:server   # Express on :4000 with node --watch
npm run dev:client   # Vite on :5173
```

## Tests

Start PostgreSQL first:

```bash
docker compose up -d db
```

Run all tests:

```bash
npm test
```

Or run each side individually:

```bash
npm run test:server
npm run test:client
```

- **11 API integration tests** run against real PostgreSQL and cover authentication, password hashing, validation, duplicate slots, the 4-reading limit, ownership isolation, CRUD, report calculations, empty reports and pagination.
- **7 frontend tests** cover the reading form validation, successful save, server errors, calendar selection and blocked future dates.

The API suite automatically creates a separate `sweety_test` database, rebuilds its schema and truncates data between tests. Development data is never touched. This requires database-creation permission; the Docker PostgreSQL user has it.

## Docker

Run PostgreSQL and a production build of the app:

```bash
# .env must contain a real JWT_SECRET
docker compose up --build -d

# seed the demo account once
docker compose exec app node db/seed.js
```

Open **http://localhost:4000**.

The app runs the idempotent migration on startup, and the database is stored in the `sweety-db-data` volume. `COOKIE_SECURE` is `false` in the included compose file so the local HTTP demo works; enable it behind HTTPS.

## API overview

All routes return JSON. Reading and report routes require a valid session cookie.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database-backed health check. |
| `POST` | `/api/auth/register` | Create an account and start a session. |
| `POST` | `/api/auth/login` | Log in. |
| `POST` | `/api/auth/logout` | Clear the session. |
| `GET` | `/api/auth/me` | Return the current user. |
| `GET` | `/api/readings?page=1&limit=20` | Paginated readings for the current user. |
| `POST` | `/api/readings` | Create a reading. |
| `GET` | `/api/readings/:id` | Get an owned reading. |
| `PUT` / `PATCH` | `/api/readings/:id` | Update an owned reading. |
| `DELETE` | `/api/readings/:id` | Delete an owned reading. |
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

### Validation rules

| Rule | Message |
| --- | --- |
| Value required | `Please enter a glucose value.` |
| Whole number from 40 to 600 | `Value must be between 40 and 600 mg/dl.` |
| One reading per slot per day | `You already have an After lunch reading for this date.` |
| Maximum four per day | `You can add only 4 readings per day.` |
| Date not in the future | `Date cannot be in the future.` |

### Report ranges

| Report | Range |
| --- | --- |
| Daily | The selected date. |
| Month-to-date | The 1st of the selected date's month through the selected date. |
| Monthly | The full previous calendar month. |

`GET /api/reports?date=2026-10-15` returns all three reports in one request, including a `trend` array for the chart.

## Implementation notes

- **Sessions:** JWTs are stored in `HttpOnly`, `SameSite=Lax` cookies rather than `localStorage`. Logout clears the cookie server-side.
- **Passwords:** bcrypt with a configurable cost factor. Hashes are never returned by the API.
- **Access control:** every reading and report query is scoped to the authenticated user's ID. Other users receive a `404` for inaccessible readings.
- **Concurrency:** create and update operations lock the user row for the transaction. A unique database constraint is the final guard against duplicate slots.
- **Dates:** PostgreSQL `DATE` values are parsed as strings to avoid timezone off-by-one errors. "Today" uses the server's local calendar date.
- **Reports:** calculated live with SQL aggregates (`MAX`, `MIN`, `AVG`, `COUNT`) and rounded to one decimal.
- **Accessibility:** labelled controls, visible focus states, focus-managed dialogs, keyboard-friendly calendar navigation, reduced-motion support and semantic tables.
- **Medical note:** the 70–180 mg/dL chart band is a general reference only. The UI states that users should follow their clinician's target range.

## Notes

### Assumptions

1. The four time slots are fixed for consistency across days and reports.
2. Four unique slots enforce the four-reading daily limit, and the API also checks the count explicitly to return a clear fifth-reading message.
3. Future dates are blocked for both readings and report selection.
4. The seed script intentionally resets the demo account on every run.
5. The Docker setup is for local review over HTTP. Production should use HTTPS and `COOKIE_SECURE=true`.
6. Only patient accounts are supported in the current version.

### What I would improve with more time

- Add doctor accounts with scoped patient access.
- Cache report aggregates in Redis and add BullMQ reminders.
- Adopt a dedicated migration tool and add GitHub Actions CI.
- Add end-to-end Playwright coverage for the complete user journey.
- Support per-user timezones, password reset, email verification and session revocation.
- Add CSV export and more chart filters.
