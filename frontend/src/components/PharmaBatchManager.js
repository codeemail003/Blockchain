import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { FiPlus, FiEye, FiEdit, FiTruck, FiPackage, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BatchManagerContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
  max-width: 1200px;
  margin: ${props => props.theme.spacing.xl} auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
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

const BatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const BatchCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const BatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BatchTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'CREATED': return props.theme.colors.info + '20';
      case 'IN_PRODUCTION': return props.theme.colors.warning + '20';
      case 'QUALITY_CHECK': return props.theme.colors.warning + '20';
      case 'PACKAGED': return props.theme.colors.success + '20';
      case 'IN_TRANSIT': return props.theme.colors.info + '20';
      case 'AT_DISTRIBUTOR': return props.theme.colors.primary + '20';
      case 'AT_PHARMACY': return props.theme.colors.primary + '20';
      case 'DISPENSED': return props.theme.colors.success + '20';
      case 'RECALLED': return props.theme.colors.error + '20';
      case 'EXPIRED': return props.theme.colors.error + '20';
      case 'DESTROYED': return props.theme.colors.textSecondary + '20';
      default: return props.theme.colors.textSecondary + '20';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'CREATED': return props.theme.colors.info;
      case 'IN_PRODUCTION': return props.theme.colors.warning;
      case 'QUALITY_CHECK': return props.theme.colors.warning;
      case 'PACKAGED': return props.theme.colors.success;
      case 'IN_TRANSIT': return props.theme.colors.info;
      case 'AT_DISTRIBUTOR': return props.theme.colors.primary;
      case 'AT_PHARMACY': return props.theme.colors.primary;
      case 'DISPENSED': return props.theme.colors.success;
      case 'RECALLED': return props.theme.colors.error;
      case 'EXPIRED': return props.theme.colors.error;
      case 'DESTROYED': return props.theme.colors.textSecondary;
      default: return props.theme.colors.textSecondary;
    }
  }};
`;

const BatchInfo = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
`;

const InfoValue = styled.span`
  color: ${props => props.theme.colors.text};
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : props.theme.colors.text};
  border: 1px solid ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.variant === 'primary' ? props.theme.colors.primary + 'dd' : props.theme.colors.surface};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 1rem;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 1rem;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 1rem;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.xl};
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' ? `
    background-color: ${props.theme.colors.primary};
    color: white;
    &:hover {
      background-color: ${props.theme.colors.primary}dd;
    }
  ` : `
    background-color: transparent;
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.border};
    &:hover {
      background-color: ${props.theme.colors.surface};
    }
  `}
`;

const PharmaBatchManager = ({ contract, account, provider }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({});

  const statusOptions = [
    { value: 0, label: 'CREATED' },
    { value: 1, label: 'IN_PRODUCTION' },
    { value: 2, label: 'QUALITY_CHECK' },
    { value: 3, label: 'PACKAGED' },
    { value: 4, label: 'IN_TRANSIT' },
    { value: 5, label: 'AT_DISTRIBUTOR' },
    { value: 6, label: 'AT_PHARMACY' },
    { value: 7, label: 'DISPENSED' },
    { value: 8, label: 'RECALLED' },
    { value: 9, label: 'EXPIRED' },
    { value: 10, label: 'DESTROYED' }
  ];

  useEffect(() => {
    if (contract && account) {
      loadBatches();
    }
  }, [contract, account]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const totalBatches = await contract.getTotalBatches();
      const batchList = [];

      for (let i = 1; i <= totalBatches; i++) {
        try {
          const batch = await contract.getBatch(i);
          batchList.push({
            id: batch.batchId.toString(),
            drugName: batch.drugName,
            drugCode: batch.drugCode,
            manufacturer: batch.manufacturer,
            quantity: batch.quantity.toString(),
            status: statusOptions[batch.status]?.label || 'UNKNOWN',
            currentOwner: batch.currentOwner,
            manufactureDate: new Date(Number(batch.manufactureDate) * 1000).toLocaleDateString(),
            expiryDate: new Date(Number(batch.expiryDate) * 1000).toLocaleDateString(),
            serialNumbers: batch.serialNumbers
          });
        } catch (error) {
          console.error(`Error loading batch ${i}:`, error);
        }
      }

      setBatches(batchList);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const manufactureDate = formData.manufactureDate ? 
        Math.floor(new Date(formData.manufactureDate).getTime() / 1000) : currentTime;
      const expiryDate = formData.expiryDate ? 
        Math.floor(new Date(formData.expiryDate).getTime() / 1000) : currentTime + (365 * 24 * 60 * 60);

      const metadataKeys = Object.keys(formData.metadata || {});
      const metadataValues = Object.values(formData.metadata || {});

      const tx = await contract.createBatch(
        formData.drugName,
        formData.drugCode,
        formData.manufacturer,
        manufactureDate,
        expiryDate,
        formData.quantity,
        formData.serialNumbers,
        metadataKeys,
        metadataValues
      );

      await tx.wait();
      toast.success('Batch created successfully!');
      setShowCreateModal(false);
      setFormData({});
      loadBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const transferBatch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const tx = await contract.transferBatch(
        selectedBatch.id,
        formData.to,
        formData.reason,
        formData.location,
        formData.notes
      );

      await tx.wait();
      toast.success('Batch transferred successfully!');
      setShowTransferModal(false);
      setFormData({});
      setSelectedBatch(null);
      loadBatches();
    } catch (error) {
      console.error('Error transferring batch:', error);
      toast.error('Failed to transfer batch');
    } finally {
      setLoading(false);
    }
  };

  const updateBatchStatus = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const tx = await contract.updateBatchStatus(
        selectedBatch.id,
        formData.status,
        formData.reason
      );

      await tx.wait();
      toast.success('Batch status updated successfully!');
      setShowStatusModal(false);
      setFormData({});
      setSelectedBatch(null);
      loadBatches();
    } catch (error) {
      console.error('Error updating batch status:', error);
      toast.error('Failed to update batch status');
    } finally {
      setLoading(false);
    }
  };

  const openTransferModal = (batch) => {
    setSelectedBatch(batch);
    setFormData({ to: '', reason: '', location: '', notes: '' });
    setShowTransferModal(true);
  };

  const openStatusModal = (batch) => {
    setSelectedBatch(batch);
    setFormData({ status: 0, reason: '' });
    setShowStatusModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CREATED': return <FiPlus size={16} />;
      case 'IN_PRODUCTION': return <FiEdit size={16} />;
      case 'QUALITY_CHECK': return <FiCheckCircle size={16} />;
      case 'PACKAGED': return <FiPackage size={16} />;
      case 'IN_TRANSIT': return <FiTruck size={16} />;
      case 'AT_DISTRIBUTOR': return <FiPackage size={16} />;
      case 'AT_PHARMACY': return <FiPackage size={16} />;
      case 'DISPENSED': return <FiCheckCircle size={16} />;
      case 'RECALLED': return <FiXCircle size={16} />;
      case 'EXPIRED': return <FiXCircle size={16} />;
      case 'DESTROYED': return <FiXCircle size={16} />;
      default: return <FiEye size={16} />;
    }
  };

  if (loading && batches.length === 0) {
    return (
      <BatchManagerContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading batches...</div>
        </div>
      </BatchManagerContainer>
    );
  }

  return (
    <BatchManagerContainer>
      <Header>
        <Title>Pharmaceutical Batch Manager</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <FiPlus size={18} />
          Create Batch
        </CreateButton>
      </Header>

      <BatchGrid>
        {batches.map((batch) => (
          <BatchCard key={batch.id}>
            <BatchHeader>
              <BatchTitle>{batch.drugName}</BatchTitle>
              <StatusBadge status={batch.status}>
                {getStatusIcon(batch.status)}
                {batch.status}
              </StatusBadge>
            </BatchHeader>

            <BatchInfo>
              <InfoRow>
                <InfoLabel>Drug Code:</InfoLabel>
                <InfoValue>{batch.drugCode}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Manufacturer:</InfoLabel>
                <InfoValue>{batch.manufacturer}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Quantity:</InfoLabel>
                <InfoValue>{batch.quantity} units</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Manufacture Date:</InfoLabel>
                <InfoValue>{batch.manufactureDate}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Expiry Date:</InfoLabel>
                <InfoValue>{batch.expiryDate}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Current Owner:</InfoLabel>
                <InfoValue>{batch.currentOwner.slice(0, 6)}...{batch.currentOwner.slice(-4)}</InfoValue>
              </InfoRow>
            </BatchInfo>

            <ActionButtons>
              <ActionButton onClick={() => openTransferModal(batch)}>
                <FiTruck size={16} />
                Transfer
              </ActionButton>
              <ActionButton onClick={() => openStatusModal(batch)}>
                <FiEdit size={16} />
                Update Status
              </ActionButton>
            </ActionButtons>
          </BatchCard>
        ))}
      </BatchGrid>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <Modal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Create New Batch</h3>
            <form onSubmit={createBatch}>
              <FormGroup>
                <Label>Drug Name</Label>
                <Input
                  type="text"
                  value={formData.drugName || ''}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Drug Code</Label>
                <Input
                  type="text"
                  value={formData.drugCode || ''}
                  onChange={(e) => setFormData({ ...formData, drugCode: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Manufacturer</Label>
                <Input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Serial Numbers</Label>
                <TextArea
                  value={formData.serialNumbers || ''}
                  onChange={(e) => setFormData({ ...formData, serialNumbers: e.target.value })}
                  placeholder="SN001-SN1000"
                />
              </FormGroup>
              <FormGroup>
                <Label>Manufacture Date</Label>
                <Input
                  type="date"
                  value={formData.manufactureDate || ''}
                  onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Batch'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Transfer Batch Modal */}
      {showTransferModal && selectedBatch && (
        <Modal onClick={() => setShowTransferModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Transfer Batch: {selectedBatch.drugName}</h3>
            <form onSubmit={transferBatch}>
              <FormGroup>
                <Label>To Address</Label>
                <Input
                  type="text"
                  value={formData.to || ''}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Reason</Label>
                <Input
                  type="text"
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Location</Label>
                <Input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Notes</Label>
                <TextArea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Transferring...' : 'Transfer Batch'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedBatch && (
        <Modal onClick={() => setShowStatusModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Update Status: {selectedBatch.drugName}</h3>
            <form onSubmit={updateBatchStatus}>
              <FormGroup>
                <Label>New Status</Label>
                <Select
                  value={formData.status || 0}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Reason</Label>
                <TextArea
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Status'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </BatchManagerContainer>
  );
};

export default PharmaBatchManager;