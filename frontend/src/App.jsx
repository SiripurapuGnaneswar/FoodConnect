import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import LoginPage     from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DonationsPage from "./pages/DonationsPage";
import RequestsPage  from "./pages/RequestsPage";
import MapSearchPage from "./pages/MapSearchPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "DM Sans, system-ui, sans-serif",
              fontSize: "0.875rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            },
            success: { iconTheme: { primary: "#2D7A4F", secondary: "#fff" } },
          }}
        />

        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="donations"     element={<DonationsPage />} />
            <Route path="donations/new" element={<DonationsPage />} />
            <Route path="requests"      element={<RequestsPage />} />
            <Route path="map"           element={<MapSearchPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
