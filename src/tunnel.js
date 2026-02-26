const { execSync, spawn } = require('child_process');

let tunnelId = null;
let tunnelProc = null;

async function startTunnel(port) {
  console.log('[termbeam] Starting devtunnel...');
  try {
    try {
      execSync('devtunnel user show', { stdio: 'pipe' });
    } catch {
      console.log('[termbeam] devtunnel not logged in, launching login...');
      execSync('devtunnel user login -g', { stdio: 'inherit' });
    }

    const createOut = execSync('devtunnel create --expiration 1d --json', { encoding: 'utf-8' });
    const tunnelData = JSON.parse(createOut);
    tunnelId = tunnelData.tunnel.tunnelId;

    execSync(`devtunnel port create ${tunnelId} -p ${port} --protocol http`, { stdio: 'pipe' });
    execSync(`devtunnel access create ${tunnelId} -p ${port} --anonymous`, { stdio: 'pipe' });

    const hostProc = spawn('devtunnel', ['host', tunnelId], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    });
    tunnelProc = hostProc;

    return new Promise((resolve) => {
      let output = '';
      const timeout = setTimeout(() => resolve(null), 15000);

      hostProc.stdout.on('data', (data) => {
        output += data.toString();
        const match = output.match(/(https:\/\/[^\s]+devtunnels\.ms[^\s]*)/);
        if (match) {
          clearTimeout(timeout);
          resolve(match[1]);
        }
      });
      hostProc.stderr.on('data', (data) => {
        output += data.toString();
      });
      hostProc.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  } catch (e) {
    console.error(`[termbeam] Tunnel error: ${e.message}`);
    return null;
  }
}

function cleanupTunnel() {
  if (tunnelId) {
    try {
      if (tunnelProc) tunnelProc.kill();
      execSync(`devtunnel delete ${tunnelId} -f`, { stdio: 'pipe' });
      console.log('[termbeam] Tunnel cleaned up');
    } catch {
      /* best effort */
    }
    tunnelId = null;
    tunnelProc = null;
  }
}

module.exports = { startTunnel, cleanupTunnel };
