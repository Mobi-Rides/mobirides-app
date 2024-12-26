import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import AddCar from "./pages/AddCar";
import SavedCars from "./pages/SavedCars";
import More from "./pages/More";
import CarDetails from "./pages/CarDetails";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/add-car" element={<ProtectedRoute><AddCar /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedCars /></ProtectedRoute>} />
          <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/cars/:id" element={<ProtectedRoute><CarDetails /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;