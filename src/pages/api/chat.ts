import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { getSystemPrompt } from '../../lib/chat/knowledge';

/* Chatbot API route START */
/* The only on-demand route on an otherwise static site. Receives the chat
   history from the widget, calls the Gemini API (free tier) with the site
   knowledge as system instruction, and returns the complete reply as plain
   text. Replies are only returned once Gemini confirms they finished, so a
   visitor never sees a half answer. */

export const prerender = false;

/* Flash-Lite models: fast, and a much higher free-tier daily quota than
   gemini-3.8-flash (20 requests per day). Each model is tried in order when
   the previous one is out of quota, unavailable, or returns an incomplete reply. */
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
const GEMINI_URL = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT = { requests: 20, windowMs: 10 * 60 * 1000 };
const FALLBACK_TEXT =
  "Sorry, I can't answer right now. You can reach Srdjan directly at https://www.srdjan-jovic.com/contact/";

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type GeminiReply = {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

/* Best-effort per-instance limiter. Pair with a Vercel Firewall rate-limit rule on /api/chat for real protection. */
const hits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.requests;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  const list = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(list) || list.length === 0) return null;
  const messages = list.slice(-MAX_MESSAGES).map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.trim().slice(0, MAX_MESSAGE_CHARS) : '',
  })) as ChatMessage[];
  if (messages.at(-1)?.role !== 'user' || !messages.at(-1)?.content) return null;
  return messages.filter((m) => m.content);
}

/* Returns the first complete reply, or null when every model failed. */
async function askGemini(apiKey: string, system: string, messages: ChatMessage[]): Promise<string | null> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  });

  for (const model of MODELS) {
    const response = await fetch(GEMINI_URL(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
    });
    if (!response.ok) {
      console.error(`[chat] ${model} failed`, response.status, (await response.text().catch(() => '')).slice(0, 300));
      continue;
    }
    const data = (await response.json()) as GeminiReply;
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (candidate?.finishReason === 'STOP' && text) return text;
    console.error(`[chat] ${model} incomplete reply`, candidate?.finishReason);
  }
  return null;
}

const plain = (text: string, status: number) =>
  new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  // Only accept calls from this site's own pages.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return plain('Forbidden', 403);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  if (isRateLimited(ip)) return plain('You have sent a lot of messages. Please try again in a few minutes.', 429);

  const messages = parseMessages(await request.json().catch(() => null));
  if (!messages) return plain('Invalid request', 400);

  const apiKey = getSecret('CHAT_BOT_GEMINI_API_KEY');
  if (!apiKey) {
    console.error('[chat] CHAT_BOT_GEMINI_API_KEY is not set');
    return plain(FALLBACK_TEXT, 503);
  }

  try {
    const system = await getSystemPrompt();
    const reply = await askGemini(apiKey, system, messages);
    return reply ? plain(reply, 200) : plain(FALLBACK_TEXT, 503);
  } catch (error) {
    console.error('[chat] Unexpected error', error);
    return plain(FALLBACK_TEXT, 503);
  }
};
/* Chatbot API route END */
