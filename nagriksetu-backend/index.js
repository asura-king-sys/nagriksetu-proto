import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pkg from 'pg'; 
import 'dotenv/config'; 

const { Pool } = pkg;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Haversine formula to find distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// API: Submit with De-duplication check
app.post('/api/report', upload.single('image'), async (req, res) => {
  try {
    const { category, description, lat, lng } = req.body;
    const img = req.file ? req.file.filename : null;
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    const check = await pool.query(`SELECT id, lat, lng FROM civic_tickets WHERE category = $1 AND status != 'Resolved'`, [category]);
    const duplicate = check.rows.find(r => getDistance(nLat, nLng, r.lat, r.lng) < 50);

    if (duplicate) {
        if (img) fs.unlinkSync(path.join(uploadDir, img));
        return res.status(409).json({ message: "Duplicate found", duplicateId: duplicate.id });
    }

    const result = await pool.query(
      `INSERT INTO civic_tickets (category, description, lat, lng, image_path) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category, description, nLat, nLng, img]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports', async (req, res) => {
  const result = await pool.query('SELECT * FROM civic_tickets ORDER BY upvotes DESC, created_at DESC');
  res.json(result.rows);
});

app.post('/api/report/:id/vote', async (req, res) => {
  await pool.query('UPDATE civic_tickets SET upvotes = upvotes + 1 WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

app.post('/api/report/:id/status', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE civic_tickets SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ success: true });
});

app.listen(5000, () => console.log(`🚀 Server on http://localhost:5000`));