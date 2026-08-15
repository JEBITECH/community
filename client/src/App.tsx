import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/appRoutes";
import { AuthProvider } from "./erp/context/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingProvider } from "./utils/hooks/useLoading";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { BrandingProvider } from "./contexts/BrandingContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoadingProvider>
          <TooltipProvider>
            <Toaster />
            <AuthProvider>
              <OrganizationProvider>
                <BrandingProvider>
                  <BrowserRouter>
                    <AppRouter />
                  </BrowserRouter>
                </BrandingProvider>
              </OrganizationProvider>
            </AuthProvider>
          </TooltipProvider>
        </LoadingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
