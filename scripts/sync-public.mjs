import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'public');
const siteFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'site.css',
  'app.js',
  'robots.txt',
  'llms.txt',
  'sitemap.xml'
];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  siteFiles.map((file) => copyFile(path.join(projectRoot, file), path.join(outputDirectory, file)))
);

console.log(`Synced ${siteFiles.length} static files to public/.`);
