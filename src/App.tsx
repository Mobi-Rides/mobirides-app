import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import "./App.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapboxTokenProvider } from "@/contexts/MapboxTokenContext";
import { LocationSearchProvider } from "@/contexts/LocationSearchContext";
import { VerificationProvider } from "@/contexts/VerificationContext";
import { HandoverProvider } from "@/contexts/HandoverContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingView } from "@/components/home/LoadingView";
import { ChatManager } from "@/components/chat/ChatManager";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
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

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/signup"));
const Profile = lazy(() => import("@/pages/Profile"));
const Map = lazy(() => import("@/pages/Map"));
const More = lazy(() => import("@/pages/More"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const AddCar = lazy(() => import("@/pages/AddCar"));
const DriverLicense = lazy(() => import("@/pages/DriverLicense"));
const EditCar = lazy(() => import("@/pages/EditCar"));
const SavedCars = lazy(() => import("@/pages/SavedCars"));
const BookingDetails = lazy(() => import("@/components/BookingDetails"));
const NotificationDetails = lazy(() => import("@/components/NotificationDetails"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const HelpSection = lazy(() => import("@/pages/HelpSection"));

const BookingRequestDetails = lazy(
  () => import("@/pages/BookingRequestDetails"),
);
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotificationsRefactored = lazy(() => import("@/pages/NotificationsRefactored"));
const Messages = lazy(() => import("@/pages/Messages"));
const RentalReview = lazy(() => import("./pages/RentalReview"));
const RentalDetailsRefactored = lazy(
  () => import("./pages/RentalDetailsRefactored"),
);
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ConfirmEmail = lazy(() => import("@/pages/ConfirmEmail"));
const Wallet = lazy(() => import("@/pages/Wallet"));
const Verification = lazy(() => import("@/pages/Verification"));
const NotificationPreferencesPage = lazy(() => import("@/pages/NotificationPreferencesPage"));
const CreateCar = lazy(() => import("@/pages/CreateCar"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const CarListing = lazy(() => import("@/pages/CarListing"));
const ResendTestPage = lazy(() => import("@/pages/ResendTestPage"));
const EmailConfirmationTestPage = lazy(() => import("@/pages/EmailConfirmationTestPage"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminCars = lazy(() => import("@/pages/admin/AdminCars"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminTransactions = lazy(() => import("@/pages/admin/AdminTransactions"));
const AdminVerifications = lazy(() => import("@/pages/admin/AdminVerifications"));
const AdminMessages = lazy(() => import("@/pages/admin/AdminMessages"));
const AdminManagement = lazy(() => import("@/pages/admin/AdminManagement"));

// Role-specific booking pages
const HostBookings = lazy(() => import("@/pages/HostBookings"));
const RenterBookings = lazy(() => import("@/pages/RenterBookings"));
const RoleAwareBookingsRedirect = lazy(() => import("@/components/RoleAwareBookingsRedirect"));

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <MapboxTokenProvider>
              <LocationSearchProvider>
                <VerificationProvider>
                  <TooltipProvider>
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
                        <Route path="/confirm-email" element={
                          <Suspense fallback={<LoadingView />}>
                            <ConfirmEmail />
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
                        <Route path="/edit-car/:id" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <EditCar />
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
                        <Route path="/rental-review/:bookingId" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <RentalReview />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/rental-details/:id" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <RentalDetailsRefactored />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/verification" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <Verification />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/notification-preferences" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <NotificationPreferencesPage />
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
                        <Route path="/map" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <HandoverRoute>
                                <Map />
                              </HandoverRoute>
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

                        {/* Role-aware booking routing */}
                        <Route path="/bookings" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <RoleAwareBookingsRedirect />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/bookings/:id" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <BookingDetails />
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
                              <NotificationsRefactored />
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
                        
                        {/* Help Center Routes */}
                        <Route path="/help/:role" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <HelpCenter />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/help/:role/:section" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <HelpSection />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        
                        <Route path="/messages" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <Messages />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        
                        {/* Testing Routes */}
                        <Route path="/test/resend" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <ResendTestPage />
                            </ProtectedRoute>
                          </Suspense>
                        } />
                        <Route path="/test/email-confirmation" element={
                          <Suspense fallback={<LoadingView />}>
                            <ProtectedRoute>
                              <EmailConfirmationTestPage />
                            </ProtectedRoute>
                          </Suspense>
                        } />

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminDashboard />
                          </Suspense>
                        } />
                        <Route path="/admin/users" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminUsers />
                          </Suspense>
                        } />
                        <Route path="/admin/cars" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminCars />
                          </Suspense>
                        } />
                        <Route path="/admin/bookings" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminBookings />
                          </Suspense>
                        } />
                        <Route path="/admin/transactions" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminTransactions />
                          </Suspense>
                        } />
                        <Route path="/admin/verifications" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminVerifications />
                          </Suspense>
                        } />
                        <Route path="/admin/messages" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminMessages />
                          </Suspense>
                        } />
                        <Route path="/admin/management" element={
                          <Suspense fallback={<LoadingView />}>
                            <AdminManagement />
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
                      
                      {/* Global Chat Manager */}
                      <ChatManager />
                      
                      <Toaster position="top-center" />
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
}

export default App;