import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Map from "@/pages/Map";
import More from "@/pages/More";
import CarDetails from "@/pages/CarDetails";
import AddCar from "@/pages/AddCar";
import EditCar from "@/pages/EditCar";
import Bookings from "@/pages/Bookings";
import SavedCars from "@/pages/SavedCars";
import NotificationDetails from "@/pages/NotificationDetails";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public landing route that redirects to login */}
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
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
            path="/notifications/:id"
            element={
              <ProtectedRoute>
                <NotificationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedCars />
              </ProtectedRoute>
            }
          />
          <Route path="/more" element={<More />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route
            path="/cars/add"
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
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            }
          />
          {/* Catch all unmatched routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </Router>
    </QueryClientProvider>
  );
}

export default App;