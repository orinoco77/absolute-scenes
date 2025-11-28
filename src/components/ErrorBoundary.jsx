import React from 'react';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send to error tracking service in the future
    // Example: sendErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleContinue = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI based on whether this is a section boundary or app-level
      const isSection = this.props.section;

      if (isSection) {
        // Minimal error UI for section-level boundaries
        return (
          <div className="error-boundary-section">
            <div className="error-boundary-section-content">
              <h3>⚠️ This section encountered an error</h3>
              <p>Try refreshing the app or continuing with other sections.</p>
              <button onClick={this.handleContinue} className="btn-small">
                Dismiss
              </button>
            </div>
          </div>
        );
      }

      // Full error UI for app-level boundary
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h1>⚠️ Something went wrong</h1>
            <p className="error-boundary-message">
              Don&apos;t worry - your work is auto-saved. You can try to
              continue or reload the app.
            </p>

            {this.state.error && (
              <details className="error-details">
                <summary>Error Details (for debugging)</summary>
                <div className="error-stack">
                  <strong>Error:</strong>
                  <pre>{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <>
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleContinue} className="btn-primary">
                Try to Continue
              </button>
              <button onClick={this.handleReload} className="btn-secondary">
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
