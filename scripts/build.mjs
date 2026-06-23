import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/src', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
cpSync('src', 'dist/src', { recursive: true });
console.log('Static build generated in dist/');
