# AGENTS.md

This file provides guidance to AI coding assistants working on the OpenBisbis codebase.

## Project Overview

OpenBisbis is a **desktop speech-to-text application** built with Electron.
It records audio via the system microphone, transcribes it locally using a
whisper.cpp server, and optionally enhances the transcript with a local
llama.cpp LLM server — then pastes the result into the active application.
Everything runs 100 % offline on the user's machine.

## Monorepo Structure

This is a **Yarn 4 workspaces** monorepo. Never use `npm`.

```
open-bisbis/
├── apps/
│   └── main-app/          # Electron application (main + renderer)
│       ├── electron/       # Main-process code (Node.js / Electron APIs)
│       │   ├── main.ts           # App entry point, IPC handler registration
│       │   ├── preload.ts        # Context bridge (exposes ipcRenderer)
│       │   ├── config.ts         # Paths, model definitions, LLM definitions
│       │   ├── storage.ts        # electron-store persistence layer
│       │   ├── handlers/         # IPC handler implementations (one per domain)
│       │   ├── services/         # Native server management (whisper.cpp, llama.cpp)
│       │   │   └── server/       # Generic server lifecycle (start/stop/health)
│       │   ├── components/       # Electron window & tray factories
│       │   └── utils/            # Download, hashing helpers
│       └── src/            # Renderer-process code (React)
│           ├── App.tsx           # Root: onboarding vs dashboard routing
│           ├── Widget.tsx        # Floating recording-status overlay window
│           ├── onboarding/       # First-run permission & setup screens
│           ├── dashboard/        # Main UI (models, settings, shortcuts)
│           └── components/       # Shared UI components (Card, etc.)
├── packages/
│   ├── ipc/               # @open-bisbis/ipc — Type-safe IPC contract layer
│   └── hooks/             # @open-bisbis/hooks — React Query hooks for the UI
├── scripts/               # Native dependency build scripts (ffmpeg, whisper, llama)
├── biome.json             # Linter + formatter config (replaces ESLint/Prettier)
└── package.json           # Root workspace config
```

### Package Dependency Graph

```
@open-bisbis/hooks  →  @open-bisbis/ipc
main-app             →  @open-bisbis/hooks, @open-bisbis/ipc
```

`@open-bisbis/ipc` is consumed by **both** the main process (handler registration)
and the renderer process (via hooks). It must never import Electron main-process APIs
directly — it uses `import type` for `IpcMain` and `IpcRenderer`.

## IPC Architecture (Critical Pattern)

All communication between renderer and main process follows this pipeline:

```
UI Component → Hook (packages/hooks) → IPC call (packages/ipc) → Handler (electron/handlers) → Service/Storage
```

### Adding a new IPC channel — step by step:

1. **`packages/ipc/src/<domain>.ts`** — Define the topic string, Valibot schemas,
   `register*` function (main-side), and client function (renderer-side).
   Both sides validate with Valibot. Every response uses `IpcResult<T>`.
2. **`packages/ipc/src/index.ts`** — Re-export the new symbols.
3. **`packages/hooks/src/<domain>.ts`** — Create a React Query `useQuery` or
   `useMutation` hook that calls the IPC client function via `window.ipcRenderer`.
4. **`packages/hooks/src/index.ts`** — Re-export the new hook.
5. **`apps/main-app/electron/handlers/<domain>/`** — Implement the handler,
   call `register*()` from `@open-bisbis/ipc`, wire to services/storage.
6. **`apps/main-app/electron/handlers/index.ts`** — Re-export the handler.
7. **`apps/main-app/electron/main.ts`** — Call the handler at startup.

### IPC Conventions

- Topic strings use slash-separated namespaces: `"models/list"`, `"llms/download"`.
- Both request and response payloads are validated with **Valibot** schemas.
- All IPC results follow the `IpcResult<T>` type:
  `{ status: 'success'; data: T } | { status: 'error'; data: string[] }`
- Hooks check `result.status === 'error'` and throw to let React Query handle errors.
- Use `ipc.handle()` / `ipc.invoke()` (request-response). Use `webContents.send()` /
  `ipcRenderer.on()` only for push events (e.g. download progress, widget status).

## Tech Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Runtime | Electron | 27.3.11 |
| Frontend | React | 19.x |
| Routing | react-router | 7.x |
| State | @tanstack/react-query | 5.x |
| Styling | Tailwind CSS + DaisyUI | 4.2 / 5.x |
| Validation | Valibot | 1.x |
| Bundler | Vite + vite-plugin-electron | 8.x / 0.29 |
| Linter/Formatter | Biome | 2.4.x |
| Package Manager | Yarn | 4.14 (Berry) |
| Persistence | electron-store | 11.x |
| Native Deps | whisper.cpp, llama.cpp, ffmpeg | Built from source (see scripts/) |

## Code Conventions

### Style & Formatting (enforced by Biome)

- Single quotes, no semicolons (unless required by ASI).
- 2-space indentation, 120 character line width.
- Unused imports/variables are warnings, not errors.
- `noExplicitAny` and `noNonNullAssertion` are off — pragmatic use is OK.
- **Do not add ESLint or Prettier** — Biome handles everything.
- Pre-commit hook (Husky) runs `biome check --staged`.

### TypeScript

- Strict mode enabled. Target ESNext, module ESNext, bundler resolution.
- Path alias: `@/*` → `apps/main-app/src/*` (renderer only).
- Use `import type` for type-only imports.

### Naming

- Files: `kebab-case.ts` (e.g., `llama.cpp-service.ts`, `speech-to-text.ts`).
- React components: `PascalCase.tsx`.
- Exported functions: `camelCase`. Handler exports are named `handler`.
- IPC topics: `"domain/action"` (e.g., `"models/list"`, `"llms/download/cancel"`).

### Validation

- Always use **Valibot** (`v.object`, `v.safeParse`, etc.) for runtime validation.
- Never use Zod, Yup, or manual validation.

### React Patterns

- Hooks live in `@open-bisbis/hooks`, not in the app's `src/` directory.
- Data fetching uses `useQuery`; mutations use `useMutation` with `queryClient.invalidateQueries`.
- IPC is accessed via `window.ipcRenderer` (exposed by preload script).
- Use `classnames` package to create conditional styles based on variables.

## Services Architecture

The app manages two local HTTP servers as child processes:

| Service | Binary | Port | Purpose |
|---|---|---|---|
| whisper.cpp | `resources/whisper.cpp/whisper-server` | 8766 | Speech-to-text transcription |
| llama.cpp | `resources/llama.cpp/llama-server` | 8765 | Text enhancement / rewriting |

- Both use the `createServer()` abstraction in `electron/services/server/`.
- Lifecycle: `init()` starts the server, `stop()` kills it, `request()` checks health then calls the HTTP API.
- Models/LLMs are downloaded to `resources/models/` and `resources/llms/` respectively.
- Health checks poll `GET /health` until status is `"ok"`.

## Development

### Commands

```bash
yarn dev              # Start Electron app in dev mode (Vite HMR)
yarn dev:inspect      # Start with Node.js inspector for main-process debugging
yarn build            # Production build (tsc + vite build + electron-builder)
yarn lint             # Run Biome check across all workspaces
yarn format           # Auto-format with Biome
yarn clean            # Remove dist artifacts from all workspaces
yarn build-deps       # Build native dependencies (ffmpeg, whisper.cpp, llama.cpp)
```

### Environment Variables

- `LLAMA_SERVER_PORT` — Override llama.cpp port (default: 8765)
- `WHISPER_SERVER_PORT` — Override whisper.cpp port (default: 8766)

## Constraints & Gotchas

- **Never use `npm`** — this is a Yarn 4 workspace. Always `yarn add`, `yarn install`.
- **electron-store is ESM-only** — Vite is configured with `resolve.conditions: ['node']`
  to handle this. Do not add CommonJS workarounds.
- **Main process has no `window` global** — only renderer code can use browser APIs.
- **Preload is sandboxed** — only `window.ipcRenderer` methods (on/off/send/invoke)
  are exposed. Do not expose Node.js APIs directly.
- **macOS-only features**: Accessibility permission, AppleScript paste simulation.
  Always guard with `process.platform === 'darwin'`.
- **Model files are large** (500 MB–1.7 GB). Never commit them to git. They live
  in `resources/` and are downloaded at runtime.
- The `resources/` directory and native binaries must be built before first run — see `yarn build-deps`.
