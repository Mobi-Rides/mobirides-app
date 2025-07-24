
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocationSearchProvider } from "@/contexts/LocationSearchContext";
import { MapboxTokenProvider } from "@/contexts/MapboxTokenContext";
import { VerificationProvider } from "@/contexts/VerificationContext";
import { HandoverProvider } from "@/contexts/HandoverContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingView } from "@/components/home/LoadingView";
import { AuthProvider } from "@/hooks/useAuth";
import "./App.css";

const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Profile = lazy(() => import("@/pages/Profile"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const Map = lazy(() => import("@/pages/Map"));
const Verification = lazy(() => import("@/pages/Verification"));
const RentalDetails = lazy(() => import("@/pages/RentalDetailsRefactored"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Component to conditionally wrap routes that need HandoverProvider
const HandoverRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <HandoverProvider>
      {children}
    </HandoverProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <MapboxTokenProvider>
              <LocationSearchProvider>
                <VerificationProvider>
                  <TooltipProvider>
                  <Toaster />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={
                        <Suspense fallback={<LoadingView />}>
                          <Index />
                        </Suspense>
                      } />
                      <Route path="/login" element={
                        <Suspense fallback={<LoadingView />}>
                          <Login />
                        </Suspense>
                      } />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/cars/:carId" element={
                        <Suspense fallback={<LoadingView />}>
                          <CarDetails />
                        </Suspense>
                      } />
                      <Route path="/map" element={
                        <Suspense fallback={<LoadingView />}>
                          <HandoverRoute>
                            <Map />
                          </HandoverRoute>
                        </Suspense>
                      } />
                      <Route path="/verify" element={
                        <Suspense fallback={<LoadingView />}>
                          <Verification />
                        </Suspense>
                      } />
                      <Route path="/rental-details/:id" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <RentalDetails />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="*" element={
                        <Suspense fallback={<LoadingView />}>
                          <div className="flex items-center justify-center min-h-screen">
                            <div className="text-center">
                              <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                              <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                            </div>
                          </div>
                        </Suspense>
                      } />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </VerificationProvider>
            </LocationSearchProvider>
          </MapboxTokenProvider>
        </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
