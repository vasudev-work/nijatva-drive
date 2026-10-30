# Nijatva Drive

A private, offline-first file vault for Android — built with Expo + React Native + TypeScript.

The interaction model follows the Proton Drive mobile app closely: a single vault you can browse by
folder, an upload action always within thumb reach, long-press context menus, a proper trash, and
share links you can revoke. The visual language is Nijatva's own — deep teal, mint accents and a
calm, high-contrast surface system — rather than a copy of any existing brand.

Everything runs on the device. Files are copied into the app's private storage, the index is a JSON
file next to them, and nothing is uploaded anywhere unless you point the app at the included API stub.

---

## What is in the box

| Area | What it does |
| --- | --- |
| **Files** | Breadcrumb navigation, list/grid toggle, sort by name/recent/size, starred filter, live search across the whole vault, "jump back in" recents, floating add button |
| **Upload** | System file picker (multi-select), real copy into the vault, automatic MIME and size capture |
| **Folders** | Create, rename, move into any folder from a tree picker, recursive delete |
| **Files** | Preview images inline, read text/markdown/JSON/code in place, hand off anything else to another app, copy/rotate/revoke share links |
| **Photos** | Automatic grid of every image in the vault, grouped by day |
| **Shared** | Every active link in one place, with copy, rotate and revoke |
| **Trash** | Soft delete, restore (re-parents if the original folder is gone), delete permanently, empty trash |
| **Settings** | Storage meter with per-type breakdown, light/dark/system theme, app lock passcode, API base url + connection test, vault footprint |
| **Onboarding** | A three-point welcome screen and a numeric lock screen |

## Design system

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#F4F6F5` | `#080F0E` |
| Surface | `#FFFFFF` | `#111A18` |
| Primary | `#0E7C66` | `#19C08A` |
| Accent | `#19C08A` | `#19C08A` |
| Star | `#FFB020` | `#FFB020` |
| Danger | `#E5484D` | `#FF6B6F` |
| Header gradient | `#08302A → #0E7C66` | `#04120E → #0B4A3B` |

Radii are 10/14/20/28 plus a pill, spacing is a 4-point scale, and category tiles (folder, image,
video, audio, document, archive, code) each get their own tint/ink pair in both themes. All of it
lives in `src/theme/index.ts` — change two colours there and the whole app follows.

## Tech stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript in strict mode
- `expo-file-system` (the new `File` / `Directory` / `Paths` API) for the actual vault
- `expo-document-picker`, `expo-clipboard`, `expo-haptics`, `expo-linear-gradient`
- `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`
- No navigation library — a deliberately small custom tab + stack router in `src/nav/Root.tsx`

## Getting started

```bash
npm install
npm run typecheck      # tsc --noEmit, clean
npm start              # Metro, then press "a" for Android
```

You can run it in **Expo Go** for a quick look, but the file picker and file system behave best in a
development build (`npx expo run:android`).

## Building an APK

Three routes, cheapest first:

**1. EAS cloud build (no Android SDK needed) — recommended**

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview     # or: npm run build:apk
```

`eas.json` ships a `preview` profile that produces a directly installable **APK**, and a `production`
profile that produces an **AAB** for the Play Store. EAS emails/links the artifact when it finishes.

**2. Local build with Android Studio / SDK**

```bash
npm run prebuild            # generates the native android/ project
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

**3. Development build on a connected device**

```bash
npx expo run:android        # compiles and installs a debug APK
```

The Android package name is `app.nijatva.drive` (change it in `app.json` if you fork this).

## Project structure

```
App.tsx                     providers + root
index.ts                    Expo entry point
src/
  nav/Root.tsx              tab state, folder state, viewer overlay, onboarding/lock gate
  store/DriveProvider.tsx   single source of truth: state, CRUD, theme, toasts
  storage/index.ts          vault on disk — index.json, blob copy/delete, seeding
  api/client.ts             typed client for the optional backend stub
  theme/index.ts            colours, radii, spacing, shadows (light + dark)
  types/index.ts            DriveNode, DriveMeta, DriveState
  utils/                    byte/date formatting, mime + category helpers, icon maps
  components/               header, storage meter, file row, grid card, sheet, prompts, tab bar, UI kit
  screens/                  Files, Photos, Shared, Trash, Settings, Viewer, Welcome, Lock
server/index.js             zero-dependency Node API stub (in-memory)
```

### Data model

Each item is a `DriveNode`:

```ts
{ id, name, kind: 'file' | 'folder', parentId, size, mimeType,
  localUri, createdAt, updatedAt, starred, trashedAt, share }
```

Folders are nodes with `kind: 'folder'` and `parentId: null` at the root, so moves are a single field
write and the tree is rebuilt by walking parents. Deleting a folder marks (or removes) the whole
subtree. Blobs live in `<documents>/nijatva-vault/blobs/` and the index in `index.json`.

## The API stub

`server/index.js` is dependency-free Node (18+), in memory, and exists so you can wire the client to a
real backend later without rewriting the app.

```bash
npm run server            # http://localhost:8787
```

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | service + version |
| POST | `/api/auth/login` | returns a stub token and user |
| GET | `/api/files` | list records |
| POST | `/api/files` | create a record |
| POST | `/api/files/sync` | accept a batch snapshot from the app |
| PATCH | `/api/files/:id` | update |
| DELETE | `/api/files/:id` | delete |

Point the app at it from **Settings → API base url**, then **Test connection & push snapshot**. On a
physical phone use your machine's LAN IP, e.g. `http://192.168.1.10:8787`.

## Honest notes on security

This is a UI/UX-complete client, not a cryptographic one:

- Files sit in app-private storage. They are **not** encrypted at rest by this code.
- The app-lock passcode is stored locally and compared in the client — a convenience lock, not a KDF.
- Share links are generated client-side (`https://nijatva.drive/s/<token>`) as a UI demo. They do not
  resolve on the internet.
- No account, telemetry or network calls happen unless you configure an API url.

If you want the real thing, the places to change are `src/storage/index.ts` (encrypt blobs with a
key derived from the passcode) and `src/api/client.ts` (upload ciphertext instead of metadata).

## Roadmap

- Encrypted blobs with a passcode-derived key (Argon2id + AES-GCM)
- Real share links served by the backend, with expiry and download counts
- Multi-select and batch move/delete
- Offline pinning and background upload queue
- Tablet two-pane layout

## License

MIT — see [LICENSE](LICENSE).
