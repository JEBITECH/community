// Authentication context with automatic token refresh and inactivity detection
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { isTokenExpired, shouldRefreshToken, refreshAccessToken } from "@/lib/tokenRefresh";
import { useInactivityDetection } from "@/hooks/useInactivityDetection";
import { SessionExtensionDialog } from "@/components/SessionExtensionDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization_id?: number;
}

interface ModuleAccess {
  module_id: number;
  name: string;
  status: boolean;
  action_list: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  modules: ModuleAccess[];
  login: (data: { user: User; accessToken: string; refreshToken: string; module_list_access_by_user: ModuleAccess[] }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  updateToken: (newToken: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);

  // Session Management Settings
  const INACTIVITY_TIMEOUT = 25 * 60 * 1000;
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
  const DIALOG_COUNTDOWN_SECONDS = 60;

  const handleInactivity = useCallback(() => {
    if (user && token) {
      setShowInactivityDialog(true);
    }
  }, [user, token]);

 
  const handleExtendSession = useCallback(async () => {
    setShowInactivityDialog(false);
    const newToken = await refreshAccessToken();
    if (newToken) {
      updateToken(newToken);
    }
  }, []);

  const handleInactivityLogout = useCallback(async () => {
    setShowInactivityDialog(false);
    await performLogout();
  }, []);

  useInactivityDetection({
    timeout: INACTIVITY_TIMEOUT,
    onInactive: handleInactivity,
    enabled: !!user && !!token,
  });

  useEffect(() => {
    if (!token || !user) return;

    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && shouldRefreshToken(currentToken)) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          updateToken(newToken);
        } else {
          logout();
        }
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedModules = localStorage.getItem("modules");

    if (storedUser && storedToken) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        // Token is expired, try to refresh
        refreshAccessToken().then((newToken) => {
          if (newToken) {
            setUser(JSON.parse(storedUser));
            setToken(newToken);
            setModules(storedModules ? JSON.parse(storedModules) : []);
            localStorage.setItem('token', newToken);
          } else {
            // Refresh failed, clear everything
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("modules");
          }
          setLoading(false);
        });
      } else {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setModules(storedModules ? JSON.parse(storedModules) : []);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((data: { user: User; accessToken: string; refreshToken: string; module_list_access_by_user: ModuleAccess[] }) => {
    queryClient.clear();
    setUser(data.user);
    setToken(data.accessToken);
    setModules(data.module_list_access_by_user);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("modules", JSON.stringify(data.module_list_access_by_user));
  }, []);

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }, []);

  const performLogout = useCallback(async () => {
    try {
      await apiRequest("POST", "/auth/logout");
    } catch (error) {
      // Continue with logout even if API call fails
    }

    setUser(null);
    setToken(null);
    setModules([]);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("modules");
    localStorage.removeItem("selectedOrganizationId");

    queryClient.clear();
  }, []);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  return (
    <>
      <AuthContext.Provider
        value={{
          user,
          token,
          modules,
          login,
          logout,
          isAuthenticated: !!token,
          loading,
          updateToken,
        }}
      >
        {children}
      </AuthContext.Provider>
      
      <SessionExtensionDialog
        open={showInactivityDialog}
        onExtend={handleExtendSession}
        onLogout={handleInactivityLogout}
        countdownSeconds={DIALOG_COUNTDOWN_SECONDS}
      />
    </>
  );
}

