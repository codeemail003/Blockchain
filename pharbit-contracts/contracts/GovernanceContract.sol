// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title GovernanceContract
 * @notice Multi-signature governance with role-based access control for Pharbit
 */
contract GovernanceContract is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VIEWER_ROLE = keccak256("VIEWER_ROLE");

    struct Proposal {
        address proposer;
        string description;
        uint256 createdAt;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    // owners are the multi-sig participants
    EnumerableSet.AddressSet private ownerSet;
    uint256 public quorum; // required yes votes to pass

    // governance proposals
    uint256 public proposalCount;
    mapping(uint256 => Proposal) private proposals;

    // events
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event QuorumUpdated(uint256 quorum);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event RolesAssigned(address indexed account, bytes32 role);
    event RolesRevoked(address indexed account, bytes32 role);

    error InvalidOwner();
    error DuplicateOwner();
    error NotOwner();
    error InvalidQuorum();
    error ProposalNotFound();
    error VotingClosed();
    error AlreadyVoted();
    error NotAdmin();

    modifier onlyOwner() {
        if (!ownerSet.contains(msg.sender)) revert NotOwner();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAdmin();
        _;
    }

    constructor(address[] memory initialOwners, uint256 initialQuorum, address admin) {
        require(initialOwners.length > 0, "Owners required");
        for (uint256 i = 0; i < initialOwners.length; i++) {
            address owner = initialOwners[i];
            if (owner == address(0)) revert InvalidOwner();
            if (!ownerSet.add(owner)) revert DuplicateOwner();
        }
        _setQuorum(initialQuorum);

        // Access control setup
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // Owner management
    function addOwner(address newOwner) external onlyAdmin {
        if (newOwner == address(0)) revert InvalidOwner();
        if (!ownerSet.add(newOwner)) revert DuplicateOwner();
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) external onlyAdmin {
        if (!ownerSet.remove(owner)) revert InvalidOwner();
        if (quorum > ownerSet.length()) {
            quorum = ownerSet.length();
            emit QuorumUpdated(quorum);
        }
        emit OwnerRemoved(owner);
    }

    function owners() external view returns (address[] memory) {
        return ownerSet.values();
    }

    function setQuorum(uint256 newQuorum) external onlyAdmin {
        _setQuorum(newQuorum);
    }

    function _setQuorum(uint256 newQuorum) internal {
        if (newQuorum == 0 || newQuorum > ownerSet.length()) revert InvalidQuorum();
        quorum = newQuorum;
        emit QuorumUpdated(newQuorum);
    }

    // Proposals
    function createProposal(string calldata description, uint256 votingPeriodSeconds) external onlyOwner returns (uint256) {
        require(bytes(description).length > 0, "desc required");
        require(votingPeriodSeconds >= 1 minutes && votingPeriodSeconds <= 30 days, "bad period");

        uint256 id = ++proposalCount;
        Proposal storage p = proposals[id];
        p.proposer = msg.sender;
        p.description = description;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + votingPeriodSeconds;

        emit ProposalCreated(id, msg.sender, description, p.deadline);
        return id;
    }

    function vote(uint256 proposalId, bool support) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        if (p.createdAt == 0) revert ProposalNotFound();
        if (block.timestamp > p.deadline) revert VotingClosed();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        p.hasVoted[msg.sender] = true;
        if (support) {
            p.yesVotes += 1;
        } else {
            p.noVotes += 1;
        }
        emit Voted(proposalId, msg.sender, support, 1);
    }

    function execute(uint256 proposalId) external onlyOwner returns (bool passed) {
        Proposal storage p = proposals[proposalId];
        if (p.createdAt == 0) revert ProposalNotFound();
        if (block.timestamp <= p.deadline) revert VotingClosed();
        require(!p.executed, "already executed");

        passed = p.yesVotes >= quorum && p.yesVotes > p.noVotes;
        p.executed = true;
        emit ProposalExecuted(proposalId, passed);
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            string memory description,
            uint256 createdAt,
            uint256 yesVotes,
            uint256 noVotes,
            uint256 deadline,
            bool executed
        )
    {
        Proposal storage p = proposals[proposalId];
        if (p.createdAt == 0) revert ProposalNotFound();
        return (p.proposer, p.description, p.createdAt, p.yesVotes, p.noVotes, p.deadline, p.executed);
    }

    // Role assignment helpers via ADMIN_ROLE
    function grantViewer(address account) external onlyAdmin {
        _grantRole(VIEWER_ROLE, account);
        emit RolesAssigned(account, VIEWER_ROLE);
    }

    function grantAuditor(address account) external onlyAdmin {
        _grantRole(AUDITOR_ROLE, account);
        emit RolesAssigned(account, AUDITOR_ROLE);
    }

    function grantAdmin(address account) external onlyAdmin {
        _grantRole(ADMIN_ROLE, account);
        emit RolesAssigned(account, ADMIN_ROLE);
    }

    function revokeRoleFrom(address account, bytes32 role) external onlyAdmin {
        _revokeRole(role, account);
        emit RolesRevoked(account, role);
    }
}

