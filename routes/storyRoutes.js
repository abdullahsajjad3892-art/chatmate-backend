const express = require('express');
const router = express.Router();
const {
  createStory,
  getStoriesFeed,
  likeStory,
  dislikeStory,
  getStoryReactions,
} = require('../controllers/storyController');

router.post('/create', createStory);
router.get('/feed', getStoriesFeed);
router.post('/like', likeStory);
router.post('/dislike', dislikeStory);
router.get('/reactions/:story_id', getStoryReactions);

module.exports = router;