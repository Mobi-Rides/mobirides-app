
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
const Signup = lazy(() => import("@/pages/signup"));
const Profile = lazy(() => import("@/pages/Profile"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const Map = lazy(() => import("@/pages/Map"));
const Verification = lazy(() => import("@/pages/Verification"));
const RentalDetails = lazy(() => import("@/pages/RentalDetailsRefactored"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AddCar = lazy(() => import("@/pages/AddCar"));
const CreateCar = lazy(() => import("@/pages/CreateCar"));
const EditCar = lazy(() => import("@/pages/EditCar"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const HostBookings = lazy(() => import("@/pages/HostBookings"));
const RenterBookings = lazy(() => import("@/pages/RenterBookings"));
const BookingRequestDetails = lazy(() => import("@/pages/BookingRequestDetails"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const NotificationDetails = lazy(() => import("@/pages/NotificationDetails"));
const Wallet = lazy(() => import("@/pages/Wallet"));
const SavedCars = lazy(() => import("@/pages/SavedCars"));
const DriverLicense = lazy(() => import("@/pages/DriverLicense"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const RentalReview = lazy(() => import("@/pages/RentalReview"));
const More = lazy(() => import("@/pages/More"));
const CarListing = lazy(() => import("@/pages/CarListing"));

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
                      <Route path="/signup" element={
                        <Suspense fallback={<LoadingView />}>
                          <Signup />
                        </Suspense>
                      } />
                      <Route path="/reset-password" element={
                        <Suspense fallback={<LoadingView />}>
                          <ResetPassword />
                        </Suspense>
                      } />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/edit-profile" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <EditProfile />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/dashboard" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/cars/:carId" element={
                        <Suspense fallback={<LoadingView />}>
                          <CarDetails />
                        </Suspense>
                      } />
                      <Route path="/car-listing" element={
                        <Suspense fallback={<LoadingView />}>
                          <CarListing />
                        </Suspense>
                      } />
                      <Route path="/add-car" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <AddCar />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/create-car" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <CreateCar />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/edit-car/:carId" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <EditCar />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/bookings" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Bookings />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/host-bookings" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <HostBookings />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/renter-bookings" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <RenterBookings />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/booking-requests/:id" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <BookingRequestDetails />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/notifications" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/notifications/:id" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <NotificationDetails />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/wallet" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Wallet />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/saved-cars" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <SavedCars />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/driver-license" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <DriverLicense />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/rental-review/:id" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <RentalReview />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/more" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <More />
                          </ProtectedRoute>
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
