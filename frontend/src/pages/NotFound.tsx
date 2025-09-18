import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft, FiSearch } from 'react-icons/fi';

const NotFoundContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background-color: ${props => props.theme.colors.background};
`;

const NotFoundIcon = styled.div`
  font-size: 8rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  opacity: 0.8;
`;

const NotFoundTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const NotFoundSubtitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const NotFoundDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  max-width: 600px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.md};
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &.primary {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};

    &:hover {
      background-color: ${props => props.theme.colors.primary}dd;
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${props => props.theme.colors.text};
    border-color: ${props => props.theme.colors.border};

    &:hover {
      background-color: ${props => props.theme.colors.surface};
      border-color: ${props => props.theme.colors.primary};
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const SearchSuggestion = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  max-width: 500px;
`;

const SearchTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SearchList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: left;
`;

const SearchItem = styled.li`
  margin-bottom: ${props => props.theme.spacing.sm};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SearchLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:hover {
    text-decoration: underline;
  }
`;

const NotFound: React.FC = () => {
  const suggestions = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/batches', label: 'Batch Management' },
    { path: '/compliance', label: 'Compliance Center' },
    { path: '/wallets', label: 'Wallet Management' },
    { path: '/files', label: 'File Management' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <NotFoundContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NotFoundIcon>
          <FiSearch />
        </NotFoundIcon>

        <NotFoundTitle>404</NotFoundTitle>
        <NotFoundSubtitle>Page Not Found</NotFoundSubtitle>
        <NotFoundDescription>
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
        </NotFoundDescription>

        <ButtonGroup>
          <Button to="/dashboard" className="primary">
            <FiHome />
            Go to Dashboard
          </Button>
          <Button to="javascript:history.back()" className="secondary">
            <FiArrowLeft />
            Go Back
          </Button>
        </ButtonGroup>

        <SearchSuggestion>
          <SearchTitle>
            <FiSearch />
            Popular Pages
          </SearchTitle>
          <SearchList>
            {suggestions.map((suggestion) => (
              <SearchItem key={suggestion.path}>
                <SearchLink to={suggestion.path}>
                  {suggestion.label}
                </SearchLink>
              </SearchItem>
            ))}
          </SearchList>
        </SearchSuggestion>
      </motion.div>
    </NotFoundContainer>
  );
};

export default NotFound;