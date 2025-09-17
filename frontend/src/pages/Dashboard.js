import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { 
  FiPackage, 
  FiShield, 
  FiUsers, 
  FiTrendingUp,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: ${props => props.theme.spacing.sm} 0 0 0;
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
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.color}20;
  color: ${props => props.color};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: 0.875rem;
  color: ${props => props.positive ? props.theme.colors.success : props.theme.colors.error};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const ChartContainer = styled.div`
  height: 300px;
`;

const RecentActivity = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const ActivityTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const ActivityIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.color}20;
  color: ${props => props.color};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing['2xl']};
  background-color: ${props => props.theme.colors.surface};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
`;

const ConnectTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const ConnectDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const ConnectButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
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
`;

const Dashboard = () => {
  const { isConnected, account, chainId, getNetworkName } = useMetaMask();
  const { deploymentStatus, batches, fetchBatches } = useBlockchain();
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    compliantBatches: 0,
    totalTransfers: 0
  });

  // Sample data for charts
  const batchData = [
    { month: 'Jan', batches: 12, transfers: 8 },
    { month: 'Feb', batches: 19, transfers: 15 },
    { month: 'Mar', batches: 15, transfers: 12 },
    { month: 'Apr', batches: 22, transfers: 18 },
    { month: 'May', batches: 28, transfers: 24 },
    { month: 'Jun', batches: 35, transfers: 30 }
  ];

  const complianceData = [
    { name: 'Compliant', value: 85, color: '#059669' },
    { name: 'Non-Compliant', value: 10, color: '#dc2626' },
    { name: 'Pending', value: 5, color: '#d97706' }
  ];

  const recentActivities = [
    {
      icon: FiPackage,
      color: '#2563eb',
      text: 'New batch created: Batch #PBT-001',
      time: '2 minutes ago'
    },
    {
      icon: FiShield,
      color: '#059669',
      text: 'Compliance check passed for Batch #PBT-002',
      time: '15 minutes ago'
    },
    {
      icon: FiUsers,
      color: '#7c3aed',
      text: 'Role assigned to new user',
      time: '1 hour ago'
    },
    {
      icon: FiActivity,
      color: '#0891b2',
      text: 'System health check completed',
      time: '2 hours ago'
    }
  ];

  useEffect(() => {
    if (isConnected) {
      fetchBatches();
      setStats({
        totalBatches: batches.length,
        activeBatches: batches.filter(b => b.status === 'ACTIVE').length,
        compliantBatches: batches.filter(b => b.compliant).length,
        totalTransfers: batches.reduce((acc, b) => acc + (b.transfers || 0), 0)
      });
    }
  }, [isConnected, batches, fetchBatches]);

  if (!isConnected) {
    return (
      <DashboardContainer>
        <ConnectPrompt>
          <ConnectTitle>Welcome to PharbitChain</ConnectTitle>
          <ConnectDescription>
            Connect your MetaMask wallet to start managing pharmaceutical batches and ensure compliance.
          </ConnectDescription>
          <ConnectButton onClick={() => window.location.reload()}>
            Connect MetaMask
          </ConnectButton>
        </ConnectPrompt>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>Dashboard</Title>
          <Subtitle>
            Welcome back! Here's what's happening with your pharmaceutical blockchain.
          </Subtitle>
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Total Batches</StatTitle>
            <StatIcon color="#2563eb">
              <FiPackage size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalBatches}</StatValue>
          <StatChange positive>
            <FiTrendingUp size={16} />
            +12% from last month
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Active Batches</StatTitle>
            <StatIcon color="#059669">
              <FiActivity size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.activeBatches}</StatValue>
          <StatChange positive>
            <FiTrendingUp size={16} />
            +8% from last month
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Compliant Batches</StatTitle>
            <StatIcon color="#059669">
              <FiShield size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.compliantBatches}</StatValue>
          <StatChange positive>
            <FiCheckCircle size={16} />
            98% compliance rate
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Total Transfers</StatTitle>
            <StatIcon color="#7c3aed">
              <FiUsers size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalTransfers}</StatValue>
          <StatChange positive>
            <FiTrendingUp size={16} />
            +15% from last month
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Batch Activity Over Time</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={batchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="batches" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Batches Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="transfers" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Transfers"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Compliance Status</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>
      </ChartsGrid>

      <RecentActivity>
        <ActivityTitle>Recent Activity</ActivityTitle>
        <ActivityList>
          {recentActivities.map((activity, index) => (
            <ActivityItem key={index}>
              <ActivityIcon color={activity.color}>
                <activity.icon size={16} />
              </ActivityIcon>
              <ActivityContent>
                <ActivityText>{activity.text}</ActivityText>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityList>
      </RecentActivity>
    </DashboardContainer>
  );
};

export default Dashboard;