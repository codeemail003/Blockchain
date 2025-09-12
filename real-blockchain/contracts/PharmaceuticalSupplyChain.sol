// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PharmaceuticalSupplyChain
 * @dev Smart contract for tracking pharmaceutical products through the supply chain
 * @author Pharbit Blockchain
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PharmaceuticalSupplyChain is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Counters
    Counters.Counter private _batchIds;
    Counters.Counter private _transactionIds;

    // Structs
    struct MedicineInfo {
        string name;
        string manufacturer;
        string type;
        uint256 expirationDate;
        string dosage;
        string activeIngredients;
    }

    struct Location {
        string facility;
        int256 latitude;
        int256 longitude;
        string address;
    }

    struct SensorData {
        int256 temperature;
        uint256 humidity;
        uint256 lightLevel;
        bool tampering;
        uint256 timestamp;
    }

    struct Batch {
        uint256 batchId;
        MedicineInfo medicineInfo;
        uint256 quantity;
        uint256 manufacturingDate;
        uint256 expirationDate;
        Location manufacturingLocation;
        int256 initialTemperature;
        uint256 initialHumidity;
        address currentStakeholder;
        string status;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Transaction {
        uint256 transactionId;
        uint256 batchId;
        address from;
        address to;
        string action;
        string stakeholder;
        Location location;
        SensorData sensorData;
        uint256 timestamp;
        bool isValid;
    }

    struct Alert {
        uint256 alertId;
        uint256 batchId;
        string alertType;
        string severity;
        string message;
        bool isActive;
        uint256 createdAt;
        address createdBy;
    }

    // Mappings
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Alert) public alerts;
    mapping(uint256 => Transaction[]) public batchTransactions;
    mapping(address => uint256[]) public stakeholderBatches;
    mapping(string => bool) public registeredDrugs;
    mapping(uint256 => SensorData[]) public batchTemperatureHistory;

    // Events
    event BatchCreated(
        uint256 indexed batchId,
        address indexed manufacturer,
        string medicineName,
        uint256 quantity
    );

    event TransactionCreated(
        uint256 indexed transactionId,
        uint256 indexed batchId,
        address indexed from,
        address to,
        string action
    );

    event AlertCreated(
        uint256 indexed alertId,
        uint256 indexed batchId,
        string alertType,
        string severity
    );

    event StakeholderUpdated(
        uint256 indexed batchId,
        address indexed oldStakeholder,
        address indexed newStakeholder
    );

    event TemperatureViolation(
        uint256 indexed batchId,
        int256 temperature,
        int256 threshold
    );

    event BatchRecalled(
        uint256 indexed batchId,
        string reason,
        address indexed recalledBy
    );

    // Modifiers
    modifier onlyStakeholder(uint256 _batchId) {
        require(
            batches[_batchId].currentStakeholder == msg.sender,
            "Only current stakeholder can perform this action"
        );
        _;
    }

    modifier batchExists(uint256 _batchId) {
        require(batches[_batchId].isActive, "Batch does not exist or is inactive");
        _;
    }

    modifier validTemperature(int256 _temperature) {
        require(_temperature >= -50 && _temperature <= 100, "Invalid temperature range");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @dev Create a new pharmaceutical batch
     * @param _medicineInfo Information about the medicine
     * @param _quantity Quantity of medicine in the batch
     * @param _manufacturingLocation Location where the batch was manufactured
     * @param _initialTemperature Initial temperature reading
     * @param _initialHumidity Initial humidity reading
     */
    function createBatch(
        MedicineInfo memory _medicineInfo,
        uint256 _quantity,
        Location memory _manufacturingLocation,
        int256 _initialTemperature,
        uint256 _initialHumidity
    ) external onlyRole(MANUFACTURER_ROLE) validTemperature(_initialTemperature) {
        _batchIds.increment();
        uint256 newBatchId = _batchIds.current();

        Batch storage newBatch = batches[newBatchId];
        newBatch.batchId = newBatchId;
        newBatch.medicineInfo = _medicineInfo;
        newBatch.quantity = _quantity;
        newBatch.manufacturingDate = block.timestamp;
        newBatch.expirationDate = _medicineInfo.expirationDate;
        newBatch.manufacturingLocation = _manufacturingLocation;
        newBatch.initialTemperature = _initialTemperature;
        newBatch.initialHumidity = _initialHumidity;
        newBatch.currentStakeholder = msg.sender;
        newBatch.status = "manufactured";
        newBatch.isActive = true;
        newBatch.createdAt = block.timestamp;
        newBatch.updatedAt = block.timestamp;

        // Register the drug if not already registered
        if (!registeredDrugs[_medicineInfo.name]) {
            registeredDrugs[_medicineInfo.name] = true;
        }

        // Add to stakeholder batches
        stakeholderBatches[msg.sender].push(newBatchId);

        emit BatchCreated(newBatchId, msg.sender, _medicineInfo.name, _quantity);
    }

    /**
     * @dev Transfer batch custody to another stakeholder
     * @param _batchId ID of the batch
     * @param _to New stakeholder address
     * @param _action Action being performed
     * @param _location Current location
     * @param _sensorData Current sensor data
     */
    function transferCustody(
        uint256 _batchId,
        address _to,
        string memory _action,
        Location memory _location,
        SensorData memory _sensorData
    ) external 
        onlyStakeholder(_batchId) 
        batchExists(_batchId)
        validTemperature(_sensorData.temperature)
        nonReentrant
    {
        require(_to != address(0), "Invalid recipient address");
        require(bytes(_action).length > 0, "Action cannot be empty");

        Batch storage batch = batches[_batchId];
        address oldStakeholder = batch.currentStakeholder;

        // Update batch
        batch.currentStakeholder = _to;
        batch.updatedAt = block.timestamp;

        // Create transaction record
        _transactionIds.increment();
        uint256 newTransactionId = _transactionIds.current();

        Transaction storage newTransaction = transactions[newTransactionId];
        newTransaction.transactionId = newTransactionId;
        newTransaction.batchId = _batchId;
        newTransaction.from = oldStakeholder;
        newTransaction.to = _to;
        newTransaction.action = _action;
        newTransaction.stakeholder = _getStakeholderRole(_to);
        newTransaction.location = _location;
        newTransaction.sensorData = _sensorData;
        newTransaction.timestamp = block.timestamp;
        newTransaction.isValid = true;

        // Add to batch transactions
        batchTransactions[_batchId].push(newTransaction);

        // Update stakeholder batches
        stakeholderBatches[_to].push(_batchId);

        // Store temperature data
        batchTemperatureHistory[_batchId].push(_sensorData);

        // Check for temperature violations
        _checkTemperatureViolation(_batchId, _sensorData.temperature);

        emit TransactionCreated(newTransactionId, _batchId, oldStakeholder, _to, _action);
        emit StakeholderUpdated(_batchId, oldStakeholder, _to);
    }

    /**
     * @dev Update batch status
     * @param _batchId ID of the batch
     * @param _newStatus New status
     */
    function updateBatchStatus(
        uint256 _batchId,
        string memory _newStatus
    ) external onlyStakeholder(_batchId) batchExists(_batchId) {
        require(bytes(_newStatus).length > 0, "Status cannot be empty");

        Batch storage batch = batches[_batchId];
        batch.status = _newStatus;
        batch.updatedAt = block.timestamp;
    }

    /**
     * @dev Add temperature data for a batch
     * @param _batchId ID of the batch
     * @param _sensorData Sensor data including temperature
     */
    function addTemperatureData(
        uint256 _batchId,
        SensorData memory _sensorData
    ) external batchExists(_batchId) validTemperature(_sensorData.temperature) {
        batchTemperatureHistory[_batchId].push(_sensorData);
        _checkTemperatureViolation(_batchId, _sensorData.temperature);
    }

    /**
     * @dev Create an alert for a batch
     * @param _batchId ID of the batch
     * @param _alertType Type of alert
     * @param _severity Severity level
     * @param _message Alert message
     */
    function createAlert(
        uint256 _batchId,
        string memory _alertType,
        string memory _severity,
        string memory _message
    ) external batchExists(_batchId) {
        require(bytes(_alertType).length > 0, "Alert type cannot be empty");
        require(bytes(_severity).length > 0, "Severity cannot be empty");
        require(bytes(_message).length > 0, "Message cannot be empty");

        _transactionIds.increment();
        uint256 newAlertId = _transactionIds.current();

        Alert storage newAlert = alerts[newAlertId];
        newAlert.alertId = newAlertId;
        newAlert.batchId = _batchId;
        newAlert.alertType = _alertType;
        newAlert.severity = _severity;
        newAlert.message = _message;
        newAlert.isActive = true;
        newAlert.createdAt = block.timestamp;
        newAlert.createdBy = msg.sender;

        emit AlertCreated(newAlertId, _batchId, _alertType, _severity);
    }

    /**
     * @dev Recall a batch
     * @param _batchId ID of the batch to recall
     * @param _reason Reason for recall
     */
    function recallBatch(
        uint256 _batchId,
        string memory _reason
    ) external onlyRole(REGULATOR_ROLE) batchExists(_batchId) {
        require(bytes(_reason).length > 0, "Recall reason cannot be empty");

        Batch storage batch = batches[_batchId];
        batch.status = "recalled";
        batch.updatedAt = block.timestamp;

        emit BatchRecalled(_batchId, _reason, msg.sender);
    }

    /**
     * @dev Get batch information
     * @param _batchId ID of the batch
     * @return Batch information
     */
    function getBatch(uint256 _batchId) external view returns (Batch memory) {
        require(batches[_batchId].isActive, "Batch does not exist or is inactive");
        return batches[_batchId];
    }

    /**
     * @dev Get batch transaction history
     * @param _batchId ID of the batch
     * @return Array of transactions
     */
    function getBatchTransactions(uint256 _batchId) external view returns (Transaction[] memory) {
        return batchTransactions[_batchId];
    }

    /**
     * @dev Get temperature history for a batch
     * @param _batchId ID of the batch
     * @return Array of sensor data
     */
    function getTemperatureHistory(uint256 _batchId) external view returns (SensorData[] memory) {
        return batchTemperatureHistory[_batchId];
    }

    /**
     * @dev Get batches for a stakeholder
     * @param _stakeholder Address of the stakeholder
     * @return Array of batch IDs
     */
    function getStakeholderBatches(address _stakeholder) external view returns (uint256[] memory) {
        return stakeholderBatches[_stakeholder];
    }

    /**
     * @dev Get total number of batches
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchIds.current();
    }

    /**
     * @dev Get total number of transactions
     * @return Total transaction count
     */
    function getTotalTransactions() external view returns (uint256) {
        return _transactionIds.current();
    }

    /**
     * @dev Check for temperature violations
     * @param _batchId ID of the batch
     * @param _temperature Current temperature
     */
    function _checkTemperatureViolation(uint256 _batchId, int256 _temperature) internal {
        // Standard pharmaceutical storage temperature range: 2-8°C
        if (_temperature < 2 || _temperature > 8) {
            emit TemperatureViolation(_batchId, _temperature, _temperature < 2 ? 2 : 8);
        }
    }

    /**
     * @dev Get stakeholder role based on address
     * @param _address Address to check
     * @return Role string
     */
    function _getStakeholderRole(address _address) internal view returns (string memory) {
        if (hasRole(MANUFACTURER_ROLE, _address)) return "manufacturer";
        if (hasRole(DISTRIBUTOR_ROLE, _address)) return "distributor";
        if (hasRole(PHARMACY_ROLE, _address)) return "pharmacy";
        if (hasRole(REGULATOR_ROLE, _address)) return "regulator";
        if (hasRole(AUDITOR_ROLE, _address)) return "auditor";
        return "unknown";
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