
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SalaryBenchmark from "./pages/SalaryBenchmark";
import SalaryComparison from "./pages/SalaryComparison";
import NegotiationCoach from "./pages/NegotiationCoach";
import SalaryResults from "./pages/SalaryResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/salary-benchmark" element={<SalaryBenchmark />} />
          <Route path="/salary-comparison" element={<SalaryComparison />} />
          <Route path="/negotiation-coach" element={<NegotiationCoach />} />
          <Route path="/salary-results" element={<SalaryResults />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
