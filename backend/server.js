import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// ES-module shim for __dirname
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─── Security: HTTP headers ────────────────────────────────────────────────
app.use(helmet());

// Performance: GZIP compression
app.use(compression());

// Security: CORS — fail-closed in production if FRONTEND_URL is not configured.
// Using '*' in production would allow any origin to call the Gemini-backed API.
const allowedOrigin = process.env.FRONTEND_URL;
if (IS_PRODUCTION && !allowedOrigin) {
  console.error(
    'FATAL: FRONTEND_URL environment variable is required in production. ' +
    'Set it to your deployed frontend URL to prevent open CORS.',
  );
  process.exit(1);
}

app.use(
  cors({
    // Development falls back to '*' only; production requires an explicit origin
    origin: IS_PRODUCTION ? allowedOrigin : (process.env.FRONTEND_URL || '*'),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

// Security: Limit body payload size to prevent large-payload DoS
app.use(express.json({ limit: '10kb' }));

// Security: Rate limiting — protects Gemini API quota and prevents DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ─── Data layer: load stadium JSON once at startup ─────────────────────────
const stadiumDataPath = path.join(__dirname, 'stadium_data.json');
let stadiumData = null;
try {
  const fileContent = fs.readFileSync(stadiumDataPath, 'utf-8');
  stadiumData = JSON.parse(fileContent);
  console.log('Stadium database loaded successfully.');
} catch (error) {
  console.error('Failed to load stadium database:', error);
}

// ─── Gemini client — lazy singleton ───────────────────────────────────────
let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiClient;
}

/**
 * Extract the sector-specific slice of the stadium database relevant to a
 * user's current location. Passing only the relevant sector reduces Gemini
 * prompt size by ~70% versus sending the entire JSON on every request.
 *
 * Falls back to the full database if no sector match is found so the AI can
 * still give a helpful general answer.
 */
function buildRagContext(location) {
  if (!stadiumData) return '{}';

  // Match "Sector 1 - Gate A" → sector id contains "Sector 1"
  const sectorId = location ? location.split(' - ')[0].trim() : null;
  const matchedSector = sectorId
    ? stadiumData.sectors.find((s) => s.id === sectorId)
    : null;

  const ragPayload = {
    // Always include gate wait times — needed for any routing question
    gate_status: stadiumData.gate_status,
    emergency_info: stadiumData.emergency_info,
    // Include only the matched sector if we can, else all sectors
    sectors: matchedSector ? [matchedSector] : stadiumData.sectors,
  };

  return JSON.stringify(ragPayload, null, 2);
}

// ─── API: stadium data ─────────────────────────────────────────────────────
app.get('/api/stadium', (req, res) => {
  if (!stadiumData) {
    return res.status(500).json({ error: 'Stadium database is not available.' });
  }
  res.json(stadiumData);
});

// ─── API: chat ─────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, currentLocation } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({
        error: 'Invalid message payload. Must be a non-empty string under 500 characters.',
      });
    }

    if (history !== undefined) {
      if (!Array.isArray(history) || history.length > 50) {
        return res.status(400).json({
          error: 'Invalid history payload. Must be an array with max 50 items.',
        });
      }
      // Validate each history item — prevents oversized or malformed context injection
      for (const item of history) {
        if (
          typeof item !== 'object' ||
          !item.role ||
          !['user', 'model'].includes(item.role) ||
          typeof item.text !== 'string' ||
          item.text.length > 2000
        ) {
          return res.status(400).json({
            error:
              'Invalid history item. Each item must have role ("user"|"model") and text (string ≤2000 chars).',
          });
        }
      }
    }

    if (currentLocation !== undefined &&
        (typeof currentLocation !== 'string' || currentLocation.length > 100)) {
      return res.status(400).json({
        error: 'Invalid location payload. Must be a string under 100 characters.',
      });
    }

    // ── Gemini client ─────────────────────────────────────────────────────
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err) {
      console.error('Configuration Error:', err.message);
      return res.status(500).json({
        error: 'Configuration Error',
        details: 'Internal server configuration error.',
      });
    }

    // ── Location-aware RAG context (sector-scoped, not full DB) ──────────
    const ragContext = buildRagContext(currentLocation);

    const systemInstruction = `You are the "Smart Stadium Assistant" — the official AI guide for FIFA World Cup 2026 fans at MetLife Arena.

The fan is currently at: **${currentLocation || 'Not Selected (General Area)'}**.
Use their location to give highly personalized, proximity-aware answers.

STADIUM DATABASE (your only source of truth):
${ragContext}

RESPONSE RULES:
1. **Proximity Guidance**: Recommend the nearest concession, gate, or first aid relative to the fan's sector.
2. **Anti-Hallucination**: Base all answers strictly on the database above. If something is not in the data, say so.
3. **Multilingual**: Answer in Spanish, French, Arabic etc. if asked. Translate on request.
4. **Wait-Time Optimisation**: Actively recommend alternatives with lower wait times.
5. **Emergency**: For any emergency, display +1 (555) 911-2026 and the nearest First Aid station immediately.
6. **Scope**: Stay focused on the World Cup / stadium. Politely redirect off-topic queries.
7. **Formatting**: Use markdown with bold, bullets, and numbered lists. Keep responses mobile-friendly.`;

    // Build conversation history for Gemini
    const contents = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    console.log(`Sending prompt to Gemini. User location: ${currentLocation}`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText =
      response.text || 'I apologize, but I could not formulate a response. Please try again.';
    res.json({ reply: replyText });
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    res.status(500).json({
      error: 'Gemini Service Error',
      details: 'An unexpected error occurred while processing your request.',
    });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Backend API is running.');
});

// ─── 404 fallback ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
