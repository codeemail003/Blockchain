import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import styled, { ThemeProvider } from 'styled-components';

// Contexts
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import BatchManagement from './pages/BatchManagement';
import ComplianceCenter from './pages/ComplianceCenter';
import WalletManagement from './pages/WalletManagement';
import FileManagement from './pages/FileManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Lazy loaded components for better performance
const BatchDetails = React.lazy(() => import('./pages/BatchDetails'));
const ComplianceDetails = React.lazy(() => import('./pages/ComplianceDetails'));
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory'));

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const SuspenseWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const App: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <AppContainer>
          <SuspenseWrapper>
            <LoadingSpinner size="large" />
          </SuspenseWrapper>
        </AppContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Helmet>
          <title>PharbitChain - Pharmaceutical Blockchain Management</title>
          <meta 
            name="description" 
            content="Secure, transparent, and compliant pharmaceutical supply chain management powered by blockchain technology." 
          />
        </Helmet>
        
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="batches" element={<BatchManagement />} />
            <Route 
              path="batches/:batchId" 
              element={
                <Suspense fallback={<LoadingSpinner size="large" />}>
                  <BatchDetails />
                </Suspense>
              } 
            />
            <Route path="compliance" element={<ComplianceCenter />} />
            <Route 
              path="compliance/:recordId" 
              element={
                <Suspense fallback={<LoadingSpinner size="large" />}>
                  <ComplianceDetails />
                </Suspense>
              } 
            />
            <Route path="wallets" element={<WalletManagement />} />
            <Route path="files" element={<FileManagement />} />
            <Route 
              path="transactions" 
              element={
                <Suspense fallback={<LoadingSpinner size="large" />}>
                  <TransactionHistory />
                </Suspense>
              } 
            />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;