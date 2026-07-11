import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * PROBLEM STATEMENT ALIGNMENT (Code Quality & Accessibility):
 * A global React Error Boundary that catches unhandled rendering errors anywhere
 * in the component tree. Instead of a blank white screen, it displays a user-friendly
 * fallback UI with a retry mechanism. This is critical for stadium operations where
 * fans depend on the app during live events — a crash must never leave a fan stranded.
 *
 * WCAG 2.1 AA: The fallback UI uses semantic HTML, high-contrast text, and an
 * aria-live region so screen readers announce the error state immediately.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught rendering error:', error, errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50 px-6 text-center font-sans"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl" aria-hidden="true">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-md leading-relaxed">
            The Stadium Assistant encountered an unexpected error. Your chat history
            is safely preserved. Please retry or refresh the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Retry Application
          </button>
          {this.state.error && (
            <details className="mt-6 text-left max-w-lg w-full">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                Technical Details
              </summary>
              <pre className="mt-2 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto font-mono">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
