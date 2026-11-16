import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateText, readInput, HttpError } from './core.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/generate', async (req, res) => {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const input = readInput(req.body);
    const text = await generateText(input, controller.signal);
    res.json({ text });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const code = err instanceof HttpError ? err.code : 'server_error';
    const message = err instanceof HttpError ? err.message : 'Something went wrong on the server.';
    if (!res.headersSent) res.status(status).json({ error: code, message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
