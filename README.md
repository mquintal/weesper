# OpenBisbis

OpenBisbis is a **desktop speech-to-text application** built with Electron. It records audio via the system microphone, transcribes it locally, and optionally enhances the transcript with a local LLM — then automatically pastes the result into your active application. 

**Everything runs 100% offline on your machine.** No cloud dependencies, no data leaves your computer.

> **Note:** Currently, OpenBisbis is only supported on **macOS (Apple Silicon / ARM64)**.

## Core Technologies

OpenBisbis is powered by several robust open-source technologies under the hood:

- **[whisper.cpp](https://github.com/ggerganov/whisper.cpp):** Used for fast, high-quality, on-device speech-to-text transcription.
- **[llama.cpp](https://github.com/ggerganov/llama.cpp):** Used as a local LLM server to enhance, reformat, or rewrite the transcribed text based on custom user prompts.
- **[Electron](https://www.electronjs.org/):** The desktop application framework.
- **[React](https://react.dev/) & [Tailwind CSS](https://tailwindcss.com/):** The frontend technologies powering the UI.

## Getting Started

### Prerequisites

- macOS with Apple Silicon (M1/M2/M3/M4)
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Yarn 4 (Berry)](https://yarnpkg.com/)
- Standard build tools for macOS (`xcode-select --install`)

### Installation & Local Development

This project uses Yarn workspaces. Never use `npm`.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/open-bisbis.git
   cd open-bisbis
   ```

2. **Install dependencies:**
   ```bash
   yarn --immutable
   ```

3. **Build native dependencies:**
   Before running the app, you need to compile the underlying `whisper.cpp`, `llama.cpp`, and `ffmpeg` binaries.
   ```bash
   yarn build-deps
   ```

4. **Run the app in development mode:**
   ```bash
   yarn dev
   ```

### Other Useful Commands

- `yarn dev:inspect` - Start with Node.js inspector for main-process debugging
- `yarn build` - Create a production build of the application
- `yarn lint` - Run Biome check across all workspaces
- `yarn format` - Auto-format with Biome
- `yarn clean` - Remove build artifacts from all workspaces

## Architecture Overview

OpenBisbis is structured as a monorepo using Yarn workspaces:

```text
open-bisbis/
├── apps/
│   └── admin/             # The core Electron application
│       ├── electron/      # Main process (Node.js, File System, Server Management)
│       └── src/           # Renderer process (React Frontend)
├── packages/
│   ├── ipc/               # Shared, type-safe IPC contract layer using Valibot
│   └── hooks/             # React Query hooks bridging UI and IPC
├── scripts/               # Scripts to build native dependencies
└── ...
```

### IPC Architecture

Communication between the React frontend (Renderer process) and the Node.js backend (Main process) strictly follows a type-safe IPC pipeline:

`UI Component` → `React Query Hook (packages/hooks)` → `IPC Client (packages/ipc)` → `Main Handler (electron/handlers)`

Both request and response payloads are validated using **Valibot**, ensuring complete type safety across process boundaries.

### Services

The application manages two local HTTP servers as child processes:
1. **whisper.cpp server:** Handles audio transcription.
2. **llama.cpp server:** Handles text enhancement and rewriting.

Models for these servers are downloaded dynamically by the user and stored within the application's local `resources` directory.

## License

You are free to view, clone, modify, and run this code for personal use or as an internal productivity tool within a company. **However, you may not commercialize the software itself, offer it as a service, or sell it to third parties.**

For the full legal terms, please ensure you review the project's [LICENSE.md](LICENSE.md) file.
