import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import LoadingSpinner from './LoadingSpinner';
import { FiWallet } from 'react-icons/fi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background-color: ${props => props.theme.colors.background};
`;

const LoadingText = styled.p`
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.fontSize.lg};
`;

const WalletRequiredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background-color: ${props => props.theme.colors.background};
`;

const WalletIcon = styled.div`
  font-size: 4rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const WalletTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const WalletMessage = styled.p`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 600px;
  line-height: 1.6;
`;

const ConnectButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [] 
}) => {
  const { isAuthenticated, isLoading: authLoading, user, canAccess } = useAuth();
  const { isConnected, isConnecting, connect } = useWeb3();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="large" />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <WalletRequiredContainer>
        <WalletIcon>
          <FiWallet />
        </WalletIcon>
        
        <WalletTitle>Wallet Required</WalletTitle>
        
        <WalletMessage>
          Please connect your MetaMask wallet to access the pharmaceutical blockchain management system.
          This ensures secure transaction signing and blockchain interaction.
        </WalletMessage>
        
        <ConnectButton onClick={connect} disabled={isConnecting}>
          <FiWallet />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </ConnectButton>
      </WalletRequiredContainer>
    );
  }

  // Check role and permission requirements
  if (requiredRoles.length > 0 || requiredPermissions.length > 0) {
    if (!canAccess(requiredRoles, requiredPermissions)) {
      return (
        <WalletRequiredContainer>
          <WalletIcon>
            <FiWallet />
          </WalletIcon>
          
          <WalletTitle>Access Denied</WalletTitle>
          
          <WalletMessage>
            You don't have the required permissions to access this page.
            {user && ` Your current role: ${user.role}`}
          </WalletMessage>
        </WalletRequiredContainer>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;