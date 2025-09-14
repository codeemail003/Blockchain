const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeholderContract", function () {
  let contract, admin, a1;
  beforeEach(async () => {
    [admin, a1] = await ethers.getSigners();
    const C = await ethers.getContractFactory("StakeholderContract");
    contract = await C.deploy(admin.address);
    await contract.waitForDeployment();
  });

  it("registers and sets KYC", async () => {
    await contract.registerCompany(a1.address, "A1", 1);
    await contract.setKYC(a1.address, true, "ref");
    const c = await contract.getCompany(a1.address);
    expect(c.kycCompleted).to.equal(true);
    const list = await contract.listCompanies();
    expect(list.length).to.equal(1);
  });
});
