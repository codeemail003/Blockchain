// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./PharmaceuticalBatch.sol";

/**
 * @title ComplianceManager
 * @dev Smart contract for managing pharmaceutical compliance and auditing
 * @author PharbitChain Team
 */
contract ComplianceManager is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ ROLES ============
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant QUALITY_MANAGER_ROLE = keccak256("QUALITY_MANAGER_ROLE");

    // ============ ENUMS ============
    enum CheckType {
        QUALITY_CONTROL,
        REGULATORY_COMPLIANCE,
        SAFETY_INSPECTION,
        DOCUMENTATION_REVIEW,
        STORAGE_CONDITIONS,
        TRANSPORT_COMPLIANCE,
        MANUFACTURING_STANDARDS,
        PACKAGING_INTEGRITY
    }

    enum ComplianceStatus {
        PENDING,
        PASSED,
        FAILED,
        REQUIRES_ATTENTION,
        UNDER_REVIEW
    }

    // ============ STRUCTS ============
    struct ComplianceRecord {
        uint256 recordId;
        uint256 batchId;
        CheckType checkType;
        ComplianceStatus status;
        bool passed;
        uint256 timestamp;
        address auditor;
        string notes;
        string findings;
        string correctiveActions;
        string[] evidenceHashes;
        mapping(string => string) additionalData;
    }

    struct ComplianceStandard {
        string name;
        string description;
        string version;
        bool isActive;
        string[] requirements;
        uint256 createdAt;
        address createdBy;
    }

    struct AuditTrail {
        uint256 auditId;
        uint256 batchId;
        address auditor;
        uint256 auditDate;
        CheckType auditType;
        string findings;
        string recommendations;
        ComplianceStatus result;
        string[] evidenceHashes;
        uint256 createdAt;
    }

    // ============ STATE VARIABLES ============
    Counters.Counter private _recordCounter;
    Counters.Counter private _auditCounter;
    
    PharmaceuticalBatch public pharmaceuticalBatchContract;
    
    mapping(uint256 => ComplianceRecord) public complianceRecords;
    mapping(uint256 => bool) public recordExists;
    mapping(uint256 => ComplianceRecord[]) public batchComplianceHistory;
    mapping(string => ComplianceStandard) public complianceStandards;
    mapping(uint256 => AuditTrail) public auditTrails;
    mapping(address => uint256[]) public auditorRecords;
    mapping(uint256 => bool) public batchCompliant;

    // ============ EVENTS ============
    event ComplianceRecordCreated(
        uint256 indexed recordId,
        uint256 indexed batchId,
        CheckType checkType,
        address indexed auditor,
        ComplianceStatus status
    );

    event ComplianceStatusUpdated(
        uint256 indexed recordId,
        ComplianceStatus oldStatus,
        ComplianceStatus newStatus,
        address indexed updater
    );

    event ComplianceStandardSet(
        string indexed standardName,
        string version,
        bool isActive,
        address indexed creator
    );

    event AuditTrailRecorded(
        uint256 indexed auditId,
        uint256 indexed batchId,
        address indexed auditor,
        CheckType auditType,
        ComplianceStatus result
    );

    event BatchComplianceUpdated(
        uint256 indexed batchId,
        bool isCompliant,
        address indexed updater
    );

    event EvidenceAdded(
        uint256 indexed recordId,
        string evidenceHash,
        address indexed adder
    );

    // ============ MODIFIERS ============
    modifier onlyAuthorizedRole() {
        require(
            hasRole(AUDITOR_ROLE, msg.sender) ||
            hasRole(REGULATOR_ROLE, msg.sender) ||
            hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender) ||
            hasRole(QUALITY_MANAGER_ROLE, msg.sender),
            "Unauthorized role"
        );
        _;
    }

    modifier recordExistsModifier(uint256 recordId) {
        require(recordExists[recordId], "Record does not exist");
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(pharmaceuticalBatchContract.batchExists(batchId), "Batch does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address _pharmaceuticalBatchContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
        _grantRole(QUALITY_MANAGER_ROLE, msg.sender);
        
        pharmaceuticalBatchContract = PharmaceuticalBatch(_pharmaceuticalBatchContract);
    }

    // ============ COMPLIANCE MANAGEMENT ============

    /**
     * @dev Add a compliance check for a batch
     * @param batchId ID of the batch
     * @param checkType Type of compliance check
     * @param notes Notes about the check
     * @param findings Findings from the check
     * @param correctiveActions Corrective actions taken
     * @param evidenceHashes Array of evidence hashes
     * @param additionalDataKeys Array of additional data keys
     * @param additionalDataValues Array of additional data values
     */
    function addComplianceCheck(
        uint256 batchId,
        CheckType checkType,
        string memory notes,
        string memory findings,
        string memory correctiveActions,
        string[] memory evidenceHashes,
        string[] memory additionalDataKeys,
        string[] memory additionalDataValues
    ) external onlyAuthorizedRole whenNotPaused nonReentrant batchExists(batchId) {
        require(bytes(notes).length > 0, "Notes required");
        require(additionalDataKeys.length == additionalDataValues.length, "Additional data arrays length mismatch");

        _recordCounter.increment();
        uint256 recordId = _recordCounter.current();

        ComplianceRecord storage record = complianceRecords[recordId];
        record.recordId = recordId;
        record.batchId = batchId;
        record.checkType = checkType;
        record.status = ComplianceStatus.PENDING;
        record.passed = false;
        record.timestamp = block.timestamp;
        record.auditor = msg.sender;
        record.notes = notes;
        record.findings = findings;
        record.correctiveActions = correctiveActions;
        record.evidenceHashes = evidenceHashes;

        // Set additional data
        for (uint256 i = 0; i < additionalDataKeys.length; i++) {
            record.additionalData[additionalDataKeys[i]] = additionalDataValues[i];
        }

        recordExists[recordId] = true;
        batchComplianceHistory[batchId].push(record);
        auditorRecords[msg.sender].push(recordId);

        emit ComplianceRecordCreated(recordId, batchId, checkType, msg.sender, ComplianceStatus.PENDING);
    }

    /**
     * @dev Update compliance record status
     * @param recordId ID of the record
     * @param newStatus New compliance status
     * @param passed Whether the check passed
     * @param updatedNotes Updated notes
     */
    function updateComplianceStatus(
        uint256 recordId,
        ComplianceStatus newStatus,
        bool passed,
        string memory updatedNotes
    ) external onlyAuthorizedRole whenNotPaused recordExistsModifier(recordId) {
        ComplianceRecord storage record = complianceRecords[recordId];
        ComplianceStatus oldStatus = record.status;

        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");

        record.status = newStatus;
        record.passed = passed;
        if (bytes(updatedNotes).length > 0) {
            record.notes = updatedNotes;
        }

        // Update batch compliance if needed
        _updateBatchCompliance(record.batchId);

        emit ComplianceStatusUpdated(recordId, oldStatus, newStatus, msg.sender);
    }

    /**
     * @dev Add evidence to a compliance record
     * @param recordId ID of the record
     * @param evidenceHash Hash of the evidence
     */
    function addEvidence(
        uint256 recordId,
        string memory evidenceHash
    ) external onlyAuthorizedRole whenNotPaused recordExistsModifier(recordId) {
        require(bytes(evidenceHash).length > 0, "Evidence hash required");

        complianceRecords[recordId].evidenceHashes.push(evidenceHash);

        emit EvidenceAdded(recordId, evidenceHash, msg.sender);
    }

    /**
     * @dev Record an audit trail
     * @param batchId ID of the batch
     * @param auditType Type of audit
     * @param findings Audit findings
     * @param recommendations Recommendations
     * @param result Audit result
     * @param evidenceHashes Array of evidence hashes
     */
    function recordAuditTrail(
        uint256 batchId,
        CheckType auditType,
        string memory findings,
        string memory recommendations,
        ComplianceStatus result,
        string[] memory evidenceHashes
    ) external onlyAuthorizedRole whenNotPaused nonReentrant batchExists(batchId) {
        require(bytes(findings).length > 0, "Findings required");

        _auditCounter.increment();
        uint256 auditId = _auditCounter.current();

        AuditTrail storage audit = auditTrails[auditId];
        audit.auditId = auditId;
        audit.batchId = batchId;
        audit.auditor = msg.sender;
        audit.auditDate = block.timestamp;
        audit.auditType = auditType;
        audit.findings = findings;
        audit.recommendations = recommendations;
        audit.result = result;
        audit.evidenceHashes = evidenceHashes;
        audit.createdAt = block.timestamp;

        emit AuditTrailRecorded(auditId, batchId, msg.sender, auditType, result);
    }

    // ============ COMPLIANCE STANDARDS ============

    /**
     * @dev Set a compliance standard
     * @param name Name of the standard
     * @param description Description of the standard
     * @param version Version of the standard
     * @param isActive Whether the standard is active
     * @param requirements Array of requirements
     */
    function setComplianceStandard(
        string memory name,
        string memory description,
        string memory version,
        bool isActive,
        string[] memory requirements
    ) external onlyRole(REGULATOR_ROLE) whenNotPaused {
        require(bytes(name).length > 0, "Standard name required");
        require(bytes(description).length > 0, "Description required");

        ComplianceStandard storage standard = complianceStandards[name];
        standard.name = name;
        standard.description = description;
        standard.version = version;
        standard.isActive = isActive;
        standard.requirements = requirements;
        standard.createdAt = block.timestamp;
        standard.createdBy = msg.sender;

        emit ComplianceStandardSet(name, version, isActive, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get compliance record
     * @param recordId ID of the record
     * @return Record information
     */
    function getComplianceRecord(uint256 recordId) external view recordExistsModifier(recordId) returns (
        uint256 recordId_,
        uint256 batchId,
        CheckType checkType,
        ComplianceStatus status,
        bool passed,
        uint256 timestamp,
        address auditor,
        string memory notes,
        string memory findings,
        string memory correctiveActions,
        string[] memory evidenceHashes
    ) {
        ComplianceRecord storage record = complianceRecords[recordId];
        return (
            record.recordId,
            record.batchId,
            record.checkType,
            record.status,
            record.passed,
            record.timestamp,
            record.auditor,
            record.notes,
            record.findings,
            record.correctiveActions,
            record.evidenceHashes
        );
    }

    /**
     * @dev Get compliance history for a batch
     * @param batchId ID of the batch
     * @return Array of compliance records
     */
    function getComplianceHistory(uint256 batchId) external view batchExists(batchId) returns (ComplianceRecord[] memory) {
        return batchComplianceHistory[batchId];
    }

    /**
     * @dev Check if batch is compliant
     * @param batchId ID of the batch
     * @return True if batch is compliant
     */
    function isBatchCompliant(uint256 batchId) external view batchExists(batchId) returns (bool) {
        return batchCompliant[batchId];
    }

    /**
     * @dev Get audit trail
     * @param auditId ID of the audit
     * @return Audit trail information
     */
    function getAuditTrail(uint256 auditId) external view returns (
        uint256 auditId_,
        uint256 batchId,
        address auditor,
        uint256 auditDate,
        CheckType auditType,
        string memory findings,
        string memory recommendations,
        ComplianceStatus result,
        string[] memory evidenceHashes,
        uint256 createdAt
    ) {
        require(auditId > 0 && auditId <= _auditCounter.current(), "Invalid audit ID");
        
        AuditTrail storage audit = auditTrails[auditId];
        return (
            audit.auditId,
            audit.batchId,
            audit.auditor,
            audit.auditDate,
            audit.auditType,
            audit.findings,
            audit.recommendations,
            audit.result,
            audit.evidenceHashes,
            audit.createdAt
        );
    }

    /**
     * @dev Get compliance standard
     * @param name Name of the standard
     * @return Standard information
     */
    function getComplianceStandard(string memory name) external view returns (
        string memory standardName,
        string memory description,
        string memory version,
        bool isActive,
        string[] memory requirements,
        uint256 createdAt,
        address createdBy
    ) {
        ComplianceStandard storage standard = complianceStandards[name];
        require(bytes(standard.name).length > 0, "Standard not found");
        
        return (
            standard.name,
            standard.description,
            standard.version,
            standard.isActive,
            standard.requirements,
            standard.createdAt,
            standard.createdBy
        );
    }

    /**
     * @dev Get records by auditor
     * @param auditor Auditor address
     * @return Array of record IDs
     */
    function getRecordsByAuditor(address auditor) external view returns (uint256[] memory) {
        return auditorRecords[auditor];
    }

    /**
     * @dev Get total number of records
     * @return Total record count
     */
    function getTotalRecords() external view returns (uint256) {
        return _recordCounter.current();
    }

    /**
     * @dev Get total number of audits
     * @return Total audit count
     */
    function getTotalAudits() external view returns (uint256) {
        return _auditCounter.current();
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Update batch compliance status
     * @param batchId ID of the batch
     */
    function _updateBatchCompliance(uint256 batchId) internal {
        ComplianceRecord[] storage records = batchComplianceHistory[batchId];
        bool isCompliant_ = true;

        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].status == ComplianceStatus.FAILED || records[i].status == ComplianceStatus.REQUIRES_ATTENTION) {
                isCompliant_ = false;
                break;
            }
        }

        bool oldStatus = batchCompliant[batchId];
        batchCompliant[batchId] = isCompliant_;

        if (oldStatus != isCompliant_) {
            emit BatchComplianceUpdated(batchId, isCompliant_, msg.sender);
        }
    }

    /**
     * @dev Check if status transition is valid
     * @param from Current status
     * @param to New status
     * @return True if transition is valid
     */
    function _isValidStatusTransition(ComplianceStatus from, ComplianceStatus to) internal pure returns (bool) {
        if (from == ComplianceStatus.PENDING) {
            return to == ComplianceStatus.PASSED || to == ComplianceStatus.FAILED || to == ComplianceStatus.UNDER_REVIEW;
        }
        if (from == ComplianceStatus.UNDER_REVIEW) {
            return to == ComplianceStatus.PASSED || to == ComplianceStatus.FAILED || to == ComplianceStatus.REQUIRES_ATTENTION;
        }
        if (from == ComplianceStatus.REQUIRES_ATTENTION) {
            return to == ComplianceStatus.PASSED || to == ComplianceStatus.FAILED || to == ComplianceStatus.UNDER_REVIEW;
        }
        if (from == ComplianceStatus.PASSED || from == ComplianceStatus.FAILED) {
            return false; // Final states
        }
        return false;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update pharmaceutical batch contract address
     * @param newContract New contract address
     */
    function updatePharmaceuticalBatchContract(address newContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newContract != address(0), "Invalid contract address");
        pharmaceuticalBatchContract = PharmaceuticalBatch(newContract);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}