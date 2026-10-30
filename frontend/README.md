# Campus OS — Mobile app (React Native + Expo)

The student-facing app: dark-green UI, Inter type, bottom tabs, toast
notifications, and a full task / course / profile flow backed by the
Express API in `../backend`.

## Run it

```bash
cd frontend
npm install
cp .env.example .env      # then set EXPO_PUBLIC_API_URL
npx expo start            # press a (Android) / i (iOS), or scan the QR in Expo Go
npx expo start --web      # or run it in the browser → http://localhost:8081
```

> Web needs three extra packages — `react-dom`, `react-native-web` and
> `expo-asset` — which are already listed in `package.json`.

`EXPO_PUBLIC_API_URL` must point at the machine running the backend:

| Where the app runs | Value |
| --- | --- |
| iOS simulator | `http://localhost:5000` |
| Android emulator | `http://10.0.2.2:5000` |
| Phone (Expo Go) | `http://<your-LAN-IP>:5000` — same Wi-Fi as your computer |

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React Native 0.79 (Expo SDK 53) |
| Styling | NativeWind (Tailwind CSS) — see `tailwind.config.js` for the palette |
| Type | Google Fonts **Inter** (`@expo-google-fonts/inter`) |
| Icons | `lucide-react-native` |
| Navigation | React Navigation (native stack + bottom tabs) |
| HTTP | Axios (`src/api/index.js`, JWT interceptor included) |
| Toasts | `react-native-toast-message` (`src/components/ToastConfig.js`) |

## Structure

```
frontend/
├── App.js                    providers, fonts, toast host
├── tailwind.config.js        primary #14532D, tinted bg #EFF6F0, soft shadows
└── src/
    ├── api/index.js          all endpoint calls + auth interceptor
    ├── components/           Avatar, TaskRow, CourseCard, modals, …
    ├── context/              AuthContext (JWT/session), PreferencesContext (i18n)
    ├── i18n/translations.js  en · de · es · fr · pt dictionary
    ├── navigation/           RootNavigator (auth switch) + MainTabs
    ├── screens/              Login, SignUp, ForgotPassword, Home, Tasks, Courses, Profile, Settings
    └── utils/                dates, validators, toast/confirm helpers
```

## Feature map

- **Auth** — login / sign up / forgot-password with field validation and toast feedback; token persisted in AsyncStorage; any 401 silently signs out.
- **Home** — header (logo, school, bell with pending badge, profile), gradient welcome card (name, live date/time, student ID), quick actions, and pending tasks you can tick off inline.
- **Tasks** — add / edit / delete, due-date quick chips, All · Pending · Done filter, FAB.
- **Courses** — instructor, room, colour, weekly schedule chips; "today's classes" summary.
- **Profile** — stats, photo upload (expo-image-picker → Multer endpoint), personal info.
- **Settings** — share, rate, contact (email via API), reset account, delete account, login/logout, language picker with flags, privacy & terms links.
