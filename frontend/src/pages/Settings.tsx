import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSettings, FiUser, FiShield, FiBell, FiPalette } from 'react-icons/fi';
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

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SettingsCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
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

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const CardDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  flex: 1;
`;

const SettingName = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const SettingDescription = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const Toggle = styled.button<{ $active: boolean }>`
  position: relative;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$active ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: all 0.2s ease;
  }
`;

const Settings: React.FC = () => {
  const settingsCategories = [
    {
      title: 'Profile Settings',
      description: 'Manage your account information and preferences',
      icon: FiUser,
      color: '#3b82f6',
      settings: [
        {
          name: 'Email Notifications',
          description: 'Receive email updates about batch status changes',
          type: 'toggle',
          value: true,
        },
        {
          name: 'Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          type: 'toggle',
          value: false,
        },
        {
          name: 'Profile Visibility',
          description: 'Control who can see your profile information',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Security Settings',
      description: 'Configure security preferences and access controls',
      icon: FiShield,
      color: '#10b981',
      settings: [
        {
          name: 'Session Timeout',
          description: 'Automatically log out after 30 minutes of inactivity',
          type: 'toggle',
          value: true,
        },
        {
          name: 'IP Whitelist',
          description: 'Restrict access to specific IP addresses',
          type: 'toggle',
          value: false,
        },
        {
          name: 'Audit Logging',
          description: 'Log all user actions for security monitoring',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Notification Settings',
      description: 'Customize how you receive notifications',
      icon: FiBell,
      color: '#f59e0b',
      settings: [
        {
          name: 'Push Notifications',
          description: 'Receive real-time notifications in your browser',
          type: 'toggle',
          value: true,
        },
        {
          name: 'SMS Alerts',
          description: 'Get critical alerts via SMS',
          type: 'toggle',
          value: false,
        },
        {
          name: 'Weekly Reports',
          description: 'Receive weekly summary reports',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Appearance Settings',
      description: 'Customize the look and feel of the application',
      icon: FiPalette,
      color: '#8b5cf6',
      settings: [
        {
          name: 'Dark Mode',
          description: 'Use dark theme for better visibility in low light',
          type: 'toggle',
          value: false,
        },
        {
          name: 'Compact View',
          description: 'Use a more compact layout to fit more content',
          type: 'toggle',
          value: false,
        },
        {
          name: 'High Contrast',
          description: 'Increase contrast for better accessibility',
          type: 'toggle',
          value: false,
        },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon>
            <FiSettings />
          </PageIcon>
          Settings
        </PageTitle>
      </PageHeader>

      <SettingsGrid>
        {settingsCategories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SettingsCard>
              <CardHeader>
                <CardIcon $color={category.color}>
                  <category.icon />
                </CardIcon>
                <CardTitle>{category.title}</CardTitle>
              </CardHeader>
              <CardDescription>{category.description}</CardDescription>
              
              {category.settings.map((setting, settingIndex) => (
                <SettingItem key={setting.name}>
                  <SettingLabel>
                    <SettingName>{setting.name}</SettingName>
                    <SettingDescription>{setting.description}</SettingDescription>
                  </SettingLabel>
                  <Toggle $active={setting.value} />
                </SettingItem>
              ))}
            </SettingsCard>
          </motion.div>
        ))}
      </SettingsGrid>
    </PageContainer>
  );
};

export default Settings;