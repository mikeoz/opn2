
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyCards from "./pages/MyCards";
import Directory from "./pages/Directory";
import AdminCards from "./pages/AdminCards";
import CreateCard from "./pages/CreateCard";
import ViewCard from "./pages/ViewCard";
import EditCard from "./pages/EditCard";
import NotFound from "./pages/NotFound";
import StandardTemplateLibrary from "./components/StandardTemplateLibrary";
import SecurityDashboard from "./pages/SecurityDashboard";
import BulkImport from "./pages/BulkImport";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/cards" element={
              <ProtectedRoute>
                <MyCards />
              </ProtectedRoute>
            } />
            <Route path="/directory" element={
              <ProtectedRoute>
                <Directory />
              </ProtectedRoute>
            } />
          <Route path="/admin/cards" element={
            <ProtectedRoute>
              <AdminCards />
            </ProtectedRoute>
          } />
          <Route path="/admin/security" element={
            <ProtectedRoute>
              <SecurityDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/bulk-import" element={
            <ProtectedRoute>
              <BulkImport />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
            <Route path="/cards/create/:templateId" element={
              <ProtectedRoute>
                <CreateCard />
              </ProtectedRoute>
            } />
            <Route path="/cards/view/:cardId" element={
              <ProtectedRoute>
                <ViewCard />
              </ProtectedRoute>
            } />
            <Route path="/cards/edit/:cardId" element={
              <ProtectedRoute>
                <EditCard />
              </ProtectedRoute>
            } />
            <Route path="/templates/standard" element={
              <ProtectedRoute>
                <StandardTemplateLibrary />
              </ProtectedRoute>
            } />
            <Route path="/cards/share/:id" element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold">Share Specific Card</h2>
                  <p className="text-gray-600 mt-2">Coming Soon - Future Development</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
