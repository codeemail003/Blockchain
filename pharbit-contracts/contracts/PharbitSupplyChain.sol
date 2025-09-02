// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPharbitBatch {
	function updateBatchStatus(string calldata batchId, uint8 newStatus) external;
	function transferCustody(string calldata batchId, address newCustodian) external;
}

interface IPharbitStakeholderSC {
	function MANUFACTURER_ROLE() external view returns (bytes32);
	function DISTRIBUTOR_ROLE() external view returns (bytes32);
	function PHARMACY_ROLE() external view returns (bytes32);
	function hasRole(bytes32 role, address account) external view returns (bool);
}

contract PharbitSupplyChain {
	enum Stage { Production, Distribution, Pharmacy, Patient }

	IPharbitBatch public batch;
	IPharbitStakeholderSC public stakeholder;

	event CustodyTransfer(string indexed batchId, address indexed from, address indexed to, Stage stage, uint256 timestamp);
	event DisputeRaised(string indexed batchId, address indexed by, string reason);
	event DisputeResolved(string indexed batchId, address indexed by, string resolution);

	constructor(address batchAddress, address stakeholderAddress) {
		batch = IPharbitBatch(batchAddress);
		stakeholder = IPharbitStakeholderSC(stakeholderAddress);
	}

	modifier onlyAuthorizedTransfer(address from, address to) {
		bool okFrom = stakeholder.hasRole(stakeholder.MANUFACTURER_ROLE(), from)
			|| stakeholder.hasRole(stakeholder.DISTRIBUTOR_ROLE(), from)
			|| stakeholder.hasRole(stakeholder.PHARMACY_ROLE(), from);
		bool okTo = stakeholder.hasRole(stakeholder.DISTRIBUTOR_ROLE(), to)
			|| stakeholder.hasRole(stakeholder.PHARMACY_ROLE(), to);
		require(okFrom && okTo, "Not authorized");
		_;
	}

	function transfer(string calldata batchId, address from, address to, Stage stage) external onlyAuthorizedTransfer(from, to) {
		batch.transferCustody(batchId, to);
		emit CustodyTransfer(batchId, from, to, stage, block.timestamp);
	}

	function raiseDispute(string calldata batchId, string calldata reason) external {
		emit DisputeRaised(batchId, msg.sender, reason);
	}

	function resolveDispute(string calldata batchId, string calldata resolution) external {
		emit DisputeResolved(batchId, msg.sender, resolution);
	}
}