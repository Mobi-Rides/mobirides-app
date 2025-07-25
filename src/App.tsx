
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
<<<<<<< Updated upstream
=======
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
>>>>>>> Stashed changes

const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Profile = lazy(() => import("@/pages/Profile"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
<<<<<<< Updated upstream
const Map = lazy(() => import("@/pages/Map"));
=======
const AddCar = lazy(() => import("@/pages/AddCar"));
const DriverLicense = lazy(() => import("@/pages/DriverLicense"));
const EditCar = lazy(() => import("@/pages/EditCar"));
const SavedCars = lazy(() => import("@/pages/SavedCars"));
const NotificationDetails = lazy(() => import("@/pages/NotificationDetails"));
const BookingRequestDetails = lazy(
  () => import("@/pages/BookingRequestDetails"),
);
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const Messages = lazy(() => import("@/pages/Messages"));
const RentalReview = lazy(() => import("./pages/RentalReview"));
const RentalDetailsRefactored = lazy(
  () => import("./pages/RentalDetailsRefactored"),
);
const Signup = lazy(() => import("./pages/signup"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Wallet = lazy(() => import("@/pages/Wallet"));
>>>>>>> Stashed changes
const Verification = lazy(() => import("@/pages/Verification"));
const NotificationPreferencesPage = lazy(() => import("@/pages/NotificationPreferencesPage"));

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
<<<<<<< Updated upstream
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

=======
    <>
      <PageTransitionLoader />
      <Suspense
        fallback={
          <div className="fixed top-0 left-0 w-full z-50 bg-background/80">
            <div className="flex flex-col items-center justify-center py-3">
              <BarLoader color="#7c3aed" width={150} />
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <Map />
              </ProtectedRoute>
            }
          />
          <Route
            path="/more"
            element={
              <ProtectedRoute>
                <More />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cars/:id"
            element={
              <ProtectedRoute>
                <CarDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-car"
            element={
              <ProtectedRoute>
                <AddCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-license"
            element={
              <ProtectedRoute>
                <DriverLicense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-car/:id"
            element={
              <ProtectedRoute>
                <EditCar />
              </ProtectedRoute>
            }
          />
          {/* Role-aware booking routing */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <RoleAwareBookingsRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host-bookings"
            element={
              <ProtectedRoute>
                <HostBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renter-bookings"
            element={
              <ProtectedRoute>
                <RenterBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-cars"
            element={
              <ProtectedRoute>
                <SavedCars />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/:id"
            element={
              <ProtectedRoute>
                <NotificationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-requests/:id"
            element={
              <ProtectedRoute>
                <BookingRequestDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/rental-review/:bookingId" element={<RentalReview />} />
          <Route
            path="/rental-details/:id"
            element={
              <ProtectedRoute>
                <RentalDetailsRefactored />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <Verification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notification-preferences"
            element={
              <ProtectedRoute>
                <NotificationPreferencesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <ShadcnToaster />
          <SonnerToaster position="top-center" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

>>>>>>> Stashed changes
export default App;
