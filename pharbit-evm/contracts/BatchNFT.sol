// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BatchNFT
 * @dev NFT representation of pharmaceutical batches
 */
contract BatchNFT is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    mapping(string => uint256) public batchIdToTokenId;
    mapping(uint256 => string) public tokenIdToBatchId;
    
    event BatchTokenized(string batchId, uint256 tokenId, address owner);
    
    constructor() ERC721("PharbitBatch", "PHRB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint NFT for a batch
     */
    function mintBatchToken(
        address owner,
        string memory batchId,
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(batchIdToTokenId[batchId] == 0, "Batch already tokenized");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(owner, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        batchIdToTokenId[batchId] = newTokenId;
        tokenIdToBatchId[newTokenId] = batchId;
        
        emit BatchTokenized(batchId, newTokenId, owner);
        
        return newTokenId;
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}