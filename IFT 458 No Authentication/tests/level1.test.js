require('./helpers'); // must be first: sets env + in-memory DB

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app')(); // app.js exports a factory: createApp(logger)
const User = require('../models/userModel');
const Game = require('../models/gameModel');

const alice = {
  name: 'Alice',
  email: 'alice@ift458.test',
  password: 'password12345',
  passwordConfirmation: 'password12345'
};

describe('Level 1 - authentication (signup + login)', () => {
  test('signup stores a bcrypt hash, never the plain password', async () => {
    const res = await request(app).post('/api/v1/users/signup').send(alice);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.password, undefined, 'password must never be returned');

    const saved = await User.findOne({ email: alice.email }).select('+password').lean();
    assert.notEqual(saved.password, alice.password);
    assert.match(saved.password, /^\$2[aby]\$/); // bcrypt hash prefix
    assert.equal(saved.passwordConfirmation, undefined);
  });

  test('signup rejects a mismatched password confirmation', async () => {
    const res = await request(app)
      .post('/api/v1/users/signup')
      .send({ ...alice, passwordConfirmation: 'different-password' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Passwords do not match/);
  });

  test('signup rejects a duplicate email with 409', async () => {
    await User.create(alice);
    const res = await request(app).post('/api/v1/users/signup').send(alice);
    assert.equal(res.status, 409);
  });

  test('login succeeds with the right password', async () => {
    await User.create(alice);
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({ email: alice.email, password: alice.password });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.email, alice.email);
  });

  test('login gives the SAME error for a wrong password and an unknown email', async () => {
    await User.create(alice);
    const wrongPassword = await request(app)
      .post('/api/v1/users/login')
      .send({ email: alice.email, password: 'nope-nope-nope' });
    const unknownEmail = await request(app)
      .post('/api/v1/users/login')
      .send({ email: 'ghost@ift458.test', password: 'whatever123' });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });

  test('login blocks NoSQL-injection objects in the email field', async () => {
    await User.create(alice);
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({ email: { $gt: '' }, password: alice.password });
    assert.equal(res.status, 401);
  });
});

describe('Level 1 - ZERO authorization (these tests document the weakness)', () => {
  test('a successful login returns NO cookie and NO token', async () => {
    await User.create(alice);
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({ email: alice.email, password: alice.password });
    assert.equal(res.headers['set-cookie'], undefined);
    assert.equal(res.body.token, undefined);
  });

  test('an anonymous client can edit and delete anyone\'s game', async () => {
    const game = await Game.create({
      title: 'Hollow Knight',
      developer: 'Team Cherry',
      description: 'Mine!',
      submittedBy: 'Alice'
    });

    const edit = await request(app).patch(`/api/v1/games/${game._id}`).send({ submittedBy: 'Mallory' });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.data.game.submittedBy, 'Mallory');

    const del = await request(app).delete(`/api/v1/games/${game._id}`);
    assert.equal(del.status, 204);
    assert.equal(await Game.countDocuments(), 0);
  });
});

describe('Level 1 - API plumbing', () => {
  test('an invalid game id returns 400, not a crash', async () => {
    const res = await request(app).get('/api/v1/games/not-an-id');
    assert.equal(res.status, 400);
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/v1/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.status, 'fail');
  });

  test('Swagger UI is served at /api-docs', async () => {
    const res = await request(app).get('/api-docs/');
    assert.equal(res.status, 200);
    assert.match(res.text, /swagger-ui/i);
  });
});
