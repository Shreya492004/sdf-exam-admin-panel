# sdf-exam-admin-panel

School admin panel for managing classes, students, subjects, question banks and MCQ tests, with an online test page students open from a link.

- **Frontend:** React + TypeScript + Vite (this folder)
- **Backend:** NestJS + TypeScript API in [`backend/`](backend/README.md)
- **Database:** PostgreSQL (Docker), with pgAdmin on port 8000

## Features

- Classes, subjects and students (logins generated automatically)
- Question bank: save question sets per class and subject, edit a whole set at once
- Create Test: pick question sets, set the date, time window and pass mark
- Add students to a test and share their logins (copy / WhatsApp / email / SMS)
- Student test page: sign in, full-screen test with timer, skip and revisit questions, auto-submit at the end time, instant score
- Results per test, including how many times a student left the test screen

## Run it locally

Requires [Bun](https://bun.sh) and Docker.

```bash
bun install
cd backend && bun install && cp .env.example .env && cd ..
```

Edit `backend/.env` and set your own `ADMIN_PASSWORD`, `JWT_SECRET` and `PGADMIN_PASSWORD`.

```bash
bun run db     # PostgreSQL + pgAdmin (Docker)
bun run api    # API on http://localhost:3000/api
bun run dev    # admin panel on http://localhost:5173
```

See [backend/README.md](backend/README.md) for the API routes and database details.
