import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 32,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <AlertTriangle size={36} color="var(--risk-high)" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>
            {this.props.title || 'Component Error'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 540, margin: '0 auto 16px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred. The application has contained the error safely to avoid a blank screen.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-accent" onClick={this.handleReset}>
              <RefreshCw size={14} /> Retry View
            </button>
            <button className="btn" onClick={() => window.location.href = '/dashboard'}>
              <Home size={14} /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

