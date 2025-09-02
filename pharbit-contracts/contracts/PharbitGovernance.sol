// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PharbitGovernance is AccessControl {
	bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

	struct Params {
		int16 minTempC; // scaled by 10
		int16 maxTempC; // scaled by 10
		uint256 sensorWindowSec;
	}

	Params public params;

	event ParamsUpdated(Params params);

	constructor(address admin, int16 minTempC, int16 maxTempC, uint256 sensorWindowSec) {
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(GOVERNOR_ROLE, admin);
		params = Params(minTempC, maxTempC, sensorWindowSec);
		emit ParamsUpdated(params);
	}

	function updateParams(Params calldata p) external onlyRole(GOVERNOR_ROLE) {
		params = p;
		emit ParamsUpdated(params);
	}
}