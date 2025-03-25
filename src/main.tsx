import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MapboxTokenProvider } from "./contexts/MapboxTokenContext";
import CarDetails from "./pages/CarDetails";
import CarListing from "./pages/CarListing";
import EditCar from "./pages/EditCar";
import CreateCar from "./pages/CreateCar";
import Profile from "./pages/Profile";
import Map from "./pages/Map";
import Bookings from "./pages/Bookings";
import RentalDetailsRefactored from "./pages/RentalDetailsRefactored";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/cars/:id",
    element: <CarDetails />,
  },
  {
    path: "/cars",
    element: <CarListing />,
  },
  {
    path: "/cars/:id/edit",
    element: <EditCar />,
  },
  {
    path: "/cars/new",
    element: <CreateCar />,
  },
  {
    path: "/profile/:id",
    element: <Profile />,
  },
  {
    path: "/map",
    element: <Map />,
  },
  {
    path: "/bookings",
    element: <Bookings />,
  },
  {
    path: "/rentals/:id",
    element: <RentalDetailsRefactored />,
  },
  {
    path: "/profile/:id/edit",
    element: <EditProfile />,
  },
  {
    path: "/notifications",
    element: <Notifications />,
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MapboxTokenProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors />
        </MapboxTokenProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
