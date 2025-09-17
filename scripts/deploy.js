const hre = require("hardhat");

async function main() {
  console.log("Deploying Pharbit contracts...");

  // Deploy PharbitDeployer
  const PharbitDeployer = await hre.ethers.getContractFactory("PharbitDeployer");
  const deployer = await PharbitDeployer.deploy();
  await deployer.waitForDeployment();

  const deployerAddress = await deployer.getAddress();
  console.log("PharbitDeployer deployed to:", deployerAddress);

  // Get individual contract addresses
  const [pharbitCore, complianceManager, batchNFT] = await deployer.getAddresses();
  
  console.log("\nContract Addresses:");
  console.log("PharbitCore:", pharbitCore);
  console.log("ComplianceManager:", complianceManager);
  console.log("BatchNFT:", batchNFT);

  // Save addresses to a file for future reference
  const fs = require('fs');
  const addresses = {
    deployer: deployerAddress,
    pharbitCore,
    complianceManager,
    batchNFT
  };
  
  fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });