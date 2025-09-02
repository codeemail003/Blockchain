// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PharbitSensor is AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant IOT_ROLE = keccak256("IOT_ROLE");

	struct Sensor {
		string manufacturer;
		string model;
		string metadataURI;
		bool active;
	}

	mapping(address => Sensor) public sensors;
	mapping(address => bytes32) public sensorPubKeyHash; // optional for signature attestation

	event SensorRegistered(address indexed sensor, string manufacturer, string model);
	event SensorStatus(address indexed sensor, bool active);

	constructor(address admin) {
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(ADMIN_ROLE, admin);
	}

	function registerSensor(address sensor, Sensor calldata info, bytes32 pubKeyHash) external onlyRole(ADMIN_ROLE) {
		require(sensor != address(0), "Invalid sensor");
		sensors[sensor] = info;
		sensors[sensor].active = true;
		sensorPubKeyHash[sensor] = pubKeyHash;
		_grantRole(IOT_ROLE, sensor);
		emit SensorRegistered(sensor, info.manufacturer, info.model);
	}

	function setActive(address sensor, bool active) external onlyRole(ADMIN_ROLE) {
		require(bytes(sensors[sensor].manufacturer).length != 0, "Not registered");
		sensors[sensor].active = active;
		if (active) {
			_grantRole(IOT_ROLE, sensor);
		} else {
			_revokeRole(IOT_ROLE, sensor);
		}
		emit SensorStatus(sensor, active);
	}
}