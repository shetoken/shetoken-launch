import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { trackPageview } from "@/lib/analytics";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { SiteFooter } from "@/components/SiteFooter";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CountryDetail from "./pages/CountryDetail.tsx";
import Whitepaper from "./pages/Whitepaper.tsx";
import Why from "./pages/Why.tsx";
import Community from "./pages/Community.tsx";
import Profile from "./pages/Profile.tsx";
import Compare from "./pages/Compare.tsx";
import SHEconomy from "./pages/SHEconomy.tsx";
import SheClock from "./pages/SheClock.tsx";
import SafetyHotspots from "./pages/SafetyHotspots.tsx";
import AdminConsole from "./pages/AdminConsole.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import Drives from "./pages/Drives.tsx";
import Initiatives from "./pages/Initiatives.tsx";
import IndexLandscape from "./pages/IndexLandscape.tsx";
import Methodology from "./pages/Methodology.tsx";
import WhyBackShe from "./pages/WhyBackShe.tsx";
import NotFound from "./pages/NotFound.tsx";

/** Records a page view on every route change (best-effort). */
function PageTracker() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => { void trackPageview(pathname, user?.id); }, [pathname, user?.id]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {/* Global auth modal — openable from any component via useAuth().openAuth() */}
            <AuthModal />
            <PageTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/country/:iso" element={<CountryDetail />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
              <Route path="/why" element={<Why />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/drives" element={<Drives />} />
              <Route path="/initiatives" element={<Initiatives />} />
              <Route path="/index-landscape" element={<IndexLandscape />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/why-back-she" element={<WhyBackShe />} />
              <Route path="/simulator" element={<SHEconomy />} />
              <Route path="/sheconomy" element={<Navigate to="/marketplace" replace />} />
              <Route path="/she-clock" element={<SheClock />} />
              <Route path="/safety" element={<SafetyHotspots />} />
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="/admin/downloads" element={<Navigate to="/admin?tab=downloads" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SiteFooter />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
