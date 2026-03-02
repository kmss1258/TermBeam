#!/usr/bin/env node
const os = require('os');
const path = require('path');
const readline = require('readline');
const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const { WebSocketServer } = require('ws');
const { generate: generateQR } = require('lean-qr');

const { parseArgs } = require('./cli');
const { createAuth } = require('./auth');
const { SessionManager } = require('./sessions');
const { setupRoutes, cleanupUploadedFiles } = require('./routes');
const { setupWebSocket } = require('./websocket');
const { startTunnel, cleanupTunnel, findDevtunnel } = require('./tunnel');
const { createPreviewProxy } = require('./preview');

// --- Helpers ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function confirmPublicTunnel() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('  Do you want to continue with public access? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

/**
 * Create a TermBeam server instance without starting it.
 * @param {object} [overrides] - Optional overrides
 * @param {object} [overrides.config] - Full config object (skips parseArgs)
 * @returns {{ app, server, wss, sessions, config, auth, start, shutdown }}
 */
function createTermBeamServer(overrides = {}) {
  const config = overrides.config || parseArgs();
  const log = require('./logger');
  if (config.logLevel) log.setLevel(config.logLevel);
  const auth = createAuth(config.password);
  const sessions = new SessionManager();

  // --- Express ---
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, res, next) => {
    // Don't apply TermBeam's security headers to proxied preview content
    if (req.path.startsWith('/preview/')) return next();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self' ws: wss: https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net",
    );
    next();
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1 * 1024 * 1024 });

  const state = { shareBaseUrl: null };
  app.use('/preview', auth.middleware, createPreviewProxy());
  setupRoutes(app, { auth, sessions, config, state });
  setupWebSocket(wss, { auth, sessions });

  // --- Lifecycle ---
  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    sessions.shutdown();
    cleanupUploadedFiles();
    cleanupTunnel();
    server.close();
    wss.close();
  }

  async function start() {
    // If tunnel mode is on but devtunnel is missing, offer to install it
    if (config.useTunnel && !findDevtunnel()) {
      const { promptInstall } = require('./devtunnel-install');
      const installed = await promptInstall();
      if (!installed) {
        log.error('❌ DevTunnel CLI is not available.');
        log.error('');
        log.error('  Use --no-tunnel for LAN-only mode, or install manually:');
        log.error('    Windows:  winget install Microsoft.devtunnel');
        log.error('    macOS:    brew install --cask devtunnel');
        log.error('    Linux:    curl -sL https://aka.ms/DevTunnelCliInstall | bash');
        log.error('');
        log.error(
          '  Docs: https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started',
        );
        log.error('');
        process.exit(1);
      }
    }

    // Warn and require consent for public tunnel access
    if (config.useTunnel && config.publicTunnel) {
      const rd = '\x1b[31m';
      const yl = '\x1b[33m';
      const rs = '\x1b[0m';
      const bd = '\x1b[1m';
      console.log('');
      console.log(`  ${rd}${bd}⚠️  DANGER: Public tunnel access requested${rs}`);
      console.log('');
      console.log(`  ${yl}This will make your terminal accessible to ANYONE with the URL.${rs}`);
      console.log(`  ${yl}No Microsoft login will be required to reach the tunnel.${rs}`);
      console.log(`  ${yl}Only the TermBeam password will protect your terminal.${rs}`);
      console.log('');
      const confirmed = await confirmPublicTunnel();
      if (!confirmed) {
        console.log('');
        console.log('  Aborted. Restart without --public for private access.');
        console.log('');
        process.exit(1);
      }
    }

    return new Promise((resolve) => {
      server.listen(config.port, config.host, async () => {
        const ip = getLocalIP();
        const localUrl = `http://${ip}:${config.port}`;

        const defaultId = sessions.create({
          name: path.basename(config.cwd),
          shell: config.shell,
          args: config.shellArgs,
          cwd: config.cwd,
        });

        const lp = '\x1b[38;5;141m'; // light purple
        const rs = '\x1b[0m'; // reset
        console.log('');
        console.log(
          `${lp}  ████████╗███████╗██████╗ ███╗   ███╗██████╗ ███████╗ █████╗ ███╗   ███╗${rs}`,
        );
        console.log(
          `${lp}  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔══██╗██╔════╝██╔══██╗████╗ ████║${rs}`,
        );
        console.log(
          `${lp}     ██║   █████╗  ██████╔╝██╔████╔██║██████╔╝█████╗  ███████║██╔████╔██║${rs}`,
        );
        console.log(
          `${lp}     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║${rs}`,
        );
        console.log(
          `${lp}     ██║   ███████╗██║  ██║██║ ╚═╝ ██║██████╔╝███████╗██║  ██║██║ ╚═╝ ██║${rs}`,
        );
        console.log(
          `${lp}     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝${rs}`,
        );
        console.log('');
        console.log(`  Beam your terminal to any device 📡  v${config.version}`);
        console.log('');
        const isLanReachable =
          config.host === '0.0.0.0' || config.host === '::' || config.host === ip;
        state.shareBaseUrl = isLanReachable ? localUrl : `http://localhost:${config.port}`;
        const gn = '\x1b[38;5;114m'; // green
        const dm = '\x1b[2m'; // dim

        const bl = '\x1b[38;5;75m'; // light blue

        let publicUrl = null;
        if (config.useTunnel) {
          const tunnel = await startTunnel(config.port, {
            persisted: config.persistedTunnel,
            anonymous: config.publicTunnel,
          });
          if (tunnel) {
            publicUrl = tunnel.url;
            state.shareBaseUrl = publicUrl;
          } else {
            console.log('  ⚠️  Tunnel failed to start. Using LAN only.');
          }
        }

        console.log(`  Shell:    ${config.shell}`);
        console.log(`  Session:  ${defaultId}`);
        console.log(`  Auth:     ${config.password ? `${gn}🔒 password${rs}` : '🔓 none'}`);
        if (isLanReachable) {
          console.log(`  Bind:     ${config.host} (LAN accessible)`);
        } else {
          console.log(`  Bind:     ${config.host} (localhost only)`);
        }
        console.log('');

        if (publicUrl) {
          console.log(`  Public:   ${bl}${publicUrl}${rs}`);
        }
        console.log(`  Local:    http://localhost:${config.port}`);
        if (isLanReachable) {
          console.log(`  LAN:      ${localUrl}`);
        }

        const qrUrl = publicUrl || (isLanReachable ? localUrl : `http://localhost:${config.port}`);
        const qrDisplayUrl = qrUrl; // clean URL shown in console text
        const qrCodeUrl = config.password ? `${qrUrl}?ott=${auth.generateShareToken()}` : qrUrl;
        console.log('');
        try {
          const code = generateQR(qrCodeUrl);
          const size = code.size;
          const margin = 1;
          let qr = '';
          for (let y = -margin; y < size + margin; y += 2) {
            let line = '';
            for (let x = -margin; x < size + margin; x++) {
              const top = y >= 0 && y < size && x >= 0 && x < size && code.get(x, y);
              const btm = y + 1 >= 0 && y + 1 < size && x >= 0 && x < size && code.get(x, y + 1);
              if (top && btm) line += '\u2588';
              else if (top) line += '\u2580';
              else if (btm) line += '\u2584';
              else line += ' ';
            }
            qr += '  ' + line + '\n';
          }
          console.log(qr);
        } catch {
          /* ignore */
        }

        console.log(`  Scan the QR code or open: ${bl}${qrDisplayUrl}${rs}`);
        if (config.password) console.log(`  Password: ${gn}${config.password}${rs}`);
        console.log('');

        resolve({ url: `http://localhost:${config.port}`, defaultId });
      });
    });
  }

  return { app, server, wss, sessions, config, auth, start, shutdown };
}

module.exports = { createTermBeamServer };

// Auto-start when run directly (CLI entry point)
const _entryBase = path.basename(process.argv[1] || '');
if (require.main === module || _entryBase === 'termbeam' || _entryBase === 'termbeam.js') {
  const instance = createTermBeamServer();

  process.on('SIGINT', () => {
    console.log('\n[termbeam] Shutting down...');
    instance.shutdown();
    setTimeout(() => process.exit(0), 500).unref();
  });
  process.on('SIGTERM', () => {
    console.log('\n[termbeam] Shutting down...');
    instance.shutdown();
    setTimeout(() => process.exit(0), 500).unref();
  });
  process.on('uncaughtException', (err) => {
    console.error('[termbeam] Uncaught exception:', err.message);
    cleanupTunnel();
    process.exit(1);
  });

  instance.start();
}
