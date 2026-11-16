import { generateText, readInput, HttpError } from '../server/core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' });
  }

  const controller = new AbortController();
  req.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        /* treat as plain text */
      }
    }
    const input = readInput(body);
    const text = await generateText(input, controller.signal);
    return res.status(200).json({ text });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const code = err instanceof HttpError ? err.code : 'server_error';
    const message = err instanceof HttpError ? err.message : 'Something went wrong on the server.';
    return res.status(status).json({ error: code, message });
  }
}
