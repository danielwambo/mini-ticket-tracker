import 'dotenv/config';
import app from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await pool.query('SELECT 1');

    app.listen(port, () => {
      console.log(`Ticket API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Could not connect to PostgreSQL:', error.message);
    process.exitCode = 1;
    await pool.end();
  }
}

startServer();
