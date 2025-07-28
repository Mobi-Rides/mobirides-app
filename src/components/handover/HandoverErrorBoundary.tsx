import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import { toast } from "@/utils/toast-utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class HandoverErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HandoverErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if you have one)
    // For now, we'll just log it
    const errorReport = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    console.error("Handover Error Report:", errorReport);
    
    // Show toast notification
    toast.error("A handover system error occurred. Please try again.");
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
      
      toast.info("Retrying handover process...");
    } else {
      toast.error("Maximum retry attempts reached. Please refresh the page.");
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleNavigateHome = () => {
    // Clear any URL parameters related to handover
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('mode');
    currentUrl.searchParams.delete('bookingId');
    window.history.replaceState({}, '', currentUrl.pathname);
    
    // Navigate to home
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const errorMessage = this.state.error?.message || "An unexpected error occurred";

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <div>
                <h3 className="font-semibold">Handover System Error</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {errorMessage}
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Retry attempt: {this.state.retryCount}/{this.maxRetries}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Handover
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReset}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Process
                </Button>
                
                <Button
                  onClick={this.handleNavigateHome}
                  className="w-full"
                  variant="secondary"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}