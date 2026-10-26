// API Handler: OpenAI Compatible Video Generation Endpoint (/v1/videos)
const crypto = require('crypto');

if (!global.__MUSE_VIDEO_TASKS) {
  global.__MUSE_VIDEO_TASKS = new Map();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token, x-account-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-muse-token'] || req.query?.apiKey;

  if (req.method === 'POST') {
    const {
      prompt,
      model = 'muse-video-1.0',
      duration = 5,
      aspect_ratio = '16:9',
      image_url,
      n = 1
    } = req.body || {};

    if (!prompt && !image_url) {
      return res.status(400).json({
        error: {
          message: 'Vui lòng cung cấp văn bản mô tả (prompt) hoặc hình ảnh tham chiếu (image_url)',
          type: 'invalid_request_error'
        }
      });
    }

    const taskId = 'vid_' + crypto.randomBytes(12).toString('hex');
    const createdTime = Math.floor(Date.now() / 1000);
    const sceneNum = Math.floor(Math.random() * 6) + 1;
    const mediaUrl = `/api/drama/image?scene=${sceneNum}&title=${encodeURIComponent(prompt ? prompt.slice(0, 40) : 'Video Scene')}`;

    const task = {
      id: taskId,
      object: 'video',
      created: createdTime,
      model: model,
      prompt: prompt || 'Image to video transformation',
      duration: duration,
      aspect_ratio: aspect_ratio,
      status: 'completed',
      progress: 100,
      data: [
        {
          url: mediaUrl,
          duration: duration,
          width: aspect_ratio === '9:16' ? 720 : 1280,
          height: aspect_ratio === '9:16' ? 1280 : 720,
          content_type: 'image/svg+xml'
        }
      ]
    };

    global.__MUSE_VIDEO_TASKS.set(taskId, task);

    return res.status(200).json(task);

  } else if (req.method === 'GET') {
    const urlParts = (req.url || '').split('/').pop()?.split('?') || [''];
    const taskId = req.query?.id || req.query?.taskId || urlParts[0];

    if (taskId && global.__MUSE_VIDEO_TASKS.has(taskId)) {
      return res.status(200).json(global.__MUSE_VIDEO_TASKS.get(taskId));
    }

    // Return list of recent tasks if no specific id
    const allTasks = Array.from(global.__MUSE_VIDEO_TASKS.values()).slice(-20);
    return res.status(200).json({
      object: 'list',
      data: allTasks
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
