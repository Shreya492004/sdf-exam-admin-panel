# Student Management — Backend

NestJS + TypeScript API for the admin panel, storing everything in **PostgreSQL** (via TypeORM).
The panel no longer keeps school data in the browser; it loads from and saves to this API.

## Run it

```bash
# 1. Start PostgreSQL (Docker)
docker compose up -d

# 2. Configure (first time) — then edit the admin login and JWT secret
cp .env.example .env

# 3. Install and start the API on http://localhost:3000/api
bun install
bun run dev        # watches for changes
# or: bun run start  (compiles to dist/ and runs it)
```

From the panel folder you can also run `bun run db` and `bun run api`.

`docker compose up -d` also starts **pgAdmin** on http://localhost:8000. Log in with
`PGADMIN_EMAIL` / `PGADMIN_PASSWORD` from `.env`; the "Student Management" server is already
listed (connect with `DB_PASSWORD`). The database runs PostgreSQL 18 with its data in the
`pgdata18` volume.
The panel's Vite dev server proxies `/api` to `http://localhost:3000`.

On first start with an empty database, demo students, subjects and exams are loaded
(set `SEED_DEMO_DATA=false` to skip). Tables are created automatically (`synchronize`);
set `DB_SYNCHRONIZE=false` and use migrations for production.

## Moving old browser data

If a browser still has data from the old localStorage version, the panel shows a
**Move to Server** banner after sign-in. It sends that data to `POST /api/data/import`
(which replaces the server data) and then clears it from the browser.

## API

All routes are under `/api`. Admin routes need `Authorization: Bearer <token>` from `POST /auth/login`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Admin sign-in → `{ token }` (public) |
| GET | `/auth/me` | Check the token |
| GET | `/data` | Everything the panel shows (students, subjects, exams, question sets) |
| POST | `/data/import` | Replace all data with an export from the old browser storage |
| GET / POST | `/classes/:classId/students` | List / add a student (roll no, username, password generated) |
| POST | `/students/:id/reset-password` | New password for a student |
| POST | `/classes/:classId/students/reset-passwords` | New passwords for a whole class |
| GET / POST | `/classes/:classId/subjects` | List / add a subject |
| DELETE | `/classes/:classId/subjects/:subjectId` | Remove a subject |
| GET / POST | `/question-sets` | List (newest first, `?classId=`) / create a question set |
| PUT / DELETE | `/question-sets/:id` | Update / delete a question set |
| DELETE | `/questions/:questionId` | Remove one question (an emptied set is deleted) |
| GET / POST | `/classes/:classId/exams` | List / create an exam |
| GET / PUT / DELETE | `/exams/:id` | Get / update details and questions / delete |
| PUT | `/exams/:id/students` | Set added students `{ studentIds }` — keeps existing logins, generates new ones |
| POST | `/exams/:id/students/:studentId/reset-password` | New exam password for one student |
| PUT | `/exams/:id/results/:studentId` | Save answers from the admin panel |
| GET | `/attend/:code` | Exam for the student link — questions without answers (public) |
| POST | `/attend/:code/login` | Student login with the exam username/password → student token (public) |
| POST | `/attend/:code/submit` | Submit answers once with the student token → score (public) |
| GET | `/health` | Health check (public) |

## Tables

`students`, `subjects` (per class), `question_sets` (questions as `jsonb`), `exams` (questions as `jsonb`),
`exam_access` (students added to an exam + their exam login), `exam_results` (answers + submitted time).

> Student and exam passwords are stored in plain text so the admin can hand them out.
> Hash them (and change the admin login and `JWT_SECRET`) before using this in production.
