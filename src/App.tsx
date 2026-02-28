import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DatasetProvider } from "@/contexts/DatasetContext";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Distribution from "./pages/Distribution";
import Correlation from "./pages/Correlation";
import FairnessMetrics from "./pages/FairnessMetrics";
import Mitigation from "./pages/Mitigation";
import AuditReport from "./pages/AuditReport";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DatasetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/distribution" element={<Distribution />} />
            <Route path="/correlation" element={<Correlation />} />
            <Route path="/fairness" element={<FairnessMetrics />} />
            <Route path="/mitigation" element={<Mitigation />} />
            <Route path="/report" element={<AuditReport />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DatasetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
