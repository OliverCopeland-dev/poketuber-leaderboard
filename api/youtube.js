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

// Helper: compute months between two dates
function monthsBetween(start, end) {
  const ms = end.getTime() - start.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / 30.4; // rough average
}

// Helper: fetch most recent upload date from an uploads playlist
async function fetchLastUploadDate(uploadsPlaylistId) {
  if (!uploadsPlaylistId) return null;

  try {
    const res = await axios.get(`${YT_BASE}/playlistItems`, {
      params: {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 1,
        key: API_KEY,
      },
    });

    const items = res.data.items || [];
    if (!items.length) return null;

    // This field holds the upload time of the video in the playlist
    return items[0].contentDetails?.videoPublishedAt || null;
  } catch (err) {
    console.error(
      'Error fetching last upload date for playlist',
      uploadsPlaylistId,
      err.message
    );
    return null;
  }
}

async function fetchChannelStats() {
  if (!channels.length) return [];

  const batchSize = 50; // YouTube limit
  const now = new Date();
  const results = [];

  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);

    const params = {
      part: 'snippet,statistics,contentDetails', // includes uploads playlist
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

      // uploads playlist for this channel
      const uploadsPlaylistId =
        item.contentDetails?.relatedPlaylists?.uploads || null;

      // newest upload date (may be null if no videos / playlist)
      const lastUploadAt = await fetchLastUploadDate(uploadsPlaylistId);

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
        lastUploadAt, // 👈 this is what main.js uses for 😴
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
