/* Chatbot panel START */
/* Loaded only after the visitor clicks the launcher (see ChatWidget.astro).
   Builds the panel, keeps the conversation in sessionStorage for the current
   tab, and streams replies from /api/chat. Assistant text is escaped first and
   only site links are turned into anchors, so model output can never inject
   markup. */

import { initStagerButtons } from './stager';

type Message = { role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'chatbot-history';
const SITE_ORIGIN = 'https://www.srdjan-jovic.com';
const GREETING = 'Hi! How can I help you today?';
const ERROR_TEXT = `Sorry, something went wrong. You can reach Srdjan directly at ${SITE_ORIGIN}/contact/`;

/* Pixel-art assistant icon (original artwork, 12x12 grid) shown next to the panel title */
const AVATAR_SVG =
  '<svg width="22" height="22" viewBox="0 0 12 12" shape-rendering="crispEdges"><rect x="5" y="0" width="2" height="1" fill="currentColor"/><rect x="5.5" y="1" width="1" height="1" fill="currentColor"/><path fill="currentColor" fill-rule="evenodd" d="M1 2h10v8H1zM3 4h2v2H3zM7 4h2v2H7zM4 8h4v1H4z"/><rect x="0" y="5" width="1" height="2" fill="currentColor"/><rect x="11" y="5" width="1" height="2" fill="currentColor"/><rect x="3" y="10" width="2" height="1" fill="currentColor"/><rect x="7" y="10" width="2" height="1" fill="currentColor"/></svg>';

/* Pixel-art visitor icon (head and shoulders), same 12x12 grid as the bot */
const USER_SVG =
  '<svg width="22" height="22" viewBox="0 0 12 12" shape-rendering="crispEdges"><rect x="4" y="1" width="4" height="4" fill="currentColor"/><rect x="3" y="6" width="6" height="1" fill="currentColor"/><rect x="2" y="7" width="8" height="4" fill="currentColor"/></svg>';

let panel: HTMLElement | undefined;
let list: HTMLElement;
let form: HTMLFormElement;
let input: HTMLTextAreaElement;
let sendButton: HTMLButtonElement;
let launcherRef: HTMLButtonElement;
let history: Message[] = [];
let busy = false;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadHistory(): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
  } catch {
    // Storage can be blocked; the chat still works for this page view.
  }
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/* Only same-site URLs become links; everything else stays plain text. */
function siteHref(url: string): string | null {
  try {
    const parsed = new URL(url, SITE_ORIGIN);
    // Collapse leading slashes so a path like "//other.site" can never become a protocol-relative link.
    const path = `/${parsed.pathname.replace(/^\/+/, '')}`;
    return parsed.origin === SITE_ORIGIN ? path + parsed.search + parsed.hash : null;
  } catch {
    return null;
  }
}

function renderText(text: string): string {
  let html = escapeHtml(text);
  // [label](url) Markdown links
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, url) => {
    const href = siteHref(url.replace(/&amp;/g, '&'));
    return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
  });
  // Bare site URLs that are not already inside an anchor
  html = html.replace(/(^|[\s(])(https:\/\/www\.srdjan-jovic\.com\/[^\s<)]*)/g, (match, lead, url) => {
    const clean = url.replace(/[.,;:!?]+$/, '');
    const trailing = url.slice(clean.length);
    const href = siteHref(clean.replace(/&amp;/g, '&'));
    return href ? `${lead}<a href="${escapeHtml(href)}">${clean}</a>${trailing}` : match;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return html.replace(/\n/g, '<br>');
}

function addMessage(message: Message): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = `chatbot_message is-${message.role}`;
  bubble.innerHTML = message.role === 'assistant' ? renderText(message.content) : escapeHtml(message.content).replace(/\n/g, '<br>');

  // Every bubble sits next to its sender's avatar: bot on the left, visitor on the right
  const row = document.createElement('div');
  row.className = `chatbot_row is-${message.role}`;
  const avatar = document.createElement('span');
  avatar.className = `chatbot_message-avatar is-${message.role}`;
  avatar.setAttribute('aria-hidden', 'true');
  avatar.innerHTML = message.role === 'assistant' ? AVATAR_SVG : USER_SVG;
  row.append(avatar, bubble);
  list.append(row);
  list.scrollTo({ top: list.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
  return bubble;
}

function setBusy(state: boolean) {
  busy = state;
  sendButton.disabled = state;
  list.setAttribute('aria-busy', String(state));
}

async function sendMessage(text: string) {
  history.push({ role: 'user', content: text });
  addMessage({ role: 'user', content: text });
  saveHistory();

  const bubble = addMessage({ role: 'assistant', content: '' });
  bubble.classList.add('is-typing');
  setBusy(true);

  let reply = '';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      reply += decoder.decode(value, { stream: true });
      bubble.classList.remove('is-typing');
      bubble.innerHTML = renderText(reply);
      list.scrollTop = list.scrollHeight;
    }
    reply = reply.trim() || ERROR_TEXT;
  } catch {
    reply = ERROR_TEXT;
  }

  bubble.classList.remove('is-typing');
  bubble.innerHTML = renderText(reply);
  history.push({ role: 'assistant', content: reply });
  saveHistory();
  setBusy(false);
  input.focus();
}

function buildPanel() {
  panel = document.createElement('section');
  panel.className = 'chatbot_panel';
  panel.id = 'chatbot-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'chatbot-title');
  panel.innerHTML = `
    <div class="chatbot_header">
      <div class="chatbot_identity">
        <span class="chatbot_avatar" aria-hidden="true">${AVATAR_SVG}</span>
        <h2 class="chatbot_title" id="chatbot-title">Ask Srdjan's AI assistant</h2>
      </div>
      <button type="button" class="chatbot_close" aria-label="Close chat">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="chatbot_messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
    <form class="chatbot_form">
      <label class="chatbot_sr-only" for="chatbot-input">Your message</label>
      <textarea class="chatbot_input" id="chatbot-input" rows="1" maxlength="1000" placeholder="Type your question…" required></textarea>
      <button type="submit" class="chatbot_send" data-stager-btn><span data-stager-text>Send</span></button>
    </form>`;
  document.body.append(panel);
  initStagerButtons();

  list = panel.querySelector('.chatbot_messages')!;
  form = panel.querySelector('.chatbot_form')!;
  input = panel.querySelector('.chatbot_input')!;
  sendButton = panel.querySelector('.chatbot_send')!;

  panel.querySelector('.chatbot_close')!.addEventListener('click', () => closeChat());
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeChat();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    input.style.height = '';
    void sendMessage(text);
  });

  // Enter sends, Shift+Enter adds a new line
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = '';
    // scrollHeight excludes the 1px top and bottom borders (box-sizing: border-box)
    input.style.height = `${input.scrollHeight + 2}px`;
  });

  history = loadHistory();
  addMessage({ role: 'assistant', content: GREETING });
  history.forEach(addMessage);
}

function openChat() {
  if (!panel) buildPanel();
  panel!.hidden = false;
  requestAnimationFrame(() => panel!.classList.add('is-open'));
  launcherRef.setAttribute('aria-expanded', 'true');
  launcherRef.setAttribute('aria-controls', 'chatbot-panel');
  input.focus();
}

function closeChat() {
  if (!panel) return;
  panel.classList.remove('is-open');
  launcherRef.setAttribute('aria-expanded', 'false');
  // Skip hiding if the panel was reopened before the close transition finished.
  const hide = () => {
    if (!panel!.classList.contains('is-open')) panel!.hidden = true;
  };
  if (reducedMotion()) hide();
  else panel.addEventListener('transitionend', hide, { once: true });
  launcherRef.focus();
}

export function toggleChat(launcher: HTMLButtonElement) {
  launcherRef = launcher;
  if (panel && !panel.hidden && panel.classList.contains('is-open')) closeChat();
  else openChat();
}
/* Chatbot panel END */
