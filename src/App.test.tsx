import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock Google Maps to avoid needing an actual API key during testing
vi.mock('@vis.gl/react-google-maps', () => {
  return {
    APIProvider: ({ children }: any) => <div>{children}</div>,
    Map: () => <div data-testid="google-map-mock">Map Mock</div>,
    AdvancedMarker: ({ children }: any) => <div>{children}</div>,
    Pin: () => <div>Pin</div>,
  };
});

describe('App Component', () => {
  // ──────────────────────────────────────────────
  // Pillar 1: Core rendering (happy path)
  // ──────────────────────────────────────────────
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getAllByText(/MetLife Stadium/i).length).toBeGreaterThan(0);
  });

  it('renders the initial chat tip', () => {
    render(<App />);
    expect(screen.getByText(/SMART COMPANION TIP/i)).toBeInTheDocument();
  });

  it('allows user to type a message in the input field', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(
      /Ask about food, gate wait times/i,
    ) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: 'Where is the nearest hot dog?' } });
    expect(inputElement.value).toBe('Where is the nearest hot dog?');
  });

  it('renders the custom language flags', () => {
    render(<App />);
    expect(screen.getAllByText('🇺🇸').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🇪🇸').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🇫🇷').length).toBeGreaterThan(0);
  });

  it('dismisses the SMART COMPANION TIP when the close button is clicked', () => {
    render(<App />);
    const tipHeader = screen.getByText(/SMART COMPANION TIP/i);
    expect(tipHeader).toBeInTheDocument();

    const tipContainer = tipHeader.closest('.bg-indigo-50');
    if (tipContainer) {
      const closeButton = tipContainer.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    }

    expect(screen.queryByText(/SMART COMPANION TIP/i)).not.toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Pillar 5: Accessibility (WCAG 2.1 AA)
  // ──────────────────────────────────────────────
  it('chat area has role="log" for screen readers', () => {
    render(<App />);
    const chatArea = document.getElementById('middle_chat_area');
    expect(chatArea).not.toBeNull();
    expect(chatArea?.getAttribute('role')).toBe('log');
  });

  it('chat area has aria-live="polite" for dynamic updates', () => {
    render(<App />);
    const chatArea = document.getElementById('middle_chat_area');
    expect(chatArea?.getAttribute('aria-live')).toBe('polite');
  });

  it('location dropdown button has aria-haspopup and aria-expanded', () => {
    render(<App />);
    const dropdownBtn = screen.getByLabelText('Select Current Location');
    expect(dropdownBtn).not.toBeNull();
    expect(dropdownBtn.getAttribute('aria-haspopup')).toBe('listbox');
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('language flags have aria-label for screen reader identification', () => {
    render(<App />);
    const spanishFlag = screen.getByLabelText(/Change language to Español/i);
    expect(spanishFlag).toBeInTheDocument();
  });

  it('send button has aria-label', () => {
    render(<App />);
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeInTheDocument();
  });

  it('dismiss tip button has aria-label', () => {
    render(<App />);
    const dismissBtn = screen.getByLabelText('Dismiss tip');
    expect(dismissBtn).toBeInTheDocument();
  });

  it('right panel tabs have role="tab" and aria-selected', () => {
    render(<App />);
    const mapTab = document.getElementById('tab-map');
    expect(mapTab).not.toBeNull();
    expect(mapTab?.getAttribute('role')).toBe('tab');
    expect(mapTab?.getAttribute('aria-selected')).toBe('true'); // default tab
    expect(mapTab?.getAttribute('aria-controls')).toBe('tabpanel-map');
  });

  it('tab container has role="tablist"', () => {
    render(<App />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(tablist.getAttribute('aria-label')).toBe('Stadium information panels');
  });

  it('emergency button has descriptive aria-label', () => {
    render(<App />);
    const emergencyBtn = screen.getByLabelText(/Request emergency assistance/i);
    expect(emergencyBtn).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Pillar 4: Edge Cases & Boundary Tests
  // ──────────────────────────────────────────────
  it('send button is disabled when input is empty', () => {
    render(<App />);
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeDisabled();
  });

  it('input field does not submit on empty whitespace-only value', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(
      /Ask about food, gate wait times/i,
    ) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: '   ' } });
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeDisabled();
  });

  it('chat input has aria-label for accessibility', () => {
    render(<App />);
    const inputElement = screen.getByLabelText('Chat message input');
    expect(inputElement).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Pillar 4: Integration & Error-State Tests
  // ──────────────────────────────────────────────

  it('handleSendMessage: user message appears and AI reply renders after send', async () => {
    // Override global fetch to handle both stadium data and chat API
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.endsWith('/api/stadium')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              stadiumName: 'Mock Stadium',
              sectors: [],
              gateStatus: {},
              emergencyInfo: { rules: [] },
            }),
        });
      }
      if (url.endsWith('/api/chat')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ reply: 'The nearest restroom is at Gate B.' }),
        });
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    });

    render(<App />);

    const inputElement = screen.getByPlaceholderText(
      /Ask about food, gate wait times/i
    ) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: 'Where is the restroom?' } });

    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);

    // User message should appear immediately
    await waitFor(() => {
      expect(screen.getByText('Where is the restroom?')).toBeInTheDocument();
    });

    // AI reply should appear after the mock fetch resolves
    await waitFor(() => {
      expect(screen.getByText(/nearest restroom is at Gate B/i)).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('displays error message when backend returns a 500 error', async () => {
    // Clear any persisted chat history that could interfere
    localStorage.removeItem('STADIUM_CHAT_HISTORY');

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.endsWith('/api/stadium')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              stadiumName: 'Mock Stadium',
              sectors: [],
              gateStatus: {},
              emergencyInfo: { rules: [] },
            }),
        });
      }
      if (url.endsWith('/api/chat')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ error: 'Gemini Service Error' }),
        });
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    });

    render(<App />);

    const inputElement = screen.getByPlaceholderText(
      /Ask about food, gate wait times/i
    ) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: 'Hello AI' } });

    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);

    // The error-state message should render in the chat feed
    const errorMsg = await screen.findByText(/high demand/i, {}, { timeout: 10000 });
    expect(errorMsg).toBeInTheDocument();

    global.fetch = originalFetch;
  }, 15000);

  it('renders gracefully when stadium data API fails on mount', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/stadium')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    });

    // The app should render without crashing even when the data API is unreachable
    render(<App />);

    // Core UI elements should still be present
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    expect(screen.getByText(/SMART COMPANION TIP/i)).toBeInTheDocument();

    global.fetch = originalFetch;
  });
});
