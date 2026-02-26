const path = require('path');
const { execSync } = require('child_process');

function getVersion() {
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  const base = pkg.version;

  // If installed via npm (global or npx), use the package version as-is
  if (process.env.npm_package_version || isInstalledGlobally()) {
    return base;
  }

  // Running from source — try git describe for a dev version
  try {
    const gitDesc = execSync('git describe --tags --always --dirty', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    // If we have a tag like v1.0.0, and we're exactly on it, return base
    if (gitDesc === `v${base}`) return base;
    // Otherwise return dev version
    return `${base}-dev (${gitDesc})`;
  } catch {
    return `${base}-dev`;
  }
}

function isInstalledGlobally() {
  // Check if we're running from a node_modules path (npm/npx install)
  return __dirname.includes('node_modules');
}

module.exports = { getVersion };
