import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Batch Types
export interface Batch {
  id: string;
  batchId: string;
  drugName: string;
  drugCode: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  status: number;
  currentOwner: string;
  serialNumbers?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  drugName: string;
  drugCode: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  serialNumbers?: string;
  metadata?: Record<string, string>;
}

export interface TransferBatchRequest {
  to: string;
  reason: string;
  location: string;
  notes?: string;
}

export interface UpdateBatchStatusRequest {
  status: number;
  reason: string;
}

// Compliance Types
export interface ComplianceRecord {
  id: string;
  recordId: string;
  batchId: string;
  checkType: number;
  status: number;
  passed: boolean;
  auditor: string;
  notes: string;
  findings?: string;
  correctiveActions?: string;
  evidenceHashes?: string[];
  additionalData?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplianceCheckRequest {
  batchId: number;
  checkType: number;
  notes: string;
  findings?: string;
  correctiveActions?: string;
  evidenceHashes?: string[];
  additionalData?: Record<string, string>;
}

export interface UpdateComplianceStatusRequest {
  status: number;
  passed: boolean;
  updatedNotes?: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  address: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface GenerateWalletsRequest {
  count?: number;
}

export interface ImportWalletRequest {
  privateKey: string;
  name?: string;
}

// File Types
export interface File {
  id: string;
  fileId: string;
  originalName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  category: string;
  description?: string;
  batchId?: number;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export interface UploadFileRequest {
  files: FileList;
  batchId?: number;
  category?: string;
  description?: string;
}

// User Types
export interface User {
  id: string;
  address: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  address: string;
}

export interface RegisterRequest {
  address: string;
  role?: string;
  permissions?: string[];
}

// Statistics Types
export interface Statistics {
  totalBatches: number;
  totalComplianceRecords: number;
  totalFiles: number;
  totalWallets: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
        toast.error(errorMessage);
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(address: string): Promise<{ user: User; token: string }> {
    const response = await this.api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/login', { address });
    return response.data.data!;
  }

  async register(address: string, role?: string, permissions?: string[]): Promise<{ user: User; token: string }> {
    const response = await this.api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/register', { 
      address, 
      role, 
      permissions 
    });
    return response.data.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data!;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.api.post<ApiResponse<{ token: string }>>('/api/auth/refresh');
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/api/auth/logout');
  }

  // Batch Methods
  async getBatches(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    owner?: string;
    status?: number;
  }): Promise<PaginatedResponse<Batch>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<Batch>>>('/api/batches', { params });
    return response.data.data!;
  }

  async getBatch(batchId: string): Promise<Batch> {
    const response = await this.api.get<ApiResponse<Batch>>(`/api/batches/${batchId}`);
    return response.data.data!;
  }

  async createBatch(batchData: CreateBatchRequest): Promise<Batch & { transaction: any }> {
    const response = await this.api.post<ApiResponse<Batch & { transaction: any }>>('/api/batches', batchData);
    return response.data.data!;
  }

  async transferBatch(batchId: string, transferData: TransferBatchRequest): Promise<{ transaction: any }> {
    const response = await this.api.put<ApiResponse<{ transaction: any }>>(`/api/batches/${batchId}/transfer`, transferData);
    return response.data.data!;
  }

  async updateBatchStatus(batchId: string, statusData: UpdateBatchStatusRequest): Promise<{ transaction: any }> {
    const response = await this.api.put<ApiResponse<{ transaction: any }>>(`/api/batches/${batchId}/status`, statusData);
    return response.data.data!;
  }

  async updateBatchMetadata(batchId: string, metadata: Record<string, string>): Promise<{ metadata: Record<string, string> }> {
    const response = await this.api.put<ApiResponse<{ metadata: Record<string, string> }>>(`/api/batches/${batchId}/metadata`, { metadata });
    return response.data.data!;
  }

  async getBatchTransfers(batchId: string): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>(`/api/batches/${batchId}/transfers`);
    return response.data.data!;
  }

  async getBatchStatistics(): Promise<Statistics> {
    const response = await this.api.get<ApiResponse<Statistics>>('/api/batches/statistics');
    return response.data.data!;
  }

  // Compliance Methods
  async createComplianceCheck(complianceData: CreateComplianceCheckRequest): Promise<ComplianceRecord & { transaction: any }> {
    const response = await this.api.post<ApiResponse<ComplianceRecord & { transaction: any }>>('/api/compliance/checks', complianceData);
    return response.data.data!;
  }

  async getComplianceRecord(recordId: string): Promise<ComplianceRecord> {
    const response = await this.api.get<ApiResponse<ComplianceRecord>>(`/api/compliance/checks/${recordId}`);
    return response.data.data!;
  }

  async updateComplianceStatus(recordId: string, statusData: UpdateComplianceStatusRequest): Promise<ComplianceRecord & { transaction: any }> {
    const response = await this.api.put<ApiResponse<ComplianceRecord & { transaction: any }>>(`/api/compliance/checks/${recordId}/status`, statusData);
    return response.data.data!;
  }

  async getComplianceHistory(batchId: string): Promise<ComplianceRecord[]> {
    const response = await this.api.get<ApiResponse<ComplianceRecord[]>>(`/api/compliance/batches/${batchId}`);
    return response.data.data!;
  }

  async getComplianceStatistics(): Promise<{
    totalRecords: number;
    totalAudits: number;
    passedChecks: number;
    failedChecks: number;
  }> {
    const response = await this.api.get<ApiResponse<any>>('/api/compliance/statistics');
    return response.data.data!;
  }

  // Wallet Methods
  async generateWallets(count: number = 1): Promise<Wallet[]> {
    const response = await this.api.post<ApiResponse<Wallet[]>>('/api/wallets/generate', { count });
    return response.data.data!;
  }

  async importWallet(privateKey: string, name?: string): Promise<Wallet> {
    const response = await this.api.post<ApiResponse<Wallet>>('/api/wallets/import', { privateKey, name });
    return response.data.data!;
  }

  async getWallets(active?: boolean): Promise<Wallet[]> {
    const response = await this.api.get<ApiResponse<Wallet[]>>('/api/wallets', { 
      params: active !== undefined ? { active } : {} 
    });
    return response.data.data!;
  }

  async getWallet(address: string): Promise<Wallet> {
    const response = await this.api.get<ApiResponse<Wallet>>(`/api/wallets/${address}`);
    return response.data.data!;
  }

  async getWalletBalance(address: string): Promise<{
    address: string;
    balance: string;
    balanceWei: string;
  }> {
    const response = await this.api.get<ApiResponse<any>>(`/api/wallets/${address}/balance`);
    return response.data.data!;
  }

  async exportWallet(address: string, password: string): Promise<{
    address: string;
    privateKey: string;
    mnemonic?: string;
  }> {
    const response = await this.api.post<ApiResponse<any>>(`/api/wallets/${address}/export`, { password });
    return response.data.data!;
  }

  async updateWallet(address: string, updates: { name?: string; isActive?: boolean }): Promise<Wallet> {
    const response = await this.api.put<ApiResponse<Wallet>>(`/api/wallets/${address}`, updates);
    return response.data.data!;
  }

  async deleteWallet(address: string): Promise<void> {
    await this.api.delete(`/api/wallets/${address}`);
  }

  // File Methods
  async uploadFiles(formData: FormData): Promise<File[]> {
    const response = await this.api.post<ApiResponse<File[]>>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async getFile(fileId: string): Promise<File> {
    const response = await this.api.get<ApiResponse<File>>(`/api/files/${fileId}`);
    return response.data.data!;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await this.api.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getFileUrl(fileId: string, expiresIn?: number): Promise<{ url: string; expiresAt: string }> {
    const response = await this.api.get<ApiResponse<{ url: string; expiresAt: string }>>(`/api/files/${fileId}/url`, {
      params: expiresIn ? { expiresIn } : {},
    });
    return response.data.data!;
  }

  async getFilesByBatch(batchId: string, category?: string): Promise<File[]> {
    const response = await this.api.get<ApiResponse<File[]>>(`/api/files/batches/${batchId}`, {
      params: category ? { category } : {},
    });
    return response.data.data!;
  }

  async getFiles(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<File>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<File>>>('/api/files', { params });
    return response.data.data!;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.api.delete(`/api/files/${fileId}`);
  }

  async getFileStatistics(): Promise<{
    totalFiles: number;
    totalSize: string;
    filesByCategory: Record<string, number>;
    recentUploads: number;
  }> {
    const response = await this.api.get<ApiResponse<any>>('/api/files/statistics');
    return response.data.data!;
  }

  // Health Check
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, any>;
  }> {
    const response = await this.api.get<ApiResponse<any>>('/health');
    return response.data.data!;
  }

  // Utility Methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
    delete this.api.defaults.headers.Authorization;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;