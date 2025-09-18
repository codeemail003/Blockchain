import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

interface ComplianceOverviewProps {
  stats?: {
    totalRecords: number;
    totalAudits: number;
    passedChecks: number;
    failedChecks: number;
  };
}

const OverviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const StatItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const StatIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.$color}20;
  color: ${props => props.$color};
  font-size: ${props => props.theme.typography.fontSize.lg};
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-top: ${props => props.theme.spacing.xs};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${props => props.theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.sm};
`;

const ProgressFill = styled.div<{ $percentage: number; $color: string }>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => props.$color};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ stats }) => {
  if (!stats) {
    return (
      <OverviewContainer>
        <div>No compliance data available</div>
      </OverviewContainer>
    );
  }

  const totalChecks = stats.passedChecks + stats.failedChecks;
  const passRate = totalChecks > 0 ? (stats.passedChecks / totalChecks) * 100 : 0;

  const statItems = [
    {
      icon: FiCheckCircle,
      color: '#10b981',
      value: stats.passedChecks,
      label: 'Passed Checks',
    },
    {
      icon: FiXCircle,
      color: '#ef4444',
      value: stats.failedChecks,
      label: 'Failed Checks',
    },
    {
      icon: FiClock,
      color: '#f59e0b',
      value: stats.totalRecords - totalChecks,
      label: 'Pending Reviews',
    },
    {
      icon: FiAlertCircle,
      color: '#3b82f6',
      value: stats.totalAudits,
      label: 'Total Audits',
    },
  ];

  return (
    <OverviewContainer>
      {statItems.map((item, index) => (
        <StatItem
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatIcon $color={item.color}>
            <item.icon />
          </StatIcon>
          <StatInfo>
            <StatValue>{item.value.toLocaleString()}</StatValue>
            <StatLabel>{item.label}</StatLabel>
            {item.label === 'Passed Checks' && totalChecks > 0 && (
              <ProgressBar>
                <ProgressFill
                  $percentage={passRate}
                  $color={item.color}
                />
              </ProgressBar>
            )}
          </StatInfo>
        </StatItem>
      ))}
    </OverviewContainer>
  );
};

export default ComplianceOverview;