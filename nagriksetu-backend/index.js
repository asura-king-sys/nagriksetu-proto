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

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- Database Connection using .env ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Verify connection
pool.query('SELECT NOW()', (err) => {
  if (err) console.error('❌ DB Connection Error:', err.message);
  else console.log('🐘 PostgreSQL Connected: Table "civic_tickets" ready.');
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- API Routes ---

app.post('/api/report', upload.single('image'), async (req, res) => {
  try {
    // Note: description in the DB stores the address string from the frontend
    const { category, description, lat, lng } = req.body;
    const image_path = req.file ? req.file.filename : null;

    if (!image_path) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Insert query matching your db.sql columns
    const query = `
      INSERT INTO civic_tickets (category, description, lat, lng, image_path)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    
    // Convert lat/lng to numbers to match DOUBLE PRECISION in Postgres
    const values = [category, description, parseFloat(lat), parseFloat(lng), image_path];
    
    const result = await pool.query(query, values);

    console.log("✅ Report Logged:", result.rows[0]);

    res.status(200).json({
      message: "Success",
      id: result.rows[0].id
    });

  } catch (error) {
    console.error("❌ Database Error:", error.message);
    res.status(500).json({ error: "Database insertion failed" });
  }
});

// Fetch all reports to show on the map and dashboard
app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM civic_tickets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});