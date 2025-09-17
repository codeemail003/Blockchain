// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PharbitCore.sol";

/**
 * @title ComplianceManager
 * @dev Manages compliance and regulatory aspects of the pharmaceutical blockchain
 */
contract ComplianceManager is AccessControl {
    bytes32 public constant FDA_ROLE = keccak256("FDA_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");
    
    PharbitCore public core;
    
    struct ComplianceRecord {
        string batchId;
        string regulationType;
        string status;
        address inspector;
        uint256 timestamp;
        string comments;
    }
    
    mapping(string => ComplianceRecord[]) public complianceRecords;
    
    event ComplianceRecordAdded(
        string batchId,
        string regulationType,
        string status,
        address inspector
    );
    
    constructor(address _core) {
        core = PharbitCore(_core);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Add a compliance record for a batch
     */
    function addComplianceRecord(
        string memory batchId,
        string memory regulationType,
        string memory status,
        string memory comments
    ) public onlyRole(INSPECTOR_ROLE) {
        ComplianceRecord memory record = ComplianceRecord({
            batchId: batchId,
            regulationType: regulationType,
            status: status,
            inspector: msg.sender,
            timestamp: block.timestamp,
            comments: comments
        });
        
        complianceRecords[batchId].push(record);
        
        emit ComplianceRecordAdded(
            batchId,
            regulationType,
            status,
            msg.sender
        );
    }
    
    /**
     * @dev FDA approval of a batch
     */
    function fdaApprove(string memory batchId) public onlyRole(FDA_ROLE) {
        core.setFDAApproval(batchId, true);
    }
    
    /**
     * @dev FDA rejection of a batch
     */
    function fdaReject(string memory batchId) public onlyRole(FDA_ROLE) {
        core.setFDAApproval(batchId, false);
    }
    
    /**
     * @dev Get all compliance records for a batch
     */
    function getComplianceRecords(string memory batchId) 
        public 
        view 
        returns (ComplianceRecord[] memory) 
    {
        return complianceRecords[batchId];
    }
}