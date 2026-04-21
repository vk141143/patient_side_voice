import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ForgotPasswordScreen } from "./components/screens/ForgotPasswordScreen";
import { useNavigate } from "react-router-dom";
import { AdminApp } from "./admin/AdminApp";

const queryClient = new QueryClient();

// Handles Firebase action URLs: ?mode=resetPassword&oobCode=...
function FirebaseActionHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  if (mode === 'resetPassword' && oobCode) {
    return <ForgotPasswordScreen oobCode={oobCode} onBack={() => navigate('/')} onSuccess={() => navigate('/')} />;
  }
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FirebaseActionHandler />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="/__/auth/action" element={<FirebaseActionHandler />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
