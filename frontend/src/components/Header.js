import React from 'react';
import styled from 'styled-components';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { FiMenu, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { FaEthereum } from 'react-icons/fa';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const MenuButton = styled.button`
  display: none;
  padding: ${props => props.theme.spacing.sm};
  border: none;
  background: none;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.md};

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const NetworkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const NetworkIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.connected ? props.theme.colors.success : props.theme.colors.error};
`;

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem;
`;

const AccountAddress = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const AccountBalance = styled.span`
  color: ${props => props.theme.colors.textSecondary};
`;

const ConnectButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActionButton = styled.button`
  padding: ${props => props.theme.spacing.sm};
  border: none;
  background: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const Header = () => {
  const { 
    isInstalled, 
    isConnected, 
    account, 
    chainId, 
    balance, 
    connect, 
    disconnect, 
    getNetworkName, 
    formatAddress 
  } = useMetaMask();

  const { deploymentStatus } = useBlockchain();

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton>
          <FiMenu size={20} />
        </MenuButton>
        <Logo>
          <FaEthereum size={24} />
          PharbitChain
        </Logo>
      </LeftSection>

      <RightSection>
        {isInstalled ? (
          isConnected ? (
            <>
              <NetworkInfo>
                <NetworkIndicator connected={isConnected} />
                <span>{getNetworkName(chainId)}</span>
              </NetworkInfo>
              
              <AccountInfo>
                <AccountAddress>{formatAddress(account)}</AccountAddress>
                <AccountBalance>{parseFloat(balance).toFixed(4)} ETH</AccountBalance>
              </AccountInfo>

              <ActionButton title="Notifications">
                <FiBell size={20} />
              </ActionButton>

              <ActionButton title="Settings">
                <FiSettings size={20} />
              </ActionButton>

              <ActionButton onClick={handleDisconnect} title="Disconnect">
                <FiLogOut size={20} />
              </ActionButton>
            </>
          ) : (
            <ConnectButton onClick={handleConnect}>
              Connect MetaMask
            </ConnectButton>
          )
        ) : (
          <ConnectButton disabled>
            Install MetaMask
          </ConnectButton>
        )}
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;