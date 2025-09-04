const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PharmaTracker", function () {
  let pharmaTracker;
  let owner;
  let manufacturer1;
  let manufacturer2;
  let distributor;
  let pharmacy;
  let accounts;

  beforeEach(async function () {
    [owner, manufacturer1, manufacturer2, distributor, pharmacy, ...accounts] = await ethers.getSigners();
    
    const PharmaTracker = await ethers.getContractFactory("PharmaTracker");
    pharmaTracker = await PharmaTracker.deploy();
    await pharmaTracker.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pharmaTracker.owner()).to.equal(owner.address);
    });

    it("Should have owner as authorized manufacturer", async function () {
      expect(await pharmaTracker.isAuthorizedManufacturer(owner.address)).to.be.true;
    });

    it("Should start with 0 total drugs", async function () {
      expect(await pharmaTracker.getTotalDrugs()).to.equal(0);
    });
  });

  describe("Manufacturer Authorization", function () {
    it("Should allow owner to authorize manufacturers", async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      expect(await pharmaTracker.isAuthorizedManufacturer(manufacturer1.address)).to.be.true;
    });

    it("Should emit ManufacturerAuthorized event", async function () {
      await expect(pharmaTracker.authorizeManufacturer(manufacturer1.address))
        .to.emit(pharmaTracker, "ManufacturerAuthorized")
        .withArgs(manufacturer1.address);
    });

    it("Should allow owner to deauthorize manufacturers", async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      await pharmaTracker.deauthorizeManufacturer(manufacturer1.address);
      expect(await pharmaTracker.isAuthorizedManufacturer(manufacturer1.address)).to.be.false;
    });

    it("Should emit ManufacturerDeauthorized event", async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      await expect(pharmaTracker.deauthorizeManufacturer(manufacturer1.address))
        .to.emit(pharmaTracker, "ManufacturerDeauthorized")
        .withArgs(manufacturer1.address);
    });

    it("Should not allow non-owner to authorize manufacturers", async function () {
      await expect(
        pharmaTracker.connect(manufacturer1).authorizeManufacturer(manufacturer2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address authorization", async function () {
      await expect(
        pharmaTracker.authorizeManufacturer(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid manufacturer address");
    });
  });

  describe("Drug Registration", function () {
    beforeEach(async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
    });

    it("Should allow authorized manufacturer to register drugs", async function () {
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      const tx = await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      await expect(tx)
        .to.emit(pharmaTracker, "DrugRegistered")
        .withArgs(
          1, // drugId
          drugData.name,
          drugData.manufacturer,
          drugData.manufactureDate,
          drugData.expiryDate,
          manufacturer1.address,
          drugData.batchNumber,
          drugData.quantity
        );

      const drug = await pharmaTracker.getDrug(1);
      expect(drug.name).to.equal(drugData.name);
      expect(drug.manufacturer).to.equal(drugData.manufacturer);
      expect(drug.currentOwner).to.equal(manufacturer1.address);
      expect(drug.isActive).to.be.true;
    });

    it("Should increment total drugs count", async function () {
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      expect(await pharmaTracker.getTotalDrugs()).to.equal(1);
    });

    it("Should not allow unauthorized manufacturer to register drugs", async function () {
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await expect(
        pharmaTracker.connect(manufacturer2).registerDrug(
          drugData.name,
          drugData.manufacturer,
          drugData.manufactureDate,
          drugData.expiryDate,
          drugData.batchNumber,
          drugData.quantity,
          drugData.storageConditions
        )
      ).to.be.revertedWith("Only authorized manufacturers can perform this action");
    });

    it("Should validate drug registration parameters", async function () {
      await expect(
        pharmaTracker.connect(manufacturer1).registerDrug(
          "", // empty name
          "PharmaCorp",
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          "ASP2024001",
          1000,
          "Store at room temperature"
        )
      ).to.be.revertedWith("Drug name cannot be empty");

      await expect(
        pharmaTracker.connect(manufacturer1).registerDrug(
          "Aspirin",
          "PharmaCorp",
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60), // expiry before manufacture
          "ASP2024001",
          1000,
          "Store at room temperature"
        )
      ).to.be.revertedWith("Expiry date must be after manufacture date");
    });
  });

  describe("Drug Transfer", function () {
    let drugId;

    beforeEach(async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      drugId = 1;
    });

    it("Should allow current owner to transfer drug", async function () {
      const tx = await pharmaTracker.connect(manufacturer1).transferDrug(drugId, distributor.address);
      
      await expect(tx)
        .to.emit(pharmaTracker, "DrugTransferred")
        .withArgs(drugId, manufacturer1.address, distributor.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));

      const drug = await pharmaTracker.getDrug(drugId);
      expect(drug.currentOwner).to.equal(distributor.address);
    });

    it("Should update transfer history", async function () {
      await pharmaTracker.connect(manufacturer1).transferDrug(drugId, distributor.address);
      await pharmaTracker.connect(distributor).transferDrug(drugId, pharmacy.address);

      const transferHistory = await pharmaTracker.getTransferHistory(drugId);
      expect(transferHistory).to.have.lengthOf(3); // manufacturer, distributor, pharmacy
      expect(transferHistory[0]).to.equal(manufacturer1.address);
      expect(transferHistory[1]).to.equal(distributor.address);
      expect(transferHistory[2]).to.equal(pharmacy.address);
    });

    it("Should not allow non-owner to transfer drug", async function () {
      await expect(
        pharmaTracker.connect(distributor).transferDrug(drugId, pharmacy.address)
      ).to.be.revertedWith("Only current owner can transfer the drug");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        pharmaTracker.connect(manufacturer1).transferDrug(drugId, ethers.constants.AddressZero)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should not allow transfer to current owner", async function () {
      await expect(
        pharmaTracker.connect(manufacturer1).transferDrug(drugId, manufacturer1.address)
      ).to.be.revertedWith("Cannot transfer to current owner");
    });
  });

  describe("Drug Information", function () {
    let drugId;

    beforeEach(async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      drugId = 1;
    });

    it("Should return correct drug information", async function () {
      const drug = await pharmaTracker.getDrug(drugId);
      expect(drug.name).to.equal("Aspirin");
      expect(drug.manufacturer).to.equal("PharmaCorp");
      expect(drug.batchNumber).to.equal("ASP2024001");
      expect(drug.quantity).to.equal(1000);
    });

    it("Should return correct basic drug information", async function () {
      const basicInfo = await pharmaTracker.getDrugBasicInfo(drugId);
      expect(basicInfo.name).to.equal("Aspirin");
      expect(basicInfo.manufacturer).to.equal("PharmaCorp");
      expect(basicInfo.currentOwner).to.equal(manufacturer1.address);
      expect(basicInfo.expired).to.be.false;
    });

    it("Should return drugs by owner", async function () {
      const ownerDrugs = await pharmaTracker.getDrugsByOwner(manufacturer1.address);
      expect(ownerDrugs).to.have.lengthOf(1);
      expect(ownerDrugs[0]).to.equal(drugId);
    });

    it("Should check expiry correctly", async function () {
      expect(await pharmaTracker.isDrugExpired(drugId)).to.be.false;
      
      const daysUntilExpiry = await pharmaTracker.getDaysUntilExpiry(drugId);
      expect(daysUntilExpiry).to.be.greaterThan(0);
    });
  });

  describe("Drug Deactivation", function () {
    let drugId;

    beforeEach(async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      
      const drugData = {
        name: "Aspirin",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        batchNumber: "ASP2024001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      drugId = 1;
    });

    it("Should allow owner to deactivate drug", async function () {
      // Get drug info before deactivation
      const drugBefore = await pharmaTracker.getDrug(drugId);
      expect(drugBefore.isActive).to.be.true;
      
      // Deactivate the drug
      await pharmaTracker.deactivateDrug(drugId);
      
      // Verify drug is deactivated by checking it can't be accessed
      await expect(pharmaTracker.getDrug(drugId))
        .to.be.revertedWith("Drug does not exist or is inactive");
    });

    it("Should not allow non-owner to deactivate drug", async function () {
      await expect(
        pharmaTracker.connect(manufacturer1).deactivateDrug(drugId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow operations on inactive drugs", async function () {
      await pharmaTracker.deactivateDrug(drugId);
      
      await expect(
        pharmaTracker.getDrug(drugId)
      ).to.be.revertedWith("Drug does not exist or is inactive");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple drug registrations", async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      
      // Register multiple drugs
      for (let i = 0; i < 5; i++) {
        const drugData = {
          name: `Drug${i}`,
          manufacturer: "PharmaCorp",
          manufactureDate: Math.floor(Date.now() / 1000),
          expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          batchNumber: `BATCH${i}`,
          quantity: 1000,
          storageConditions: "Store at room temperature"
        };

        await pharmaTracker.connect(manufacturer1).registerDrug(
          drugData.name,
          drugData.manufacturer,
          drugData.manufactureDate,
          drugData.expiryDate,
          drugData.batchNumber,
          drugData.quantity,
          drugData.storageConditions
        );
      }

      expect(await pharmaTracker.getTotalDrugs()).to.equal(5);
      
      const ownerDrugs = await pharmaTracker.getDrugsByOwner(manufacturer1.address);
      expect(ownerDrugs).to.have.lengthOf(5);
    });

    it("Should handle expired drugs", async function () {
      await pharmaTracker.authorizeManufacturer(manufacturer1.address);
      
      const drugData = {
        name: "Expired Drug",
        manufacturer: "PharmaCorp",
        manufactureDate: Math.floor(Date.now() / 1000) - (2 * 365 * 24 * 60 * 60), // 2 years ago
        expiryDate: Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60), // 1 year ago
        batchNumber: "EXP2022001",
        quantity: 1000,
        storageConditions: "Store at room temperature"
      };

      await pharmaTracker.connect(manufacturer1).registerDrug(
        drugData.name,
        drugData.manufacturer,
        drugData.manufactureDate,
        drugData.expiryDate,
        drugData.batchNumber,
        drugData.quantity,
        drugData.storageConditions
      );

      const drugId = 1;
      expect(await pharmaTracker.isDrugExpired(drugId)).to.be.true;
      expect(await pharmaTracker.getDaysUntilExpiry(drugId)).to.equal(0);
      
      // Should not allow transfer of expired drug
      await expect(
        pharmaTracker.connect(manufacturer1).transferDrug(drugId, distributor.address)
      ).to.be.revertedWith("Drug has expired");
    });
  });
});