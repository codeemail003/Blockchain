// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Direct deployment script for PharbitDeployer.sol

interface IDeployer {
    function pharbitCore() external view returns (address);
    function complianceManager() external view returns (address);
    function batchNFT() external view returns (address);
}

contract DeployHelper {
    address public deployerAddress;
    
    constructor(address _deployerAddress) {
        deployerAddress = _deployerAddress;
    }
    
    function getAddresses() public view returns (address, address, address) {
        IDeployer deployer = IDeployer(deployerAddress);
        return (
            deployer.pharbitCore(),
            deployer.complianceManager(),
            deployer.batchNFT()
        );
    }
}