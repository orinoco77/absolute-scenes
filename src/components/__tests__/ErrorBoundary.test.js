import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
// eslint-disable-next-line react/prefer-stateless-function
class ThrowError extends React.Component {
  render() {
    if (this.props.shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  }
}

// Mock console.error to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    console.error.mockClear();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders app-level error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('⚠️ Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Don't worry - your work is auto-saved/)
    ).toBeInTheDocument();
  });

  test('renders section-level error UI when section prop is true', () => {
    render(
      <ErrorBoundary section>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('⚠️ This section encountered an error')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Try refreshing the app or continuing with other sections/
      )
    ).toBeInTheDocument();
  });

  test('displays error details in app-level UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error details should be in a <details> element
    const details = screen.getByText('Error Details (for debugging)');
    expect(details).toBeInTheDocument();

    // Click to expand details
    fireEvent.click(details);

    // Check that error message is displayed
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  test('handles "Try to Continue" button in app-level UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText('⚠️ Something went wrong')).toBeInTheDocument();

    // Verify the "Try to Continue" button is present and clickable
    const continueButton = screen.getByText('Try to Continue');
    expect(continueButton).toBeInTheDocument();

    // Click should not throw an error
    expect(() => fireEvent.click(continueButton)).not.toThrow();
  });

  test('handles "Reload App" button in app-level UI', () => {
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Click "Reload App"
    const reloadButton = screen.getByText('Reload App');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  test('handles "Dismiss" button in section-level UI', () => {
    render(
      <ErrorBoundary section>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be displayed
    expect(
      screen.getByText('⚠️ This section encountered an error')
    ).toBeInTheDocument();

    // Verify the "Dismiss" button is present and clickable
    const dismissButton = screen.getByText('Dismiss');
    expect(dismissButton).toBeInTheDocument();

    // Click should not throw an error
    expect(() => fireEvent.click(dismissButton)).not.toThrow();
  });

  test('logs error to console when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
  });

  test('does not render error UI if no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Working Component</div>
      </ErrorBoundary>
    );

    expect(
      screen.queryByText('⚠️ Something went wrong')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('⚠️ This section encountered an error')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });

  test('renders multiple children correctly', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  test('catches errors in nested components', () => {
    const NestedComponent = () => {
      return (
        <div>
          <ThrowError shouldThrow={true} />
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('⚠️ Something went wrong')).toBeInTheDocument();
  });

  test('app-level UI contains both action buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try to Continue')).toBeInTheDocument();
    expect(screen.getByText('Reload App')).toBeInTheDocument();
  });

  test('section-level UI only contains dismiss button', () => {
    render(
      <ErrorBoundary section>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(screen.queryByText('Try to Continue')).not.toBeInTheDocument();
    expect(screen.queryByText('Reload App')).not.toBeInTheDocument();
  });

  test('displays component stack in error details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Expand error details
    const details = screen.getByText('Error Details (for debugging)');
    fireEvent.click(details);

    // Check for "Component Stack" label
    expect(screen.getByText('Component Stack:')).toBeInTheDocument();
  });
});
