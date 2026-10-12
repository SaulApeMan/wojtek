import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer, handleRequest } from '../server.mjs';

test('local server serves browser modules and refuses non-app files', async () => {
  // Exercise the real HTTP handler without requiring local socket permission.
  const request = async (resource, method = 'GET') => {
    const response = { status: null, headers: {}, body: '' };
    await handleRequest({ url: resource, method }, {
      writeHead(status, headers) { response.status = status; response.headers = Object.fromEntries(Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), value])); },
      end(body) { response.body = body === undefined ? '' : body.toString(); },
    });
    return response;
  };
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(page.body, /Survey Lab/);
  assert.match(page.headers['content-security-policy'], /connect-src 'none'/);
  for (const asset of ['/styles.css', '/app.js', '/grader.js']) assert.equal((await request(asset)).status, 200);
  for (const forbidden of ['/package.json', '/.git/config', '/../package.json', '/%2e%2e%2fpackage.json', '/missing', '/%ZZ']) {
    assert.notEqual((await request(forbidden)).status, 200);
  }
  assert.equal((await request('/', 'POST')).status, 405);
  assert.equal((await request('/', 'HEAD')).body, '');
});

test('the HTTP server responds through a real loopback connection', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await new Promise((resolve, reject) => {
    const request = http.get({ hostname: '127.0.0.1', port: server.address().port, path: '/' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    request.on('error', reject);
  });
  assert.equal(response.status, 200);
  assert.match(response.body, /Survey Lab/);
});
