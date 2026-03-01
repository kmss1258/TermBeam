# Architecture

## Project Structure

```
termbeam/
├── bin/
│   └── termbeam.js         # CLI entry point
├── src/
│   ├── server.js            # Main orchestrator
│   ├── cli.js               # Argument parsing & help
│   ├── auth.js              # Authentication & rate limiting
│   ├── sessions.js          # PTY session management
│   ├── routes.js            # Express HTTP routes
│   ├── websocket.js         # WebSocket connection handling
│   ├── tunnel.js            # DevTunnel integration
│   ├── preview.js           # Port preview reverse proxy
│   ├── shells.js            # Shell detection (cross-platform)
│   ├── logger.js            # Structured logger with levels
│   └── version.js           # Smart version detection
├── public/
│   ├── index.html           # Session manager (mobile UI)
│   ├── terminal.html        # Terminal view (xterm.js)
│   ├── sw.js                # Service worker (PWA caching)
│   ├── manifest.json        # Web app manifest
│   └── icons/               # PWA icons
├── test/
│   ├── auth.test.js
│   ├── cli.test.js
│   ├── integration.test.js
│   ├── logger.test.js
│   ├── routes.test.js
│   ├── sessions.test.js
│   ├── shells.test.js
│   ├── version.test.js
│   └── websocket.test.js
├── docs/                    # MkDocs documentation
├── package.json
└── mkdocs.yml
```

## Module Responsibilities

### `server.js` — Orchestrator

Wires all modules together. Exports `createTermBeamServer()` which creates the Express app, HTTP server, WebSocket server, and returns `{ app, server, wss, sessions, config, auth, start, shutdown }`. The `start()` method begins listening and creates the default session. Handles process lifecycle (shutdown, uncaught exceptions).

### `cli.js` — CLI Interface

Parses command-line arguments and environment variables. Returns a config object used by all other modules. Includes platform-specific shell auto-detection: on Windows it walks the process tree (via `wmic`) looking for PowerShell or cmd.exe; on Unix it inspects the parent process via `ps` and falls back to `$SHELL` or `/bin/sh`.

### `auth.js` — Authentication

Factory function `createAuth(password)` returns an object with middleware, token management, rate limiting, and the login page HTML.

### `sessions.js` — Session Manager

`SessionManager` class wraps the PTY lifecycle. Handles spawning, tracking, listing, updating, and cleaning up terminal sessions. Each session has an auto-assigned color, tracks `lastActivity` timestamps, a `createdAt` timestamp, and supports live updates via the `update()` method. Sessions maintain a scrollback buffer (capped at 200 KB) that is sent to newly connecting clients, and track a `clients` Set of active WebSocket connections. Supports an optional `initialCommand` that is written to the PTY shortly after spawn.

### `routes.js` — HTTP Routes

Registers all Express routes: login page (`GET /login`), auth API, session CRUD (including `PATCH` for updating session color/name), shell detection, directory browser, image upload, version endpoint. The `POST /api/sessions` endpoint validates `shell` against detected shells and `cwd` against the filesystem, and accepts optional `args`, `initialCommand`, and `color` parameters.

### `websocket.js` — WebSocket Handler

Handles real-time communication: validates the Origin header to reject cross-origin connections, WebSocket-level authentication (password or token), session attachment, terminal I/O forwarding, and resize events. When multiple clients are connected to the same session, the PTY is resized to the minimum dimensions across all clients.

### `preview.js` — Port Preview Proxy

Reverse-proxies HTTP requests from `/preview/:port/*` to services running on `127.0.0.1`. Allows previewing web apps started inside a terminal session without exposing additional ports. Handles proxy errors (502) and timeouts (504).

### `shells.js` — Shell Detection

Detects available shells on the host system. Returns a list of shell objects with `name`, `path`, and `cmd` fields. Cross-platform: scans known paths on Unix and queries the registry on Windows.

### `logger.js` — Logger

Structured logger with configurable levels (`error`, `warn`, `info`, `debug`). Used by all modules. Level is set via `--log-level` flag or `TERMBEAM_LOG_LEVEL` environment variable.

### `tunnel.js` — DevTunnel

Manages Azure DevTunnel lifecycle: login, create, host, cleanup.

### `version.js` — Version Detection

Smart version that shows `1.0.0` for npm installs and `1.0.0-dev (git-hash)` for local development.

## Data Flow

```
Client (Phone Browser)
  │
  ├─ HTTP ──► Express Routes ──► Session Manager
  │              │                     │
  │              ├─ /api/sessions      ├─ create/list/delete
  │              ├─ /api/auth          │
  │              ├─ /api/shells        │
  │              └─ /api/dirs          │
  │                                    │
  └─ WebSocket ──► WS Handler ──► PTY Process
                    │                  │
                    ├─ attach          ├─ spawn shell
                    ├─ input ──────►  ├─ write stdin
                    ├─ resize         ├─ resize terminal
                    └─ output ◄────── └─ read stdout
```
