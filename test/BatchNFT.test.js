const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BatchNFT", function () {
  async function deployBatchNFTFixture() {
    const [owner, minter, burner, metadataManager, user1, user2] = await ethers.getSigners();

    const BatchNFT = await ethers.getContractFactory("BatchNFT");
    const batchNFT = await BatchNFT.deploy(
      "PharbitBatch",
      "PBT",
      "https://api.pharbit.com/metadata/",
      "https://api.pharbit.com/contract"
    );

    // Grant roles
    await batchNFT.grantRole(batchNFT.MINTER_ROLE(), minter.address);
    await batchNFT.grantRole(batchNFT.BURNER_ROLE(), burner.address);
    await batchNFT.grantRole(batchNFT.METADATA_ROLE(), metadataManager.address);

    return { batchNFT, owner, minter, burner, metadataManager, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { batchNFT } = await loadFixture(deployBatchNFTFixture);
      expect(await batchNFT.name()).to.equal("PharbitBatch");
      expect(await batchNFT.symbol()).to.equal("PBT");
    });

    it("Should set the right owner", async function () {
      const { batchNFT, owner } = await loadFixture(deployBatchNFTFixture);
      expect(await batchNFT.hasRole(batchNFT.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with zero total supply", async function () {
      const { batchNFT } = await loadFixture(deployBatchNFTFixture);
      expect(await batchNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint batch NFT successfully", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      const batchData = {
        batchId: 1,
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        complianceCertificates: ["CERT001", "CERT002"],
        customAttributesKeys: ["temperature", "humidity"],
        customAttributesValues: ["20°C", "45%"],
        tokenURI: "https://api.pharbit.com/metadata/1"
      };

      await expect(batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        batchData.batchId,
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        batchData.quantity,
        batchData.productionDate,
        batchData.expiryDate,
        batchData.batchNumber,
        batchData.serialNumbers,
        batchData.complianceCertificates,
        batchData.customAttributesKeys,
        batchData.customAttributesValues,
        batchData.tokenURI
      )).to.emit(batchNFT, "BatchNFTMinted");

      expect(await batchNFT.totalSupply()).to.equal(1);
      expect(await batchNFT.ownerOf(1)).to.equal(user1.address);
      expect(await batchNFT.isBatchActive(1)).to.be.true;
    });

    it("Should fail to mint with invalid recipient", async function () {
      const { batchNFT, minter } = await loadFixture(deployBatchNFTFixture);

      await expect(batchNFT.connect(minter).mintBatchNFT(
        ethers.ZeroAddress, // Invalid recipient
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      )).to.be.revertedWith("Invalid recipient");
    });

    it("Should fail to mint with empty drug name", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      await expect(batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "", // Empty drug name
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      )).to.be.revertedWith("Drug name required");
    });

    it("Should fail to mint with duplicate batch number", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      const batchData = {
        batchId: 1,
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        complianceCertificates: [],
        customAttributesKeys: [],
        customAttributesValues: [],
        tokenURI: "https://api.pharbit.com/metadata/1"
      };

      // Mint first NFT
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        batchData.batchId,
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        batchData.quantity,
        batchData.productionDate,
        batchData.expiryDate,
        batchData.batchNumber,
        batchData.serialNumbers,
        batchData.complianceCertificates,
        batchData.customAttributesKeys,
        batchData.customAttributesValues,
        batchData.tokenURI
      );

      // Try to mint second NFT with same batch number
      await expect(batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        2,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001", // Same batch number
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/2"
      )).to.be.revertedWith("Batch number exists");
    });

    it("Should fail if non-minter tries to mint", async function () {
      const { batchNFT, user1 } = await loadFixture(deployBatchNFTFixture);

      await expect(batchNFT.connect(user1).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Burning", function () {
    it("Should burn batch NFT successfully", async function () {
      const { batchNFT, minter, burner, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Burn NFT
      await expect(batchNFT.connect(burner).burnBatchNFT(
        1,
        "Batch recalled"
      )).to.emit(batchNFT, "BatchNFTBurned");

      expect(await batchNFT.isBatchActive(1)).to.be.false;
    });

    it("Should fail to burn non-existent token", async function () {
      const { batchNFT, burner } = await loadFixture(deployBatchNFTFixture);

      await expect(batchNFT.connect(burner).burnBatchNFT(
        999, // Non-existent token
        "Batch recalled"
      )).to.be.revertedWith("Batch not active");
    });

    it("Should fail if non-burner tries to burn", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Try to burn as non-burner
      await expect(batchNFT.connect(user1).burnBatchNFT(
        1,
        "Batch recalled"
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Metadata Management", function () {
    it("Should update batch metadata successfully", async function () {
      const { batchNFT, minter, metadataManager, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Update metadata
      await expect(batchNFT.connect(metadataManager).updateBatchMetadata(
        1,
        "temperature",
        "25°C"
      )).to.emit(batchNFT, "BatchMetadataUpdated");

      expect(await batchNFT.getCustomAttribute(1, "temperature")).to.equal("25°C");
    });

    it("Should add compliance certificate successfully", async function () {
      const { batchNFT, minter, metadataManager, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Add compliance certificate
      await expect(batchNFT.connect(metadataManager).addComplianceCertificate(
        1,
        "CERT003"
      )).to.emit(batchNFT, "BatchMetadataUpdated");
    });

    it("Should update batch status successfully", async function () {
      const { batchNFT, minter, metadataManager, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Update status
      await expect(batchNFT.connect(metadataManager).updateBatchStatus(
        1,
        "IN_TRANSIT"
      )).to.emit(batchNFT, "BatchMetadataUpdated");

      expect(await batchNFT.getBatchStatus(1)).to.equal("IN_TRANSIT");
    });

    it("Should fail if non-metadata manager tries to update metadata", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Try to update metadata as non-metadata manager
      await expect(batchNFT.connect(user1).updateBatchMetadata(
        1,
        "temperature",
        "25°C"
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Transfer Functions", function () {
    it("Should transfer batch with info successfully", async function () {
      const { batchNFT, minter, user1, user2 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Transfer with info
      await expect(batchNFT.connect(minter).transferBatchWithInfo(
        user1.address,
        user2.address,
        1,
        "Distribution",
        "Warehouse A",
        true
      )).to.emit(batchNFT, "BatchTransferred");

      expect(await batchNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("Should fail to transfer to zero address", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT first
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      // Try to transfer to zero address
      await expect(batchNFT.connect(minter).transferBatchWithInfo(
        user1.address,
        ethers.ZeroAddress,
        1,
        "Distribution",
        "Warehouse A",
        true
      )).to.be.revertedWith("Invalid recipient");
    });

    it("Should fail to transfer non-existent token", async function () {
      const { batchNFT, minter, user1, user2 } = await loadFixture(deployBatchNFTFixture);

      await expect(batchNFT.connect(minter).transferBatchWithInfo(
        user1.address,
        user2.address,
        999, // Non-existent token
        "Distribution",
        "Warehouse A",
        true
      )).to.be.revertedWith("Batch not active");
    });
  });

  describe("View Functions", function () {
    it("Should return correct batch metadata", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      const batchData = {
        batchId: 1,
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        complianceCertificates: ["CERT001", "CERT002"],
        customAttributesKeys: ["temperature", "humidity"],
        customAttributesValues: ["20°C", "45%"],
        tokenURI: "https://api.pharbit.com/metadata/1"
      };

      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        batchData.batchId,
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        batchData.quantity,
        batchData.productionDate,
        batchData.expiryDate,
        batchData.batchNumber,
        batchData.serialNumbers,
        batchData.complianceCertificates,
        batchData.customAttributesKeys,
        batchData.customAttributesValues,
        batchData.tokenURI
      );

      const metadata = await batchNFT.getBatchMetadata(1);
      expect(metadata.batchId).to.equal(batchData.batchId);
      expect(metadata.drugName).to.equal(batchData.drugName);
      expect(metadata.drugCode).to.equal(batchData.drugCode);
      expect(metadata.manufacturer).to.equal(batchData.manufacturer);
      expect(metadata.quantity).to.equal(batchData.quantity);
      expect(metadata.batchNumber).to.equal(batchData.batchNumber);
      expect(metadata.serialNumbers).to.equal(batchData.serialNumbers);
    });

    it("Should return user tokens", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint multiple NFTs
      for (let i = 1; i <= 3; i++) {
        await batchNFT.connect(minter).mintBatchNFT(
          user1.address,
          i,
          `Drug${i}`,
          `DRUG${i}`,
          "PharmaCorp",
          1000,
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          `BATCH${i}`,
          `SN${i}`,
          [],
          [],
          [],
          `https://api.pharbit.com/metadata/${i}`
        );
      }

      const userTokens = await batchNFT.getUserTokens(user1.address);
      expect(userTokens.length).to.equal(3);
      expect(userTokens[0]).to.equal(1);
      expect(userTokens[1]).to.equal(2);
      expect(userTokens[2]).to.equal(3);
    });

    it("Should return token by batch number", async function () {
      const { batchNFT, minter, user1 } = await loadFixture(deployBatchNFTFixture);

      // Mint NFT
      await batchNFT.connect(minter).mintBatchNFT(
        user1.address,
        1,
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        [],
        [],
        "https://api.pharbit.com/metadata/1"
      );

      const tokenId = await batchNFT.getTokenByBatchNumber("BATCH001");
      expect(tokenId).to.equal(1);
    });
  });
});