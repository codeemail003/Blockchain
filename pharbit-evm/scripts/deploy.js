const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PharbitCore
  const PharbitCore = await hre.ethers.getContractFactory("PharbitCore");
  const pharbitCore = await PharbitCore.deploy();
  await pharbitCore.waitForDeployment();
  console.log("PharbitCore deployed to:", await pharbitCore.getAddress());

  // Deploy ComplianceManager
  const ComplianceManager = await hre.ethers.getContractFactory("ComplianceManager");
  const complianceManager = await ComplianceManager.deploy(await pharbitCore.getAddress());
  await complianceManager.waitForDeployment();
  console.log("ComplianceManager deployed to:", await complianceManager.getAddress());

  // Deploy BatchNFT
  const BatchNFT = await hre.ethers.getContractFactory("BatchNFT");
  const batchNFT = await BatchNFT.deploy();
  await batchNFT.waitForDeployment();
  console.log("BatchNFT deployed to:", await batchNFT.getAddress());

  // Grant roles
  const fdaRole = await complianceManager.FDA_ROLE();
  const inspectorRole = await complianceManager.INSPECTOR_ROLE();
  const minterRole = await batchNFT.MINTER_ROLE();

  // Grant roles to deployer (for testing)
  await complianceManager.grantRole(fdaRole, deployer.address);
  await complianceManager.grantRole(inspectorRole, deployer.address);
  await batchNFT.grantRole(minterRole, deployer.address);

  console.log("Roles granted to deployer");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});