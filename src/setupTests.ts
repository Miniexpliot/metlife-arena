import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
  },
  writable: true,
});

// Mock fetch for /api/stadium to prevent invalid URL error in jsdom.
// The headers mock must include a `.get()` function because App.tsx checks
// `res.headers.get('content-type')` before calling res.json().
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.endsWith('/api/stadium')) {
    return Promise.resolve({
      ok: true,
      headers: { get: (_name: string) => null },
      json: () =>
        Promise.resolve({
          stadiumName: 'Mock Stadium',
          sectors: [],
          gateStatus: {},
          emergencyInfo: { rules: [] },
        }),
    });
  }
  return Promise.reject(new Error(`Unmocked fetch URL: ${url}`));
});
