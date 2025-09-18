import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiShield, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: transparent;
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.surface};
    border-color: ${props => props.theme.colors.primary};
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

const ComplianceDetails: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader>
        <BackButton to="/compliance">
          <FiArrowLeft />
          Back to Compliance
        </BackButton>
        <PageTitle>
          <PageIcon>
            <FiShield />
          </PageIcon>
          Compliance Details
        </PageTitle>
      </PageHeader>

      <ContentCard>
        <PlaceholderContent>
          <PlaceholderIcon>
            <FiShield />
          </PlaceholderIcon>
          <PlaceholderTitle>Compliance Details Coming Soon</PlaceholderTitle>
          <PlaceholderDescription>
            This page will show detailed information about a specific compliance record,
            including audit findings, corrective actions, and related documentation.
          </PlaceholderDescription>
        </PlaceholderContent>
      </ContentCard>
    </PageContainer>
  );
};

export default ComplianceDetails;