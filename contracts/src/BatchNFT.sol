// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PharmaceuticalBatch.sol";

/**
 * @title BatchNFT
 * @dev NFT contract for pharmaceutical batch tokenization
 * @author PharbitChain Team
 */
contract BatchNFT is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {

    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant METADATA_UPDATER_ROLE = keccak256("METADATA_UPDATER_ROLE");

    // ============ STATE VARIABLES ============
    uint256 private _tokenIdCounter;
    PharmaceuticalBatch public pharmaceuticalBatchContract;
    
    // Mapping from tokenId to batchId
    mapping(uint256 => uint256) public tokenIdToBatchId;
    mapping(uint256 => uint256) public batchIdToTokenId;
    mapping(uint256 => bool) public batchTokenized;
    
    // NFT metadata
    mapping(uint256 => string) public tokenMetadata;
    mapping(uint256 => mapping(string => string)) public tokenAttributes;

    // ============ EVENTS ============
    event BatchNFTMinted(
        uint256 indexed tokenId,
        uint256 indexed batchId,
        string drugName,
        string batchNumber,
        address indexed minter
    );

    event BatchNFTBurned(
        uint256 indexed tokenId,
        uint256 indexed batchId,
        address indexed burner
    );

    event TokenMetadataUpdated(
        uint256 indexed tokenId,
        string metadata,
        address indexed updater
    );

    event TokenAttributeUpdated(
        uint256 indexed tokenId,
        string key,
        string value,
        address indexed updater
    );

    event BatchContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );

    // ============ MODIFIERS ============
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    modifier batchNotTokenized(uint256 batchId) {
        require(!batchTokenized[batchId], "Batch already tokenized");
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(pharmaceuticalBatchContract.batchExists(batchId), "Batch does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        string memory name,
        string memory symbol,
        address _pharmaceuticalBatchContract
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(METADATA_UPDATER_ROLE, msg.sender);
        
        pharmaceuticalBatchContract = PharmaceuticalBatch(_pharmaceuticalBatchContract);
    }

    // ============ MINTING & BURNING ============

    /**
     * @dev Mint NFT for a pharmaceutical batch
     * @param to Address to mint the NFT to
     * @param batchId ID of the batch to tokenize
     * @param _tokenURI URI for the token metadata
     * @param metadata Additional metadata for the token
     * @param attributesKeys Array of attribute keys
     * @param attributesValues Array of attribute values
     */
    function mintBatchNFT(
        address to,
        uint256 batchId,
        string memory _tokenURI,
        string memory metadata,
        string[] memory attributesKeys,
        string[] memory attributesValues
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant batchExists(batchId) batchNotTokenized(batchId) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(_tokenURI).length > 0, "Token URI required");
        require(attributesKeys.length == attributesValues.length, "Attributes arrays length mismatch");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Get batch information
        (
            uint256 batchId_,
            string memory drugName,
            string memory drugCode,
            string memory manufacturer,
            uint256 manufactureDate,
            uint256 expiryDate,
            uint256 quantity,
            PharmaceuticalBatch.BatchStatus status,
            address currentOwner,
            string memory serialNumbers,
            uint256 createdAt,
            uint256 updatedAt
        ) = pharmaceuticalBatchContract.getBatch(batchId);

        // Verify batch ownership
        require(currentOwner == msg.sender || hasRole(MINTER_ROLE, msg.sender), "Not batch owner or authorized minter");

        // Mint the NFT
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Set mappings
        tokenIdToBatchId[tokenId] = batchId;
        batchIdToTokenId[batchId] = tokenId;
        batchTokenized[batchId] = true;
        tokenMetadata[tokenId] = metadata;

        // Set attributes
        for (uint256 i = 0; i < attributesKeys.length; i++) {
            tokenAttributes[tokenId][attributesKeys[i]] = attributesValues[i];
        }

        emit BatchNFTMinted(tokenId, batchId, drugName, drugCode, msg.sender);
    }

    /**
     * @dev Burn NFT for a batch
     * @param tokenId ID of the token to burn
     */
    function burnBatchNFT(uint256 tokenId) external onlyRole(BURNER_ROLE) whenNotPaused nonReentrant {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        uint256 batchId = tokenIdToBatchId[tokenId];
        require(batchId != 0, "Invalid batch ID");

        // Update mappings
        delete tokenIdToBatchId[tokenId];
        delete batchIdToTokenId[batchId];
        batchTokenized[batchId] = false;
        delete tokenMetadata[tokenId];

        // Clear attributes
        // Note: In a production environment, you might want to keep a record of burned tokens

        _burn(tokenId);

        emit BatchNFTBurned(tokenId, batchId, msg.sender);
    }

    // ============ METADATA MANAGEMENT ============

    /**
     * @dev Update token metadata
     * @param tokenId ID of the token
     * @param metadata New metadata
     */
    function updateTokenMetadata(
        uint256 tokenId,
        string memory metadata
    ) external onlyRole(METADATA_UPDATER_ROLE) whenNotPaused {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        tokenMetadata[tokenId] = metadata;

        emit TokenMetadataUpdated(tokenId, metadata, msg.sender);
    }

    /**
     * @dev Update token attribute
     * @param tokenId ID of the token
     * @param key Attribute key
     * @param value Attribute value
     */
    function updateTokenAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) external onlyRole(METADATA_UPDATER_ROLE) whenNotPaused {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(key).length > 0, "Key cannot be empty");

        tokenAttributes[tokenId][key] = value;

        emit TokenAttributeUpdated(tokenId, key, value, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get batch ID from token ID
     * @param tokenId ID of the token
     * @return Batch ID
     */
    function getBatchFromToken(uint256 tokenId) external view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenIdToBatchId[tokenId];
    }

    /**
     * @dev Get token ID from batch ID
     * @param batchId ID of the batch
     * @return Token ID
     */
    function getTokenFromBatch(uint256 batchId) external view returns (uint256) {
        require(batchTokenized[batchId], "Batch not tokenized");
        return batchIdToTokenId[batchId];
    }

    /**
     * @dev Check if batch is tokenized
     * @param batchId ID of the batch
     * @return True if batch is tokenized
     */
    function isBatchTokenized(uint256 batchId) external view returns (bool) {
        return batchTokenized[batchId];
    }

    /**
     * @dev Get token metadata
     * @param tokenId ID of the token
     * @return Token metadata
     */
    function getTokenMetadata(uint256 tokenId) external view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenMetadata[tokenId];
    }

    /**
     * @dev Get token attribute
     * @param tokenId ID of the token
     * @param key Attribute key
     * @return Attribute value
     */
    function getTokenAttribute(uint256 tokenId, string memory key) external view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenAttributes[tokenId][key];
    }

    /**
     * @dev Get comprehensive token information
     * @param tokenId ID of the token
     * @return batchId The batch ID
     * @return drugName The drug name
     * @return drugCode The drug code
     * @return manufacturer The manufacturer
     * @return quantity The quantity
     * @return status The batch status
     * @return currentOwner The current owner
     * @return tokenMetadata_ The token metadata
     * @return tokenURI_ The token URI
     */
    function getTokenInfo(uint256 tokenId) external view returns (
        uint256 batchId,
        string memory drugName,
        string memory drugCode,
        string memory manufacturer,
        uint256 quantity,
        PharmaceuticalBatch.BatchStatus status,
        address currentOwner,
        string memory tokenMetadata_,
        string memory tokenURI_
    ) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        batchId = tokenIdToBatchId[tokenId];
        (
            ,
            drugName,
            drugCode,
            manufacturer,
            ,
            ,
            quantity,
            status,
            currentOwner,
            ,
            ,
            
        ) = pharmaceuticalBatchContract.getBatch(batchId);
        
        tokenMetadata_ = tokenMetadata[tokenId];
        tokenURI_ = tokenURI(tokenId);
    }

    /**
     * @dev Get all tokens owned by address
     * @param owner Owner address
     * @return Array of token IDs
     */
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }

    /**
     * @dev Get total supply
     * @return Total number of tokens
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenIdCounter;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update pharmaceutical batch contract address
     * @param newContract New contract address
     */
    function updatePharmaceuticalBatchContract(address newContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newContract != address(0), "Invalid contract address");
        
        address oldContract = address(pharmaceuticalBatchContract);
        pharmaceuticalBatchContract = PharmaceuticalBatch(newContract);
        
        emit BatchContractUpdated(oldContract, newContract);
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

    // ============ OVERRIDE FUNCTIONS ============

    /**
     * @dev Override tokenURI to include batch information
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override _update to add pausable functionality
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721, ERC721Enumerable) 
        whenNotPaused 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override _increaseBalance to handle enumerable functionality
     */
    function _increaseBalance(address account, uint128 value) 
        internal 
        override(ERC721, ERC721Enumerable) 
    {
        super._increaseBalance(account, value);
    }


    /**
     * @dev Override supportsInterface to include all interfaces
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}