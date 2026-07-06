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

// Mock fetch for /api/stadium to prevent invalid URL error
global.fetch = vi.fn().mockImplementation((url) => {
  if (url === '/api/stadium') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ stadium_name: 'Mock Stadium' })
    });
  }
  return Promise.reject(new Error('Unknown URL'));
});
