// Check the actual server lifecycle in a clean folder, never the instructor's .env.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { MongoMemoryServer } = require('mongodb-memory-server');

const root = path.resolve(__dirname, '..');
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ift458-startup-'));
  for (const name of ['server.js', 'app.js', 'SwaggerTFT458.js', 'controllers', 'models', 'routes', 'middleware', 'utils', 'dev-data']) {
    fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  }
  return dir;
}
function run(dir, database, port, args = ['server.js']) {
  const child = spawn(process.execPath, args, {
    cwd: dir,
    env: { ...process.env, NODE_PATH: path.join(root, 'node_modules'), DATABASE: database,
      PORT: String(port), API_VERSION: '/api/v1', LOG_GEO: 'false', BCRYPT_ROUNDS: '4',
      STUDENT_NAME: 'Package Test', STUDENT_ID: '0000000000' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  return { child, output: () => output, exited: once(child, 'exit') };
}

test('missing configuration reports guidance rather than a TypeError', async () => {
  const dir = fixture();
  try {
    for (const args of [['server.js'], ['dev-data/seed.js', '--import']]) {
      const proc = run(dir, '', 0, args);
      const [code] = await proc.exited;
      assert.equal(code, 1);
      assert.match(proc.output(), /DATABASE is not set/);
      assert.doesNotMatch(proc.output(), /TypeError/);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('student task sequence writes 8/8 coverage and a valid checksum on shutdown', { timeout: 60000 }, async () => {
  const mongo = await MongoMemoryServer.create();
  const dir = fixture();
  let proc;
  try {
    const socket = net.createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    proc = run(dir, mongo.getUri(), port);
    for (let n = 0; n < 200 && !proc.output().includes('Swagger:'); n++) {
      if (proc.child.exitCode !== null) throw new Error(proc.output());
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.match(proc.output(), /DB connection successful/);
    async function request(method, route, expected, body) {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1${route}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body)
      });
      assert.equal(res.status, expected, `${method} ${route}`);
      return res.status === 204 ? null : res.json();
    }
    const user = { name: 'Student One', email: 'student.one@ift458.test', password: 'password12345', passwordConfirmation: 'password12345' };
    for (let n = 0; n < 3; n++) {
      await request('POST', '/users/signup', 201, { ...user, email: `student.${n}@ift458.test` });
      await request('POST', '/scores', 201, { gameTitle: `Game ${n}`, points: 100 + n, playerEmail: `student.${n}@ift458.test` });
    }
    await request('GET', '/scores', 200);
    const created = await request('POST', '/games', 201, { title: 'Demo', developer: 'Student', description: 'Disposable game' });
    const route = `/games/${created.data.game._id}`;
    await request('GET', '/games', 200);
    await request('GET', route, 200);
    await request('PATCH', route, 200, { title: 'Updated', submittedBy: 'Course Admin' });
    await request('DELETE', route, 204);
    await request('GET', route, 404);
    await request('POST', '/users/login', 200, { email: 'student.0@ift458.test', password: user.password });
    await request('POST', '/users/login', 401, { email: 'student.0@ift458.test', password: 'wrong' });
    await request('POST', '/users/login', 401, { email: 'unknown@ift458.test', password: 'wrong' });
    await request('POST', '/users/signup', 409, { ...user, email: 'student.0@ift458.test' });
    await request('POST', '/users/signup', 400, { ...user, password: 'abc', passwordConfirmation: 'abc' });
    proc.child.kill('SIGINT');
    const [code] = await proc.exited;
    assert.equal(code, 0, proc.output());
    const log = fs.readFileSync(path.join(dir, 'logs', 'app-latest.log'), 'utf8');
    assert.match(log, /CLO COVERAGE - 8\/8 demonstrated/);
    assert.doesNotMatch(log, /ReferenceError/);
    const marker = '# checksum sha256 of everything above: ';
    const offset = log.indexOf(marker);
    assert.ok(offset > 0);
    const expected = require('node:crypto').createHash('sha256').update(log.slice(0, offset)).digest('hex');
    assert.equal(log.slice(offset + marker.length).split('\n')[0], expected);
  } finally {
    if (proc && proc.child.exitCode === null) { proc.child.kill('SIGKILL'); await proc.exited; }
    await mongo.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
