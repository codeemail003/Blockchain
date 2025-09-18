import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService, User } from '../services/apiService';
import { useWeb3 } from './Web3Context';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  
  // Auth methods
  login: (address: string) => Promise<void>;
  register: (address: string, role?: string, permissions?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // User methods
  updateUser: (updates: Partial<User>) => void;
  
  // Utility methods
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (requiredRoles: string[], requiredPermissions?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { isConnected, account } = useWeb3();
  const queryClient = useQueryClient();

  // Initialize auth state
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      apiService.setAuthToken(savedToken);
    }
  }, []);

  // Auto-login when wallet connects
  useEffect(() => {
    if (isConnected && account && !isAuthenticated) {
      handleAutoLogin(account);
    }
  }, [isConnected, account, isAuthenticated]);

  const handleAutoLogin = async (address: string) => {
    try {
      // Try to login first
      await login(address);
    } catch (error) {
      // If login fails, try to register
      try {
        await register(address);
      } catch (registerError) {
        console.error('Auto-login failed:', registerError);
      }
    }
  };

  // Query for current user
  const { isLoading: isLoadingUser } = useQuery(
    ['user'],
    () => apiService.getCurrentUser(),
    {
      enabled: isAuthenticated && !!token,
      onSuccess: (data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      },
      onError: () => {
        // Token might be invalid
        logout();
      },
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    (address: string) => apiService.login(address),
    {
      onSuccess: (data) => {
        const { user: userData, token: authToken } = data;
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        apiService.setAuthToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.address.slice(0, 6)}...${userData.address.slice(-4)}!`);
      },
      onError: (error: any) => {
        console.error('Login error:', error);
        toast.error(error.response?.data?.error || 'Login failed');
      },
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    ({ address, role, permissions }: { address: string; role?: string; permissions?: string[] }) =>
      apiService.register(address, role, permissions),
    {
      onSuccess: (data) => {
        const { user: userData, token: authToken } = data;
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        apiService.setAuthToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(`Account created successfully!`);
      },
      onError: (error: any) => {
        console.error('Registration error:', error);
        toast.error(error.response?.data?.error || 'Registration failed');
      },
    }
  );

  // Refresh token mutation
  const refreshTokenMutation = useMutation(
    () => apiService.refreshToken(),
    {
      onSuccess: (data) => {
        const { token: newToken } = data;
        setToken(newToken);
        apiService.setAuthToken(newToken);
        localStorage.setItem('authToken', newToken);
      },
      onError: () => {
        // Refresh failed, logout user
        logout();
      },
    }
  );

  // Logout mutation
  const logoutMutation = useMutation(
    () => apiService.logout(),
    {
      onSuccess: () => {
        handleLogout();
      },
      onError: () => {
        // Even if logout fails on server, clear local state
        handleLogout();
      },
    }
  );

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    apiService.removeAuthToken();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  const login = async (address: string) => {
    await loginMutation.mutateAsync(address);
  };

  const register = async (address: string, role?: string, permissions?: string[]) => {
    await registerMutation.mutateAsync({ address, role, permissions });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refreshToken = async () => {
    await refreshTokenMutation.mutateAsync();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission) || user.permissions.includes('*');
  };

  const canAccess = (requiredRoles: string[], requiredPermissions?: string[]): boolean => {
    // Check roles
    if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role || '')) {
      return false;
    }
    
    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      return requiredPermissions.every(permission => hasPermission(permission));
    }
    
    return true;
  };

  const isLoading = isLoadingUser || loginMutation.isLoading || registerMutation.isLoading;

  const value: AuthContextType = {
    // Auth state
    isAuthenticated,
    isLoading,
    user,
    token,
    
    // Auth methods
    login,
    register,
    logout,
    refreshToken,
    
    // User methods
    updateUser,
    
    // Utility methods
    hasRole,
    hasPermission,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;