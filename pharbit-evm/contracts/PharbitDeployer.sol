// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Main contracts combined for easy deployment

contract PharbitCore is Ownable, Pausable {
    // ... [Previous PharbitCore code remains the same]
}

contract ComplianceManager is AccessControl {
    // ... [Previous ComplianceManager code remains the same]
}

contract BatchNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIds;
    
    constructor() ERC721("PharbitBatch", "PHRB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mintBatch(address to) public onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        return newTokenId;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// Deployment contract
contract PharbitDeployer {
    PharbitCore public immutable pharbitCore;
    ComplianceManager public immutable complianceManager;
    BatchNFT public immutable batchNFT;
    
    event ContractsDeployed(
        address indexed pharbitCoreAddress,
        address indexed complianceManagerAddress,
        address indexed batchNFTAddress
    );
    
    constructor() {
        // Deploy core contracts
        pharbitCore = new PharbitCore();
        complianceManager = new ComplianceManager(address(pharbitCore));
        batchNFT = new BatchNFT();
        
        // Setup roles
        complianceManager.grantRole(complianceManager.FDA_ROLE(), msg.sender);
        complianceManager.grantRole(complianceManager.INSPECTOR_ROLE(), msg.sender);
        batchNFT.grantRole(batchNFT.MINTER_ROLE(), msg.sender);

        // Emit deployment addresses
        emit ContractsDeployed(
            address(pharbitCore),
            address(complianceManager),
            address(batchNFT)
        );
    }
    
    function getAddresses() public view returns (address, address, address) {
        return (address(pharbitCore), address(complianceManager), address(batchNFT));
    }
}