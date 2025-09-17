const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PharbitCore", function () {
  async function deployPharbitCoreFixture() {
    const [owner, manufacturer, distributor, pharmacy, inspector, fda] = await ethers.getSigners();

    const PharbitCore = await ethers.getContractFactory("PharbitCore");
    const pharbitCore = await PharbitCore.deploy();

    // Grant roles
    await pharbitCore.grantRole(pharbitCore.MANUFACTURER_ROLE(), manufacturer.address);
    await pharbitCore.grantRole(pharbitCore.DISTRIBUTOR_ROLE(), distributor.address);
    await pharbitCore.grantRole(pharbitCore.PHARMACY_ROLE(), pharmacy.address);
    await pharbitCore.grantRole(pharbitCore.INSPECTOR_ROLE(), inspector.address);
    await pharbitCore.grantRole(pharbitCore.FDA_ROLE(), fda.address);

    return { pharbitCore, owner, manufacturer, distributor, pharmacy, inspector, fda };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pharbitCore, owner } = await loadFixture(deployPharbitCoreFixture);
      expect(await pharbitCore.hasRole(pharbitCore.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with zero batches", async function () {
      const { pharbitCore } = await loadFixture(deployPharbitCoreFixture);
      expect(await pharbitCore.getTotalBatches()).to.equal(0);
    });
  });

  describe("Batch Creation", function () {
    it("Should create a batch successfully", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

      const batchData = {
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        metadataKeys: ["temperature", "humidity"],
        metadataValues: ["20°C", "45%"]
      };

      await expect(pharbitCore.connect(manufacturer).createBatch(
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
      )).to.emit(pharbitCore, "BatchCreated");

      expect(await pharbitCore.getTotalBatches()).to.equal(1);
    });

    it("Should fail to create batch with invalid data", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

      await expect(pharbitCore.connect(manufacturer).createBatch(
        "", // Empty drug name
        "ASP001",
        "PharmaCorp",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH001",
        "SN001,SN002,SN003",
        [],
        []
      )).to.be.revertedWith("Drug name required");
    });

    it("Should fail to create batch with duplicate batch number", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

      const batchData = {
        drugName: "Aspirin",
        drugCode: "ASP001",
        manufacturer: "PharmaCorp",
        quantity: 1000,
        productionDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "BATCH001",
        serialNumbers: "SN001,SN002,SN003",
        metadataKeys: [],
        metadataValues: []
      };

      // Create first batch
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

      // Try to create second batch with same batch number
      await expect(pharbitCore.connect(manufacturer).createBatch(
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
      )).to.be.revertedWith("Batch number exists");
    });

    it("Should fail if non-manufacturer tries to create batch", async function () {
      const { pharbitCore, distributor } = await loadFixture(deployPharbitCoreFixture);

      await expect(pharbitCore.connect(distributor).createBatch(
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
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Batch Transfer", function () {
    it("Should transfer batch successfully", async function () {
      const { pharbitCore, manufacturer, distributor } = await loadFixture(deployPharbitCoreFixture);

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

      // Transfer batch
      await expect(pharbitCore.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        "Distribution",
        "Warehouse A"
      )).to.emit(pharbitCore, "BatchTransferred");

      const batch = await pharbitCore.getBatch(1);
      expect(batch.currentOwner).to.equal(distributor.address);
    });

    it("Should fail to transfer batch to zero address", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

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

      // Try to transfer to zero address
      await expect(pharbitCore.connect(manufacturer).transferBatch(
        1,
        ethers.ZeroAddress,
        "Distribution",
        "Warehouse A"
      )).to.be.revertedWith("Invalid recipient");
    });

    it("Should fail if non-owner tries to transfer batch", async function () {
      const { pharbitCore, manufacturer, distributor, pharmacy } = await loadFixture(deployPharbitCoreFixture);

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

      // Try to transfer as non-owner
      await expect(pharbitCore.connect(pharmacy).transferBatch(
        1,
        pharmacy.address,
        "Distribution",
        "Warehouse A"
      )).to.be.revertedWith("Not batch owner");
    });
  });

  describe("Batch Status Updates", function () {
    it("Should update batch status successfully", async function () {
      const { pharbitCore, manufacturer, distributor } = await loadFixture(deployPharbitCoreFixture);

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

      // Update status
      await expect(pharbitCore.connect(manufacturer).updateBatchStatus(
        1,
        1, // IN_TRANSIT
        "Shipped to distributor"
      )).to.emit(pharbitCore, "BatchStatusChanged");

      const batch = await pharbitCore.getBatch(1);
      expect(batch.status).to.equal(1); // IN_TRANSIT
    });

    it("Should fail to update status with invalid transition", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

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
  });

  describe("Emergency Functions", function () {
    it("Should pause contract in emergency", async function () {
      const { pharbitCore, owner } = await loadFixture(deployPharbitCoreFixture);

      await expect(pharbitCore.connect(owner).emergencyPause())
        .to.emit(pharbitCore, "EmergencyPaused");

      expect(await pharbitCore.emergencyMode()).to.be.true;
    });

    it("Should unpause contract after emergency", async function () {
      const { pharbitCore, owner } = await loadFixture(deployPharbitCoreFixture);

      // Pause first
      await pharbitCore.connect(owner).emergencyPause();

      // Unpause
      await expect(pharbitCore.connect(owner).emergencyUnpause())
        .to.emit(pharbitCore, "EmergencyUnpaused");

      expect(await pharbitCore.emergencyMode()).to.be.false;
    });

    it("Should fail to create batch when paused", async function () {
      const { pharbitCore, owner, manufacturer } = await loadFixture(deployPharbitCoreFixture);

      // Pause contract
      await pharbitCore.connect(owner).emergencyPause();

      // Try to create batch
      await expect(pharbitCore.connect(manufacturer).createBatch(
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
      )).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("View Functions", function () {
    it("Should return correct batch information", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

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

      const batch = await pharbitCore.getBatch(1);
      expect(batch.drugName).to.equal(batchData.drugName);
      expect(batch.drugCode).to.equal(batchData.drugCode);
      expect(batch.manufacturer).to.equal(batchData.manufacturer);
      expect(batch.quantity).to.equal(batchData.quantity);
      expect(batch.batchNumber).to.equal(batchData.batchNumber);
      expect(batch.currentOwner).to.equal(manufacturer.address);
    });

    it("Should return user batches", async function () {
      const { pharbitCore, manufacturer } = await loadFixture(deployPharbitCoreFixture);

      // Create multiple batches
      for (let i = 1; i <= 3; i++) {
        await pharbitCore.connect(manufacturer).createBatch(
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
        );
      }

      const userBatches = await pharbitCore.getUserBatches(manufacturer.address);
      expect(userBatches.length).to.equal(3);
      expect(userBatches[0]).to.equal(1);
      expect(userBatches[1]).to.equal(2);
      expect(userBatches[2]).to.equal(3);
    });
  });
});