import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-sm text-center max-w-lg mx-auto my-12 animate-fade-in-up">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            An unexpected error occurred while rendering this page. You can try refreshing the page.
          </p>
          {this.state.error && (
            <pre className="text-left text-xs bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-40 overflow-y-auto text-rose-600 font-mono mb-6">
              {this.state.error.message}
            </pre>
          )}
          <Button
            variant="primary"
            icon={<RefreshCw size={14} />}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
