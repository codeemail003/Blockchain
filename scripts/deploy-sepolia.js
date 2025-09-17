const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Sepolia testnet deployment of PharbitChain contracts...");

  // Check environment variables
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL environment variable is required");
  }

  // Get signers
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: Sepolia Testnet`);
  console.log(`   Chain ID: 11155111`);
  console.log("");

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceInEth} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance. Please add Sepolia ETH to your account.");
  }

  // Deploy PharbitDeployer
  console.log("📦 Deploying PharbitDeployer...");
  const PharbitDeployer = await ethers.getContractFactory("PharbitDeployer");
  const pharbitDeployer = await PharbitDeployer.deploy();
  await pharbitDeployer.waitForDeployment();
  const pharbitDeployerAddress = await pharbitDeployer.getAddress();
  console.log(`✅ PharbitDeployer deployed at: ${pharbitDeployerAddress}`);

  // Deploy all contracts using PharbitDeployer
  console.log("📦 Deploying all contracts via PharbitDeployer...");
  const deploymentParams = {
    nftName: "PharbitBatch",
    nftSymbol: "PBT",
    baseTokenURI: "https://api.pharbit.com/metadata/",
    contractURI: "https://api.pharbit.com/contract"
  };

  const tx = await pharbitDeployer.deployContracts(
    deploymentParams.nftName,
    deploymentParams.nftSymbol,
    deploymentParams.baseTokenURI,
    deploymentParams.contractURI
  );

  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsed = pharbitDeployer.interface.parseLog(log);
      return parsed.name === 'ContractsDeployed';
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = pharbitDeployer.interface.parseLog(event);
    const [deployerAddr, pharbitCore, complianceManager, batchNFT, version] = parsed.args;
    
    console.log("✅ All contracts deployed successfully!");
    console.log(`   PharbitCore: ${pharbitCore}`);
    console.log(`   ComplianceManager: ${complianceManager}`);
    console.log(`   BatchNFT: ${batchNFT}`);
    console.log(`   Version: ${version}`);
  }

  // Get contract instances for verification
  const PharbitCore = await ethers.getContractFactory("PharbitCore");
  const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
  const BatchNFT = await ethers.getContractFactory("BatchNFT");

  const pharbitCoreContract = PharbitCore.attach(pharbitCore);
  const complianceManagerContract = ComplianceManager.attach(complianceManager);
  const batchNFTContract = BatchNFT.attach(batchNFT);

  // Verify contracts are deployed correctly
  console.log("\n🔍 Verifying contract deployment...");
  
  try {
    const pharbitCoreName = await pharbitCoreContract.name();
    const complianceManagerName = await complianceManagerContract.name();
    const batchNFTName = await batchNFTContract.name();
    
    console.log(`   PharbitCore name: ${pharbitCoreName}`);
    console.log(`   ComplianceManager name: ${complianceManagerName}`);
    console.log(`   BatchNFT name: ${batchNFTName}`);
    console.log("✅ All contracts verified successfully!");
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    throw error;
  }

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      pharbitDeployer: pharbitDeployerAddress,
      pharbitCore: pharbitCore,
      complianceManager: complianceManager,
      batchNFT: batchNFT
    },
    deploymentParams: deploymentParams,
    blockExplorer: "https://sepolia.etherscan.io",
    rpcUrl: process.env.SEPOLIA_RPC_URL
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, "sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Create .env.sepolia file for frontend
  const envContent = `# PharbitChain Sepolia Deployment
REACT_APP_NETWORK_ID=11155111
REACT_APP_CHAIN_ID=0xaa36a7
REACT_APP_PHARBIT_CORE_ADDRESS=${pharbitCore}
REACT_APP_COMPLIANCE_MANAGER_ADDRESS=${complianceManager}
REACT_APP_BATCH_NFT_ADDRESS=${batchNFT}
REACT_APP_PHARBIT_DEPLOYER_ADDRESS=${pharbitDeployerAddress}
REACT_APP_RPC_URL=${process.env.SEPOLIA_RPC_URL}
REACT_APP_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
`;

  const envFile = path.join(__dirname, "../frontend/.env.sepolia");
  fs.writeFileSync(envFile, envContent);
  console.log(`💾 Frontend environment file created: ${envFile}`);

  console.log("\n🎉 Sepolia deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("   1. Verify contracts on Etherscan:");
  console.log(`      npx hardhat verify --network sepolia ${pharbitDeployerAddress}`);
  console.log(`      npx hardhat verify --network sepolia ${pharbitCore}`);
  console.log(`      npx hardhat verify --network sepolia ${complianceManager}`);
  console.log(`      npx hardhat verify --network sepolia ${batchNFT}`);
  console.log("   2. Update frontend with new contract addresses");
  console.log("   3. Test on Sepolia testnet");
  console.log("   4. Deploy to mainnet when ready");

  console.log("\n🔗 Contract Addresses:");
  console.log(`   PharbitDeployer: ${pharbitDeployerAddress}`);
  console.log(`   PharbitCore: ${pharbitCore}`);
  console.log(`   ComplianceManager: ${complianceManager}`);
  console.log(`   BatchNFT: ${batchNFT}`);

  console.log("\n🌐 Block Explorer Links:");
  console.log(`   PharbitDeployer: https://sepolia.etherscan.io/address/${pharbitDeployerAddress}`);
  console.log(`   PharbitCore: https://sepolia.etherscan.io/address/${pharbitCore}`);
  console.log(`   ComplianceManager: https://sepolia.etherscan.io/address/${complianceManager}`);
  console.log(`   BatchNFT: https://sepolia.etherscan.io/address/${batchNFT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });