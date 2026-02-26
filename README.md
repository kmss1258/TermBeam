<div align="center">

# 📡 TermBeam

**Beam your terminal to any device**

[![npm version](https://img.shields.io/npm/v/termbeam.svg)](https://www.npmjs.com/package/termbeam)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

Access your terminal from your phone, tablet, or any browser.
Multi-session, mobile-optimized, with touch controls.

</div>

---

## ✨ Features

- 📱 **Mobile-optimized** — Touch-friendly UI designed for phones and tablets
- 🖥️ **Multi-session** — Run multiple terminal sessions simultaneously
- 🔐 **Password auth** — Token-based authentication with rate limiting
- 📂 **Folder browser** — Visual directory picker for setting the working directory
- 👆 **Touch controls** — Arrow keys, Ctrl shortcuts, Tab, Esc via on-screen touch bar
- 🔤 **Nerd Font support** — Full glyph rendering with JetBrains Mono Nerd Font
- 📲 **QR code** — Scan to connect instantly from your phone
- 🌐 **DevTunnel** — Optional public URL for remote access from anywhere
- 🔍 **Zoom** — Adjustable font size for any screen
- ↔️ **Swipe to delete** — iOS-style session management

## 🚀 Quick Start

```bash
npx termbeam
```

Or install globally:

```bash
npm install -g termbeam
termbeam
```

Scan the QR code printed in your terminal, or open the URL on any device.

## 📖 Usage

```bash
# Start with your default shell
termbeam

# With password protection (recommended)
termbeam --password mysecret

# Auto-generate a secure password
termbeam --generate-password

# Use a specific shell
termbeam /bin/bash

# Custom port and listen on all interfaces
termbeam --port 8080 --host 0.0.0.0

# Public tunnel + password (access from anywhere)
termbeam --tunnel --generate-password
```

### All Options

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

TermBeam is designed for **local network use**. When exposing to the internet:

- **Always use a password** (`--password` or `--generate-password`)
- Authentication uses secure, httpOnly tokens with 24-hour expiry
- Login endpoint is rate-limited (5 attempts per minute)
- Security headers enabled (X-Frame-Options, X-Content-Type-Options, etc.)
- By default, binds to `127.0.0.1` (localhost only)
- Use `--host 0.0.0.0` explicitly to expose on your LAN

> ⚠️ **Never run without a password on a public network.**

## 🏗️ Project Structure

```
termbeam/
├── bin/
│   └── termbeam.js       # CLI entry point
├── src/
│   └── server.js         # Express + WebSocket server
├── public/
│   ├── index.html        # Session manager UI
│   └── terminal.html     # Terminal UI (xterm.js)
├── package.json
├── LICENSE
└── README.md
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE) — made with ❤️
