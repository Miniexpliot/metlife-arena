import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock the Google Maps components to avoid needing an actual API key during testing
vi.mock('@vis.gl/react-google-maps', () => {
  return {
    APIProvider: ({ children }: any) => <div>{children}</div>,
    Map: () => <div data-testid="google-map-mock">Map Mock</div>,
    AdvancedMarker: ({ children }: any) => <div>{children}</div>,
    Pin: () => <div>Pin</div>
  };
});

describe('App Component', () => {
  
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
    const inputElement = screen.getByPlaceholderText(/Ask about food, gate wait times/i) as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: 'Where is the nearest hot dog?' } });
    expect(inputElement.value).toBe('Where is the nearest hot dog?');
  });

  it('renders the custom language flags', () => {
    render(<App />);
    // Verify a few flags are rendered using their flag emojis
    expect(screen.getAllByText('🇺🇸').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🇪🇸').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🇫🇷').length).toBeGreaterThan(0);
  });

  it('dismisses the SMART COMPANION TIP when the close button is clicked', () => {
    const { container } = render(<App />);
    const tipHeader = screen.getByText(/SMART COMPANION TIP/i);
    expect(tipHeader).toBeInTheDocument();
    
    // Find the tip container
    const tipContainer = tipHeader.closest('.bg-indigo-50');
    if (tipContainer) {
      const closeButton = tipContainer.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    }
    
    expect(screen.queryByText(/SMART COMPANION TIP/i)).not.toBeInTheDocument();
  });

});
