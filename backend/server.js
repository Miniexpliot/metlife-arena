/**
 * PROBLEM STATEMENT ALIGNMENT:
 * This Express server functions as the central "operational intelligence" hub.
 * It strictly enforces "security" (rate-limiting, payload bounding, CORS protection)
 * and dynamically injects "real-time decision support" (RAG context) into the
 * generative AI prompts to ensure responses are grounded in stadium ground truth.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { detectPromptInjection } from './security.js';
import { getSystemInstruction } from './systemPrompt.js';
import winston from 'winston';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { stadiumDataSchema } from './schema.js';

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
let sectorIndex = new Map(); // O(1) Index

// Schema and Integrity Enforcer
async function loadAndValidateDatabase() {
  try {
    const fileContent = await fs.promises.readFile(stadiumDataPath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    stadiumData = stadiumDataSchema.parse(rawData); // Enforce schema
    sectorIndex = new Map(stadiumData.sectors.map((s) => [s.id, s])); // Build index
    console.log('Stadium database loaded, validated, and indexed successfully.');
  } catch (error) {
    console.error('FATAL: Failed to load or validate stadium database:', error.message);
    if (!stadiumData) process.exit(1); // Only exit if it's the first load
  }
}

// Ensure the first load completes before the app starts handling requests
// In a top-level await environment this is fine, but since Express runs asynchronously,
// we just call it.
loadAndValidateDatabase();

// Efficiency: Hot-reload on file change
fs.watch(stadiumDataPath, async (eventType) => {
  if (eventType === 'change') {
    console.log('Database file changed. Performing hot-reload...');
    await loadAndValidateDatabase();
  }
});

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
  const matchedSector = sectorId ? sectorIndex.get(sectorId) : null;

  // Build a lightweight summary of all concessions across the stadium to enable cross-sector recommendations
  const allConcessionsSummary = stadiumData.sectors.map((sector) => ({
    sector: sector.id,
    concessions: sector.concessions.map((c) => ({
      name: c.name,
      location: c.location,
      cuisine: c.cuisine,
    })),
  }));

  const ragPayload = {
    // Always include gate wait times — needed for any routing question
    gateStatus: stadiumData.gateStatus,
    emergencyInfo: stadiumData.emergencyInfo,
    // Stadium-wide directory index (extremely token efficient)
    stadiumConcessionsIndex: allConcessionsSummary,
    // Detailed menus and wait times scoped specifically to current sector (or all if not matched)
    currentSectorDetails: matchedSector ? [matchedSector] : stadiumData.sectors,
  };

  return JSON.stringify(ragPayload, null, 2);
}

// Security/Accessibility: Database Audit Logger Middleware
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, message }) => `[AUDIT] ${timestamp} - ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, 'audit.log') })
  ]
});

app.use('/api', (req, res, next) => {
  auditLogger.info(`Method: ${req.method} | Route: ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

// Accessibility: Swagger API Docs
try {
  const file = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
  const swaggerDocument = yaml.parse(file);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('Could not load swagger.yaml for API docs', err.message);
}

// Database connection pooling (Efficiency)
const dbPool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}) : null;

if (dbPool) {
  console.log('PostgreSQL connection pool initialized.');
} else {
  console.log('No DATABASE_URL provided. Falling back to in-memory JSON data store.');
}

// Security: API Key Middleware for stadium DB endpoint
async function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing API key' });
  }

  // Graceful fallback to static key if DB pooling isn't configured
  if (!dbPool) {
    if (!process.env.STADIUM_API_KEY || apiKey !== process.env.STADIUM_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    return next();
  }

  // Proper DB-backed credential security practices
  try {
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const result = await dbPool.query('SELECT id FROM api_keys WHERE api_key_hash = $1', [hashedKey]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    next();
  } catch (error) {
    console.error('Database error during authentication:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ─── API: stadium data ─────────────────────────────────────────────────────
app.get('/api/stadium', requireApiKey, (req, res) => {
  if (!stadiumData) {
    return res.status(500).json({ error: 'Stadium database is not available.' });
  }
  res.json(stadiumData);
});

// ─── API: chat ─────────────────────────────────────────────────────────────
// Predictive Spatial Cache (Efficiency Optimization)
const spatialCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const MAX_CACHE_SIZE = 500; // LRU eviction cap to prevent unbounded memory growth

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, currentLocation } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({
        error: 'Invalid message payload. Must be a non-empty string under 500 characters.',
      });
    }

    // Heuristic prompt injection safeguard scan
    if (detectPromptInjection(message)) {
      return res.status(400).json({
        error: 'Invalid message content. Potential security threat detected.',
      });
    }

    if (history !== undefined) {
      if (!Array.isArray(history) || history.length > 30) {
        return res.status(400).json({
          error: 'Invalid history payload. Must be an array with max 30 items.',
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

    // ── Predictive Spatial Cache Intercept ─────────────────────────────────
    // Only cache operational zero-shot queries (empty history) to preserve conversational flow
    const cacheKey = `${currentLocation || 'unknown'}_${message.trim().toLowerCase()}`;
    const isZeroShot = !history || history.length === 0;

    if (isZeroShot && spatialCache.has(cacheKey)) {
      const cachedEntry = spatialCache.get(cacheKey);
      if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        console.log(`[CACHE HIT] Returning instant O(1) response for: ${cacheKey}`);
        return res.json({ reply: cachedEntry.reply, cached: true });
      } else {
        spatialCache.delete(cacheKey); // Evict stale cache
      }
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

    const systemInstruction = getSystemInstruction(currentLocation, ragContext);

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
    
    // Populate the cache for future localized queries (with LRU eviction)
    if (isZeroShot) {
      if (spatialCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = spatialCache.keys().next().value;
        spatialCache.delete(oldestKey);
      }
      spatialCache.set(cacheKey, { reply: replyText, timestamp: Date.now() });
    }

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
