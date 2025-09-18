import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPackage, FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';
import { Batch } from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';

interface RecentBatchesProps {
  batches: Batch[];
  isLoading?: boolean;
}

const BatchesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const BatchItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary}30;
    transform: translateX(4px);
  }
`;

const BatchIcon = styled.div<{ $status: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => {
    const statusColors = {
      0: props.theme.colors.info, // Created
      1: props.theme.colors.warning, // In Transit
      2: props.theme.colors.success, // Received
      3: props.theme.colors.primary, // In Storage
      4: props.theme.colors.secondary, // Dispensed
      5: props.theme.colors.error, // Recalled
    };
    return statusColors[props.$status as keyof typeof statusColors] || props.theme.colors.textSecondary;
  }}20;
  color: ${props => {
    const statusColors = {
      0: props.theme.colors.info,
      1: props.theme.colors.warning,
      2: props.theme.colors.success,
      3: props.theme.colors.primary,
      4: props.theme.colors.secondary,
      5: props.theme.colors.error,
    };
    return statusColors[props.$status as keyof typeof statusColors] || props.theme.colors.textSecondary;
  }};
  flex-shrink: 0;
`;

const BatchInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BatchName = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BatchDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

const BatchDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const BatchStatus = styled.span<{ $status: number }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${props => {
    const statusColors = {
      0: props.theme.colors.info + '20',
      1: props.theme.colors.warning + '20',
      2: props.theme.colors.success + '20',
      3: props.theme.colors.primary + '20',
      4: props.theme.colors.secondary + '20',
      5: props.theme.colors.error + '20',
    };
    return statusColors[props.$status as keyof typeof statusColors] || props.theme.colors.textSecondary + '20';
  }};
  color: ${props => {
    const statusColors = {
      0: props.theme.colors.info,
      1: props.theme.colors.warning,
      2: props.theme.colors.success,
      3: props.theme.colors.primary,
      4: props.theme.colors.secondary,
      5: props.theme.colors.error,
    };
    return statusColors[props.$status as keyof typeof statusColors] || props.theme.colors.textSecondary;
  }};
`;

const ArrowIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  transition: all 0.2s ease;

  ${BatchItem}:hover & {
    color: ${props => props.theme.colors.primary};
    transform: translateX(2px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: ${props => props.theme.colors.textSecondary}50;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const EmptyTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const EmptyDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${props => props.theme.spacing.xl};
`;

const getStatusText = (status: number): string => {
  const statusMap = {
    0: 'Created',
    1: 'In Transit',
    2: 'Received',
    3: 'In Storage',
    4: 'Dispensed',
    5: 'Recalled',
  };
  return statusMap[status as keyof typeof statusMap] || 'Unknown';
};

const RecentBatches: React.FC<RecentBatchesProps> = ({ batches, isLoading }) => {
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="medium" />
      </LoadingContainer>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>
          <FiPackage />
        </EmptyIcon>
        <EmptyTitle>No batches found</EmptyTitle>
        <EmptyDescription>
          Create your first pharmaceutical batch to get started with the blockchain system.
        </EmptyDescription>
      </EmptyState>
    );
  }

  return (
    <BatchesContainer>
      {batches.map((batch, index) => (
        <BatchItem
          key={batch.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          as={Link}
          to={`/batches/${batch.batchId}`}
        >
          <BatchIcon $status={batch.status}>
            <FiPackage />
          </BatchIcon>

          <BatchInfo>
            <BatchName>{batch.drugName}</BatchName>
            <BatchDetails>
              <BatchDetail>
                <FiCalendar />
                <span>{format(new Date(batch.createdAt), 'MMM dd, yyyy')}</span>
              </BatchDetail>
              <BatchDetail>
                <FiUser />
                <span>{batch.manufacturer}</span>
              </BatchDetail>
              <BatchStatus $status={batch.status}>
                {getStatusText(batch.status)}
              </BatchStatus>
            </BatchDetails>
          </BatchInfo>

          <ArrowIcon>
            <FiArrowRight />
          </ArrowIcon>
        </BatchItem>
      ))}
    </BatchesContainer>
  );
};

export default RecentBatches;