const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting MAINNET deployment of PharbitChain contracts...");
  console.log("⚠️  WARNING: This will deploy to Ethereum Mainnet!");
  console.log("⚠️  Make sure you have tested thoroughly on testnets!");
  console.log("");

  // Check environment variables
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  if (!process.env.MAINNET_RPC_URL) {
    throw new Error("MAINNET_RPC_URL environment variable is required");
  }

  // Get signers
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: Ethereum Mainnet`);
  console.log(`   Chain ID: 1`);
  console.log("");

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceInEth} ETH`);

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance. Please add ETH to your account for gas fees.");
  }

  // Confirmation prompt (in a real deployment, you'd want to add a confirmation)
  console.log("🔐 Security checks:");
  console.log("   ✅ Private key loaded");
  console.log("   ✅ RPC URL configured");
  console.log("   ✅ Sufficient balance");
  console.log("");

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
    network: "mainnet",
    chainId: 1,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      pharbitDeployer: pharbitDeployerAddress,
      pharbitCore: pharbitCore,
      complianceManager: complianceManager,
      batchNFT: batchNFT
    },
    deploymentParams: deploymentParams,
    blockExplorer: "https://etherscan.io",
    rpcUrl: process.env.MAINNET_RPC_URL,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: receipt.gasPrice?.toString() || "unknown"
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, "mainnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Create .env.mainnet file for frontend
  const envContent = `# PharbitChain Mainnet Deployment
REACT_APP_NETWORK_ID=1
REACT_APP_CHAIN_ID=0x1
REACT_APP_PHARBIT_CORE_ADDRESS=${pharbitCore}
REACT_APP_COMPLIANCE_MANAGER_ADDRESS=${complianceManager}
REACT_APP_BATCH_NFT_ADDRESS=${batchNFT}
REACT_APP_PHARBIT_DEPLOYER_ADDRESS=${pharbitDeployerAddress}
REACT_APP_RPC_URL=${process.env.MAINNET_RPC_URL}
REACT_APP_BLOCK_EXPLORER_URL=https://etherscan.io
`;

  const envFile = path.join(__dirname, "../frontend/.env.mainnet");
  fs.writeFileSync(envFile, envContent);
  console.log(`💾 Frontend environment file created: ${envFile}`);

  console.log("\n🎉 MAINNET deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("   1. Verify contracts on Etherscan:");
  console.log(`      npx hardhat verify --network mainnet ${pharbitDeployerAddress}`);
  console.log(`      npx hardhat verify --network mainnet ${pharbitCore}`);
  console.log(`      npx hardhat verify --network mainnet ${complianceManager}`);
  console.log(`      npx hardhat verify --network mainnet ${batchNFT}`);
  console.log("   2. Update frontend with new contract addresses");
  console.log("   3. Test thoroughly on mainnet");
  console.log("   4. Announce the launch!");

  console.log("\n🔗 Contract Addresses:");
  console.log(`   PharbitDeployer: ${pharbitDeployerAddress}`);
  console.log(`   PharbitCore: ${pharbitCore}`);
  console.log(`   ComplianceManager: ${complianceManager}`);
  console.log(`   BatchNFT: ${batchNFT}`);

  console.log("\n🌐 Block Explorer Links:");
  console.log(`   PharbitDeployer: https://etherscan.io/address/${pharbitDeployerAddress}`);
  console.log(`   PharbitCore: https://etherscan.io/address/${pharbitCore}`);
  console.log(`   ComplianceManager: https://etherscan.io/address/${complianceManager}`);
  console.log(`   BatchNFT: https://etherscan.io/address/${batchNFT}`);

  console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
  console.log("   - Keep your private key secure");
  console.log("   - Monitor contract activity");
  console.log("   - Set up proper access controls");
  console.log("   - Consider multi-sig for admin functions");
  console.log("   - Regular security audits recommended");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });