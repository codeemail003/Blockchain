// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPharbitStakeholder {
	function MANUFACTURER_ROLE() external view returns (bytes32);
	function DISTRIBUTOR_ROLE() external view returns (bytes32);
	function PHARMACY_ROLE() external view returns (bytes32);
	function IOT_ROLE() external view returns (bytes32);
	function hasRole(bytes32 role, address account) external view returns (bool);
}

contract PharbitBatch is AccessControl {
	using EnumerableSet for EnumerableSet.Bytes32Set;

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

	enum BatchStatus { Produced, Shipped, Received, Dispensed }

	struct BatchInfo {
		string batchId;
		string medicineName;
		address manufacturer;
		uint256 quantity;
		uint256 expiration; // unix timestamp
		BatchStatus status;
		address custodian;
	}

	struct SensorData {
		int16 temperatureC; // scaled by 10 (e.g., 45 => 4.5C)
		uint8 humidity; // %
		int32 latE7; // lat * 1e7
		int32 lonE7; // lon * 1e7
		bool tampering;
		uint256 timestamp;
	}

	IPharbitStakeholder public stakeholder;
	mapping(bytes32 => BatchInfo) private batches;
	mapping(bytes32 => SensorData[]) private batchSensors;
	EnumerableSet.Bytes32Set private batchKeys;

	event BatchCreated(string indexed batchId, address indexed manufacturer, uint256 quantity, uint256 expiration);
	event BatchStatusUpdated(string indexed batchId, BatchStatus newStatus, address indexed actor);
	event SensorDataRecorded(string indexed batchId, SensorData data, address indexed device);
	event CustodyTransferred(string indexed batchId, address indexed from, address indexed to);

	constructor(address stakeholderContract, address admin) {
		stakeholder = IPharbitStakeholder(stakeholderContract);
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(ADMIN_ROLE, admin);
	}

	modifier onlyManufacturer() {
		require(stakeholder.hasRole(stakeholder.MANUFACTURER_ROLE(), msg.sender), "Not manufacturer");
		_;
	}

	modifier onlyAuthorizedCustodian(bytes32 key) {
		require(batches[key].custodian == msg.sender, "Not batch custodian");
		_;
	}

	modifier onlyAuthorizedUpdater() {
		bool ok = stakeholder.hasRole(stakeholder.MANUFACTURER_ROLE(), msg.sender)
			|| stakeholder.hasRole(stakeholder.DISTRIBUTOR_ROLE(), msg.sender)
			|| stakeholder.hasRole(stakeholder.PHARMACY_ROLE(), msg.sender);
		require(ok, "Not authorized");
		_;
	}

	modifier onlyIoT() {
		require(stakeholder.hasRole(stakeholder.IOT_ROLE(), msg.sender), "Not IoT");
		_;
	}

	function _key(string memory batchId) internal pure returns (bytes32) {
		return keccak256(abi.encodePacked(batchId));
	}

	function createBatch(
		string calldata batchId,
		string calldata medicineName,
		uint256 quantity,
		uint256 expiration,
		address custodian
	) external onlyManufacturer {
		require(bytes(batchId).length > 0, "batchId required");
		bytes32 key = _key(batchId);
		require(batches[key].manufacturer == address(0), "Batch exists");
		require(expiration > block.timestamp, "Invalid expiration");
		require(quantity > 0, "Invalid qty");

		batches[key] = BatchInfo({
			batchId: batchId,
			medicineName: medicineName,
			manufacturer: msg.sender,
			quantity: quantity,
			expiration: expiration,
			status: BatchStatus.Produced,
			custodian: custodian
		});
		batchKeys.add(key);
		emit BatchCreated(batchId, msg.sender, quantity, expiration);
	}

	function updateBatchStatus(string calldata batchId, BatchStatus newStatus) external onlyAuthorizedUpdater {
		bytes32 key = _key(batchId);
		require(batches[key].manufacturer != address(0), "No batch");
		batches[key].status = newStatus;
		emit BatchStatusUpdated(batchId, newStatus, msg.sender);
	}

	function recordSensorData(string calldata batchId, SensorData calldata data) external onlyIoT {
		bytes32 key = _key(batchId);
		require(batches[key].manufacturer != address(0), "No batch");
		require(data.timestamp + 1 days >= block.timestamp, "Stale data");
		batchSensors[key].push(data);
		emit SensorDataRecorded(batchId, data, msg.sender);
	}

	function transferCustody(string calldata batchId, address newCustodian) external {
		bytes32 key = _key(batchId);
		require(batches[key].manufacturer != address(0), "No batch");
		address prev = batches[key].custodian;
		require(prev == msg.sender, "Not current custodian");
		require(newCustodian != address(0), "Invalid custodian");
		batches[key].custodian = newCustodian;
		emit CustodyTransferred(batchId, prev, newCustodian);
	}

	function verifyBatch(string calldata batchId) external view returns (BatchInfo memory info, bool isValid) {
		bytes32 key = _key(batchId);
		info = batches[key];
		if (info.manufacturer == address(0)) return (info, false);
		bool notExpired = info.expiration > block.timestamp;
		bool hasSensors = batchSensors[key].length > 0;
		return (info, notExpired && hasSensors);
	}

	function getSensorData(string calldata batchId) external view returns (SensorData[] memory) {
		return batchSensors[_key(batchId)];
	}

	function getBatch(string calldata batchId) external view returns (BatchInfo memory) {
		return batches[_key(batchId)];
	}
}