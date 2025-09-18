import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { web3Service } from '../services/web3Service';
import { toast } from 'react-hot-toast';

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  balance: string | null;
  network: ethers.Network | null;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: string) => Promise<void>;
  
  // Contract methods
  createBatch: (batchData: any) => Promise<any>;
  getBatch: (batchId: string) => Promise<any>;
  transferBatch: (batchId: string, to: string, reason: string, location: string, notes?: string) => Promise<any>;
  updateBatchStatus: (batchId: string, status: number, reason: string) => Promise<any>;
  getTotalBatches: () => Promise<number>;
  
  // Compliance methods
  addComplianceCheck: (complianceData: any) => Promise<any>;
  getComplianceRecord: (recordId: string) => Promise<any>;
  getComplianceHistory: (batchId: string) => Promise<any>;
  
  // NFT methods
  mintBatchNFT: (nftData: any) => Promise<any>;
  
  // Event listeners
  onBatchCreated: (callback: (batchId: string, creator: string, drugName: string, quantity: string) => void) => void;
  onBatchTransferred: (callback: (batchId: string, from: string, to: string, reason: string) => void) => void;
  onComplianceCheckAdded: (callback: (recordId: string, batchId: string, auditor: string, checkType: number) => void) => void;
  
  // Utility methods
  formatAddress: (address: string) => string;
  formatBalance: (balance: string) => string;
  isValidAddress: (address: string) => boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<ethers.Network | null>(null);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
      web3Service.removeAllListeners();
    };
  }, []);

  // Update balance when account changes
  useEffect(() => {
    if (account) {
      updateBalance();
    }
  }, [account]);

  const initializeConnection = async () => {
    try {
      if (!window.ethereum) return;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connect();
      }
    } catch (error) {
      console.error('Failed to initialize Web3 connection:', error);
    }
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      const address = await web3Service.connectWallet();
      
      setAccount(address);
      setIsConnected(true);
      
      // Get network info
      const networkInfo = await web3Service.getNetwork();
      setNetwork(networkInfo);
      
      // Get balance
      await updateBalance();
      
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await web3Service.disconnectWallet();
      setAccount(null);
      setIsConnected(false);
      setBalance(null);
      setNetwork(null);
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  const switchNetwork = async (chainId: string) => {
    try {
      await web3Service.switchNetwork(chainId);
      const networkInfo = await web3Service.getNetwork();
      setNetwork(networkInfo);
      toast.success('Network switched successfully');
    } catch (error: any) {
      console.error('Network switch error:', error);
      toast.error(error.message || 'Failed to switch network');
    }
  };

  const updateBalance = async () => {
    if (!account) return;
    
    try {
      const balanceValue = await web3Service.getBalance(account);
      setBalance(balanceValue);
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    // Reload the page to ensure proper initialization
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Contract method wrappers
  const createBatch = async (batchData: any) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.createBatch(batchData);
  };

  const getBatch = async (batchId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.getBatch(batchId);
  };

  const transferBatch = async (batchId: string, to: string, reason: string, location: string, notes?: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.transferBatch(batchId, to, reason, location, notes);
  };

  const updateBatchStatus = async (batchId: string, status: number, reason: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.updateBatchStatus(batchId, status, reason);
  };

  const getTotalBatches = async () => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.getTotalBatches();
  };

  const addComplianceCheck = async (complianceData: any) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.addComplianceCheck(complianceData);
  };

  const getComplianceRecord = async (recordId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.getComplianceRecord(recordId);
  };

  const getComplianceHistory = async (batchId: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.getComplianceHistory(batchId);
  };

  const mintBatchNFT = async (nftData: any) => {
    if (!isConnected) throw new Error('Wallet not connected');
    return await web3Service.mintBatchNFT(nftData);
  };

  // Event listener wrappers
  const onBatchCreated = (callback: (batchId: string, creator: string, drugName: string, quantity: string) => void) => {
    web3Service.onBatchCreated(callback);
  };

  const onBatchTransferred = (callback: (batchId: string, from: string, to: string, reason: string) => void) => {
    web3Service.onBatchTransferred(callback);
  };

  const onComplianceCheckAdded = (callback: (recordId: string, batchId: string, auditor: string, checkType: number) => void) => {
    web3Service.onComplianceCheckAdded(callback);
  };

  // Utility methods
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string): string => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  const isValidAddress = (address: string): boolean => {
    return ethers.isAddress(address);
  };

  const value: Web3ContextType = {
    // Connection state
    isConnected,
    isConnecting,
    account,
    balance,
    network,
    
    // Connection methods
    connect,
    disconnect,
    switchNetwork,
    
    // Contract methods
    createBatch,
    getBatch,
    transferBatch,
    updateBatchStatus,
    getTotalBatches,
    
    // Compliance methods
    addComplianceCheck,
    getComplianceRecord,
    getComplianceHistory,
    
    // NFT methods
    mintBatchNFT,
    
    // Event listeners
    onBatchCreated,
    onBatchTransferred,
    onComplianceCheckAdded,
    
    // Utility methods
    formatAddress,
    formatBalance,
    isValidAddress,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context;