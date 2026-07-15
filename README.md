# 🏰 CastleApp (Echoes & Paths)
> **Discover European heritage through geospatial exploration.**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo SDK 54](https://img.shields.io/badge/Expo_SDK_54-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Navigation](https://img.shields.io/badge/React_Navigation-6B52AE?style=for-the-badge&logo=react&logoColor=white)](https://reactnavigation.org/)

---

## 📖 Overview
**CastleApp** is a mobile application designed to bridge the gap between modern technology and historical memory. It turns your surroundings into a living museum: using your location it surfaces nearby castles, ruins, museums, monuments and religious sites, enriched with descriptions and images.

Places come from the **Google Places API** and are enriched with summaries and translations from **Wikipedia** (with **Europeana / Wikimedia** used for imagery), all served by the companion backend. On top of discovery, the app adds a light layer of gamification and social features — conquer places you physically visit, climb medieval ranks, and compare your map against your friends'.

Whether you are a traveler or a local history enthusiast, CastleApp transforms your surroundings into a living museum.

## 📸 Screenshots
<table style="width: 100%;">
  <tr>
    <td align="center" width="25%"><b>Main Map</b></td>
    <td align="center" width="25%"><b>Discovery Feed</b></td>
    <td align="center" width="25%"><b>Landmark Details</b></td>
    <td align="center" width="25%"><b>App Demo Video</b></td> </tr>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/6ba4a6fb-f330-45c1-bb48-0311655e7888" width="220" alt="Map Screen"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/d63c5c4a-1abb-4f97-b6f5-bfd36947e8bc" width="220" alt="Feed Screen"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/51d0dff0-5ebe-4bbb-ad25-ce8c73ae785e" width="220" alt="Details Screen"></td>
    <td align="center">
      <video src="https://github.com/user-attachments/assets/56492b0f-b5db-43a4-8b6d-e553b67623d2"width="220" controls title="CastleApp Demo Video"></video>
    </td>
  </tr>
</table>

## 🚀 Key Features
* **Geospatial discovery feed:** Historic places around you, merging the community database with live Google Places results and Wikipedia enrichment.
* **Interactive map:** Real-time navigation and landmark discovery powered by `react-native-maps`, with a custom retro map style.
* **Conquests & ranks:** "Conquer" a place when you are physically within 150 m of it (GPS-verified). Climb medieval tiers (Peasant → Squire → … → High King) as your count grows.
* **Friends & social map:** Send friend requests, then compare conquests on a shared **VS** map (`HistoryMapScreen`).
* **Community contributions:** Add photos and info to places (with moderation on the backend).
* **Authentication:** Email/password **and** Google Sign-In, backed by JWT.
* **Push notifications:** Expo push for friend requests and acceptances.
* **Internationalization:** Multi-language UI via `i18next` + `expo-localization`.
* **City search & favorites:** Jump to any city (no GPS needed) and bookmark places locally.

## 🛠️ Tech Stack
* **React Native 0.81 + Expo SDK 54** (TypeScript) — cross-platform mobile.
* **React Navigation** — native-stack + bottom-tabs.
* **react-native-maps** — Google-provider maps and markers.
* **expo-location** — GPS handling and permissions.
* **expo-notifications / expo-device** — push notifications.
* **@react-native-google-signin/google-signin + expo-auth-session / expo-crypto** — Google OAuth.
* **expo-image-picker** — photos for community contributions.
* **AsyncStorage** — auth token, user info and favorites.
* **axios / fetch** — API calls.
* **i18next + react-i18next + expo-localization** — translations.

### Backend
This app talks to the **CastleApp backend** (Node.js + Express + PostgreSQL/PostGIS), which proxies Google Places / Wikipedia / Europeana and stores users, conquests, friendships and contributions. The production API runs on Railway:

```
https://castleapp-backend-production.up.railway.app
```

Repo: [`CastleApp-backend`](https://github.com/sebitacasa/CastleApp-backend).

## 📁 Project structure
```
src/
├── api/            # API clients (locations, contributions) + AsyncStorage helpers
├── components/     # Reusable UI (carousel, cards, city search, splash, footer)
├── context/        # AuthContext (JWT/session) and FavoritesContext
├── screens/        # Feed, Map, HistoryMap, Detail, Search, Conquests,
│                   #   Friends, MyDiscoveries, Profile, Login, Register, ...
├── i18n/           # i18next setup and translations
├── data/           # Static data (regions, top cities)
├── theme/          # Colors
├── types/          # Shared TypeScript types
└── utils/          # notifications, category icons, cloudinary upload
```

## ⚙️ Getting started

### Prerequisites
- Node.js 18+
- A **development build** (this app uses native modules — Google Sign-In, maps, notifications — so it does **not** run in plain Expo Go). Use `expo-dev-client` / `expo run:android` / `expo run:ios`, or an EAS dev build.
- Android Studio / Xcode for emulators, or a physical device with the dev client installed.

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create a `.env` file in the project root (it is git-ignored). `app.config.js` reads:

```env
GOOGLE_MAPS_API_KEY=your_android_google_maps_api_key
```

> This key is injected into the native Android Google Maps config at build time. Google Sign-In client IDs live in `credentials.json` / the native config and are also git-ignored.

### 3. Run
```bash
npm start          # Metro bundler (dev client)
npm run android    # build & run on Android
npm run ios        # build & run on iOS
```

> **Emulator tip:** the feed needs a location. Android emulators have no GPS fix by default — set one via **Extended controls → Location** (e.g. Vienna `48.2082, 16.3738`), or just use the in-app **Search City** box, which uses manual coordinates.

## 🔗 API configuration
The backend base URL is currently hard-coded in the screens/context (e.g. `AuthContext.tsx`, `FeedScreen.tsx`) as the Railway production URL. To point at a local backend, update those constants (a good future refactor is to centralize this in a single config / env value).

## 🧠 The "Why" behind this project
After living in different continents—from the vast landscapes of **Australia** to the historic heart of **Europe**—I've learned that objects and places are vessels for stories. This app is my way of ensuring those "echoes" aren't lost. It represents my commitment to building technology that serves culture and memory, not just utility.
