import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      /Ask about food, gate wait times/i
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
    const { container } = render(<App />);
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
      /Ask about food, gate wait times/i
    ) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: '   ' } });
    const sendBtn = screen.getByLabelText('Send message');
    // Send button should still be effectively disabled because trim() yields empty
    expect(sendBtn).toBeDisabled();
  });

  it('chat input has aria-label for accessibility', () => {
    render(<App />);
    const inputElement = screen.getByLabelText('Chat message input');
    expect(inputElement).toBeInTheDocument();
  });
});
