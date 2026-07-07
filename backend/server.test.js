import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Gemini SDK before importing server ──────────────────────────────────
// The server accesses `response.text` as a direct property (not a getter),
// so the mock resolves to { text: string } — matching the real SDK shape.
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor() {
        this.models = {
          generateContent: vi.fn().mockResolvedValue({
            text: 'Mocked AI Response',
          }),
        };
      }
    },
  };
});

// Set required env vars before server initialises
process.env.GEMINI_API_KEY = 'fake_key_for_testing';
process.env.NODE_ENV = 'test';
// Explicitly clear FRONTEND_URL so the server uses dev-mode CORS (not fail-closed)
delete process.env.FRONTEND_URL;

// Import server AFTER env vars and mocks are in place
const { default: app } = await import('./server.js');

describe('Backend API Tests', () => {
  // ── Health check ────────────────────────────────────────────────────────
  it('GET / should return 200 health check', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Backend API is running.');
  });

  // ── Stadium data ────────────────────────────────────────────────────────
  it('GET /api/stadium should return stadium JSON data', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.status).toBe(200);
    expect(res.body.stadium_name).toBe('MetLife Stadium');
    expect(res.body.sectors).toBeInstanceOf(Array);
  });

  it('GET /api/stadium should contain gate_status and emergency_info', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.body.gate_status).toBeDefined();
    expect(res.body.emergency_info).toBeDefined();
    expect(res.body.emergency_info.rules).toBeInstanceOf(Array);
  });

  // ── Chat — happy path ────────────────────────────────────────────────────
  it('POST /api/chat should return 200 and mocked response for valid payload', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Where is the nearest restroom?',
      currentLocation: 'Section 100-Level (Lower Bowl)',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked AI Response');
  });

  it('POST /api/chat should handle empty history array gracefully', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Hello',
      history: [],
      currentLocation: 'Gate A',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });

  // ── Input validation — message ───────────────────────────────────────────
  it('POST /api/chat should return 400 if message is missing', async () => {
    const res = await request(app).post('/api/chat').send({ history: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should return 400 if message exceeds 500 chars', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'A'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should reject non-string message types', async () => {
    const res = await request(app).post('/api/chat').send({ message: 12345 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should reject null message', async () => {
    const res = await request(app).post('/api/chat').send({ message: null });
    expect(res.status).toBe(400);
  });

  // ── Input validation — history ───────────────────────────────────────────
  it('POST /api/chat should reject oversized history (>50 items)', async () => {
    const hugeHistory = Array.from({ length: 51 }, (_, i) => ({
      role: 'user',
      text: `Message ${i}`,
    }));
    const res = await request(app).post('/api/chat').send({
      message: 'Valid',
      history: hugeHistory,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid history payload');
  });

  it('POST /api/chat should reject history item with invalid role', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Hello',
      history: [{ role: 'admin', text: 'Injected content' }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid history item');
  });

  it('POST /api/chat should reject history item with text over 2000 chars', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Hello',
      history: [{ role: 'user', text: 'X'.repeat(2001) }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid history item');
  });

  // ── Input validation — location ──────────────────────────────────────────
  it('POST /api/chat should reject oversized currentLocation (>100 chars)', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Valid message',
      currentLocation: 'X'.repeat(150),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid location payload');
  });

  // ── Security — XSS injection handling ───────────────────────────────────
  it('POST /api/chat should handle XSS injection in message without crashing', async () => {
    const res = await request(app).post('/api/chat').send({
      message: '<script>alert("xss")</script>',
      currentLocation: 'Sector 1',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });

  // ── 404 ──────────────────────────────────────────────────────────────────
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
