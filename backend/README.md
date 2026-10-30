# Campus OS — API

Express + Passport.js + GraphQL + Multer + Nodemailer, backed by **Supabase PostgreSQL**.

## Quick start

```bash
cd backend
npm install
cp .env.example .env      # then fill in DATABASE_URL (and JWT_SECRET)
npm run db:schema         # creates users / courses / schedules / tasks
npm run dev               # http://localhost:5000
```

No SMTP credentials? No problem — the mailer runs in **dev mode** and prints
password-reset / contact emails to the console.

## Endpoints

### REST

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | `{ fullName, email, password, schoolName? }` → `201 { user, token }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ user, token }` (Passport *local*) |
| POST | `/api/auth/forgot-password` | – | `{ email }` → sends reset email (5/hour) |
| POST | `/api/auth/reset-password` | – | `{ token, password }` |
| GET | `/api/auth/me` | JWT | current user |
| POST | `/api/auth/logout` | JWT | stateless sign-out |
| GET | `/api/tasks?status=` | JWT | list tasks |
| POST | `/api/tasks` | JWT | create task |
| PATCH | `/api/tasks/:id` | JWT | update task |
| DELETE | `/api/tasks/:id` | JWT | delete task |
| GET | `/api/courses` | JWT | list courses (+ schedules) |
| POST | `/api/courses` | JWT | create course |
| PATCH | `/api/courses/:id` | JWT | update course |
| DELETE | `/api/courses/:id` | JWT | delete course |
| GET | `/api/user/profile` | JWT | student info |
| PATCH | `/api/user/profile` | JWT | update name / school / language / email |
| POST | `/api/user/avatar` | JWT | multipart `photo` → `/uploads/<file>` |
| POST | `/api/user/reset-account` | JWT | clears tasks + courses |
| DELETE | `/api/user/account` | JWT | `{ password }` deletes the account |
| POST | `/api/contact` | JWT | `{ subject, message }` → emailed to CONTACT_EMAIL |

Auth routes are rate limited (20/15 min, successful requests excluded);
password-reset emails are limited to 5/hour per IP.

### GraphQL

`POST /graphql` with `Authorization: Bearer <token>`:

```graphql
query { tasks(status: "pending") { id title dueDate course { name } } }
mutation { createTask(input: { title: "Read ch. 4", status: "pending" }) { id } }
```

Queries: `me`, `stats`, `tasks`, `task`, `courses`, `course`.
Mutations: `createTask`, `updateTask`, `deleteTask`, `createCourse`,
`updateCourse`, `deleteCourse`, `updateProfile`.

## Database

See `src/db/schema.sql`:

- **users** — auth + profile (+ password-reset token hash)
- **courses** — per-student course catalogue
- **schedules** — weekly recurrence per course (`day_of_week` 0–6 = Sun–Sat)
- **tasks** — with optional `course_id` link and `pending`/`done` status
