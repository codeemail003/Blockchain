import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

// Contract ABIs (simplified for demo - in production, these would be imported from compiled contracts)
const PHARMACEUTICAL_BATCH_ABI = [
  "function createBatch(string memory drugName, string memory drugCode, string memory manufacturer, uint256 manufactureDate, uint256 expiryDate, uint256 quantity, string memory serialNumbers, string[] memory metadataKeys, string[] memory metadataValues) external returns (uint256)",
  "function getBatch(uint256 batchId) external view returns (tuple(uint256 batchId, string drugName, string drugCode, string manufacturer, uint256 manufactureDate, uint256 expiryDate, uint256 quantity, uint8 status, address currentOwner, string serialNumbers, uint256 createdAt, uint256 updatedAt))",
  "function transferBatch(uint256 batchId, address to, string memory reason, string memory location, string memory notes) external",
  "function updateBatchStatus(uint256 batchId, uint8 status, string memory reason) external",
  "function getTotalBatches() external view returns (uint256)",
  "event BatchCreated(uint256 indexed batchId, address indexed creator, string drugName, uint256 quantity)",
  "event BatchTransferred(uint256 indexed batchId, address indexed from, address indexed to, string reason)",
  "event BatchStatusUpdated(uint256 indexed batchId, uint8 status, string reason)"
];

const BATCH_NFT_ABI = [
  "function mintBatchNFT(address to, uint256 batchId, string memory tokenURI, string memory metadata, string[] memory attributes, string[] memory values) external returns (uint256)",
  "function burnBatchNFT(uint256 tokenId) external",
  "function getBatchFromToken(uint256 tokenId) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event BatchNFTMinted(uint256 indexed tokenId, uint256 indexed batchId, address indexed to)"
];

const COMPLIANCE_MANAGER_ABI = [
  "function addComplianceCheck(uint256 batchId, uint8 checkType, string memory notes, string memory findings, string memory correctiveActions, string[] memory evidenceHashes, string[] memory additionalDataKeys, string[] memory additionalDataValues) external returns (uint256)",
  "function updateComplianceStatus(uint256 recordId, uint8 status, bool passed, string memory updatedNotes) external",
  "function getComplianceRecord(uint256 recordId) external view returns (tuple(uint256 recordId, uint256 batchId, uint8 checkType, uint8 status, bool passed, address auditor, string notes, string findings, string correctiveActions, string[] evidenceHashes, uint256 createdAt, uint256 updatedAt))",
  "function getComplianceHistory(uint256 batchId) external view returns (tuple(uint256 recordId, uint256 batchId, uint8 checkType, uint8 status, bool passed, address auditor, string notes, string findings, string correctiveActions, string[] evidenceHashes, uint256 createdAt, uint256 updatedAt)[])",
  "function getTotalRecords() external view returns (uint256)",
  "event ComplianceCheckAdded(uint256 indexed recordId, uint256 indexed batchId, address indexed auditor, uint8 checkType)",
  "event ComplianceStatusUpdated(uint256 indexed recordId, uint8 status, bool passed)"
];

// Contract addresses (these would be set based on deployment)
const CONTRACT_ADDRESSES = {
  PHARMACEUTICAL_BATCH: process.env.REACT_APP_PHARMACEUTICAL_BATCH_ADDRESS || '0x...',
  BATCH_NFT: process.env.REACT_APP_BATCH_NFT_ADDRESS || '0x...',
  COMPLIANCE_MANAGER: process.env.REACT_APP_COMPLIANCE_MANAGER_ADDRESS || '0x...',
};

export interface BatchData {
  batchId: string;
  drugName: string;
  drugCode: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: string;
  status: number;
  currentOwner: string;
  serialNumbers: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRecord {
  recordId: string;
  batchId: string;
  checkType: number;
  status: number;
  passed: boolean;
  auditor: string;
  notes: string;
  findings: string;
  correctiveActions: string;
  evidenceHashes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResult {
  txHash: string;
  gasUsed: string;
  blockNumber: number;
}

class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contracts: {
    pharmaceuticalBatch: ethers.Contract | null;
    batchNFT: ethers.Contract | null;
    complianceManager: ethers.Contract | null;
  } = {
    pharmaceuticalBatch: null,
    batchNFT: null,
    complianceManager: null,
  };

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connectWallet(): Promise<string> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contracts
      await this.initializeContracts();

      const address = accounts[0];
      toast.success(`Connected to wallet: ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.contracts = {
      pharmaceuticalBatch: null,
      batchNFT: null,
      complianceManager: null,
    };
    toast.success('Wallet disconnected');
  }

  async getAccount(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const targetAddress = address || await this.getAccount();
    if (!targetAddress) throw new Error('No address provided');
    
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  async getNetwork(): Promise<ethers.Network> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getNetwork();
  }

  private async initializeContracts(): Promise<void> {
    if (!this.signer) throw new Error('Signer not initialized');

    this.contracts.pharmaceuticalBatch = new ethers.Contract(
      CONTRACT_ADDRESSES.PHARMACEUTICAL_BATCH,
      PHARMACEUTICAL_BATCH_ABI,
      this.signer
    );

    this.contracts.batchNFT = new ethers.Contract(
      CONTRACT_ADDRESSES.BATCH_NFT,
      BATCH_NFT_ABI,
      this.signer
    );

    this.contracts.complianceManager = new ethers.Contract(
      CONTRACT_ADDRESSES.COMPLIANCE_MANAGER,
      COMPLIANCE_MANAGER_ABI,
      this.signer
    );
  }

  // Batch Management Methods
  async createBatch(batchData: {
    drugName: string;
    drugCode: string;
    manufacturer: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: number;
    serialNumbers?: string;
    metadata?: Record<string, string>;
  }): Promise<TransactionResult> {
    if (!this.contracts.pharmaceuticalBatch) {
      throw new Error('Contract not initialized');
    }

    try {
      const metadataKeys = Object.keys(batchData.metadata || {});
      const metadataValues = Object.values(batchData.metadata || {});

      const tx = await this.contracts.pharmaceuticalBatch.createBatch(
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        Math.floor(new Date(batchData.manufactureDate).getTime() / 1000),
        Math.floor(new Date(batchData.expiryDate).getTime() / 1000),
        batchData.quantity,
        batchData.serialNumbers || '',
        metadataKeys,
        metadataValues
      );

      const receipt = await tx.wait();
      
      toast.success('Batch created successfully!');
      
      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Create batch error:', error);
      toast.error(error.message || 'Failed to create batch');
      throw error;
    }
  }

  async getBatch(batchId: string): Promise<BatchData> {
    if (!this.contracts.pharmaceuticalBatch) {
      throw new Error('Contract not initialized');
    }

    try {
      const batch = await this.contracts.pharmaceuticalBatch.getBatch(batchId);
      
      return {
        batchId: batch.batchId.toString(),
        drugName: batch.drugName,
        drugCode: batch.drugCode,
        manufacturer: batch.manufacturer,
        manufactureDate: new Date(Number(batch.manufactureDate) * 1000).toISOString(),
        expiryDate: new Date(Number(batch.expiryDate) * 1000).toISOString(),
        quantity: batch.quantity.toString(),
        status: Number(batch.status),
        currentOwner: batch.currentOwner,
        serialNumbers: batch.serialNumbers,
        createdAt: new Date(Number(batch.createdAt) * 1000).toISOString(),
        updatedAt: new Date(Number(batch.updatedAt) * 1000).toISOString(),
      };
    } catch (error: any) {
      console.error('Get batch error:', error);
      toast.error(error.message || 'Failed to get batch');
      throw error;
    }
  }

  async transferBatch(
    batchId: string,
    to: string,
    reason: string,
    location: string,
    notes?: string
  ): Promise<TransactionResult> {
    if (!this.contracts.pharmaceuticalBatch) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contracts.pharmaceuticalBatch.transferBatch(
        batchId,
        to,
        reason,
        location,
        notes || ''
      );

      const receipt = await tx.wait();
      
      toast.success('Batch transferred successfully!');
      
      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Transfer batch error:', error);
      toast.error(error.message || 'Failed to transfer batch');
      throw error;
    }
  }

  async updateBatchStatus(
    batchId: string,
    status: number,
    reason: string
  ): Promise<TransactionResult> {
    if (!this.contracts.pharmaceuticalBatch) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contracts.pharmaceuticalBatch.updateBatchStatus(
        batchId,
        status,
        reason
      );

      const receipt = await tx.wait();
      
      toast.success('Batch status updated successfully!');
      
      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Update batch status error:', error);
      toast.error(error.message || 'Failed to update batch status');
      throw error;
    }
  }

  async getTotalBatches(): Promise<number> {
    if (!this.contracts.pharmaceuticalBatch) {
      throw new Error('Contract not initialized');
    }

    try {
      const total = await this.contracts.pharmaceuticalBatch.getTotalBatches();
      return Number(total);
    } catch (error: any) {
      console.error('Get total batches error:', error);
      throw error;
    }
  }

  // Compliance Management Methods
  async addComplianceCheck(complianceData: {
    batchId: string;
    checkType: number;
    notes: string;
    findings?: string;
    correctiveActions?: string;
    evidenceHashes?: string[];
    additionalData?: Record<string, string>;
  }): Promise<TransactionResult> {
    if (!this.contracts.complianceManager) {
      throw new Error('Contract not initialized');
    }

    try {
      const additionalDataKeys = Object.keys(complianceData.additionalData || {});
      const additionalDataValues = Object.values(complianceData.additionalData || {});

      const tx = await this.contracts.complianceManager.addComplianceCheck(
        complianceData.batchId,
        complianceData.checkType,
        complianceData.notes,
        complianceData.findings || '',
        complianceData.correctiveActions || '',
        complianceData.evidenceHashes || [],
        additionalDataKeys,
        additionalDataValues
      );

      const receipt = await tx.wait();
      
      toast.success('Compliance check added successfully!');
      
      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Add compliance check error:', error);
      toast.error(error.message || 'Failed to add compliance check');
      throw error;
    }
  }

  async getComplianceRecord(recordId: string): Promise<ComplianceRecord> {
    if (!this.contracts.complianceManager) {
      throw new Error('Contract not initialized');
    }

    try {
      const record = await this.contracts.complianceManager.getComplianceRecord(recordId);
      
      return {
        recordId: record.recordId.toString(),
        batchId: record.batchId.toString(),
        checkType: Number(record.checkType),
        status: Number(record.status),
        passed: record.passed,
        auditor: record.auditor,
        notes: record.notes,
        findings: record.findings,
        correctiveActions: record.correctiveActions,
        evidenceHashes: record.evidenceHashes,
        createdAt: new Date(Number(record.createdAt) * 1000).toISOString(),
        updatedAt: new Date(Number(record.updatedAt) * 1000).toISOString(),
      };
    } catch (error: any) {
      console.error('Get compliance record error:', error);
      toast.error(error.message || 'Failed to get compliance record');
      throw error;
    }
  }

  async getComplianceHistory(batchId: string): Promise<ComplianceRecord[]> {
    if (!this.contracts.complianceManager) {
      throw new Error('Contract not initialized');
    }

    try {
      const records = await this.contracts.complianceManager.getComplianceHistory(batchId);
      
      return records.map((record: any) => ({
        recordId: record.recordId.toString(),
        batchId: record.batchId.toString(),
        checkType: Number(record.checkType),
        status: Number(record.status),
        passed: record.passed,
        auditor: record.auditor,
        notes: record.notes,
        findings: record.findings,
        correctiveActions: record.correctiveActions,
        evidenceHashes: record.evidenceHashes,
        createdAt: new Date(Number(record.createdAt) * 1000).toISOString(),
        updatedAt: new Date(Number(record.updatedAt) * 1000).toISOString(),
      }));
    } catch (error: any) {
      console.error('Get compliance history error:', error);
      toast.error(error.message || 'Failed to get compliance history');
      throw error;
    }
  }

  // NFT Methods
  async mintBatchNFT(nftData: {
    to: string;
    batchId: string;
    tokenURI: string;
    metadata: string;
    attributes?: Record<string, string>;
  }): Promise<TransactionResult> {
    if (!this.contracts.batchNFT) {
      throw new Error('Contract not initialized');
    }

    try {
      const attributeKeys = Object.keys(nftData.attributes || {});
      const attributeValues = Object.values(nftData.attributes || {});

      const tx = await this.contracts.batchNFT.mintBatchNFT(
        nftData.to,
        nftData.batchId,
        nftData.tokenURI,
        nftData.metadata,
        attributeKeys,
        attributeValues
      );

      const receipt = await tx.wait();
      
      toast.success('Batch NFT minted successfully!');
      
      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Mint batch NFT error:', error);
      toast.error(error.message || 'Failed to mint batch NFT');
      throw error;
    }
  }

  // Event Listeners
  onBatchCreated(callback: (batchId: string, creator: string, drugName: string, quantity: string) => void): void {
    if (!this.contracts.pharmaceuticalBatch) return;

    this.contracts.pharmaceuticalBatch.on('BatchCreated', (batchId, creator, drugName, quantity) => {
      callback(batchId.toString(), creator, drugName, quantity.toString());
    });
  }

  onBatchTransferred(callback: (batchId: string, from: string, to: string, reason: string) => void): void {
    if (!this.contracts.pharmaceuticalBatch) return;

    this.contracts.pharmaceuticalBatch.on('BatchTransferred', (batchId, from, to, reason) => {
      callback(batchId.toString(), from, to, reason);
    });
  }

  onComplianceCheckAdded(callback: (recordId: string, batchId: string, auditor: string, checkType: number) => void): void {
    if (!this.contracts.complianceManager) return;

    this.contracts.complianceManager.on('ComplianceCheckAdded', (recordId, batchId, auditor, checkType) => {
      callback(recordId.toString(), batchId.toString(), auditor, Number(checkType));
    });
  }

  // Utility Methods
  async switchNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask is not installed');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        throw new Error('Please add this network to MetaMask first');
      }
      throw error;
    }
  }

  async addNetwork(networkConfig: {
    chainId: string;
    chainName: string;
    rpcUrls: string[];
    blockExplorerUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask is not installed');

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } catch (error: any) {
      console.error('Add network error:', error);
      throw error;
    }
  }

  // Cleanup
  removeAllListeners(): void {
    if (this.contracts.pharmaceuticalBatch) {
      this.contracts.pharmaceuticalBatch.removeAllListeners();
    }
    if (this.contracts.complianceManager) {
      this.contracts.complianceManager.removeAllListeners();
    }
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;