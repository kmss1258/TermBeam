const os = require('os');
const path = require('path');
const crypto = require('crypto');

function printHelp() {
  console.log(`
termbeam — Beam your terminal to any device

Usage:
  termbeam [options] [shell] [args...]

Options:
  --password <pw>       Set access password (or TERMBEAM_PASSWORD env var)
  --generate-password   Auto-generate a secure password
  --tunnel              Create a public devtunnel URL
  --port <port>         Set port (default: 3456, or PORT env var)
  --host <addr>         Bind address (default: 0.0.0.0)
  -h, --help            Show this help
  -v, --version         Show version

Examples:
  termbeam                          Start with default shell
  termbeam --password secret        Start with password auth
  termbeam --generate-password      Start with auto-generated password
  termbeam --tunnel --password pw   Start with public tunnel
  termbeam /bin/bash                Use bash instead of default shell

Environment:
  PORT                  Server port (default: 3456)
  TERMBEAM_PASSWORD     Access password
  TERMBEAM_CWD          Working directory
`);
}

function parseArgs() {
  let port = parseInt(process.env.PORT || '3456', 10);
  let host = '0.0.0.0';
  const defaultShell = process.env.SHELL || '/bin/zsh';
  const cwd = process.env.TERMBEAM_CWD || process.env.PTY_CWD || process.cwd();
  let password = process.env.TERMBEAM_PASSWORD || process.env.PTY_PASSWORD || null;
  let useTunnel = false;

  const args = process.argv.slice(2);
  const filteredArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--password' && args[i + 1]) {
      password = args[++i];
    } else if (args[i] === '--tunnel') {
      useTunnel = true;
    } else if (args[i].startsWith('--password=')) {
      password = args[i].split('=')[1];
    } else if (args[i] === '--help' || args[i] === '-h') {
      printHelp();
      process.exit(0);
    } else if (args[i] === '--version' || args[i] === '-v') {
      const { getVersion } = require('./version');
      console.log(`termbeam v${getVersion()}`);
      process.exit(0);
    } else if (args[i] === '--generate-password') {
      password = crypto.randomBytes(16).toString('base64url');
      console.log(`Generated password: ${password}`);
    } else if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[++i];
    } else {
      filteredArgs.push(args[i]);
    }
  }

  const shell = filteredArgs[0] || defaultShell;
  const shellArgs = filteredArgs.slice(1);

  const { getVersion } = require('./version');
  const version = getVersion();

  return { port, host, password, useTunnel, shell, shellArgs, cwd, defaultShell, version };
}

module.exports = { parseArgs, printHelp };
