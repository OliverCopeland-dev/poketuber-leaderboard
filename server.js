// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { fetchChannelStats } = require('./api/youtube'); // from youtube.js

const app = express();
const PORT = process.env.PORT || 3000;

let cachedData = null;    // will hold { stats, lastFetch }
let lastFetch = 0;        // timestamp (ms since epoch)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for channel stats
app.get('/api/stats', async (req, res) => {
  try {
    const now = Date.now();

    // If cache is still fresh, return it without calling YouTube
    if (cachedData && now - lastFetch < CACHE_TTL_MS) {
      return res.json(cachedData);
    }

    // Otherwise, fetch fresh stats from YouTube
    const stats = await fetchChannelStats();

    lastFetch = now;
    cachedData = {
      stats,
      lastFetch, // store timestamp in ms
    };

    res.json(cachedData);
  } catch (err) {
    console.error('Error in /api/stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Pokétuber Leaderboard running on http://localhost:${PORT}`);
});
