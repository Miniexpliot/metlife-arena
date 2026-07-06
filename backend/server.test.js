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

  it('POST /api/chat should return 400 if message is missing', async () => {
    const res = await request(app).post('/api/chat').send({ history: [] }); // No message
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should return 400 if message is too long (Security Check)', async () => {
    const longMessage = 'A'.repeat(600); // 600 chars, limit is 500
    const res = await request(app).post('/api/chat').send({ message: longMessage });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid message payload');
  });

  it('POST /api/chat should return 200 and mocked response for valid payload', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Where is the nearest restroom?',
      currentLocation: 'Section 100-Level (Lower Bowl)',
    });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked AI Response');
  });
});
