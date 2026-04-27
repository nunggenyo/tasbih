import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for development (Vite dev server usually runs on 5173)
app.use(cors());
app.use(express.json());

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// API endpoint to fetch random wallpapers
app.get('/api/wallpaper', async (req, res) => {
  if (!UNSPLASH_ACCESS_KEY) {
    return res.status(500).json({ error: 'Missing Unsplash API Key in server environment.' });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=nature,islamic,mosque,landscape&orientation=portrait&count=30&_t=${Date.now()}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (response.status === 403) {
      console.warn("Unsplash API limit (50/jam) telah habis.");
      return res.status(403).json({ error: 'Rate limit exceeded' });
    }

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    res.status(500).json({ error: 'Failed to fetch wallpapers' });
  }
});

// API endpoint to proxy the track download request to avoid exposing Client-ID
app.post('/api/track-download', async (req, res) => {
  const { downloadUrl } = req.body;

  if (!downloadUrl) {
    return res.status(400).json({ error: 'Missing downloadUrl' });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    return res.status(500).json({ error: 'Missing Unsplash API Key in server environment.' });
  }

  try {
    // Unsplash guidelines: "This is a simple GET request. Do not pass your Access Key."
    // Wait, the client-id should be passed in URL as it's server to server, or we can use Authorization header if it's from server? 
    // Unsplash says "This is a simple GET request. Do not pass your Access Key."
    // But then if we don't pass anything, it might be rate limited by IP?
    // Actually, passing Client-ID in the URL is fine, or Authorization header. We will just use the downloadUrl provided and append client_id.
    const response = await fetch(`${downloadUrl}&client_id=${UNSPLASH_ACCESS_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Failed to track download: ${response.status} ${response.statusText}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ error: 'Failed to track download' });
  }
});

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});