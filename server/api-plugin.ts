import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Vite dev-server plugin that exposes secure backend API routes.
 * The Gemini API key is read from process.env on the server and never
 * exposed to the client.
 *
 * Routes:
 *   GET  /api/health          — check if GEMINI_API_KEY is configured
 *   POST /api/analyze-story   — text model: extract structured story JSON
 *   POST /api/generate-panel-spec — text model: convert request to panel spec JSON
 *   POST /api/continue-story  — text model: propose next scene JSON
 *   POST /api/check-continuity — vision+text model: continuity report JSON
 *   POST /api/generate-image  — image model: generate manga panel image
 */

/**
 * Vite does NOT load .env into process.env for server-side plugin code.
 * It only loads VITE_-prefixed vars into import.meta.env for the client.
 * This manually parses .env and merges non-VITE_ vars into process.env
 * so the API routes can access GEMINI_API_KEY.
 */
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file may not exist yet
  }
}

loadEnvFile();

const TEXT_MODEL = 'gemini-3.6-flash';
const IMAGE_MODEL = 'gemini-3.1-flash-image';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
  promptFeedback?: { blockReason?: string };
}

async function callGeminiText(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  jsonMode = true,
): Promise<string> {
  const url = `${API_BASE}/${TEXT_MODEL}:generateContent`;
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    ...(systemPrompt
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : {}),
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(data.error.message || 'Gemini API error');
  }

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Request blocked: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

interface ImageInput {
  data: string; // base64
  mimeType: string;
}

async function callGeminiImage(
  apiKey: string,
  textPrompt: string,
  images: ImageInput[] = [],
): Promise<{ data: string; mimeType: string }> {
  const parts: GeminiPart[] = [];

  for (const img of images) {
    parts.push({
      inline_data: { mime_type: img.mimeType, data: img.data },
    });
  }
  parts.push({ text: textPrompt });

  const url = `${API_BASE}/${IMAGE_MODEL}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.9,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(data.error.message || 'Gemini image API error');
  }

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Image request blocked: ${data.promptFeedback.blockReason}`);
  }

  // Find the image part in the response
  const parts2 = data.candidates?.[0]?.content?.parts;
  if (parts2) {
    for (const p of parts2) {
      if (p.inline_data?.data) {
        return { data: p.inline_data.data, mimeType: p.inline_data.mime_type };
      }
    }
  }

  throw new Error('No image returned from Gemini');
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function handleRoute(
  server: ViteDevServer,
  route: string,
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
    apiKey: string,
    body: any,
  ) => Promise<void>,
) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith(route)) return next();

    if (req.method === 'OPTIONS') {
      sendJson(res, 200, {});
      return;
    }
    if (req.method !== 'POST' && req.method !== 'GET') return next();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'your_key_here') {
      sendJson(res, 503, {
        error: 'Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.',
      });
      return;
    }

    try {
      let body: any = {};
      if (req.method === 'POST') {
        const raw = await readBody(req);
        body = raw ? JSON.parse(raw) : {};
      }
      await handler(req, res, apiKey, body);
    } catch (err: any) {
      const status = err?.message?.includes('API key') ? 401 : 500;
      sendJson(res, status, {
        error: err?.message || 'Internal server error',
      });
    }
  });
}

export function storyForgeApiPlugin(): Plugin {
  return {
    name: 'storyforge-api',
    configureServer(server: ViteDevServer) {
      // Health check
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/api/health') return next();
        const key = process.env.GEMINI_API_KEY || '';
        const configured = !!key && key !== 'your_key_here';
        sendJson(res, 200, { configured });
      });

      // Analyze story
      handleRoute(server, '/api/analyze-story', async (_req, res, apiKey, body) => {
        const { story } = body;
        if (!story) return sendJson(res, 400, { error: 'Missing "story" field' });

        const system = `You are StoryForge, an AI story analyst for a manga/storyboard generator. Analyze the given story and return ONLY valid JSON matching this exact schema:
{
  "title": string,
  "genre": string,
  "tone": string,
  "visual_style": string,
  "characters": [{ "id": string (format "char_<lowercase_name>"), "name": string, "age": number|null, "appearance": string, "personality": string, "role": string, "visual_traits": string[], "outfit": string }],
  "locations": [{ "id": string, "name": string, "description": string, "visual_traits": string[] }],
  "objects": [{ "id": string, "name": string, "description": string }],
  "relationships": [{ "from": string (char id), "to": string (char id), "type": string, "description": string }],
  "events": [{ "id": string, "description": string, "characters": string[], "chapter": number, "scene": number }],
  "current_scene": string,
  "current_scene_description": string
}
Return ONLY the JSON, no markdown, no commentary.`;

        const text = await callGeminiText(apiKey, system, story, true);
        sendJson(res, 200, { result: text });
      });

      // Generate panel specification
      handleRoute(server, '/api/generate-panel-spec', async (_req, res, apiKey, body) => {
        const { request, context } = body;
        if (!request) return sendJson(res, 400, { error: 'Missing "request" field' });

        const system = `You are StoryForge's panel director. Convert the user's request into a structured panel specification for manga/storyboard generation. Return ONLY valid JSON:
{
  "shot_type": string,
  "camera_angle": string,
  "characters": string[] (character ids),
  "action": string,
  "emotion": { [characterName: string]: string },
  "location": string,
  "lighting": string,
  "composition": string,
  "continuity_constraints": string[],
  "panel_description": string,
  "events_to_remember": [{ "text": string, "type": string, "characters": string[] }],
  "character_state_updates": [{ "characterId": string, "location": string, "outfit": string, "emotion": string, "notes": string }]
}
Use the provided context (story, characters, memories, previous panels) to inform the spec.`;

        const userPrompt = `User request: ${request}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
        const text = await callGeminiText(apiKey, system, userPrompt, true);
        sendJson(res, 200, { result: text });
      });

      // Continue story
      handleRoute(server, '/api/continue-story', async (_req, res, apiKey, body) => {
        const { context } = body;

        const system = `You are StoryForge's story continuation engine. Based on the current story state, memories, and character states, propose the next scene. Return ONLY valid JSON:
{
  "next_scene_description": string,
  "panel_request": string (a clear description of what the next panel should show),
  "events_to_remember": [{ "text": string, "type": string, "characters": string[] }],
  "character_state_updates": [{ "characterId": string, "location": string, "outfit": string, "emotion": string, "notes": string }],
  "narrative_summary": string
}`;
        const userPrompt = `Current story context:\n${JSON.stringify(context, null, 2)}`;
        const text = await callGeminiText(apiKey, system, userPrompt, true);
        sendJson(res, 200, { result: text });
      });

      // Check continuity
      handleRoute(server, '/api/check-continuity', async (_req, res, apiKey, body) => {
        const { panelImage, panelSpec, context } = body;

        const system = `You are StoryForge's continuity checker. Analyze the generated panel image and compare it against the expected panel specification. Return ONLY valid JSON:
{
  "score": number (0-100),
  "checks": {
    "character_consistency": number (0-100),
    "outfit_consistency": number (0-100),
    "location_consistency": number (0-100),
    "story_consistency": number (0-100)
  },
  "warnings": string[]
}`;
        const userPrompt = `Panel specification:\n${JSON.stringify(panelSpec, null, 2)}\n\nStory context:\n${JSON.stringify(context, null, 2)}\n\nAnalyze the provided image and score the continuity.`;

        const images: ImageInput[] = [];
        if (panelImage) {
          images.push({ data: panelImage, mimeType: 'image/png' });
        }

        // Use text model with vision for continuity check
        const parts: GeminiPart[] = [];
        for (const img of images) {
          parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
        }
        parts.push({ text: userPrompt });

        const url = `${API_BASE}/${TEXT_MODEL}:generateContent`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
              maxOutputTokens: 2048,
            },
          }),
        });

        const data = (await resp.json()) as GeminiResponse;
        if (data.error) throw new Error(data.error.message);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty continuity response');
        sendJson(res, 200, { result: text });
      });

      // Generate image
      handleRoute(server, '/api/generate-image', async (_req, res, apiKey, body) => {
        const { prompt, referenceImages, previousPanel } = body;
        if (!prompt) return sendJson(res, 400, { error: 'Missing "prompt" field' });

        const images: ImageInput[] = [];
        if (referenceImages && Array.isArray(referenceImages)) {
          for (const img of referenceImages) {
            if (img.data) images.push({ data: img.data, mimeType: img.mimeType || 'image/png' });
          }
        }
        if (previousPanel?.data) {
          images.push({ data: previousPanel.data, mimeType: previousPanel.mimeType || 'image/png' });
        }

        const result = await callGeminiImage(apiKey, prompt, images);
        sendJson(res, 200, { imageUrl: `data:${result.mimeType};base64,${result.data}`, mimeType: result.mimeType });
      });
    },
  };
}
