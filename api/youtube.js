// api/youtube.js
const axios = require('axios');
const channels = require('./channels');
require('dotenv').config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

if (!API_KEY) {
  console.error('ERROR: YOUTUBE_API_KEY missing in .env');
  process.exit(1);
}

function monthsBetween(start, end) {
  const ms = end.getTime() - start.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / 30.4;
}

async function fetchChannelStats() {
  if (!channels.length) return [];

  const batchSize = 50;
  const now = new Date();
  const results = [];

  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    const params = {
      part: 'snippet,statistics',
      id: batch.join(','),
      key: API_KEY,
      maxResults: 50,
    };

    const res = await axios.get(`${YT_BASE}/channels`, { params });
    const items = res.data.items || [];

    for (const item of items) {
      const id = item.id;
      const title = item.snippet?.title || 'Unknown';
      const publishedAt = item.snippet?.publishedAt;
      const stats = item.statistics || {};
      const subs = parseInt(stats.subscriberCount || '0', 10);
      const videos = parseInt(stats.videoCount || '0', 10);

      let ageMonths = 0;
      let subsPerMonth = 0;
      if (publishedAt) {
        const createdDate = new Date(publishedAt);
        ageMonths = monthsBetween(createdDate, now);
        if (ageMonths > 0) {
          subsPerMonth = subs / ageMonths;
        }
      }

      const subsPerVideo = videos > 0 ? subs / videos : 0;

      results.push({
        id,
        title,
        subs,
        videos,
        publishedAt,
        ageMonths,
        subsPerMonth,
        subsPerVideo,
        url: `https://www.youtube.com/channel/${id}`,
        thumbnail:
          item.snippet?.thumbnails?.default?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.high?.url ||
          '',
      });
    }
  }

  return results;
}

module.exports = { fetchChannelStats };
