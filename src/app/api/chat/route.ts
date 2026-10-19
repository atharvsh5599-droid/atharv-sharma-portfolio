import { systemPrompt } from '@/config/ChatPrompt';
import { getPortfolioFallback } from '@/lib/chat-knowledge';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const GEMINI_TIMEOUT_MS = 15000;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_MESSAGES = 8;

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
};

function buildPrompt(messages: ChatMessage[], message: string) {
  const lastMessage = messages[messages.length - 1];
  const history =
    lastMessage?.sender === 'user' && lastMessage.text.trim() === message
      ? messages.slice(0, -1)
      : messages;
  const recentMessages = history
    .slice(-8)
    .map((chatMessage) => {
      const speaker = chatMessage.sender === 'user' ? 'Visitor' : 'Assistant';
      return `${speaker}: ${chatMessage.text}`;
    })
    .join('\n');

  return [
    systemPrompt,
    recentMessages ? `Recent conversation:\n${recentMessages}` : '',
    [
      'Answer quality rules:',
      '- Answer the latest visitor question directly.',
      '- Use concrete details from the portfolio context.',
      '- If listing projects, include project names and one-line summaries.',
      '- Do not stop after a generic preface like "Here are...".',
      '- Give a direct answer first, then add only the context needed to answer the question.',
      '- Keep the response concise: 2-5 bullets or one short paragraph.',
    ].join('\n'),
    `Visitor: ${message}`,
    'Assistant:',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function extractText(payload: unknown) {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('candidates' in payload) ||
    !Array.isArray(payload.candidates)
  ) {
    return '';
  }

  return payload.candidates
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text)
    .filter((text): text is string => typeof text === 'string')
    .join('\n')
    .trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const messages: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
        .filter(
          (item: unknown): item is ChatMessage =>
            typeof item === 'object' &&
            item !== null &&
            'sender' in item &&
            (item.sender === 'user' || item.sender === 'bot') &&
            'text' in item &&
            typeof item.text === 'string',
        )
        .map((item: ChatMessage) => ({
          sender: item.sender,
          text: item.text.slice(0, MAX_MESSAGE_LENGTH),
        }))
        .slice(-MAX_HISTORY_MESSAGES)
    : [];

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  if (!apiKey) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

  let geminiResponse: Response;

  try {
    geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(messages, message) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 260,
        },
      }),
      signal: abortController.signal,
    });
  } catch {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  } finally {
    clearTimeout(timeout);
  }

  const payload = await geminiResponse.json().catch(() => null);

  if (!geminiResponse.ok) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  const text = extractText(payload);

  if (!text) {
    return NextResponse.json({ text: getPortfolioFallback(message) });
  }

  return NextResponse.json({
    text,
  });
}
