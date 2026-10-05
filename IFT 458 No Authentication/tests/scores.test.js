require('./helpers');

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app')();
const Score = require('../models/scoreModel');

const score = { gameTitle: 'Hollow Knight', points: 128400, playerEmail: 'player1@ift458.test' };

describe('Level 1 - scores', () => {
  test('anyone can submit a score, and it starts as submitted', async () => {
    const res = await request(app).post('/api/v1/scores').send(score);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.score.status, 'submitted');
    assert.equal(res.body.data.score.points, 128400);
    assert.ok(res.body.data.score.playedAt, 'playedAt defaults to now');
    assert.equal(res.body.data.score.verifiedAt, null, 'nothing is verified on arrival');
  });

  test('a score needs a game title, a points value and a valid player email', async () => {
    assert.equal((await request(app).post('/api/v1/scores').send({ gameTitle: 'x' })).status, 400);
    assert.equal((await request(app).post('/api/v1/scores').send({ ...score, playerEmail: 'nope' })).status, 400);
  });

  test('points must be a whole, non-negative, plausible number', async () => {
    for (const points of [-1, 3.5, 100000001]) {
      const res = await request(app).post('/api/v1/scores').send({ ...score, points });
      assert.equal(res.status, 400, `points ${points} should be rejected`);
    }
  });

  test('anyone can list, read, edit and delete any score (the Level 1 weakness)', async () => {
    const created = await Score.create(score);
    assert.equal((await request(app).get('/api/v1/scores')).status, 200);
    assert.equal((await request(app).get(`/api/v1/scores/${created._id}`)).status, 200);

    // Nothing stops a stranger marking their own claim "verified"
    const patched = await request(app).patch(`/api/v1/scores/${created._id}`).send({ status: 'verified' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.score.status, 'verified');

    assert.equal((await request(app).delete(`/api/v1/scores/${created._id}`)).status, 204);
  });

  test('an unknown status is rejected', async () => {
    const res = await request(app).post('/api/v1/scores').send({ ...score, status: 'world-record' });
    assert.equal(res.status, 400);
  });
});
