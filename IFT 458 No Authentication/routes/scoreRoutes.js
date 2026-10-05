const express = require('express');
const scoreController = require('../controllers/scoreController');

const router = express.Router();

// As with games: not one guard anywhere. Compare with Level 2 and Level 3.
router.route('/').get(scoreController.getScores).post(scoreController.createScore);

router
  .route('/:id')
  .get(scoreController.getScore)
  .patch(scoreController.updateScore)
  .delete(scoreController.deleteScore);

module.exports = router;
