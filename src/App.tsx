import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import AddCar from "@/pages/AddCar";
import EditCar from "@/pages/EditCar";
import CarDetails from "@/pages/CarDetails";
import SavedCars from "@/pages/SavedCars";
import Bookings from "@/pages/Bookings";
import Map from "@/pages/Map";
import More from "@/pages/More";
import DriverLicense from "@/pages/DriverLicense";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<Map />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
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
          path="/cars/:id/edit"
          element={
            <ProtectedRoute>
              <EditCar />
            </ProtectedRoute>
          }
        />
        <Route path="/cars/:id" element={<CarDetails />} />
        <Route
          path="/saved-cars"
          element={
            <ProtectedRoute>
              <SavedCars />
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
        <Route path="/more" element={<More />} />
        <Route
          path="/driver-license"
          element={
            <ProtectedRoute>
              <DriverLicense />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      <SonnerToaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;