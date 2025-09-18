import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiWallet, FiArrowRight, FiShield, FiActivity, FiUsers } from 'react-icons/fi';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}10, ${props => props.theme.colors.secondary}10);
`;

const LoginCard = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: ${props => props.theme.shadows.xl};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  border-radius: ${props => props.theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const LogoText = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const Title = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  text-align: center;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  line-height: 1.6;
`;

const ConnectButton = styled(motion.button)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${props => props.theme.spacing.lg};

  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FeaturesList = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.xl};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const FeaturesTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  text-align: center;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const FeatureIcon = styled.div`
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.typography.fontSize.md};
`;

const ErrorMessage = styled.div`
  background-color: ${props => props.theme.colors.error}10;
  border: 1px solid ${props => props.theme.colors.error}30;
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connect, isConnected, isConnecting } = useWeb3();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
      
      // Auto-login after wallet connection
      if (isConnected) {
        await login(''); // Address will be taken from connected wallet
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    }
  };

  if (isLoading) {
    return (
      <LoginContainer>
        <LoginCard>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Connecting...</p>
          </div>
        </LoginCard>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <LogoIcon>P</LogoIcon>
          <LogoText>PharbitChain</LogoText>
        </Logo>

        <Title>Welcome Back</Title>
        <Subtitle>
          Connect your MetaMask wallet to access the pharmaceutical blockchain management system
        </Subtitle>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <ConnectButton
          onClick={handleConnect}
          disabled={isConnecting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isConnecting ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <FiWallet />
          )}
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          <FiArrowRight />
        </ConnectButton>

        <FeaturesList>
          <FeaturesTitle>What you can do:</FeaturesTitle>
          <FeatureItem>
            <FeatureIcon>
              <FiShield />
            </FeatureIcon>
            Track pharmaceutical batches on the blockchain
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>
              <FiActivity />
            </FeatureIcon>
            Monitor compliance and audit trails
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>
              <FiUsers />
            </FeatureIcon>
            Manage team access and permissions
          </FeatureItem>
        </FeaturesList>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;