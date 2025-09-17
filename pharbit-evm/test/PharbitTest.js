const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pharbit Contracts", function () {
  let PharbitCore, ComplianceManager, BatchNFT;
  let pharbitCore, complianceManager, batchNFT;
  let owner, addr1, addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy PharbitCore
    PharbitCore = await ethers.getContractFactory("PharbitCore");
    pharbitCore = await PharbitCore.deploy();
    await pharbitCore.deployed();

    // Deploy ComplianceManager
    ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    complianceManager = await ComplianceManager.deploy(pharbitCore.address);
    await complianceManager.deployed();

    // Deploy BatchNFT
    BatchNFT = await ethers.getContractFactory("BatchNFT");
    batchNFT = await BatchNFT.deploy();
    await batchNFT.deployed();
  });

  describe("PharbitCore", function () {
    it("Should register a new drug", async function () {
      const drugId = "DRUG001";
      const drugName = "Test Drug";
      const manufacturer = "Test Manufacturer";

      await pharbitCore.registerDrug(drugId, drugName, manufacturer);
      
      // Get the drug details and verify
      const drug = await pharbitCore.drugs(drugId);
      expect(drug.name).to.equal(drugName);
      expect(drug.manufacturer).to.equal(manufacturer);
    });

    it("Should create a new batch", async function () {
      // First register a drug
      const drugId = "DRUG001";
      await pharbitCore.registerDrug(drugId, "Test Drug", "Test Manufacturer");

      // Create a batch
      const batchId = "BATCH001";
      const quantity = 100;
      await pharbitCore.createBatch(batchId, drugId, quantity);

      // Get the batch details and verify
      const batch = await pharbitCore.batches(batchId);
      expect(batch.drugId).to.equal(drugId);
      expect(batch.quantity).to.equal(quantity);
      expect(batch.status).to.equal("MANUFACTURED");
    });
  });

  describe("ComplianceManager", function () {
    it("Should add compliance record", async function () {
      const batchId = "BATCH001";
      const regulationType = "FDA_CHECK";
      const status = "PASSED";
      const comments = "All requirements met";

      // Grant INSPECTOR_ROLE to owner
      const inspectorRole = await complianceManager.INSPECTOR_ROLE();
      await complianceManager.grantRole(inspectorRole, owner.address);

      await complianceManager.addComplianceRecord(
        batchId,
        regulationType,
        status,
        comments
      );

      // Get compliance records and verify
      const records = await complianceManager.getComplianceRecords(batchId);
      expect(records[0].regulationType).to.equal(regulationType);
      expect(records[0].status).to.equal(status);
      expect(records[0].comments).to.equal(comments);
    });
  });

  describe("BatchNFT", function () {
    it("Should mint batch token", async function () {
      const batchId = "BATCH001";
      const tokenURI = "https://example.com/batch/1";

      // Grant MINTER_ROLE to owner
      const minterRole = await batchNFT.MINTER_ROLE();
      await batchNFT.grantRole(minterRole, owner.address);

      await batchNFT.mintBatchToken(owner.address, batchId, tokenURI);

      // Verify token ownership and metadata
      const tokenId = await batchNFT.batchIdToTokenId(batchId);
      expect(await batchNFT.ownerOf(tokenId)).to.equal(owner.address);
      expect(await batchNFT.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });
});