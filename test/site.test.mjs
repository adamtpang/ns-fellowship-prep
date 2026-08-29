import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stableUrl = 'https://ns-fellowship-prep.vercel.app';

async function read(file) {
  return readFile(path.join(projectRoot, file), 'utf8');
}

test('homepage exposes complete metadata, one H1, a real CTA, and trust links', async () => {
  const html = await read('index.html');
  assert.match(html, /<title>NS Fellowship Prep — Free Readiness Checklist<\/title>/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${stableUrl.replaceAll('.', '\\.')}\/"`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="primary-cta" href="#checklist">Start the 20-point checklist/);
  for (const route of ['about', 'contact', 'privacy']) {
    assert.match(html, new RegExp(`href="\\./${route}"`));
  }
  assert.equal((html.match(/type="checkbox"/g) || []).length, 20);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.(?:js|css)/i);
});

test('structured data truthfully identifies the project, maintainer, and website', async () => {
  const html = await read('index.html');
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  assert.ok(match, 'JSON-LD block must be present');
  const data = JSON.parse(match[1]);
  const nodes = data['@graph'];
  assert.deepEqual(nodes.map((node) => node['@type']), ['Organization', 'Person', 'WebSite']);
  assert.equal(nodes[0].name, 'NS Fellowship Prep');
  assert.equal(nodes[0].url, `${stableUrl}/`);
  assert.deepEqual(nodes[0].sameAs, ['https://github.com/adamtpang/ns-fellowship-prep']);
  assert.equal(nodes[1].name, 'Adam Pang');
  assert.equal(nodes[2].isAccessibleForFree, true);
  assert.equal(nodes[2].publisher['@id'], `${stableUrl}/#organization`);
});

test('trust pages are substantive, canonical, and disclose real behavior', async () => {
  for (const page of ['about', 'contact', 'privacy']) {
    const html = await read(`${page}.html`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page} should have one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${stableUrl.replaceAll('.', '\\.')}\/${page}"`));
    assert.ok(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length >= 100, `${page} should be substantive`);
  }

  const privacy = await read('privacy.html');
  assert.match(privacy, /local storage/i);
  assert.match(privacy, /Vercel/);
  assert.match(privacy, /GitHub Pages/);
  assert.match(privacy, /does not set cookies/i);
  assert.match(privacy, /no account system, contact form, application submission, analytics tracker, advertising pixel, external embed, or backend database/i);

  const contact = await read('contact.html');
  assert.match(contact, /github\.com\/adamtpang\/ns-fellowship-prep\/issues/);
  assert.doesNotMatch(contact, /<form\b/i);
});

test('discovery files use the stable production URL and allow normal crawling', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${stableUrl.replaceAll('.', '\\.')}\/sitemap\\.xml$`, 'm'));
  assert.doesNotMatch(robots, /Disallow:\s*\//i);

  const llms = await read('llms.txt');
  assert.match(llms, /independent, free readiness checklist/i);
  assert.match(llms, /not official or affiliated/i);
  assert.match(llms, /20 preparation items across 4 stages/i);

  const sitemap = await read('sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations, [`${stableUrl}/`, `${stableUrl}/about`, `${stableUrl}/contact`, `${stableUrl}/privacy`]);
});

test('Vercel headers enforce a restrictive CSP and MIME protection', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.equal(config.outputDirectory, 'public');
  assert.equal(config.cleanUrls, true);
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.match(headers['content-security-policy'], /default-src 'self'/);
  assert.match(headers['content-security-policy'], /object-src 'none'/);
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.match(headers['content-security-policy'], /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  assert.doesNotMatch(headers['content-security-policy'], /unsafe-inline|unsafe-eval|https:\s|\*\./);
  assert.equal(headers['referrer-policy'], 'no-referrer');
});

test('source and generated public site stay byte-for-byte identical', async () => {
  for (const file of ['index.html', 'about.html', 'contact.html', 'privacy.html', 'site.css', 'app.js', 'robots.txt', 'llms.txt', 'sitemap.xml']) {
    assert.equal(await read(file), await read(path.join('public', file)), `${file} is out of sync`);
  }
});

test('keyboard focus and responsive behavior are explicit', async () => {
  const css = await read('site.css');
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.skip-link:focus/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

  const script = await read('app.js');
  assert.match(script, /aria-valuenow/);
  assert.match(script, /window\.localStorage/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
