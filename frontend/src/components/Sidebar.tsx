import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiShield,
  FiCreditCard,
  FiFileText,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiLayers,
  FiUsers,
  FiBarChart3,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const SidebarContainer = styled(motion.aside)`
  height: 100vh;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  min-height: 80px;
`;

const SidebarLogo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.text};
  transition: all 0.3s ease;

  ${props => props.$collapsed && `
    justify-content: center;
  `}
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  flex-shrink: 0;
`;

const LogoText = styled.span<{ $collapsed: boolean }>`
  transition: opacity 0.3s ease;
  white-space: nowrap;
  overflow: hidden;

  ${props => props.$collapsed && `
    opacity: 0;
    width: 0;
  `}
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  border: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    border-color: ${props => props.theme.colors.primary};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: ${props => props.theme.spacing.md} 0;
  overflow-y: auto;
`;

const NavSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3<{ $collapsed: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  padding: 0 ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;

  ${props => props.$collapsed && `
    opacity: 0;
    height: 0;
    margin: 0;
    padding: 0;
  `}
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLinkStyled = styled(NavLink)<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textSecondary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: all 0.2s ease;
  position: relative;
  border-radius: 0;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }

  &.active {
    background-color: ${props => props.theme.colors.primary}10;
    color: ${props => props.theme.colors.primary};
    border-right: 3px solid ${props => props.theme.colors.primary};

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: ${props => props.theme.colors.primary};
    }
  }

  ${props => props.$collapsed && `
    justify-content: center;
    padding: ${props.theme.spacing.md};
  `}
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const NavText = styled.span<{ $collapsed: boolean }>`
  transition: opacity 0.3s ease;
  white-space: nowrap;
  overflow: hidden;

  ${props => props.$collapsed && `
    opacity: 0;
    width: 0;
  `}
`;

const NavBadge = styled.span`
  background-color: ${props => props.theme.colors.error};
  color: white;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
  min-width: 18px;
  text-align: center;
`;

const SidebarFooter = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const UserInfo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.3s ease;

  ${props => props.$collapsed && `
    justify-content: center;
    padding: ${props.theme.spacing.sm};
  `}
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  font-size: ${props => props.theme.typography.fontSize.sm};
  flex-shrink: 0;
`;

const UserDetails = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  transition: all 0.3s ease;

  ${props => props.$collapsed && `
    opacity: 0;
    width: 0;
    overflow: hidden;
  `}
`;

const UserName = styled.span`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const UserRole = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      section: 'Main',
      items: [
        { path: '/dashboard', icon: FiHome, label: 'Dashboard', exact: true },
        { path: '/batches', icon: FiPackage, label: 'Batch Management' },
        { path: '/compliance', icon: FiShield, label: 'Compliance Center' },
        { path: '/wallets', icon: FiCreditCard, label: 'Wallet Management' },
        { path: '/files', icon: FiFileText, label: 'File Management' },
      ],
    },
    {
      section: 'Analytics',
      items: [
        { path: '/transactions', icon: FiActivity, label: 'Transactions' },
        { path: '/analytics', icon: FiBarChart3, label: 'Analytics' },
      ],
    },
    {
      section: 'System',
      items: [
        { path: '/settings', icon: FiSettings, label: 'Settings' },
      ],
    },
  ];

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <SidebarContainer
      initial={false}
      animate={{
        width: collapsed ? 80 : 280,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      <SidebarHeader>
        <SidebarLogo $collapsed={collapsed}>
          <LogoIcon>P</LogoIcon>
          <LogoText $collapsed={collapsed}>PharbitChain</LogoText>
        </SidebarLogo>
        
        <CollapseButton onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </CollapseButton>
      </SidebarHeader>

      <Navigation>
        {navigationItems.map((section) => (
          <NavSection key={section.section}>
            <SectionTitle $collapsed={collapsed}>{section.section}</SectionTitle>
            <NavList>
              {section.items.map((item) => (
                <NavItem key={item.path}>
                  <NavLinkStyled
                    to={item.path}
                    $collapsed={collapsed}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <NavIcon>
                      <item.icon />
                    </NavIcon>
                    <NavText $collapsed={collapsed}>{item.label}</NavText>
                    {item.path === '/compliance' && (
                      <NavBadge>3</NavBadge>
                    )}
                  </NavLinkStyled>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        ))}
      </Navigation>

      <SidebarFooter>
        <UserInfo $collapsed={collapsed}>
          <UserAvatar>
            {user?.address ? user.address.slice(2, 4).toUpperCase() : 'U'}
          </UserAvatar>
          <UserDetails $collapsed={collapsed}>
            <UserName>{user ? formatAddress(user.address) : 'User'}</UserName>
            <UserRole>{user?.role || 'Guest'}</UserRole>
          </UserDetails>
        </UserInfo>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;