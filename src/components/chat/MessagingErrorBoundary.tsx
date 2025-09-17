import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, MessageCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class MessagingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `msg-error-${Date.now()}`;
    console.error(`MessagingErrorBoundary [${errorId}]:`, error);
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`MessagingErrorBoundary [${this.state.errorId}] caught:`, error, errorInfo);
    console.error("Component stack:", errorInfo.componentStack);
    console.error("Error boundary details:", {
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  private handleRetry = () => {
    console.log(`MessagingErrorBoundary [${this.state.errorId}]: Attempting retry`);
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  private handleRefresh = () => {
    console.log(`MessagingErrorBoundary [${this.state.errorId}]: Refreshing page`);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-4">
          <Alert className="max-w-md border-destructive">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="space-y-4">
              <div>
                <h3 className="font-semibold text-destructive">Messages Failed to Load</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There was an error loading the messaging interface. This might be a temporary issue.
                </p>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical details
                  </summary>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                    <div>Error ID: {this.state.errorId}</div>
                    <div>Message: {this.state.error?.message}</div>
                    <div>Time: {new Date().toLocaleString()}</div>
                  </div>
                </details>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                  size="sm"
                >
                  <MessageCircle className="mr-2 h-3 w-3" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleRefresh}
                  className="flex-1"
                  variant="destructive"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh Page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}