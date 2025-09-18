import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiPlus, 
  FiPackage, 
  FiShield, 
  FiUpload, 
  FiCreditCard,
  FiFileText,
  FiSettings
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ActionItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  text-decoration: none;
  color: ${props => props.theme.colors.text};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary}30;
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const ActionIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.$color}20;
  color: ${props => props.$color};
  font-size: ${props => props.theme.typography.fontSize.lg};
  flex-shrink: 0;
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const ActionDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const ActionBadge = styled.span`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: auto;
`;

const QuickActions: React.FC = () => {
  const { canAccess } = useAuth();

  const actions = [
    {
      title: 'Create Batch',
      description: 'Add a new pharmaceutical batch to the blockchain',
      icon: FiPlus,
      color: '#3b82f6',
      path: '/batches',
      requiredRoles: ['manufacturer', 'admin'],
    },
    {
      title: 'Upload Documents',
      description: 'Upload compliance documents and certificates',
      icon: FiUpload,
      color: '#10b981',
      path: '/files',
      requiredRoles: ['manufacturer', 'distributor', 'pharmacy', 'admin'],
    },
    {
      title: 'Compliance Check',
      description: 'Record a new compliance verification',
      icon: FiShield,
      color: '#f59e0b',
      path: '/compliance',
      requiredRoles: ['auditor', 'compliance_officer', 'quality_manager', 'admin'],
    },
    {
      title: 'Generate Wallets',
      description: 'Create new Ethereum wallets for team members',
      icon: FiCreditCard,
      color: '#8b5cf6',
      path: '/wallets',
      requiredRoles: ['admin'],
    },
    {
      title: 'View Analytics',
      description: 'Access detailed analytics and reports',
      icon: FiFileText,
      color: '#06b6d4',
      path: '/analytics',
      requiredRoles: ['admin', 'regulator'],
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences and permissions',
      icon: FiSettings,
      color: '#64748b',
      path: '/settings',
      requiredRoles: ['admin'],
    },
  ];

  const filteredActions = actions.filter(action => 
    canAccess(action.requiredRoles)
  );

  return (
    <ActionsContainer>
      {filteredActions.map((action, index) => (
        <ActionItem
          key={action.title}
          as={Link}
          to={action.path}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ActionIcon $color={action.color}>
            <action.icon />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>{action.title}</ActionTitle>
            <ActionDescription>{action.description}</ActionDescription>
          </ActionContent>
          {action.title === 'Create Batch' && (
            <ActionBadge>New</ActionBadge>
          )}
        </ActionItem>
      ))}
    </ActionsContainer>
  );
};

export default QuickActions;