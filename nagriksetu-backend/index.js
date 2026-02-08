import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 5000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static folder to view uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // This ensures files go into the 'uploads' folder you created
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- API Routes ---

// Health Check
app.get('/', (req, res) => {
  res.send('NagrikSetu Backend is Running!');
});

// Report Submission Route
app.post('/api/report', upload.single('image'), (req, res) => {
  console.log("--- New Request Received ---");
  
  try {
    const { category, description, lat, lng } = req.body;

    // Check if the file was actually uploaded
    if (!req.file) {
      console.error("❌ Error: No image file received in the request.");
      return res.status(400).json({ message: "No image uploaded. Please check the 'image' field in frontend." });
    }

    // Success Log
    console.log("✅ Report Data:", { category, lat, lng });
    console.log("✅ Image Saved as:", req.file.filename);

    res.status(200).json({
      message: "Report successfully submitted!",
      filename: req.file.filename
    });

  } catch (error) {
    // --- TEMPORARY DEBUG LINE ---
    console.error("❌ CRITICAL SERVER ERROR:", error);
    // ----------------------------
    
    res.status(500).json({ 
      message: "Server failed to process the report.",
      error: error.message 
    });
  }
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📡 For mobile testing, use: http://YOUR_LAPTOP_IP:${PORT}`);
  console.log(`📂 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});