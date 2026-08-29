import assert from 'node:assert/strict';

const baseUrl = process.env.SITE_URL?.replace(/\/$/, '');
assert.ok(baseUrl, 'Set SITE_URL to the production origin before running this check.');

async function get(path, userAgent = 'Mozilla/5.0 (compatible; NSPrepProductionCheck/1.0)') {
  return fetch(`${baseUrl}${path}`, { headers: { 'user-agent': userAgent }, redirect: 'follow' });
}

const routes = ['/', '/about', '/contact', '/privacy', '/robots.txt', '/llms.txt', '/sitemap.xml'];
for (const route of routes) {
  const response = await get(route);
  assert.equal(response.status, 200, `${route} should return HTTP 200`);
  await response.arrayBuffer();
}

const browserResponse = await get('/');
const botResponse = await get('/', 'Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.0; +https://openai.com/gptbot)');
const [browserHtml, botHtml] = await Promise.all([browserResponse.text(), botResponse.text()]);

assert.equal(browserResponse.status, 200);
assert.equal(botResponse.status, 200);
assert.equal(botHtml, browserHtml, 'GPTBot and normal browser HTML should have exact substantive parity');
assert.equal(browserResponse.headers.get('x-content-type-options'), 'nosniff');
assert.match(browserResponse.headers.get('content-security-policy') || '', /default-src 'self'/);
assert.doesNotMatch(browserResponse.headers.get('content-security-policy') || '', /unsafe-inline|unsafe-eval/);
assert.match(browserResponse.headers.get('strict-transport-security') || '', /max-age=/);
assert.match(browserResponse.headers.get('content-type') || '', /text\/html/i);
assert.match(browserHtml, /<link rel="canonical" href="https:\/\/ns-fellowship-prep\.vercel\.app\/"/);
assert.equal((browserHtml.match(/<h1\b/g) || []).length, 1);

console.log(`Production smoke passed for ${baseUrl}: ${routes.length} routes, strict headers, and exact GPTBot parity.`);
