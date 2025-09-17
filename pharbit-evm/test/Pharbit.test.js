const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pharbit Contracts", function () {
  let pharbitDeployer;
  let pharbitCore;
  let complianceManager;
  let batchNFT;
  let owner;
  let fda;
  let inspector;
  let manufacturer;

  beforeEach(async function () {
    // Get signers
    [owner, fda, inspector, manufacturer] = await ethers.getSigners();

    // Deploy contracts
    const PharbitDeployer = await ethers.getContractFactory("PharbitDeployer");
    pharbitDeployer = await PharbitDeployer.deploy();
    await pharbitDeployer.waitForDeployment();

    // Get deployed contract addresses
    const [coreAddress, complianceAddress, nftAddress] = await pharbitDeployer.getAddresses();

    // Get contract instances
    pharbitCore = await ethers.getContractAt("PharbitCore", coreAddress);
    complianceManager = await ethers.getContractAt("ComplianceManager", complianceAddress);
    batchNFT = await ethers.getContractAt("BatchNFT", nftAddress);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pharbitCore.owner()).to.equal(owner.address);
    });

    it("Should assign roles correctly", async function () {
      const FDA_ROLE = await complianceManager.FDA_ROLE();
      const INSPECTOR_ROLE = await complianceManager.INSPECTOR_ROLE();
      const MINTER_ROLE = await batchNFT.MINTER_ROLE();

      expect(await complianceManager.hasRole(FDA_ROLE, owner.address)).to.be.true;
      expect(await complianceManager.hasRole(INSPECTOR_ROLE, owner.address)).to.be.true;
      expect(await batchNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("BatchNFT", function () {
    it("Should mint a new batch", async function () {
      await batchNFT.mintBatch(manufacturer.address);
      expect(await batchNFT.balanceOf(manufacturer.address)).to.equal(1);
    });

    it("Should fail if non-minter tries to mint", async function () {
      await expect(
        batchNFT.connect(manufacturer).mintBatch(manufacturer.address)
      ).to.be.revertedWith("AccessControl: account");
    });
  });
});