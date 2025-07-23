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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingView } from "@/components/home/LoadingView";
import "./App.css";

const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Profile = lazy(() => import("@/pages/Profile"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const CarForm = lazy(() => import("@/pages/CarForm"));
const Map = lazy(() => import("@/pages/Map"));
const Booking = lazy(() => import("@/pages/Booking"));
const Verification = lazy(() => import("@/pages/Verification"));
const PasswordReset = lazy(() => import("@/pages/PasswordReset"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const CarManagement = lazy(() => import("@/pages/CarManagement"));
const BookingManagement = lazy(() => import("@/pages/BookingManagement"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const HostManagement = lazy(() => import("@/pages/HostManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
                      <Route path="/register" element={
                        <Suspense fallback={<LoadingView />}>
                          <Register />
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
                      <Route path="/cars/new" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <CarForm />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/map" element={
                        <Suspense fallback={<LoadingView />}>
                          <Map />
                        </Suspense>
                      } />
                      <Route path="/booking/:carId" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute>
                            <Booking />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/verify" element={
                        <Suspense fallback={<LoadingView />}>
                          <Verification />
                        </Suspense>
                      } />
                      <Route path="/reset-password" element={
                        <Suspense fallback={<LoadingView />}>
                          <PasswordReset />
                        </Suspense>
                      } />
                      <Route path="/admin" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/admin/cars" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute requiredRole="admin">
                            <CarManagement />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/admin/bookings" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute requiredRole="admin">
                            <BookingManagement />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/admin/users" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute requiredRole="admin">
                            <UserManagement />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="/admin/hosts" element={
                        <Suspense fallback={<LoadingView />}>
                          <ProtectedRoute requiredRole="admin">
                            <HostManagement />
                          </ProtectedRoute>
                        </Suspense>
                      } />
                      <Route path="*" element={
                        <Suspense fallback={<LoadingView />}>
                          <NotFound />
                        </Suspense>
                      } />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </VerificationProvider>
            </LocationSearchProvider>
          </MapboxTokenProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
