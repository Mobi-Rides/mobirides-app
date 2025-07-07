import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BarLoader } from "react-spinners";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";

import { SecurityMiddleware } from "@/components/security/SecurityMiddleware";
import { initializeGuestTracking, trackUserType } from "@/utils/analytics";
import "./App.css";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Profile = lazy(() => import("@/pages/Profile"));
const Map = lazy(() => import("@/pages/Map"));
const More = lazy(() => import("@/pages/More"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const AddCar = lazy(() => import("@/pages/AddCar"));
const DriverLicense = lazy(() => import("@/pages/DriverLicense"));
const EditCar = lazy(() => import("@/pages/EditCar"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const SavedCars = lazy(() => import("@/pages/SavedCars"));
const NotificationDetails = lazy(() => import("@/pages/NotificationDetails"));
const BookingRequestDetails = lazy(
  () => import("@/pages/BookingRequestDetails")
);
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const RentalReview = lazy(() => import("./pages/RentalReview"));
const RentalDetailsRefactored = lazy(
  () => import("./pages/RentalDetailsRefactored")
);
const Signup = lazy(() => import("./pages/signup"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Wallet = lazy(() => import("@/pages/Wallet"));

const PageTransitionLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-background/80">
      <div className="flex flex-col items-center justify-center py-3">
        <BarLoader color="#7c3aed" width={150} />
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
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
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route
            path="/profile"
            element={<Profile />}
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
            element={<Map />}
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
          <Route
            path="/bookings"
            element={<Bookings />}
          />
          <Route
            path="/notifications"
            element={<Notifications />}
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
        </Routes>
      </Suspense>
    </>
  );
};

function App() {
  useEffect(() => {
    // Initialize guest session tracking when app loads
    initializeGuestTracking();
    // Check for authenticated user and track user type
    const checkUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            const profileAge = Date.now() - new Date(profile.created_at).getTime();
            const isNewUser = profileAge < (30 * 24 * 60 * 60 * 1000); // 30 days
            const userType = isNewUser ? 'new' : 'returning';
            trackUserType(userType, 'login');
          }
        } catch (error) {
          console.error('Error determining user type:', error);
        }
      }
    };
    checkUserType();
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            const profileAge = Date.now() - new Date(profile.created_at).getTime();
            const isNewUser = profileAge < (30 * 24 * 60 * 60 * 1000); // 30 days
            const userType = isNewUser ? 'new' : 'returning';
            trackUserType(userType, 'login');
          }
        } catch (error) {
          console.error('Error determining user type on sign in:', error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SecurityMiddleware recaptchaSiteKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
          <Router>
            <AppRoutes />
            <ShadcnToaster />
            <SonnerToaster position="top-center" />
          </Router>
        </SecurityMiddleware>
      </AuthProvider>
    </ThemeProvider>
=======
import "./App.css";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Profile = lazy(() => import("@/pages/Profile"));
const Map = lazy(() => import("@/pages/Map"));
const More = lazy(() => import("@/pages/More"));
const CarDetails = lazy(() => import("@/pages/CarDetails"));
const AddCar = lazy(() => import("@/pages/AddCar"));
const DriverLicense = lazy(() => import("@/pages/DriverLicense"));
const EditCar = lazy(() => import("@/pages/EditCar"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const SavedCars = lazy(() => import("@/pages/SavedCars"));
const NotificationDetails = lazy(() => import("@/pages/NotificationDetails"));
const BookingRequestDetails = lazy(
  () => import("@/pages/BookingRequestDetails")
);
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const RentalReview = lazy(() => import("./pages/RentalReview"));
const RentalDetailsRefactored = lazy(
  () => import("./pages/RentalDetailsRefactored")
);
const Signup = lazy(() => import("./pages/signup"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Wallet = lazy(() => import("@/pages/Wallet"));

const PageTransitionLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-background/80">
      <div className="flex flex-col items-center justify-center py-3">
        <BarLoader color="#7c3aed" width={150} />
      </div>
    </div>
  );
}

const AppRoutes = () => {
  return (
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
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
          <AppRoutes />
          <ShadcnToaster />
          <SonnerToaster position="top-center" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;