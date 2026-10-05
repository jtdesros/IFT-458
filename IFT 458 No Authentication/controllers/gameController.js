const Game = require('../models/gameModel');
const pick = require('../utils/pick');

const GAME_FIELDS = ['title', 'developer', 'genre', 'description', 'platform', 'status', 'submittedBy'];

// GET /api/v1/games
exports.getGames = async (req, res) => {
  const games = await Game.find().sort('-createdAt');
  res.status(200).json({ status: 'success', results: games.length, data: { games } });
};

// GET /api/v1/games/:id
exports.getGame = async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (!game) return res.status(404).json({ status: 'fail', message: 'Game not found.' });
  res.status(200).json({ status: 'success', data: { game } });
};

// POST /api/v1/games
exports.createGame = async (req, res) => {
  const game = await Game.create(pick(req.body, GAME_FIELDS));
  res.status(201).json({ status: 'success', data: { game } });
};

// PATCH /api/v1/games/:id  - ZERO AUTHORIZATION: anyone can edit any game
exports.updateGame = async (req, res) => {
  const game = await Game.findByIdAndUpdate(req.params.id, pick(req.body, GAME_FIELDS), {
    returnDocument: 'after', // return the updated document, not the old one
    runValidators: true
  });
  if (!game) return res.status(404).json({ status: 'fail', message: 'Game not found.' });
  res.status(200).json({ status: 'success', data: { game } });
};

// DELETE /api/v1/games/:id  - ZERO AUTHORIZATION: anyone can delete any game
exports.deleteGame = async (req, res) => {
  const game = await Game.findByIdAndDelete(req.params.id);
  if (!game) return res.status(404).json({ status: 'fail', message: 'Game not found.' });
  res.status(204).send();
};
