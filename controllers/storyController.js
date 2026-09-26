const Story = require('../models/Story');
const Contact = require('../models/Contact');
const User = require('../models/User');

// CREATE STORY (24 hours expiry)
exports.createStory = async (req, res) => {
  const { user_id, content_text, background_color } = req.body;

  if (!user_id || !content_text) {
    return res.status(400).json({ success: false, message: 'user_id and content_text are required' });
  }

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const story = await Story.create({
      user_id,
      content_text,
      background_color: background_color || '#128C7E',
      expires_at: expiresAt,
    });

    res.status(201).json({ success: true, message: 'Story posted successfully', story });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// GET STORIES FEED (apni + contacts ki stories, grouped by user)
exports.getStoriesFeed = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id is required' });
  }

  try {
    // Apne contacts ki list nikalein
    const contacts = await Contact.find({ user_id }).select('contact_user_id');
    const contactIds = contacts.map((c) => c.contact_user_id);

    // Apni aur contacts ki dono ki stories (jo expire nahi hui)
    const allUserIds = [...contactIds, user_id];

    const stories = await Story.find({
      user_id: { $in: allUserIds },
      expires_at: { $gt: new Date() },
    })
      .populate('user_id', 'name')
      .sort({ created_at: -1 });

    // User ke hisab se group karein
    const grouped = {};
    stories.forEach((story) => {
      const uid = story.user_id._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user_id: uid,
          user_name: story.user_id.name,
          is_mine: uid === user_id,
          stories: [],
        };
      }
      grouped[uid].stories.push({
        id: story._id,
        content_text: story.content_text,
        background_color: story.background_color,
        created_at: story.created_at,
        expires_at: story.expires_at,
        likes_count: story.likes.length,
        dislikes_count: story.dislikes.length,
      });
    });

    res.status(200).json({ success: true, feed: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// LIKE STORY
exports.likeStory = async (req, res) => {
  const { story_id, user_id } = req.body;

  try {
    const story = await Story.findById(story_id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Pehle dislike hata dein agar tha
    story.dislikes = story.dislikes.filter((d) => d.user_id.toString() !== user_id);

    // Agar pehle se like nahi kiya, to add karein
    const alreadyLiked = story.likes.some((l) => l.user_id.toString() === user_id);
    if (!alreadyLiked) {
      story.likes.push({ user_id });
    }

    await story.save();
    res.status(200).json({ success: true, message: 'Story liked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// DISLIKE STORY
exports.dislikeStory = async (req, res) => {
  const { story_id, user_id } = req.body;

  try {
    const story = await Story.findById(story_id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    story.likes = story.likes.filter((l) => l.user_id.toString() !== user_id);

    const alreadyDisliked = story.dislikes.some((d) => d.user_id.toString() === user_id);
    if (!alreadyDisliked) {
      story.dislikes.push({ user_id });
    }

    await story.save();
    res.status(200).json({ success: true, message: 'Story disliked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// GET REACTIONS FOR A STORY (kis ne like/dislike kiya, apni story ke liye)
exports.getStoryReactions = async (req, res) => {
  const { story_id } = req.params;

  try {
    const story = await Story.findById(story_id)
      .populate('likes.user_id', 'name')
      .populate('dislikes.user_id', 'name');

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const likes = story.likes.map((l) => ({ name: l.user_id.name, reacted_at: l.reacted_at }));
    const dislikes = story.dislikes.map((d) => ({ name: d.user_id.name, reacted_at: d.reacted_at }));

    res.status(200).json({ success: true, likes, dislikes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

module.exports = exports;