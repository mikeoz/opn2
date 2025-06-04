
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyCards from "./pages/MyCards";
import Directory from "./pages/Directory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<MyCards />} />
          <Route path="/directory" element={<Directory />} />
          {/* Future routes for card management */}
          <Route path="/cards/create" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Create Card Feature</h2><p className="text-gray-600 mt-2">Coming Soon - Future Development</p></div>} />
          <Route path="/cards/add" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Add Card Feature</h2><p className="text-gray-600 mt-2">Coming Soon - Future Development</p></div>} />
          <Route path="/cards/share" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Share Card Feature</h2><p className="text-gray-600 mt-2">Coming Soon - Future Development</p></div>} />
          <Route path="/cards/share/:id" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Share Specific Card</h2><p className="text-gray-600 mt-2">Coming Soon - Future Development</p></div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
