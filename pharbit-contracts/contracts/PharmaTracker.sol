// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PharmaTracker
 * @dev A smart contract for tracking pharmaceutical drugs through the supply chain
 * @author Pharbit Team
 */
contract PharmaTracker is Ownable, ReentrancyGuard {
    
    // Struct to represent a drug batch
    struct DrugBatch {
        uint256 id;
        string name;
        string manufacturer;
        uint256 manufactureDate;
        uint256 expiryDate;
        address currentOwner;
        address[] transferHistory;
        bool isActive;
        string batchNumber;
        uint256 quantity;
        string storageConditions;
    }
    
    // Mapping from drug ID to drug batch
    mapping(uint256 => DrugBatch) public drugs;
    
    // Mapping to track authorized manufacturers
    mapping(address => bool) public authorizedManufacturers;
    
    // Counter for drug IDs
    uint256 private drugIdCounter;
    
    // Events
    event DrugRegistered(
        uint256 indexed drugId,
        string name,
        string manufacturer,
        uint256 manufactureDate,
        uint256 expiryDate,
        address indexed manufacturerAddress,
        string batchNumber,
        uint256 quantity
    );
    
    event DrugTransferred(
        uint256 indexed drugId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerDeauthorized(address indexed manufacturer);
    event DrugExpired(uint256 indexed drugId, uint256 expiryDate);
    
    // Modifiers
    modifier onlyAuthorizedManufacturer() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == owner(),
            "Only authorized manufacturers can perform this action"
        );
        _;
    }
    
    modifier drugExists(uint256 _drugId) {
        require(drugs[_drugId].isActive, "Drug does not exist or is inactive");
        _;
    }
    
    modifier notExpired(uint256 _drugId) {
        require(
            block.timestamp < drugs[_drugId].expiryDate,
            "Drug has expired"
        );
        _;
    }
    
    constructor() {
        drugIdCounter = 1;
        // Owner is automatically an authorized manufacturer
        authorizedManufacturers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a manufacturer to register drugs
     * @param _manufacturer Address of the manufacturer to authorize
     */
    function authorizeManufacturer(address _manufacturer) external onlyOwner {
        require(_manufacturer != address(0), "Invalid manufacturer address");
        authorizedManufacturers[_manufacturer] = true;
        emit ManufacturerAuthorized(_manufacturer);
    }
    
    /**
     * @dev Deauthorize a manufacturer
     * @param _manufacturer Address of the manufacturer to deauthorize
     */
    function deauthorizeManufacturer(address _manufacturer) external onlyOwner {
        require(_manufacturer != address(0), "Invalid manufacturer address");
        authorizedManufacturers[_manufacturer] = false;
        emit ManufacturerDeauthorized(_manufacturer);
    }
    
    /**
     * @dev Register a new drug batch
     * @param _name Name of the drug
     * @param _manufacturer Name of the manufacturer
     * @param _manufactureDate Unix timestamp of manufacture date
     * @param _expiryDate Unix timestamp of expiry date
     * @param _batchNumber Unique batch number
     * @param _quantity Quantity of drugs in the batch
     * @param _storageConditions Storage conditions for the drug
     * @return drugId The ID of the registered drug
     */
    function registerDrug(
        string memory _name,
        string memory _manufacturer,
        uint256 _manufactureDate,
        uint256 _expiryDate,
        string memory _batchNumber,
        uint256 _quantity,
        string memory _storageConditions
    ) external onlyAuthorizedManufacturer nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Drug name cannot be empty");
        require(bytes(_manufacturer).length > 0, "Manufacturer name cannot be empty");
        require(bytes(_batchNumber).length > 0, "Batch number cannot be empty");
        require(_manufactureDate > 0, "Invalid manufacture date");
        require(_expiryDate > _manufactureDate, "Expiry date must be after manufacture date");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        uint256 drugId = drugIdCounter;
        drugIdCounter++;
        
        drugs[drugId] = DrugBatch({
            id: drugId,
            name: _name,
            manufacturer: _manufacturer,
            manufactureDate: _manufactureDate,
            expiryDate: _expiryDate,
            currentOwner: msg.sender,
            transferHistory: new address[](0),
            isActive: true,
            batchNumber: _batchNumber,
            quantity: _quantity,
            storageConditions: _storageConditions
        });
        
        // Add manufacturer as first in transfer history
        drugs[drugId].transferHistory.push(msg.sender);
        
        emit DrugRegistered(
            drugId,
            _name,
            _manufacturer,
            _manufactureDate,
            _expiryDate,
            msg.sender,
            _batchNumber,
            _quantity
        );
        
        return drugId;
    }
    
    /**
     * @dev Transfer drug ownership
     * @param _drugId ID of the drug to transfer
     * @param _to Address to transfer the drug to
     */
    function transferDrug(uint256 _drugId, address _to) 
        external 
        drugExists(_drugId) 
        notExpired(_drugId) 
        nonReentrant 
    {
        require(_to != address(0), "Cannot transfer to zero address");
        require(_to != drugs[_drugId].currentOwner, "Cannot transfer to current owner");
        require(
            msg.sender == drugs[_drugId].currentOwner,
            "Only current owner can transfer the drug"
        );
        
        address from = drugs[_drugId].currentOwner;
        drugs[_drugId].currentOwner = _to;
        drugs[_drugId].transferHistory.push(_to);
        
        emit DrugTransferred(_drugId, from, _to, block.timestamp);
    }
    
    /**
     * @dev Get drug information
     * @param _drugId ID of the drug
     * @return DrugBatch struct containing all drug information
     */
    function getDrug(uint256 _drugId) external view drugExists(_drugId) returns (DrugBatch memory) {
        return drugs[_drugId];
    }
    
    /**
     * @dev Get transfer history for a drug
     * @param _drugId ID of the drug
     * @return Array of addresses representing the transfer history
     */
    function getTransferHistory(uint256 _drugId) 
        external 
        view 
        drugExists(_drugId) 
        returns (address[] memory) 
    {
        return drugs[_drugId].transferHistory;
    }
    
    /**
     * @dev Check if a drug has expired
     * @param _drugId ID of the drug
     * @return Boolean indicating if the drug has expired
     */
    function isDrugExpired(uint256 _drugId) external view drugExists(_drugId) returns (bool) {
        return block.timestamp >= drugs[_drugId].expiryDate;
    }
    
    /**
     * @dev Get days until expiry for a drug
     * @param _drugId ID of the drug
     * @return Days until expiry (0 if expired)
     */
    function getDaysUntilExpiry(uint256 _drugId) external view drugExists(_drugId) returns (uint256) {
        if (block.timestamp >= drugs[_drugId].expiryDate) {
            return 0;
        }
        return (drugs[_drugId].expiryDate - block.timestamp) / 1 days;
    }
    
    /**
     * @dev Get all drugs owned by an address
     * @param _owner Address of the owner
     * @return Array of drug IDs owned by the address
     */
    function getDrugsByOwner(address _owner) external view returns (uint256[] memory) {
        uint256[] memory ownedDrugs = new uint256[](drugIdCounter - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < drugIdCounter; i++) {
            if (drugs[i].isActive && drugs[i].currentOwner == _owner) {
                ownedDrugs[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = ownedDrugs[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get total number of registered drugs
     * @return Total number of drugs registered
     */
    function getTotalDrugs() external view returns (uint256) {
        return drugIdCounter - 1;
    }
    
    /**
     * @dev Deactivate a drug (for recall purposes)
     * @param _drugId ID of the drug to deactivate
     */
    function deactivateDrug(uint256 _drugId) external onlyOwner drugExists(_drugId) {
        drugs[_drugId].isActive = false;
    }
    
    /**
     * @dev Check if an address is an authorized manufacturer
     * @param _address Address to check
     * @return Boolean indicating if the address is authorized
     */
    function isAuthorizedManufacturer(address _address) external view returns (bool) {
        return authorizedManufacturers[_address] || _address == owner();
    }
    
    /**
     * @dev Get drug information in a more gas-efficient way
     * @param _drugId ID of the drug
     * @return name Drug name
     * @return manufacturer Manufacturer name
     * @return expiryDate Expiry timestamp
     * @return currentOwner Current owner address
     * @return expired Whether drug has expired
     */
    function getDrugBasicInfo(uint256 _drugId) 
        external 
        view 
        drugExists(_drugId) 
        returns (
            string memory name,
            string memory manufacturer,
            uint256 expiryDate,
            address currentOwner,
            bool expired
        ) 
    {
        DrugBatch storage drug = drugs[_drugId];
        return (
            drug.name,
            drug.manufacturer,
            drug.expiryDate,
            drug.currentOwner,
            block.timestamp >= drug.expiryDate
        );
    }
}