const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BatchContract", function () {
  let batches, admin;
  beforeEach(async () => {
    [admin] = await ethers.getSigners();
    const B = await ethers.getContractFactory("BatchContract");
    batches = await B.deploy(admin.address);
    await batches.waitForDeployment();
  });

  it("creates and recalls a batch", async () => {
    const now = Math.floor(Date.now() / 1000);
    const tx = await batches.createBatch("DrugX", "ipfs://cid", now - 3600, now + 86400, admin.address);
    await expect(tx).to.emit(batches, "BatchCreated");
    const batch = await batches.getBatch(1);
    expect(batch.productName).to.equal("DrugX");
    await expect(batches.recall(1, "temp breach")).to.emit(batches, "BatchRecalled");
  });
});
