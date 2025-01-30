import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;