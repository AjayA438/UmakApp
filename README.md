# 🎓 Campus OS

A mobile app for students — plan your semester, track tasks, and keep your
course timetable in one place.

```
CampusOS/
├── backend/     Express · Passport.js · GraphQL · Multer · Nodemailer · Supabase (PostgreSQL)
└── frontend/    React Native (Expo) · NativeWind · Inter · Lucide · Axios · Toast
```

---

## 1 · Folder structure

```
backend/
├── package.json / .env.example
├── uploads/                    profile photos (Multer)
└── src/
    ├── index.js                server bootstrap
    ├── app.js                  Express app: CORS, routes, /graphql, static /uploads
    ├── config/                 env · db (pg Pool) · passport (local + JWT strategies)
    ├── db/schema.sql           full DDL — paste into Supabase SQL Editor
    ├── db/run-schema.js        `npm run db:schema`
    ├── middleware/             auth · rateLimiter · upload (Multer) · errorHandler
    ├── routes/                 auth · user · tasks · courses · contact
    ├── services/               auth · user · task · course   (shared with GraphQL)
    ├── graphql/server.js       SDL schema + resolvers on the same JWT
    └── utils/                  validators · tokens · mailer · errors

frontend/
├── App.js                      providers, Inter fonts, toast host
├── tailwind.config.js          design tokens (primary #14532D, tint #EFF6F0)
└── src/
    ├── api/index.js            Axios client + JWT interceptor + endpoint map
    ├── components/             AppHeader, Avatar, TaskRow, CourseCard, form modals, …
    ├── context/                AuthContext (session) · PreferencesContext (language)
    ├── i18n/translations.js    en · de · es · fr · pt
    ├── navigation/             RootNavigator (auth gate) · MainTabs (bottom nav)
    ├── screens/                Login · SignUp · ForgotPassword · Home · Tasks · Courses · Profile · Settings
    └── utils/                  dates · validators · notify (toast + confirm dialogs)
```

## 2 · Database schema (Supabase PostgreSQL)

`backend/src/db/schema.sql` — run it in the Supabase SQL Editor or with
`npm run db:schema`.

```
users                         courses                      schedules
──────────────────────        ───────────────────────      ──────────────────────
id            uuid PK         id            uuid PK        id           uuid PK
email         text unique     user_id       uuid → users   course_id    uuid → courses (CASCADE)
password_hash text            name          text           day_of_week  smallint 0–6 (Sun–Sat)
full_name     text            code          text           start_time   time
student_id    text unique     instructor    text           end_time     time  (end > start)
school_name   text            room          text
avatar_url    text            color         text
language      text default en created_at / updated_at
reset_token_hash / expires
created_at / updated_at       tasks
                              ───────────────────────
                              id          uuid PK
                              user_id     uuid → users (CASCADE)
                              course_id   uuid → courses (SET NULL)
                              title       text
                              description text
                              due_date    date
                              status      text CHECK (pending | done)
                              created_at / updated_at
```

Every table is scoped by `user_id`, so one student can never read another
student's rows. Deleting a user cascades to courses → schedules and tasks.

## 3 · Run it

**Backend**

```bash
cd backend
npm install
cp .env.example .env          # DATABASE_URL (Supabase) + JWT_SECRET
npm run db:schema             # create the tables
npm run dev                   # http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env          # EXPO_PUBLIC_API_URL (see table in frontend/README.md)
npx expo start                # a = Android, i = iOS, or scan the QR in Expo Go
npx expo start --web          # browser → http://localhost:8081
```

**No database yet?** The API automatically falls back to an in-memory demo
store (`backend/src/db/memory.js`) when `DATABASE_URL` is missing or still the
placeholder — everything works, seeded with a demo student
(`demo@campus.os` / `Campus123`), and the data resets when the server
restarts. Set a real Supabase `DATABASE_URL` (or `DEMO_MODE=false`) to switch
to PostgreSQL; no code changes needed.

Without SMTP credentials the mailer runs in dev mode and prints password-reset
and contact emails to the backend console — the flows stay fully testable.

## 4 · Feature checklist

- [x] **Auth** — email + password via Passport.js (local strategy + JWT),
      field validation, toast feedback, rate limiting (20/15 min on auth,
      5/hour on reset emails), forgot-password email via Nodemailer.
- [x] **Home** — header (logo, school, bell badge, profile), welcome card with
      name + live date/time + student ID, "What do you want to do today?"
      quick actions, pending tasks with inline checkboxes.
- [x] **Bottom nav** — Home · Tasks · Courses · Profile, Lucide icon above
      label, active tab in primary green with a rounded pill behind the icon,
      inactive tabs muted grey.
- [x] **Tasks** — add / edit / delete, due date + status, All · Pending · Done filter.
- [x] **Courses** — instructor, room, weekly schedule (day + time), add / edit / delete.
- [x] **Profile** — student info, photo upload (expo-image-picker → Multer), Settings button.
- [x] **Settings** — share, rate, contact (Nodemailer endpoint), reset account
      (confirm → clears tasks/courses), delete account (confirm → deletes user),
      login/logout, language picker (🇬🇧 🇩🇪 🇪🇸 🇫🇷 🇵🇹), privacy & terms links,
      back arrow + "Settings" title.
- [x] **GraphQL** — `POST /graphql` exposing queries `me · stats · tasks · courses`
      and mutations `createTask · updateTask · deleteTask · createCourse ·
      updateCourse · deleteCourse · updateProfile`.
- [x] **Design** — dark green `#14532D` primary, tinted `#EFF6F0` background,
      rounded cards, soft shadows, Inter type, responsive phone layouts.

## 5 · API summary

See `backend/README.md` for the full endpoint table and a GraphQL example.
