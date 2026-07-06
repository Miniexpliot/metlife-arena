import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './server.js';

// Mock the Gemini Client to prevent actual API calls during tests
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

// Set fake env vars for testing
process.env.GEMINI_API_KEY = 'fake_key_for_testing';
process.env.NODE_ENV = 'test';

describe('Backend API Tests', () => {
  // ──────────────────────────────────────────────
  // Pillar 4: Core functionality (happy path)
  // ──────────────────────────────────────────────
  it('GET / should return 200 health check', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Backend API is running.');
  });

  it('GET /api/stadium should return stadium JSON data', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.status).toBe(200);
    expect(res.body.stadium_name).toBe('MetLife Stadium');
    expect(res.body.sectors).toBeInstanceOf(Array);
  });

  it('POST /api/chat should return 200 and mocked response for valid payload', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Where is the nearest restroom?',
      currentLocation: 'Section 100-Level (Lower Bowl)',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked AI Response');
  });

  // ──────────────────────────────────────────────
  // Pillar 2: Security — Input Validation
  // ──────────────────────────────────────────────
  it('POST /api/chat should return 400 if message is missing', async () => {
    const res = await request(app).post('/api/chat').send({ history: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should return 400 if message is too long (Security Check)', async () => {
    const longMessage = 'A'.repeat(600); // 600 chars, limit is 500
    const res = await request(app).post('/api/chat').send({ message: longMessage });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  // ──────────────────────────────────────────────
  // Pillar 2: Security — XSS & Injection Defense
  // ──────────────────────────────────────────────
  it('POST /api/chat should handle XSS script injection in message field', async () => {
    const res = await request(app).post('/api/chat').send({
      message: '<script>alert("xss")</script>',
      currentLocation: 'Sector 1',
    });
    // The backend should process without crashing — Gemini mock returns safely
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
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

  // ──────────────────────────────────────────────
  // Pillar 4: Edge Cases
  // ──────────────────────────────────────────────
  it('POST /api/chat should handle empty history array gracefully', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Hello',
      history: [],
      currentLocation: 'Gate A',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });

  it('POST /api/chat should reject oversized history array (>50 items)', async () => {
    const hugeHistory = Array.from({ length: 51 }, (_, i) => ({
      role: 'user',
      text: `Message ${i}`,
    }));
    const res = await request(app).post('/api/chat').send({
      message: 'Valid message',
      history: hugeHistory,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid history payload');
  });

  it('POST /api/chat should reject oversized currentLocation (>100 chars)', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Valid message',
      currentLocation: 'X'.repeat(150),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid location payload');
  });

  it('GET /api/stadium should contain gate_status and emergency_info', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.status).toBe(200);
    expect(res.body.gate_status).toBeDefined();
    expect(res.body.emergency_info).toBeDefined();
    expect(res.body.emergency_info.rules).toBeInstanceOf(Array);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
