const hre = require("hardhat");

async function main() {
  console.log("Deploying PharbitChain contracts...");

  // Get the contract factory
  const PharmaceuticalBatch = await hre.ethers.getContractFactory("PharmaceuticalBatch");
  const BatchNFT = await hre.ethers.getContractFactory("BatchNFT");
  const ComplianceManager = await hre.ethers.getContractFactory("ComplianceManager");

  // Deploy contracts
  console.log("Deploying PharmaceuticalBatch...");
  const pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
  await pharmaceuticalBatch.waitForDeployment();
  const batchAddress = await pharmaceuticalBatch.getAddress();

  console.log("Deploying BatchNFT...");
  const batchNFT = await BatchNFT.deploy("PharbitBatchNFT", "PBNFT", batchAddress);
  await batchNFT.waitForDeployment();
  const nftAddress = await batchNFT.getAddress();

  console.log("Deploying ComplianceManager...");
  const complianceManager = await ComplianceManager.deploy(batchAddress);
  await complianceManager.waitForDeployment();
  const complianceAddress = await complianceManager.getAddress();

  // Get deployment info
  const network = await hre.ethers.provider.getNetwork();
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("\nContract Addresses:");
  console.log("PharmaceuticalBatch:", batchAddress);
  console.log("BatchNFT:", nftAddress);
  console.log("ComplianceManager:", complianceAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      PharmaceuticalBatch: batchAddress,
      BatchNFT: nftAddress,
      ComplianceManager: complianceAddress,
    },
    timestamp: new Date().toISOString(),
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nDeployment info saved to:", deploymentFile);

  // Verify contracts on mainnet/sepolia
  if (network.chainId === 1n || network.chainId === 11155111n) {
    console.log("\nVerifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: batchAddress,
        constructorArguments: [],
      });
      console.log("PharmaceuticalBatch verified");
    } catch (error) {
      console.log("PharmaceuticalBatch verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftAddress,
        constructorArguments: ["PharbitBatchNFT", "PBNFT", batchAddress],
      });
      console.log("BatchNFT verified");
    } catch (error) {
      console.log("BatchNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: complianceAddress,
        constructorArguments: [batchAddress],
      });
      console.log("ComplianceManager verified");
    } catch (error) {
      console.log("ComplianceManager verification failed:", error.message);
    }
  }

  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });