import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import PharmaBatchManager from '../components/PharmaBatchManager';
import ComplianceManager from '../components/ComplianceManager';
import WalletGenerator from '../components/WalletGenerator';
import { FiPackage, FiShield, FiCreditCard, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SupplyChainContainer = styled.div`
  padding: ${props => props.theme.spacing.xl};
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const StatIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Tabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  overflow-x: auto;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const TabContent = styled.div`
  min-height: 600px;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.connected ? props.theme.colors.success + '20' : props.theme.colors.error + '20'};
  border: 1px solid ${props => props.connected ? props.theme.colors.success : props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  color: ${props => props.connected ? props.theme.colors.success : props.theme.colors.error};
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 50%;
  border-top-color: ${props => props.theme.colors.primary};
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const PharmaceuticalSupplyChain = () => {
  const [activeTab, setActiveTab] = useState('batches');
  const [contracts, setContracts] = useState({
    pharmaceuticalBatch: null,
    batchNFT: null,
    complianceManager: null
  });
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalComplianceChecks: 0,
    totalAudits: 0,
    totalNFTs: 0
  });

  const tabs = [
    { id: 'batches', label: 'Batch Management', icon: FiPackage },
    { id: 'compliance', label: 'Compliance', icon: FiShield },
    { id: 'wallet', label: 'Wallet Generator', icon: FiCreditCard },
    { id: 'analytics', label: 'Analytics', icon: FiActivity }
  ];

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (contracts.pharmaceuticalBatch) {
      loadStats();
    }
  }, [contracts]);

  const initializeWeb3 = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        
        if (accounts.length > 0) {
          setProvider(provider);
          setAccount(accounts[0]);
          await loadContracts(provider);
        }
      } else {
        toast.error('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
      toast.error('Failed to connect to MetaMask');
    }
  };

  const loadContracts = async (provider) => {
    try {
      setLoading(true);
      
      // Load contract addresses from deployment
      const response = await fetch('/deployments/pharma-contracts.json');
      const deployment = await response.json();
      
      const pharmaceuticalBatchABI = JSON.parse(deployment.contracts.PharmaceuticalBatch.abi);
      const batchNFTABI = JSON.parse(deployment.contracts.BatchNFT.abi);
      const complianceManagerABI = JSON.parse(deployment.contracts.ComplianceManager.abi);

      const pharmaceuticalBatch = new ethers.Contract(
        deployment.contracts.PharmaceuticalBatch.address,
        pharmaceuticalBatchABI,
        provider.getSigner()
      );

      const batchNFT = new ethers.Contract(
        deployment.contracts.BatchNFT.address,
        batchNFTABI,
        provider.getSigner()
      );

      const complianceManager = new ethers.Contract(
        deployment.contracts.ComplianceManager.address,
        complianceManagerABI,
        provider.getSigner()
      );

      setContracts({
        pharmaceuticalBatch,
        batchNFT,
        complianceManager
      });

      toast.success('Contracts loaded successfully!');
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Failed to load contracts. Please ensure they are deployed.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [totalBatches, totalComplianceChecks, totalAudits, totalNFTs] = await Promise.all([
        contracts.pharmaceuticalBatch.getTotalBatches(),
        contracts.complianceManager.getTotalRecords(),
        contracts.complianceManager.getTotalAudits(),
        contracts.batchNFT.totalSupply()
      ]);

      setStats({
        totalBatches: Number(totalBatches),
        totalComplianceChecks: Number(totalComplianceChecks),
        totalAudits: Number(totalAudits),
        totalNFTs: Number(totalNFTs)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'batches':
        return (
          <PharmaBatchManager
            contract={contracts.pharmaceuticalBatch}
            account={account}
            provider={provider}
          />
        );
      case 'compliance':
        return (
          <ComplianceManager
            contract={contracts.complianceManager}
            account={account}
            provider={provider}
          />
        );
      case 'wallet':
        return <WalletGenerator />;
      case 'analytics':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Analytics Dashboard</h3>
            <p>Coming soon! This will show detailed analytics and insights.</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SupplyChainContainer>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <LoadingSpinner />
          <div style={{ marginTop: '1rem' }}>Loading contracts...</div>
        </div>
      </SupplyChainContainer>
    );
  }

  return (
    <SupplyChainContainer>
      <Header>
        <Title>Pharmaceutical Supply Chain</Title>
        <Subtitle>
          Complete blockchain solution for pharmaceutical batch tracking, compliance management, and supply chain transparency
        </Subtitle>
      </Header>

      <ConnectionStatus connected={!!account}>
        {account ? (
          <>
            <FiActivity size={20} />
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </>
        ) : (
          <>
            <FiActivity size={20} />
            Not connected to MetaMask
          </>
        )}
      </ConnectionStatus>

      <StatsGrid>
        <StatCard>
          <StatIcon>
            <FiPackage size={24} />
          </StatIcon>
          <StatValue>{stats.totalBatches}</StatValue>
          <StatLabel>Total Batches</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <FiShield size={24} />
          </StatIcon>
          <StatValue>{stats.totalComplianceChecks}</StatValue>
          <StatLabel>Compliance Checks</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <FiActivity size={24} />
          </StatIcon>
          <StatValue>{stats.totalAudits}</StatValue>
          <StatLabel>Audit Trails</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <FiCreditCard size={24} />
          </StatIcon>
          <StatValue>{stats.totalNFTs}</StatValue>
          <StatLabel>Batch NFTs</StatLabel>
        </StatCard>
      </StatsGrid>

      <Tabs>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </Tab>
          );
        })}
      </Tabs>

      <TabContent>
        {renderTabContent()}
      </TabContent>
    </SupplyChainContainer>
  );
};

export default PharmaceuticalSupplyChain;