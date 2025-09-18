import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiShield, 
  FiCreditCard, 
  FiFileText, 
  FiTrendingUp,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUsers
} from 'react-icons/fi';
import { useQuery } from 'react-query';
import { useWeb3 } from '../contexts/Web3Context';
import { apiService } from '../services/apiService';
import StatCard from '../components/StatCard';
import RecentBatches from '../components/RecentBatches';
import ComplianceOverview from '../components/ComplianceOverview';
import TransactionChart from '../components/TransactionChart';
import QuickActions from '../components/QuickActions';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const DashboardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const DashboardTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const DashboardSubtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.xl};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Section = styled(motion.section)`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SectionIcon = styled.div`
  color: ${props => props.theme.colors.primary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  color: ${props => props.theme.colors.error};
`;

const Dashboard: React.FC = () => {
  const { isConnected, account, balance, formatAddress, formatBalance } = useWeb3();

  // Fetch dashboard data
  const { data: batchStats, isLoading: batchStatsLoading } = useQuery(
    'batchStatistics',
    () => apiService.getBatchStatistics(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: complianceStats, isLoading: complianceStatsLoading } = useQuery(
    'complianceStatistics',
    () => apiService.getComplianceStatistics(),
    {
      refetchInterval: 30000,
    }
  );

  const { data: recentBatches, isLoading: recentBatchesLoading } = useQuery(
    'recentBatches',
    () => apiService.getBatches({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      refetchInterval: 30000,
    }
  );

  const { data: fileStats, isLoading: fileStatsLoading } = useQuery(
    'fileStatistics',
    () => apiService.getFileStatistics(),
    {
      refetchInterval: 30000,
    }
  );

  const isLoading = batchStatsLoading || complianceStatsLoading || recentBatchesLoading || fileStatsLoading;

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="large" />
      </LoadingContainer>
    );
  }

  const stats = [
    {
      title: 'Total Batches',
      value: batchStats?.totalBatches || 0,
      icon: FiPackage,
      color: 'primary',
      trend: '+12%',
      trendDirection: 'up' as const,
    },
    {
      title: 'Compliance Records',
      value: complianceStats?.totalRecords || 0,
      icon: FiShield,
      color: 'success',
      trend: '+8%',
      trendDirection: 'up' as const,
    },
    {
      title: 'Active Wallets',
      value: batchStats?.totalWallets || 0,
      icon: FiCreditCard,
      color: 'info',
      trend: '+5%',
      trendDirection: 'up' as const,
    },
    {
      title: 'Files Stored',
      value: fileStats?.totalFiles || 0,
      icon: FiFileText,
      color: 'warning',
      trend: '+15%',
      trendDirection: 'up' as const,
    },
  ];

  return (
    <DashboardContainer>
      <DashboardHeader>
        <div>
          <DashboardTitle>Dashboard</DashboardTitle>
          <DashboardSubtitle>
            Welcome back! Here's what's happening with your pharmaceutical blockchain system.
            {isConnected && account && (
              <span> • Connected as {formatAddress(account)}</span>
            )}
          </DashboardSubtitle>
        </div>
      </DashboardHeader>

      <StatsGrid>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader>
              <SectionTitle>
                <SectionIcon>
                  <FiActivity />
                </SectionIcon>
                Recent Activity
              </SectionTitle>
            </SectionHeader>
            <TransactionChart />
          </Section>

          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader>
              <SectionTitle>
                <SectionIcon>
                  <FiPackage />
                </SectionIcon>
                Recent Batches
              </SectionTitle>
            </SectionHeader>
            <RecentBatches batches={recentBatches?.data || []} />
          </Section>
        </MainContent>

        <SidebarContent>
          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SectionHeader>
              <SectionTitle>
                <SectionIcon>
                  <FiShield />
                </SectionIcon>
                Compliance Overview
              </SectionTitle>
            </SectionHeader>
            <ComplianceOverview stats={complianceStats} />
          </Section>

          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SectionHeader>
              <SectionTitle>
                <SectionIcon>
                  <FiTrendingUp />
                </SectionIcon>
                Quick Actions
              </SectionTitle>
            </SectionHeader>
            <QuickActions />
          </Section>
        </SidebarContent>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;