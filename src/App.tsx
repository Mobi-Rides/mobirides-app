
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Map from "@/pages/Map";
import More from "@/pages/More";
import CarDetails from "@/pages/CarDetails";
import AddCar from "@/pages/AddCar";
import DriverLicense from "@/pages/DriverLicense";
import EditCar from "@/pages/EditCar";
import Bookings from "@/pages/Bookings";
import SavedCars from "@/pages/SavedCars";
import NotificationDetails from "@/pages/NotificationDetails";
import BookingRequestDetails from "@/pages/BookingRequestDetails";
import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BarLoader } from "react-spinners";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MapboxTokenProvider } from "@/contexts/MapboxTokenContext";
import "./App.css";
import { RentalReview } from "./pages/RentalReview";
import RentalDetailsRefactored from "./pages/RentalDetailsRefactored";
import Signup from "./pages/signup";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

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
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
        <Route path="/cars/:id" element={<ProtectedRoute><CarDetails /></ProtectedRoute>} />
        <Route path="/add-car" element={<ProtectedRoute><AddCar /></ProtectedRoute>} />
        <Route path="/driver-license" element={<ProtectedRoute><DriverLicense /></ProtectedRoute>} />
        <Route path="/edit-car/:id" element={<ProtectedRoute><EditCar /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/saved-cars" element={<ProtectedRoute><SavedCars /></ProtectedRoute>} />
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
        <Route path="/rental-details/:id" element={<ProtectedRoute><RentalDetailsRefactored /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <MapboxTokenProvider>
        <Router>
          <AppRoutes />
          <ShadcnToaster />
          <SonnerToaster position="top-center" />
        </Router>
      </MapboxTokenProvider>
    </ThemeProvider>
  );
};

export default App;
