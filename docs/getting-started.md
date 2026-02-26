# Getting Started

## Prerequisites

- **Node.js** 18 or higher
- A terminal (macOS, Linux, or Windows with WSL)

## Installation

### Quick Run (no install)

```bash
npx termbeam
```

### Global Install

```bash
npm install -g termbeam
termbeam
```

## First Run

1. Start TermBeam with a password:

   ```bash
   termbeam --generate-password
   ```

2. You'll see output like:

   ```
   Generated password: xK9mP2vL8nQ4wR7j

     ████████╗███████╗██████╗ ███╗   ███╗██████╗ ███████╗ █████╗ ███╗   ███╗
     ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔══██╗██╔════╝██╔══██╗████╗ ████║
        ██║   █████╗  ██████╔╝██╔████╔██║██████╔╝█████╗  ███████║██╔████╔██║
        ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║
        ██║   ███████╗██║  ██║██║ ╚═╝ ██║██████╔╝███████╗██║  ██║██║ ╚═╝ ██║
        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝

     Beam your terminal to any device 📡

     Local:    http://localhost:3456
     LAN:      http://192.168.1.42:3456
     Shell:    /bin/zsh
     Session:  a1b2c3d4
     Auth:     🔒 password

     Scan the QR code or open: http://192.168.1.42:3456
     Password: xK9mP2vL8nQ4wR7j
   ```

3. **On your phone:** Scan the QR code or type the LAN URL
4. **Enter the password** when prompted
5. You're connected! 🎉

## Creating Sessions

- The default session uses your current shell and working directory
- Tap **+ New Session** to create additional sessions
- Use the **📂 folder browser** to pick a working directory
- **Swipe left** on a session to delete it

## Touch Controls

The bottom touch bar provides quick access to:

| Button  | Key                |
| ------- | ------------------ |
| ↑ ↓ ← → | Arrow keys         |
| Tab     | Tab completion     |
| Enter   | Return             |
| Esc     | Escape             |
| ^C      | Ctrl+C (interrupt) |
| ^D      | Ctrl+D (EOF)       |
| ^Z      | Ctrl+Z (suspend)   |
| ^L      | Ctrl+L (clear)     |
| A+ / A- | Zoom in/out        |
