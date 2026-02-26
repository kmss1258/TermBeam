<div align="center">

# 📡 TermBeam

**Beam your terminal to any device**

[![npm version](https://img.shields.io/npm/v/termbeam.svg)](https://www.npmjs.com/package/termbeam)
[![CI](https://github.com/dorlugasigal/TermBeam/actions/workflows/ci.yml/badge.svg)](https://github.com/dorlugasigal/TermBeam/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

Access your terminal from your phone, tablet, or any browser.
Multi-session, mobile-optimized, with touch controls.

[Getting Started](#-quick-start) · [Screenshots](#-screenshots) · [Documentation](https://dorlugasigal.github.io/TermBeam/) · [Contributing](CONTRIBUTING.md)

</div>

---

## 📸 Screenshots

<!--
  To add screenshots:
  1. Run TermBeam: npx termbeam --generate-password
  2. Take screenshots on your phone/browser
  3. Save images to docs/assets/screenshots/
  4. Uncomment the img tags below and update filenames

  Recommended screenshots:
  - session-manager.png  (main screen with session list)
  - terminal.png         (active terminal session)
  - folder-browser.png   (folder picker sheet)
  - login.png            (password login screen)
  - qr-code.png          (server startup with QR code in terminal)
-->

<div align="center">
<table>
<tr>
<td align="center"><strong>Session Manager</strong></td>
<td align="center"><strong>Terminal</strong></td>
<td align="center"><strong>Folder Browser</strong></td>
</tr>
<tr>
<td>

<!-- ![Session Manager](docs/assets/screenshots/session-manager.png) -->

_Manage multiple terminal sessions with swipe-to-delete_

</td>
<td>

<!-- ![Terminal](docs/assets/screenshots/terminal.png) -->

_Full terminal with touch controls and Nerd Font rendering_

</td>
<td>

<!-- ![Folder Browser](docs/assets/screenshots/folder-browser.png) -->

_Visual directory picker for working directory_

</td>
</tr>
</table>
</div>

> **💡 Screenshots coming soon!** Run `npx termbeam` and see for yourself.

## ✨ Features

- 📱 **Mobile-first UI** — Touch-friendly interface designed for phones and tablets
- 🖥️ **Multi-session** — Run multiple terminal sessions simultaneously
- 🔐 **Password auth** — Token-based authentication with rate limiting
- 📂 **Folder browser** — Visual directory picker with breadcrumb navigation
- 👆 **Touch controls** — Arrow keys, Ctrl shortcuts, Tab, Esc via on-screen touch bar
- 🔤 **Nerd Font support** — Full glyph rendering with JetBrains Mono Nerd Font
- 📲 **QR code** — Scan to connect instantly from your phone
- 🌐 **DevTunnel** — Optional public URL for remote access from anywhere
- 🔍 **Adjustable font size** — Pinch or button zoom for any screen
- ↔️ **Swipe to delete** — iOS-style session management
- 🔄 **Smart versioning** — Shows git hash in dev, clean version from npm

## 🚀 Quick Start

```bash
npx termbeam
```

Or install globally:

```bash
npm install -g termbeam
termbeam
```

That's it. Scan the QR code printed in your terminal, or open the URL on any device.

### With password protection (recommended)

```bash
# Auto-generate a secure password
termbeam --generate-password

# Or set your own
termbeam --password mysecret
```

### Remote access from anywhere

```bash
termbeam --tunnel --generate-password
```

## 📖 Usage

```bash
# Start with your default shell
termbeam

# Use a specific shell
termbeam /bin/bash

# Custom port and listen on all interfaces (LAN access)
termbeam --port 8080 --host 0.0.0.0

# Public tunnel + password (access from anywhere)
termbeam --tunnel --generate-password
```

### CLI Options

| Flag                  | Description                     | Default     |
| --------------------- | ------------------------------- | ----------- |
| `--password <pw>`     | Set access password             | None        |
| `--generate-password` | Auto-generate a secure password | —           |
| `--tunnel`            | Create a public devtunnel URL   | Off         |
| `--port <port>`       | Server port                     | `3456`      |
| `--host <addr>`       | Bind address                    | `127.0.0.1` |
| `-h, --help`          | Show help                       | —           |
| `-v, --version`       | Show version                    | —           |

### Environment Variables

| Variable            | Description                     |
| ------------------- | ------------------------------- |
| `PORT`              | Server port (overrides default) |
| `TERMBEAM_PASSWORD` | Access password                 |
| `TERMBEAM_CWD`      | Default working directory       |

## 🔒 Security

TermBeam is designed for **local network use**. Key security features:

- 🔑 **Token-based auth** with secure, httpOnly cookies (24-hour expiry)
- 🛡️ **Rate limiting** on login (5 attempts per minute)
- 🔒 **Security headers** (X-Frame-Options, X-Content-Type-Options, CSP, etc.)
- 🏠 **Localhost by default** — requires explicit `--host 0.0.0.0` for LAN access

> ⚠️ **Always use a password when exposing to any network.** See the [Security Guide](https://dorlugasigal.github.io/TermBeam/security/) for production deployment tips.

## 🏗️ Architecture

```
termbeam/
├── bin/termbeam.js            # CLI entry point
├── src/
│   ├── server.js              # Main orchestrator
│   ├── cli.js                 # Argument parsing & help
│   ├── auth.js                # Authentication & rate limiting
│   ├── sessions.js            # PTY session lifecycle
│   ├── routes.js              # Express HTTP routes
│   ├── websocket.js           # WebSocket terminal I/O
│   ├── tunnel.js              # DevTunnel integration
│   └── version.js             # Smart version detection
├── public/
│   ├── index.html             # Session manager UI (mobile)
│   └── terminal.html          # Terminal UI (xterm.js)
├── test/                      # Unit tests (node:test)
├── docs/                      # MkDocs documentation
└── .github/workflows/         # CI, Release, Docs deployment
```

See the [Architecture Guide](https://dorlugasigal.github.io/TermBeam/architecture/) for details.

## 📚 Documentation

Full documentation is available at **[dorlugasigal.github.io/TermBeam](https://dorlugasigal.github.io/TermBeam/)**

- [Getting Started](https://dorlugasigal.github.io/TermBeam/getting-started/)
- [Configuration](https://dorlugasigal.github.io/TermBeam/configuration/)
- [Security](https://dorlugasigal.github.io/TermBeam/security/)
- [API Reference](https://dorlugasigal.github.io/TermBeam/api/)
- [Architecture](https://dorlugasigal.github.io/TermBeam/architecture/)

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and local workflow
- Testing guide (Node.js built-in test runner)
- Commit conventions and PR process
- Release process (maintainers)

## 📄 License

[MIT](LICENSE) — made with ❤️ by [@dorlugasigal](https://github.com/dorlugasigal)
