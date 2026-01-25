import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import 'dotenv/config';

const { Pool } = pkg;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// --- ROUTES ---

// 1. Report an Issue (With Spatial De-duplication)
app.post('/api/report', async (req, res) => {
    const { category, description, lat, lng } = req.body;

    // Basic validation
    if (!category || !lat || !lng) {
        return res.status(400).json({ error: "Missing required fields: category, lat, or lng" });
    }

    try {
        // Step A: Check if a similar report exists within 10 meters
        const duplicateCheck = await pool.query(
            `SELECT id FROM civic_tickets 
             WHERE category = $1 
             AND ST_DWithin(
                location::geography, 
                ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 
                10
             ) 
             LIMIT 1`,
            [category, lng, lat]
        );

        if (duplicateCheck.rows.length > 0) {
            // Step B: Duplicate found -> Increment the count
            const ticketId = duplicateCheck.rows[0].id;
            const updated = await pool.query(
                'UPDATE civic_tickets SET report_count = report_count + 1 WHERE id = $1 RETURNING id, report_count',
                [ticketId]
            );
            return res.status(200).json({ 
                message: 'Duplicate found. Increased report count.', 
                ticket: updated.rows[0] 
            });
        }

        // Step C: No duplicate -> Create new ticket
        const newTicket = await pool.query( 
            `INSERT INTO civic_tickets (category, description, location) 
             VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)) 
             RETURNING id, category, status, report_count`,
            [category, description, lng, lat]
        );

        res.status(201).json(newTicket.rows[0]);
    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. Get all tickets (Formatted for Map markers)
app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, category, description, status, report_count, 
             ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
             FROM civic_tickets`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 NagrikSetu Backend running on http://localhost:${PORT}`);
});