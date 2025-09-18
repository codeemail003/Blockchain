import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle, FiEye, FiPlus, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ComplianceContainer = styled.div`
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

const Tabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const ComplianceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const ComplianceCard = styled.div`
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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const StatusBadge = styled.span`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'PENDING': return props.theme.colors.warning + '20';
      case 'PASSED': return props.theme.colors.success + '20';
      case 'FAILED': return props.theme.colors.error + '20';
      case 'REQUIRES_ATTENTION': return props.theme.colors.warning + '20';
      case 'UNDER_REVIEW': return props.theme.colors.info + '20';
      default: return props.theme.colors.textSecondary + '20';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'PENDING': return props.theme.colors.warning;
      case 'PASSED': return props.theme.colors.success;
      case 'FAILED': return props.theme.colors.error;
      case 'REQUIRES_ATTENTION': return props.theme.colors.warning;
      case 'UNDER_REVIEW': return props.theme.colors.info;
      default: return props.theme.colors.textSecondary;
    }
  }};
`;

const CardInfo = styled.div`
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
  max-width: 600px;
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

const ComplianceManager = ({ contract, account, provider }) => {
  const [complianceRecords, setComplianceRecords] = useState([]);
  const [auditTrails, setAuditTrails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});

  const checkTypeOptions = [
    { value: 0, label: 'QUALITY_CONTROL' },
    { value: 1, label: 'REGULATORY_COMPLIANCE' },
    { value: 2, label: 'SAFETY_INSPECTION' },
    { value: 3, label: 'DOCUMENTATION_REVIEW' },
    { value: 4, label: 'STORAGE_CONDITIONS' },
    { value: 5, label: 'TRANSPORT_COMPLIANCE' },
    { value: 6, label: 'MANUFACTURING_STANDARDS' },
    { value: 7, label: 'PACKAGING_INTEGRITY' }
  ];

  const statusOptions = [
    { value: 0, label: 'PENDING' },
    { value: 1, label: 'PASSED' },
    { value: 2, label: 'FAILED' },
    { value: 3, label: 'REQUIRES_ATTENTION' },
    { value: 4, label: 'UNDER_REVIEW' }
  ];

  useEffect(() => {
    if (contract && account) {
      loadComplianceRecords();
      loadAuditTrails();
    }
  }, [contract, account]);

  const loadComplianceRecords = async () => {
    try {
      setLoading(true);
      const totalRecords = await contract.getTotalRecords();
      const recordList = [];

      for (let i = 1; i <= totalRecords; i++) {
        try {
          const record = await contract.getComplianceRecord(i);
          recordList.push({
            id: record.recordId.toString(),
            batchId: record.batchId.toString(),
            checkType: checkTypeOptions[record.checkType]?.label || 'UNKNOWN',
            status: statusOptions[record.status]?.label || 'UNKNOWN',
            passed: record.passed,
            timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
            auditor: record.auditor,
            notes: record.notes,
            findings: record.findings,
            correctiveActions: record.correctiveActions,
            evidenceHashes: record.evidenceHashes
          });
        } catch (error) {
          console.error(`Error loading compliance record ${i}:`, error);
        }
      }

      setComplianceRecords(recordList);
    } catch (error) {
      console.error('Error loading compliance records:', error);
      toast.error('Failed to load compliance records');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTrails = async () => {
    try {
      const totalAudits = await contract.getTotalAudits();
      const auditList = [];

      for (let i = 1; i <= totalAudits; i++) {
        try {
          const audit = await contract.getAuditTrail(i);
          auditList.push({
            id: audit.auditId.toString(),
            batchId: audit.batchId.toString(),
            auditor: audit.auditor,
            auditDate: new Date(Number(audit.auditDate) * 1000).toLocaleString(),
            auditType: checkTypeOptions[audit.auditType]?.label || 'UNKNOWN',
            findings: audit.findings,
            recommendations: audit.recommendations,
            result: statusOptions[audit.result]?.label || 'UNKNOWN',
            evidenceHashes: audit.evidenceHashes,
            createdAt: new Date(Number(audit.createdAt) * 1000).toLocaleString()
          });
        } catch (error) {
          console.error(`Error loading audit trail ${i}:`, error);
        }
      }

      setAuditTrails(auditList);
    } catch (error) {
      console.error('Error loading audit trails:', error);
      toast.error('Failed to load audit trails');
    }
  };

  const createComplianceCheck = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const tx = await contract.addComplianceCheck(
        formData.batchId,
        formData.checkType,
        formData.notes,
        formData.findings,
        formData.correctiveActions,
        formData.evidenceHashes || [],
        formData.additionalDataKeys || [],
        formData.additionalDataValues || []
      );

      await tx.wait();
      toast.success('Compliance check created successfully!');
      setShowCreateModal(false);
      setFormData({});
      loadComplianceRecords();
    } catch (error) {
      console.error('Error creating compliance check:', error);
      toast.error('Failed to create compliance check');
    } finally {
      setLoading(false);
    }
  };

  const updateComplianceStatus = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const tx = await contract.updateComplianceStatus(
        selectedRecord.id,
        formData.status,
        formData.passed,
        formData.updatedNotes
      );

      await tx.wait();
      toast.success('Compliance status updated successfully!');
      setShowUpdateModal(false);
      setFormData({});
      setSelectedRecord(null);
      loadComplianceRecords();
    } catch (error) {
      console.error('Error updating compliance status:', error);
      toast.error('Failed to update compliance status');
    } finally {
      setLoading(false);
    }
  };

  const recordAuditTrail = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const tx = await contract.recordAuditTrail(
        formData.batchId,
        formData.auditType,
        formData.findings,
        formData.recommendations,
        formData.result,
        formData.evidenceHashes || []
      );

      await tx.wait();
      toast.success('Audit trail recorded successfully!');
      setShowAuditModal(false);
      setFormData({});
      loadAuditTrails();
    } catch (error) {
      console.error('Error recording audit trail:', error);
      toast.error('Failed to record audit trail');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (record) => {
    setSelectedRecord(record);
    setFormData({ status: 0, passed: false, updatedNotes: '' });
    setShowUpdateModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <FiClock size={16} />;
      case 'PASSED': return <FiCheckCircle size={16} />;
      case 'FAILED': return <FiXCircle size={16} />;
      case 'REQUIRES_ATTENTION': return <FiAlertTriangle size={16} />;
      case 'UNDER_REVIEW': return <FiEye size={16} />;
      default: return <FiClock size={16} />;
    }
  };

  if (loading && complianceRecords.length === 0) {
    return (
      <ComplianceContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading compliance data...</div>
        </div>
      </ComplianceContainer>
    );
  }

  return (
    <ComplianceContainer>
      <Header>
        <Title>Compliance Management</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <FiPlus size={18} />
          Add Compliance Check
        </CreateButton>
      </Header>

      <Tabs>
        <Tab active={activeTab === 'records'} onClick={() => setActiveTab('records')}>
          Compliance Records
        </Tab>
        <Tab active={activeTab === 'audits'} onClick={() => setActiveTab('audits')}>
          Audit Trails
        </Tab>
      </Tabs>

      {activeTab === 'records' && (
        <ComplianceGrid>
          {complianceRecords.map((record) => (
            <ComplianceCard key={record.id}>
              <CardHeader>
                <CardTitle>Batch #{record.batchId}</CardTitle>
                <StatusBadge status={record.status}>
                  {getStatusIcon(record.status)}
                  {record.status}
                </StatusBadge>
              </CardHeader>

              <CardInfo>
                <InfoRow>
                  <InfoLabel>Check Type:</InfoLabel>
                  <InfoValue>{record.checkType}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Auditor:</InfoLabel>
                  <InfoValue>{record.auditor.slice(0, 6)}...{record.auditor.slice(-4)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Timestamp:</InfoLabel>
                  <InfoValue>{record.timestamp}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Passed:</InfoLabel>
                  <InfoValue>{record.passed ? 'Yes' : 'No'}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Notes:</InfoLabel>
                  <InfoValue>{record.notes}</InfoValue>
                </InfoRow>
                {record.findings && (
                  <InfoRow>
                    <InfoLabel>Findings:</InfoLabel>
                    <InfoValue>{record.findings}</InfoValue>
                  </InfoRow>
                )}
              </CardInfo>

              <ActionButtons>
                <ActionButton onClick={() => openUpdateModal(record)}>
                  <FiEdit size={16} />
                  Update Status
                </ActionButton>
                <ActionButton>
                  <FiEye size={16} />
                  View Details
                </ActionButton>
              </ActionButtons>
            </ComplianceCard>
          ))}
        </ComplianceGrid>
      )}

      {activeTab === 'audits' && (
        <ComplianceGrid>
          {auditTrails.map((audit) => (
            <ComplianceCard key={audit.id}>
              <CardHeader>
                <CardTitle>Audit #{audit.id}</CardTitle>
                <StatusBadge status={audit.result}>
                  {getStatusIcon(audit.result)}
                  {audit.result}
                </StatusBadge>
              </CardHeader>

              <CardInfo>
                <InfoRow>
                  <InfoLabel>Batch ID:</InfoLabel>
                  <InfoValue>#{audit.batchId}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Audit Type:</InfoLabel>
                  <InfoValue>{audit.auditType}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Auditor:</InfoLabel>
                  <InfoValue>{audit.auditor.slice(0, 6)}...{audit.auditor.slice(-4)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Audit Date:</InfoLabel>
                  <InfoValue>{audit.auditDate}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Findings:</InfoLabel>
                  <InfoValue>{audit.findings}</InfoValue>
                </InfoRow>
                {audit.recommendations && (
                  <InfoRow>
                    <InfoLabel>Recommendations:</InfoLabel>
                    <InfoValue>{audit.recommendations}</InfoValue>
                  </InfoRow>
                )}
              </CardInfo>

              <ActionButtons>
                <ActionButton>
                  <FiFileText size={16} />
                  View Report
                </ActionButton>
              </ActionButtons>
            </ComplianceCard>
          ))}
        </ComplianceGrid>
      )}

      {/* Create Compliance Check Modal */}
      {showCreateModal && (
        <Modal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Add Compliance Check</h3>
            <form onSubmit={createComplianceCheck}>
              <FormGroup>
                <Label>Batch ID</Label>
                <Input
                  type="number"
                  value={formData.batchId || ''}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Check Type</Label>
                <Select
                  value={formData.checkType || 0}
                  onChange={(e) => setFormData({ ...formData, checkType: parseInt(e.target.value) })}
                  required
                >
                  {checkTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Notes</Label>
                <TextArea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Findings</Label>
                <TextArea
                  value={formData.findings || ''}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Corrective Actions</Label>
                <TextArea
                  value={formData.correctiveActions || ''}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Check'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedRecord && (
        <Modal onClick={() => setShowUpdateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Update Compliance Status</h3>
            <form onSubmit={updateComplianceStatus}>
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
                <Label>
                  <input
                    type="checkbox"
                    checked={formData.passed || false}
                    onChange={(e) => setFormData({ ...formData, passed: e.target.checked })}
                  />
                  {' '}Passed
                </Label>
              </FormGroup>
              <FormGroup>
                <Label>Updated Notes</Label>
                <TextArea
                  value={formData.updatedNotes || ''}
                  onChange={(e) => setFormData({ ...formData, updatedNotes: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowUpdateModal(false)}>
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

      {/* Record Audit Trail Modal */}
      {showAuditModal && (
        <Modal onClick={() => setShowAuditModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Record Audit Trail</h3>
            <form onSubmit={recordAuditTrail}>
              <FormGroup>
                <Label>Batch ID</Label>
                <Input
                  type="number"
                  value={formData.batchId || ''}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Audit Type</Label>
                <Select
                  value={formData.auditType || 0}
                  onChange={(e) => setFormData({ ...formData, auditType: parseInt(e.target.value) })}
                  required
                >
                  {checkTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Findings</Label>
                <TextArea
                  value={formData.findings || ''}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Recommendations</Label>
                <TextArea
                  value={formData.recommendations || ''}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Result</Label>
                <Select
                  value={formData.result || 0}
                  onChange={(e) => setFormData({ ...formData, result: parseInt(e.target.value) })}
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowAuditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Audit'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </ComplianceContainer>
  );
};

export default ComplianceManager;