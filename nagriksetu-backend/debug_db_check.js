import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkDb() {
    try {
        console.log(`Connecting to database: ${process.env.DB_NAME} as ${process.env.DB_USER}...`);
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', res.rows[0]);

        console.log('Listing tables...');
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        if (tables.rows.length === 0) {
            console.log('⚠️ No tables found in public schema.');
        } else {
            console.log('Tables found:');
            tables.rows.forEach(row => console.log(` - ${row.table_name}`));

            for (const row of tables.rows) {
                const tableName = row.table_name;
                console.log(`\nChecking columns for table: ${tableName}`);
                const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [tableName]);
                columns.rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
            }
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkDb();
