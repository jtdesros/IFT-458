const Score = require('../models/scoreModel');
const pick = require('../utils/pick');

const SCORE_FIELDS = ['gameTitle', 'platform', 'points', 'levelReached', 'status', 'playedAt', 'verifiedAt', 'playerEmail'];

// GET /api/v1/scores
exports.getScores = async (req, res) => {
  const scores = await Score.find().sort('-points');
  res.status(200).json({ status: 'success', results: scores.length, data: { scores } });
};

// GET /api/v1/scores/:id
exports.getScore = async (req, res) => {
  const score = await Score.findById(req.params.id);
  if (!score) return res.status(404).json({ status: 'fail', message: 'Score not found.' });
  res.status(200).json({ status: 'success', data: { score } });
};

// POST /api/v1/scores  - ZERO AUTHORIZATION: anyone can borrow as anyone
exports.createScore = async (req, res) => {
  const score = await Score.create(pick(req.body, SCORE_FIELDS));
  res.status(201).json({ status: 'success', data: { score } });
};

// PATCH /api/v1/scores/:id  - ZERO AUTHORIZATION: anyone can change any score
exports.updateScore = async (req, res) => {
  const score = await Score.findByIdAndUpdate(req.params.id, pick(req.body, SCORE_FIELDS), {
    returnDocument: 'after',
    runValidators: true
  });
  if (!score) return res.status(404).json({ status: 'fail', message: 'Score not found.' });
  res.status(200).json({ status: 'success', data: { score } });
};

// DELETE /api/v1/scores/:id  - ZERO AUTHORIZATION: anyone can delete any score
exports.deleteScore = async (req, res) => {
  const score = await Score.findByIdAndDelete(req.params.id);
  if (!score) return res.status(404).json({ status: 'fail', message: 'Score not found.' });
  res.status(204).send();
};
