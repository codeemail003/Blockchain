// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SensorDataContract
 * @notice Stores IoT sensor telemetry for batches with validation and history queries
 */
contract SensorDataContract is AccessControl {
    bytes32 public constant DATA_WRITER_ROLE = keccak256("DATA_WRITER_ROLE");
    bytes32 public constant DATA_REVIEWER_ROLE = keccak256("DATA_REVIEWER_ROLE");

    struct Telemetry {
        int256 temperatureMilliC; // milli-Celsius for precision
        uint256 humidityPermille; // 0-1000 range => 0-100%
        string location; // could be GPS or site code
        uint256 timestamp;
        bool valid;
    }

    // constraints
    int256 public minTemperatureMilliC;
    int256 public maxTemperatureMilliC;
    uint256 public maxHumidityPermille;

    // batchId => telemetry[]
    mapping(uint256 => Telemetry[]) private telemetryHistory;

    event TelemetryRecorded(uint256 indexed batchId, int256 temperatureMilliC, uint256 humidityPermille, string location, uint256 timestamp, bool valid);
    event ConstraintsUpdated(int256 minTemp, int256 maxTemp, uint256 maxHumidity);

    error NotAuthorized();
    error BadInput();

    constructor(int256 _minTempMilliC, int256 _maxTempMilliC, uint256 _maxHumidityPermille, address admin) {
        require(_minTempMilliC < _maxTempMilliC, "temp range");
        require(_maxHumidityPermille <= 1000, "humidity");
        minTemperatureMilliC = _minTempMilliC;
        maxTemperatureMilliC = _maxTempMilliC;
        maxHumidityPermille = _maxHumidityPermille;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DATA_REVIEWER_ROLE, admin);
    }

    function setConstraints(int256 _minTempMilliC, int256 _maxTempMilliC, uint256 _maxHumidityPermille) external onlyRole(DATA_REVIEWER_ROLE) {
        require(_minTempMilliC < _maxTempMilliC, "temp range");
        require(_maxHumidityPermille <= 1000, "humidity");
        minTemperatureMilliC = _minTempMilliC;
        maxTemperatureMilliC = _maxTempMilliC;
        maxHumidityPermille = _maxHumidityPermille;
        emit ConstraintsUpdated(_minTempMilliC, _maxTempMilliC, _maxHumidityPermille);
    }

    function recordTelemetry(
        uint256 batchId,
        int256 temperatureMilliC,
        uint256 humidityPermille,
        string calldata location,
        uint256 timestamp
    ) external onlyRole(DATA_WRITER_ROLE) {
        if (bytes(location).length == 0) revert BadInput();
        if (humidityPermille > 1000) revert BadInput();
        bool valid = _validate(temperatureMilliC, humidityPermille);
        Telemetry memory t = Telemetry({
            temperatureMilliC: temperatureMilliC,
            humidityPermille: humidityPermille,
            location: location,
            timestamp: timestamp == 0 ? block.timestamp : timestamp,
            valid: valid
        });
        telemetryHistory[batchId].push(t);
        emit TelemetryRecorded(batchId, temperatureMilliC, humidityPermille, location, t.timestamp, valid);
    }

    function _validate(int256 temperatureMilliC, uint256 humidityPermille) internal view returns (bool) {
        if (temperatureMilliC < minTemperatureMilliC) return false;
        if (temperatureMilliC > maxTemperatureMilliC) return false;
        if (humidityPermille > maxHumidityPermille) return false;
        return true;
    }

    function getLatest(uint256 batchId) external view returns (Telemetry memory) {
        Telemetry[] storage arr = telemetryHistory[batchId];
        require(arr.length > 0, "no data");
        return arr[arr.length - 1];
    }

    function getHistoryLength(uint256 batchId) external view returns (uint256) {
        return telemetryHistory[batchId].length;
    }

    function getByIndex(uint256 batchId, uint256 index) external view returns (Telemetry memory) {
        Telemetry[] storage arr = telemetryHistory[batchId];
        require(index < arr.length, "oob");
        return arr[index];
    }
}

