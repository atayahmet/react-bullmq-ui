const fs = require('fs');
const path = require('path');

// Get the project root directory (one level up from scripts folder)
const rootDir = path.join(__dirname, '..');

// Ensure dist directory exists
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy CSS file to dist directory
const sourceCssPath = path.join(rootDir, 'src', 'index.css');
const targetCssPath = path.join(rootDir, 'dist', 'index.css');

try {
  fs.copyFileSync(sourceCssPath, targetCssPath);
  console.log('CSS file successfully copied to dist folder');
} catch (err) {
  console.error('Error copying CSS file:', err);
  process.exit(1);
}