// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IStakeholderContract {
    enum Role {
        NONE,
        MANUFACTURER,
        DISTRIBUTOR,
        PHARMACY,
        REGULATOR
    }
    struct Company {
        string name;
        Role role;
        bool kycCompleted;
        string kycReference;
        address wallet;
        uint256 registeredAt;
        bool active;
    }
    function getCompany(address wallet) external view returns (Company memory);
}

interface IBatchContract {
    function getBatch(uint256 batchId) external view returns (
        string memory productName,
        string memory metadataURI,
        uint256 manufactureDate,
        uint256 expiryDate,
        address manufacturer,
        bool recalled,
        uint256 createdAt
    );
}

/**
 * @title SupplyChainContract
 * @notice Orchestrates end-to-end tracking across stakeholders with events
 */
contract SupplyChainContract is AccessControl {
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    struct Transfer {
        uint256 batchId;
        address from;
        address to;
        string location;
        uint256 timestamp;
    }

    mapping(uint256 => Transfer[]) private transfers; // batchId => history

    address public stakeholderContract;

    event Transferred(uint256 indexed batchId, address indexed from, address indexed to, string location, uint256 timestamp);

    error NotAllowed();
    error BadInput();

    constructor(address admin, address _stakeholderContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TRANSFER_ROLE, admin);
        stakeholderContract = _stakeholderContract;
    }

    function setStakeholderContract(address sc) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakeholderContract = sc;
    }

    function transferBatch(uint256 batchId, address to, string calldata location) external onlyRole(TRANSFER_ROLE) {
        if (to == address(0) || bytes(location).length == 0) revert BadInput();
        // ensure sender and receiver are registered and active
        IStakeholderContract.Company memory sender = IStakeholderContract(stakeholderContract).getCompany(msg.sender);
        IStakeholderContract.Company memory receiver = IStakeholderContract(stakeholderContract).getCompany(to);
        require(sender.active && receiver.active, "inactive");
        require(sender.kycCompleted && receiver.kycCompleted, "kyc");

        transfers[batchId].push(Transfer({
            batchId: batchId,
            from: msg.sender,
            to: to,
            location: location,
            timestamp: block.timestamp
        }));
        emit Transferred(batchId, msg.sender, to, location, block.timestamp);
    }

    function getTransfers(uint256 batchId) external view returns (Transfer[] memory) {
        return transfers[batchId];
    }
}

