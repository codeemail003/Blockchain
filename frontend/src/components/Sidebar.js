import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiHome, 
  FiUpload, 
  FiPackage, 
  FiShield, 
  FiUsers, 
  FiSettings,
  FiActivity,
  FiTrendingUp,
  FiCreditCard
} from 'react-icons/fi';

const SidebarContainer = styled.aside`
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  z-index: 200;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xl};
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${props => props.theme.spacing.lg} 0;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textSecondary};
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }

  &.active {
    background-color: ${props => props.theme.colors.primary}10;
    color: ${props => props.theme.colors.primary};
    font-weight: 500;

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
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const NavText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

const NavBadge = styled.span`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
`;

const SectionTitle = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: ${props => props.theme.spacing.lg};

  &:first-child {
    margin-top: 0;
  }
`;

const Footer = styled.div`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const Version = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

const Sidebar = () => {
  const navItems = [
    {
      path: '/',
      icon: FiHome,
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/deploy',
      icon: FiUpload,
      label: 'Deploy Contracts',
      badge: 'New'
    },
    {
      path: '/batches',
      icon: FiPackage,
      label: 'Batch Management'
    },
    {
      path: '/compliance',
      icon: FiShield,
      label: 'Compliance Center'
    },
    {
      path: '/roles',
      icon: FiUsers,
      label: 'Role Management'
    },
    {
      path: '/wallet',
      icon: FiCreditCard,
      label: 'Wallet Generator'
    },
    {
      path: '/settings',
      icon: FiSettings,
      label: 'Settings'
    }
  ];

  const analyticsItems = [
    {
      path: '/analytics',
      icon: FiActivity,
      label: 'Analytics'
    },
    {
      path: '/reports',
      icon: FiTrendingUp,
      label: 'Reports'
    }
  ];

  return (
    <SidebarContainer>
      <Logo>
        <FiPackage size={24} />
        PharbitChain
      </Logo>

      <Nav>
        <NavList>
          {navItems.map((item) => (
            <NavItem key={item.path}>
              <NavLinkStyled 
                to={item.path} 
                end={item.exact}
              >
                <NavIcon>
                  <item.icon size={20} />
                </NavIcon>
                <NavText>{item.label}</NavText>
                {item.badge && <NavBadge>{item.badge}</NavBadge>}
              </NavLinkStyled>
            </NavItem>
          ))}
        </NavList>

        <SectionTitle>Analytics</SectionTitle>
        <NavList>
          {analyticsItems.map((item) => (
            <NavItem key={item.path}>
              <NavLinkStyled to={item.path}>
                <NavIcon>
                  <item.icon size={20} />
                </NavIcon>
                <NavText>{item.label}</NavText>
              </NavLinkStyled>
            </NavItem>
          ))}
        </NavList>
      </Nav>

      <Footer>
        <Version>v1.0.0</Version>
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar;