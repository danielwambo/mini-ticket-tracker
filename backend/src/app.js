import express from 'express';
import cors from 'cors';
import ticketsRouter from './routes/tickets.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/tickets', ticketsRouter);

// Handle malformed JSON bodies.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
