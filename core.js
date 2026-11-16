// Shared logic for the Express dev server and the Vercel serverless function.
// Returns raw model text; parsing/validation of the deck happens on the client.

export const MAX_INPUT = 8000;
const TIMEOUT_MS = 45000;

const SYSTEM_PROMPT = `You turn study notes into flashcards and a multiple-choice quiz.
Respond with ONLY valid JSON (no markdown fences, no commentary) in exactly this shape:
{
  "title": "short deck title",
  "flashcards": [ { "front": "question or term", "back": "answer or definition" } ],
  "quiz": [ { "question": "text", "options": ["A", "B", "C", "D"], "answer": 0 } ]
}
Rules: 8-12 flashcards, 6-10 quiz questions, 4 options per question, "answer" is the
zero-based index of the correct option. Base everything on the user's notes or topic.`;

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function readInput(body) {
  const raw =
    typeof body === 'string'
      ? body
      : body?.input ?? body?.notes ?? body?.text ?? body?.prompt ?? body?.topic ?? '';
  const input = String(raw).trim();
  if (!input) throw new HttpError(400, 'bad_input', 'Please paste some notes or a topic.');
  if (input.length > MAX_INPUT)
    throw new HttpError(400, 'bad_input', `Input is too long (max ${MAX_INPUT} characters).`);
  return input;
}

function withTimeout(parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), TIMEOUT_MS);
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    else parentSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function callJson(url, options, provider) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    if (options.signal?.aborted) throw new HttpError(504, 'timeout', 'The AI took too long. Try again.');
    throw new HttpError(502, 'network', `Could not reach ${provider}.`);
  }
  if (res.status === 429) throw new HttpError(429, 'rate_limit', 'Rate limit reached. Wait a moment and retry.');
  if (res.status === 401 || res.status === 403)
    throw new HttpError(500, 'bad_key', `The ${provider} API key was rejected. Check your environment variable.`);
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new HttpError(502, 'upstream', `${provider} returned ${res.status}. ${detail}`);
  }
  return res.json();
}

export async function generateText(input, parentSignal) {
  const provider = (process.env.PROVIDER || 'gemini').toLowerCase();
  const { signal, done } = withTimeout(parentSignal);
  try {
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new HttpError(500, 'no_key', 'GEMINI_API_KEY is not set on the server.');
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const data = await callJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: input }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
          }),
        },
        'Gemini'
      );
      return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    }

    if (provider === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new HttpError(500, 'no_key', 'ANTHROPIC_API_KEY is not set on the server.');
      const data = await callJson(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: input }],
          }),
        },
        'Anthropic'
      );
      return data?.content?.map((b) => b.text || '').join('') || '';
    }

    if (provider === 'openai') {
      const key = process.env.OPENAI_API_KEY || 'not-needed';
      if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_BASE_URL)
        throw new HttpError(500, 'no_key', 'OPENAI_API_KEY is not set on the server.');
      const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
      const data = await callJson(
        `${base}/chat/completions`,
        {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: input },
            ],
          }),
        },
        'OpenAI-compatible API'
      );
      return data?.choices?.[0]?.message?.content || '';
    }

    throw new HttpError(500, 'bad_provider', `Unknown PROVIDER "${provider}". Use gemini, anthropic or openai.`);
  } finally {
    done();
  }
}
