const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PharmaceuticalBatch', function () {
  let pharmaceuticalBatch;
  let owner;
  let manufacturer;
  let distributor;
  let pharmacy;
  let regulator;
  let auditor;

  beforeEach(async function () {
    [owner, manufacturer, distributor, pharmacy, regulator, auditor] = await ethers.getSigners();

    const PharmaceuticalBatch = await ethers.getContractFactory('PharmaceuticalBatch');
    pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
    await pharmaceuticalBatch.waitForDeployment();

    // Grant roles
    await pharmaceuticalBatch.grantRole(await pharmaceuticalBatch.MANUFACTURER_ROLE(), manufacturer.address);
    await pharmaceuticalBatch.grantRole(await pharmaceuticalBatch.DISTRIBUTOR_ROLE(), distributor.address);
    await pharmaceuticalBatch.grantRole(await pharmaceuticalBatch.PHARMACY_ROLE(), pharmacy.address);
    await pharmaceuticalBatch.grantRole(await pharmaceuticalBatch.REGULATOR_ROLE(), regulator.address);
    await pharmaceuticalBatch.grantRole(await pharmaceuticalBatch.AUDITOR_ROLE(), auditor.address);
  });

  describe('Batch Creation', function () {
    it('Should create a new batch', async function () {
      const drugName = 'Aspirin';
      const manufactureDate = Math.floor(Date.now() / 1000);
      const expiryDate = manufactureDate + (365 * 24 * 60 * 60); // 1 year
      const quantity = 1000;

      await expect(
        pharmaceuticalBatch.connect(manufacturer).createBatch(
          drugName,
          manufactureDate,
          expiryDate,
          quantity
        )
      ).to.emit(pharmaceuticalBatch, 'BatchCreated')
        .withArgs(1, drugName, manufacturer.address, quantity);

      const batch = await pharmaceuticalBatch.getBatch(1);
      expect(batch.drugName).to.equal(drugName);
      expect(batch.manufacturer).to.equal(manufacturer.address);
      expect(batch.quantity).to.equal(quantity);
      expect(batch.status).to.equal(0); // CREATED
    });

    it('Should only allow manufacturers to create batches', async function () {
      await expect(
        pharmaceuticalBatch.connect(distributor).createBatch(
          'Aspirin',
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          1000
        )
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('Batch Transfer', function () {
    let batchId;

    beforeEach(async function () {
      const drugName = 'Aspirin';
      const manufactureDate = Math.floor(Date.now() / 1000);
      const expiryDate = manufactureDate + (365 * 24 * 60 * 60);
      const quantity = 1000;

      await pharmaceuticalBatch.connect(manufacturer).createBatch(
        drugName,
        manufactureDate,
        expiryDate,
        quantity
      );
      batchId = 1;
    });

    it('Should transfer batch ownership', async function () {
      const transferQuantity = 500;

      await expect(
        pharmaceuticalBatch.connect(manufacturer).transferBatch(
          batchId,
          distributor.address,
          transferQuantity
        )
      ).to.emit(pharmaceuticalBatch, 'BatchTransferred')
        .withArgs(batchId, manufacturer.address, distributor.address, transferQuantity);

      const batch = await pharmaceuticalBatch.getBatch(batchId);
      expect(batch.currentOwner).to.equal(distributor.address);
    });

    it('Should not allow transfer of more quantity than available', async function () {
      const transferQuantity = 1500; // More than available

      await expect(
        pharmaceuticalBatch.connect(manufacturer).transferBatch(
          batchId,
          distributor.address,
          transferQuantity
        )
      ).to.be.revertedWith('Insufficient quantity');
    });
  });

  describe('Batch Status Updates', function () {
    let batchId;

    beforeEach(async function () {
      const drugName = 'Aspirin';
      const manufactureDate = Math.floor(Date.now() / 1000);
      const expiryDate = manufactureDate + (365 * 24 * 60 * 60);
      const quantity = 1000;

      await pharmaceuticalBatch.connect(manufacturer).createBatch(
        drugName,
        manufactureDate,
        expiryDate,
        quantity
      );
      batchId = 1;
    });

    it('Should update batch status', async function () {
      const newStatus = 1; // IN_TRANSIT

      await expect(
        pharmaceuticalBatch.connect(manufacturer).updateBatchStatus(batchId, newStatus)
      ).to.emit(pharmaceuticalBatch, 'BatchStatusUpdated')
        .withArgs(batchId, newStatus);

      const batch = await pharmaceuticalBatch.getBatch(batchId);
      expect(batch.status).to.equal(newStatus);
    });

    it('Should only allow authorized users to update status', async function () {
      await expect(
        pharmaceuticalBatch.connect(auditor).updateBatchStatus(batchId, 1)
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('Pause Functionality', function () {
    it('Should pause and unpause the contract', async function () {
      await pharmaceuticalBatch.pause();
      expect(await pharmaceuticalBatch.paused()).to.be.true;

      await pharmaceuticalBatch.unpause();
      expect(await pharmaceuticalBatch.paused()).to.be.false;
    });

    it('Should not allow batch creation when paused', async function () {
      await pharmaceuticalBatch.pause();

      await expect(
        pharmaceuticalBatch.connect(manufacturer).createBatch(
          'Aspirin',
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          1000
        )
      ).to.be.revertedWith('Pausable: paused');
    });
  });
});