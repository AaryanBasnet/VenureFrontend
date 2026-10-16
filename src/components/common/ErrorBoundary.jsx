import React from "react";
import Button from "../ui/Button";

// Last-resort screen when a page crashes. It sits outside the router, so it uses plain links and a reload.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream p-6">
        <div role="alert" className="w-full max-w-md rounded-card-xl border border-line bg-white p-8 text-center">
          <h1 className="font-display text-h3 font-light text-ink">Something went wrong</h1>
          <p className="mt-3 font-body text-body text-ink/80">
            The page ran into a problem. Trying again often fixes it, and your work on other pages is safe.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-card-sm bg-sand p-3 text-left font-mono text-caption text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={this.handleReset}>Try again</Button>
            <Button variant="outline-dark" href="/">
              Go home
            </Button>
          </div>
        </div>
      </main>
    );
  }
}
