const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainContract", function () {
  let supply, stakeholders, batches, admin, dist;

  beforeEach(async () => {
    [admin, dist] = await ethers.getSigners();

    const Stake = await ethers.getContractFactory("StakeholderContract");
    stakeholders = await Stake.deploy(admin.address);
    await stakeholders.waitForDeployment();

    const Batch = await ethers.getContractFactory("BatchContract");
    batches = await Batch.deploy(admin.address);
    await batches.waitForDeployment();

    const Supply = await ethers.getContractFactory("SupplyChainContract");
    supply = await Supply.deploy(admin.address, await stakeholders.getAddress());
    await supply.waitForDeployment();

    // Register parties and KYC
    await stakeholders.registerCompany(admin.address, "MFR", 1);
    await stakeholders.setKYC(admin.address, true, "ref1");
    await stakeholders.registerCompany(dist.address, "DIST", 2);
    await stakeholders.setKYC(dist.address, true, "ref2");

    // Create a batch
    const now = Math.floor(Date.now() / 1000);
    await batches.createBatch("DrugX", "ipfs://cid", now - 3600, now + 86400, admin.address);
  });

  it("records a transfer", async () => {
    await expect(supply.transferBatch(1, dist.address, "warehouse"))
      .to.emit(supply, "Transferred");
    const history = await supply.getTransfers(1);
    expect(history.length).to.equal(1);
    expect(history[0].to).to.equal(dist.address);
  });
});
