const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

// ZERO AUTHORIZATION - compare with Level 2, where these lines become
//   router.post('/', protect, gameController.createGame)
router.route('/').get(gameController.getGames).post(gameController.createGame);

router
  .route('/:id')
  .get(gameController.getGame)
  .patch(gameController.updateGame)
  .delete(gameController.deleteGame);

module.exports = router;
