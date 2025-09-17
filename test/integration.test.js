const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PharbitChain Integration Tests", function () {
  async function deployFullSystemFixture() {
    const [owner, manufacturer, distributor, pharmacy, inspector, fda, user1, user2] = await ethers.getSigners();

    // Deploy PharbitDeployer
    const PharbitDeployer = await ethers.getContractFactory("PharbitDeployer");
    const pharbitDeployer = await PharbitDeployer.deploy();

    // Deploy all contracts
    const tx = await pharbitDeployer.deployContractsWithRoles(
      "PharbitBatch",
      "PBT",
      "https://api.pharbit.com/metadata/",
      "https://api.pharbit.com/contract",
      owner.address,
      manufacturer.address,
      distributor.address,
      pharmacy.address,
      inspector.address,
      fda.address
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        const parsed = pharbitDeployer.interface.parseLog(log);
        return parsed.name === 'ContractsDeployed';
      } catch (e) {
        return false;
      }
    });

    const parsed = pharbitDeployer.interface.parseLog(event);
    const [deployer, pharbitCore, complianceManager, batchNFT, version] = parsed.args;

    // Get contract instances
    const PharbitCore = await ethers.getContractFactory("PharbitCore");
    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    const BatchNFT = await ethers.getContractFactory("BatchNFT");

    const pharbitCoreContract = PharbitCore.attach(pharbitCore);
    const complianceManagerContract = ComplianceManager.attach(complianceManager);
    const batchNFTContract = BatchNFT.attach(batchNFT);

    return {
      pharbitDeployer,
      pharbitCore: pharbitCoreContract,
      complianceManager: complianceManagerContract,
      batchNFT: batchNFTContract,
      owner,
      manufacturer,
      distributor,
      pharmacy,
      inspector,
      fda,
      user1,
      user2
    };
  }

  describe("End-to-End Workflow", function () {
    it("Should complete full pharmaceutical batch lifecycle", async function () {
      const {
        pharbitCore,
        complianceManager,
        batchNFT,
        manufacturer,
        distributor,
        pharmacy,
        inspector,
        fda
      } = await loadFixture(deployFullSystemFixture);

      // Step 1: Create batch
      const batchData = {
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        metadataKeys: ["temperature", "humidity"],
        metadataValues: ["20°C", "45%"]
      };

      await pharbitCore.connect(manufacturer).createBatch(
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        batchData.quantity,
        batchData.productionDate,
        batchData.expiryDate,
        batchData.batchNumber,
        batchData.serialNumbers,
        batchData.metadataKeys,
        batchData.metadataValues
      );

      // Step 2: Mint NFT for batch
      await batchNFT.connect(manufacturer).mintBatchNFT(
        manufacturer.address,
        1, // batchId
        batchData.drugName,
        batchData.drugCode,
        batchData.manufacturer,
        batchData.quantity,
        batchData.productionDate,
        batchData.expiryDate,
        batchData.batchNumber,
        batchData.serialNumbers,
        ["CERT001"],
        batchData.metadataKeys,
        batchData.metadataValues,
        "https://api.pharbit.com/metadata/1"
      );

      // Step 3: Create compliance record
      await complianceManager.connect(inspector).createComplianceRecord(
        1, // batchId
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      // Step 4: Grant regulatory approval
      await complianceManager.connect(fda).grantRegulatoryApproval(
        batchData.drugCode,
        "FDA-2024-001",
        "FDA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "Standard manufacturing practices"
      );

      // Step 5: Transfer batch to distributor
      await pharbitCore.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        "Distribution",
        "Warehouse A"
      );

      // Step 6: Update batch status
      await pharbitCore.connect(distributor).updateBatchStatus(
        1,
        2, // IN_TRANSIT
        "Shipped to distributor"
      );

      // Step 7: Transfer NFT with info
      await batchNFT.connect(manufacturer).transferBatchWithInfo(
        manufacturer.address,
        distributor.address,
        1,
        "Distribution",
        "Warehouse A",
        true
      );

      // Step 8: Transfer to pharmacy
      await pharbitCore.connect(distributor).transferBatch(
        1,
        pharmacy.address,
        "Pharmacy delivery",
        "Pharmacy B"
      );

      // Step 9: Update status to at pharmacy
      await pharbitCore.connect(pharmacy).updateBatchStatus(
        1,
        3, // AT_PHARMACY
        "Received at pharmacy"
      );

      // Step 10: Dispense batch
      await pharbitCore.connect(pharmacy).updateBatchStatus(
        1,
        4, // DISPENSED
        "Dispensed to patients"
      );

      // Verify final state
      const batch = await pharbitCore.getBatch(1);
      expect(batch.currentOwner).to.equal(pharmacy.address);
      expect(batch.status).to.equal(4); // DISPENSED

      const nftOwner = await batchNFT.ownerOf(1);
      expect(nftOwner).to.equal(distributor.address);

      const isCompliant = await complianceManager.isBatchCompliant(1);
      expect(isCompliant).to.be.true;

      const isApproved = await complianceManager.isDrugApproved(batchData.drugCode);
      expect(isApproved).to.be.true;
    });

    it("Should handle batch recall workflow", async function () {
      const {
        pharbitCore,
        complianceManager,
        batchNFT,
        manufacturer,
        distributor,
        inspector,
        fda
      } = await loadFixture(deployFullSystemFixture);

      // Create and transfer batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      await pharbitCore.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        "Distribution",
        "Warehouse A"
      );

      // Create compliance record
      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      // Recall batch
      await pharbitCore.connect(manufacturer).updateBatchStatus(
        1,
        5, // RECALLED
        "Safety concerns identified"
      );

      // Update compliance record
      await complianceManager.connect(inspector).updateComplianceRecord(
        1,
        false,
        "Safety issues found",
        "Immediate recall required"
      );

      // Verify recall state
      const batch = await pharbitCore.getBatch(1);
      expect(batch.status).to.equal(5); // RECALLED

      const isCompliant = await complianceManager.isBatchCompliant(1);
      expect(isCompliant).to.be.false;
    });

    it("Should handle audit workflow", async function () {
      const {
        pharbitCore,
        complianceManager,
        manufacturer,
        auditor,
        inspector
      } = await loadFixture(deployFullSystemFixture);

      // Create batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      // Conduct audit
      await complianceManager.connect(auditor).conductAudit(
        1,
        "Routine Inspection",
        "Minor issues found",
        "Implement corrective measures"
      );

      // Resolve audit
      await complianceManager.connect(inspector).resolveAudit(
        1,
        "All issues resolved"
      );

      // Verify audit resolution
      const audit = await complianceManager.getAuditTrail(1);
      expect(audit.isResolved).to.be.true;
    });
  });

  describe("Multi-Contract Interactions", function () {
    it("Should maintain consistency across contracts", async function () {
      const {
        pharbitCore,
        complianceManager,
        batchNFT,
        manufacturer,
        inspector
      } = await loadFixture(deployFullSystemFixture);

      // Create batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      // Mint NFT
      await batchNFT.connect(manufacturer).mintBatchNFT(
        manufacturer.address,
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

      // Create compliance record
      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      // Verify consistency
      const batch = await pharbitCore.getBatch(1);
      const nftMetadata = await batchNFT.getBatchMetadata(1);
      const isCompliant = await complianceManager.isBatchCompliant(1);

      expect(batch.batchNumber).to.equal(nftMetadata.batchNumber);
      expect(batch.drugName).to.equal(nftMetadata.drugName);
      expect(isCompliant).to.be.true;
    });

    it("Should handle role-based access correctly", async function () {
      const {
        pharbitCore,
        complianceManager,
        batchNFT,
        manufacturer,
        distributor,
        pharmacy,
        inspector,
        fda
      } = await loadFixture(deployFullSystemFixture);

      // Only manufacturer should create batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      // Only inspector should create compliance record
      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      // Only FDA should grant regulatory approval
      await complianceManager.connect(fda).grantRegulatoryApproval(
        "ASP001",
        "FDA-2024-001",
        "FDA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "Standard manufacturing practices"
      );

      // Verify all operations succeeded
      const batch = await pharbitCore.getBatch(1);
      const isCompliant = await complianceManager.isBatchCompliant(1);
      const isApproved = await complianceManager.isDrugApproved("ASP001");

      expect(batch.batchId).to.equal(1);
      expect(isCompliant).to.be.true;
      expect(isApproved).to.be.true;
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid status transitions", async function () {
      const {
        pharbitCore,
        manufacturer
      } = await loadFixture(deployFullSystemFixture);

      // Create batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      // Try invalid status transition (PRODUCED -> DISPENSED)
      await expect(pharbitCore.connect(manufacturer).updateBatchStatus(
        1,
        4, // DISPENSED
        "Invalid transition"
      )).to.be.revertedWith("Invalid status transition");
    });

    it("Should handle unauthorized access attempts", async function () {
      const {
        pharbitCore,
        complianceManager,
        batchNFT,
        manufacturer,
        user1
      } = await loadFixture(deployFullSystemFixture);

      // Create batch
      await pharbitCore.connect(manufacturer).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      );

      // Try unauthorized operations
      await expect(pharbitCore.connect(user1).createBatch(
        "Aspirin",
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH002",
        "SN001,SN002,SN003",
        [],
        []
      )).to.be.revertedWith("AccessControl: account");

      await expect(complianceManager.connect(user1).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      )).to.be.revertedWith("AccessControl: account");

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

  describe("Gas Optimization", function () {
    it("Should deploy contracts within gas limits", async function () {
      const { pharbitDeployer, owner } = await loadFixture(deployFullSystemFixture);

      const tx = await pharbitDeployer.deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(10000000); // 10M gas limit
    });

    it("Should handle batch operations efficiently", async function () {
      const {
        pharbitCore,
        manufacturer
      } = await loadFixture(deployFullSystemFixture);

      // Create multiple batches
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(pharbitCore.connect(manufacturer).createBatch(
          `Drug${i}`,
          `DRUG${i}`,
          "PharmaCorp",
          1000,
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          `BATCH${i}`,
          `SN${i}`,
          [],
          []
        ));
      }

      await Promise.all(promises);

      const totalBatches = await pharbitCore.getTotalBatches();
      expect(totalBatches).to.equal(10);
    });
  });
});