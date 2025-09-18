import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: string;
  trendDirection?: 'up' | 'down';
  subtitle?: string;
}

const CardContainer = styled(motion.div)`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary}30;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CardIcon = styled.div<{ $color: string }>`
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

const CardContent = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const CardValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const TrendContainer = styled.div<{ $direction: 'up' | 'down' }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.$direction === 'up' ? props.theme.colors.success : props.theme.colors.error};
`;

const TrendIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardSubtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const BackgroundPattern = styled.div<{ $color: string }>`
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, ${props => props.$color}10, ${props => props.$color}05);
  border-radius: 50%;
  opacity: 0.3;
`;

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendDirection = 'up',
  subtitle,
}) => {
  const colorMap = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  };

  const cardColor = colorMap[color];

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  return (
    <CardContainer
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <BackgroundPattern $color={cardColor} />
      
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardIcon $color={cardColor}>
          <Icon />
        </CardIcon>
      </CardHeader>

      <CardContent>
        <CardValue>{formatValue(value)}</CardValue>
        {trend && (
          <TrendContainer $direction={trendDirection}>
            <TrendIcon>
              {trendDirection === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
            </TrendIcon>
            <span>{trend}</span>
          </TrendContainer>
        )}
      </CardContent>

      {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
    </CardContainer>
  );
};

export default StatCard;