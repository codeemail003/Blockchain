const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PharbitDeployer", function () {
  async function deployPharbitDeployerFixture() {
    const [owner, deployer, admin, manufacturer, distributor, pharmacy, inspector, fda] = await ethers.getSigners();

    const PharbitDeployer = await ethers.getContractFactory("PharbitDeployer");
    const pharbitDeployer = await PharbitDeployer.deploy();

    // Grant deployer role
    await pharbitDeployer.grantRole(pharbitDeployer.DEPLOYER_ROLE(), deployer.address);

    return { pharbitDeployer, owner, deployer, admin, manufacturer, distributor, pharmacy, inspector, fda };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pharbitDeployer, owner } = await loadFixture(deployPharbitDeployerFixture);
      expect(await pharbitDeployer.hasRole(pharbitDeployer.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with deployment enabled", async function () {
      const { pharbitDeployer } = await loadFixture(deployPharbitDeployerFixture);
      expect(await pharbitDeployer.deploymentEnabled()).to.be.true;
    });

    it("Should initialize with zero deployment count", async function () {
      const { pharbitDeployer } = await loadFixture(deployPharbitDeployerFixture);
      expect(await pharbitDeployer.getDeploymentCount()).to.equal(0);
    });
  });

  describe("Contract Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      const deploymentParams = {
        nftName: "PharbitBatch",
        nftSymbol: "PBT",
        baseTokenURI: "https://api.pharbit.com/metadata/",
        contractURI: "https://api.pharbit.com/contract"
      };

      await expect(pharbitDeployer.connect(deployer).deployContracts(
        deploymentParams.nftName,
        deploymentParams.nftSymbol,
        deploymentParams.baseTokenURI,
        deploymentParams.contractURI
      )).to.emit(pharbitDeployer, "ContractsDeployed");

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.deployer).to.equal(deployer.address);
      expect(deploymentInfo.isActive).to.be.true;
    });

    it("Should deploy contracts with custom roles successfully", async function () {
      const { pharbitDeployer, deployer, admin, manufacturer, distributor, pharmacy, inspector, fda } = await loadFixture(deployPharbitDeployerFixture);

      const deploymentParams = {
        nftName: "PharbitBatch",
        nftSymbol: "PBT",
        baseTokenURI: "https://api.pharbit.com/metadata/",
        contractURI: "https://api.pharbit.com/contract"
      };

      await expect(pharbitDeployer.connect(deployer).deployContractsWithRoles(
        deploymentParams.nftName,
        deploymentParams.nftSymbol,
        deploymentParams.baseTokenURI,
        deploymentParams.contractURI,
        admin.address,
        manufacturer.address,
        distributor.address,
        pharmacy.address,
        inspector.address,
        fda.address
      )).to.emit(pharbitDeployer, "ContractsDeployed");

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
    });

    it("Should fail to deploy with empty NFT name", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(deployer).deployContracts(
        "", // Empty NFT name
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("NFT name required");
    });

    it("Should fail to deploy with empty NFT symbol", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "", // Empty NFT symbol
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("NFT symbol required");
    });

    it("Should fail to deploy with empty base token URI", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "", // Empty base token URI
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("Base token URI required");
    });

    it("Should fail if non-deployer tries to deploy", async function () {
      const { pharbitDeployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(owner).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Deployment Management", function () {
    it("Should deactivate deployment successfully", async function () {
      const { pharbitDeployer, deployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts first
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      // Deactivate deployment
      await expect(pharbitDeployer.connect(owner).deactivateDeployment(deployer.address))
        .to.emit(pharbitDeployer, "DeploymentDeactivated");

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      expect(deploymentInfo.isActive).to.be.false;
    });

    it("Should fail to deactivate non-existent deployment", async function () {
      const { pharbitDeployer, owner, deployer } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(owner).deactivateDeployment(deployer.address))
        .to.be.revertedWith("Deployment not active");
    });

    it("Should fail if non-admin tries to deactivate deployment", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts first
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      // Try to deactivate as non-admin
      await expect(pharbitDeployer.connect(deployer).deactivateDeployment(deployer.address))
        .to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Configuration Management", function () {
    it("Should update deployment configuration successfully", async function () {
      const { pharbitDeployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(owner).updateDeploymentConfiguration(
        false, // Disable deployment
        500 // Set max deployments
      )).to.emit(pharbitDeployer, "DeploymentConfigurationUpdated");

      expect(await pharbitDeployer.deploymentEnabled()).to.be.false;
      expect(await pharbitDeployer.maxDeployments()).to.equal(500);
    });

    it("Should fail if non-admin tries to update configuration", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      await expect(pharbitDeployer.connect(deployer).updateDeploymentConfiguration(
        false,
        500
      )).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("View Functions", function () {
    it("Should return correct deployment info", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.deployer).to.equal(deployer.address);
      expect(deploymentInfo.isActive).to.be.true;
      expect(deploymentInfo.version).to.equal("1.0.0");
    });

    it("Should return correct contract addresses", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const addresses = await pharbitDeployer.getContractAddresses(deployer.address);
      expect(addresses.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(addresses.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(addresses.batchNFT).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return all deployments", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const allDeployments = await pharbitDeployer.getAllDeployments();
      expect(allDeployments.length).to.equal(1);
      expect(allDeployments[0]).to.equal(deployer.address);
    });

    it("Should return deployment count", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      expect(await pharbitDeployer.getDeploymentCount()).to.equal(0);

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      expect(await pharbitDeployer.getDeploymentCount()).to.equal(1);
    });

    it("Should check if deployment exists", async function () {
      const { pharbitDeployer, deployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      expect(await pharbitDeployer.deploymentExists(deployer.address)).to.be.false;

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      expect(await pharbitDeployer.deploymentExists(deployer.address)).to.be.true;
      expect(await pharbitDeployer.deploymentExists(owner.address)).to.be.false;
    });

    it("Should return contract versions", async function () {
      const { pharbitDeployer } = await loadFixture(deployPharbitDeployerFixture);

      const versions = await pharbitDeployer.getContractVersions();
      expect(versions.pharbitCoreVersion).to.equal("1.0.0");
      expect(versions.complianceManagerVersion).to.equal("1.0.0");
      expect(versions.batchNFTVersion).to.equal("1.0.0");
      expect(versions.deployerVersion).to.equal("1.0.0");
    });

    it("Should return deployment statistics", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      let stats = await pharbitDeployer.getDeploymentStats();
      expect(stats.totalDeployments).to.equal(0);
      expect(stats.activeDeployments).to.equal(0);
      expect(stats.maxDeployments_).to.equal(1000);
      expect(stats.deploymentEnabled_).to.be.true;

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      stats = await pharbitDeployer.getDeploymentStats();
      expect(stats.totalDeployments).to.equal(1);
      expect(stats.activeDeployments).to.equal(1);
    });
  });

  describe("Role Setup", function () {
    it("Should set up basic roles correctly", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      
      // Check that contracts were deployed
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set up custom roles correctly", async function () {
      const { pharbitDeployer, deployer, admin, manufacturer, distributor, pharmacy, inspector, fda } = await loadFixture(deployPharbitDeployerFixture);

      // Deploy contracts with custom roles
      await pharbitDeployer.connect(deployer).deployContractsWithRoles(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract",
        admin.address,
        manufacturer.address,
        distributor.address,
        pharmacy.address,
        inspector.address,
        fda.address
      );

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      
      // Check that contracts were deployed
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple deployments from same deployer", async function () {
      const { pharbitDeployer, deployer } = await loadFixture(deployPharbitDeployerFixture);

      // First deployment
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch1",
        "PBT1",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      // Second deployment (should overwrite first)
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch2",
        "PBT2",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      const deploymentInfo = await pharbitDeployer.getDeploymentInfo(deployer.address);
      expect(deploymentInfo.pharbitCore).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.complianceManager).to.not.equal(ethers.ZeroAddress);
      expect(deploymentInfo.batchNFT).to.not.equal(ethers.ZeroAddress);
    });

    it("Should handle deployment when disabled", async function () {
      const { pharbitDeployer, deployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      // Disable deployment
      await pharbitDeployer.connect(owner).updateDeploymentConfiguration(false, 1000);

      // Try to deploy
      await expect(pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch",
        "PBT",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("Deployment disabled");
    });

    it("Should handle deployment when max deployments reached", async function () {
      const { pharbitDeployer, deployer, owner } = await loadFixture(deployPharbitDeployerFixture);

      // Set max deployments to 1
      await pharbitDeployer.connect(owner).updateDeploymentConfiguration(true, 1);

      // First deployment should succeed
      await pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch1",
        "PBT1",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      );

      // Second deployment should fail
      await expect(pharbitDeployer.connect(deployer).deployContracts(
        "PharbitBatch2",
        "PBT2",
        "https://api.pharbit.com/metadata/",
        "https://api.pharbit.com/contract"
      )).to.be.revertedWith("Max deployments reached");
    });
  });
});