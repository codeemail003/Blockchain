// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PharbitStakeholder is AccessControl {
	bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
	bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
	bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
	bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
	bytes32 public constant IOT_ROLE = keccak256("IOT_ROLE");
	bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

	struct StakeholderInfo {
		string name;
		string contact;
		string metadataURI; // off-chain docs
		bool active;
	}

	mapping(address => StakeholderInfo) public stakeholders;

	event StakeholderRegistered(address indexed account, string name, string role);
	event StakeholderUpdated(address indexed account, bool active);

	constructor(address admin) {
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
	}

	function registerStakeholder(
		address account,
		string calldata name,
		string calldata contact,
		string calldata metadataURI,
		bytes32 role
	) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(account != address(0), "Invalid account");
		stakeholders[account] = StakeholderInfo({ name: name, contact: contact, metadataURI: metadataURI, active: true });
		_grantRole(role, account);
		emit StakeholderRegistered(account, name, _roleToString(role));
	}

	function setActive(address account, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(bytes(stakeholders[account].name).length != 0, "Not registered");
		stakeholders[account].active = active;
		emit StakeholderUpdated(account, active);
	}

	function hasAnyRole(address account, bytes32[] memory roles) public view returns (bool) {
		for (uint256 i = 0; i < roles.length; i++) {
			if (hasRole(roles[i], account)) return true;
		}
		return false;
	}

	function _roleToString(bytes32 role) internal pure returns (string memory) {
		if (role == MANUFACTURER_ROLE) return "MANUFACTURER";
		if (role == DISTRIBUTOR_ROLE) return "DISTRIBUTOR";
		if (role == PHARMACY_ROLE) return "PHARMACY";
		if (role == HOSPITAL_ROLE) return "HOSPITAL";
		if (role == IOT_ROLE) return "IOT";
		if (role == REGULATOR_ROLE) return "REGULATOR";
		return "UNKNOWN";
	}
}