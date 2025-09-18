import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background-color: ${props => props.theme.colors.background};
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: ${props => props.theme.colors.error};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ErrorTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ErrorMessage = styled.p`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 600px;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: left;
  max-width: 800px;
  width: 100%;
`;

const ErrorSummary = styled.summary`
  cursor: pointer;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const ErrorStack = styled.pre`
  background-color: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  font-family: ${props => props.theme.typography.fontFamily.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.md};
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  ${props => props.variant === 'primary' ? `
    background-color: ${props.theme.colors.primary};
    color: white;
    border-color: ${props.theme.colors.primary};

    &:hover {
      background-color: ${props.theme.colors.primary}dd;
      transform: translateY(-1px);
    }
  ` : `
    background-color: transparent;
    color: ${props.theme.colors.text};
    border-color: ${props.theme.colors.border};

    &:hover {
      background-color: ${props.theme.colors.surface};
      border-color: ${props.theme.colors.primary};
    }
  `}

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
    resetErrorBoundary();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <ErrorContainer>
      <ErrorIcon>
        <FiAlertTriangle />
      </ErrorIcon>
      
      <ErrorTitle>Something went wrong</ErrorTitle>
      
      <ErrorMessage>
        We're sorry, but something unexpected happened. This error has been logged and our team has been notified.
      </ErrorMessage>

      <ErrorDetails>
        <ErrorSummary>
          Technical Details
        </ErrorSummary>
        <ErrorStack>
          {error.name}: {error.message}
          {error.stack && `\n\n${error.stack}`}
        </ErrorStack>
      </ErrorDetails>

      <ButtonGroup>
        <Button variant="primary" onClick={resetErrorBoundary}>
          <FiRefreshCw />
          Try Again
        </Button>
        
        <Button variant="secondary" onClick={handleGoHome}>
          <FiHome />
          Go Home
        </Button>
        
        <Button variant="secondary" onClick={handleRefresh}>
          <FiRefreshCw />
          Refresh Page
        </Button>
      </ButtonGroup>
    </ErrorContainer>
  );
};

export default ErrorFallback;