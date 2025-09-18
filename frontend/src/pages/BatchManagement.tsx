import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPackage, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const PageTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const PageIcon = styled.div`
  color: ${props => props.theme.colors.primary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
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

  ${props => props.$variant === 'primary' ? `
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
`;

const SearchBar = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SearchInput = styled.input`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.fontSize.md};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ContentCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
`;

const PlaceholderIcon = styled.div`
  font-size: 4rem;
  color: ${props => props.theme.colors.textSecondary}50;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PlaceholderTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const PlaceholderDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  max-width: 500px;
  line-height: 1.6;
`;

const BatchManagement: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon>
            <FiPackage />
          </PageIcon>
          Batch Management
        </PageTitle>
        <ActionButtons>
          <Button $variant="secondary">
            <FiFilter />
            Filter
          </Button>
          <Button $variant="primary">
            <FiPlus />
            Create Batch
          </Button>
        </ActionButtons>
      </PageHeader>

      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search batches by drug name, batch ID, or manufacturer..."
        />
        <Button $variant="secondary">
          <FiSearch />
          Search
        </Button>
      </SearchBar>

      <ContentCard>
        <PlaceholderContent>
          <PlaceholderIcon>
            <FiPackage />
          </PlaceholderIcon>
          <PlaceholderTitle>Batch Management Coming Soon</PlaceholderTitle>
          <PlaceholderDescription>
            This page will allow you to create, view, and manage pharmaceutical batches on the blockchain.
            You'll be able to track batch status, transfer ownership, and view detailed compliance information.
          </PlaceholderDescription>
        </PlaceholderContent>
      </ContentCard>
    </PageContainer>
  );
};

export default BatchManagement;