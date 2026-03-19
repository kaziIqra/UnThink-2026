const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function copyPath(sourceRelative, targetRelative = sourceRelative) {
  const source = path.join(rootDir, sourceRelative);
  const target = path.join(distDir, targetRelative);
  fs.cpSync(source, target, { recursive: true });
}

cleanDist();
copyPath('index.html');
copyPath('script.js');
copyPath('assets');

console.log('Built output in dist/');
