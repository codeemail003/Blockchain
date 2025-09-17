const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting local deployment of PharbitChain contracts...");

  // Get signers
  const [deployer, admin, manufacturer, distributor, pharmacy, inspector, fda] = await ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Admin: ${admin.address}`);
  console.log(`   Manufacturer: ${manufacturer.address}`);
  console.log(`   Distributor: ${distributor.address}`);
  console.log(`   Pharmacy: ${pharmacy.address}`);
  console.log(`   Inspector: ${inspector.address}`);
  console.log(`   FDA: ${fda.address}`);
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

  const tx = await pharbitDeployer.deployContractsWithRoles(
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

  // Verify roles are set correctly
  console.log("\n🔐 Verifying role assignments...");
  
  // PharbitCore roles
  const pharbitCoreAdmin = await pharbitCoreContract.hasRole(pharbitCoreContract.ADMIN_ROLE(), admin.address);
  const pharbitCoreManufacturer = await pharbitCoreContract.hasRole(pharbitCoreContract.MANUFACTURER_ROLE(), manufacturer.address);
  const pharbitCoreDistributor = await pharbitCoreContract.hasRole(pharbitCoreContract.DISTRIBUTOR_ROLE(), distributor.address);
  const pharbitCorePharmacy = await pharbitCoreContract.hasRole(pharbitCoreContract.PHARMACY_ROLE(), pharmacy.address);
  const pharbitCoreInspector = await pharbitCoreContract.hasRole(pharbitCoreContract.INSPECTOR_ROLE(), inspector.address);
  const pharbitCoreFDA = await pharbitCoreContract.hasRole(pharbitCoreContract.FDA_ROLE(), fda.address);

  console.log(`   PharbitCore Admin: ${pharbitCoreAdmin ? '✅' : '❌'}`);
  console.log(`   PharbitCore Manufacturer: ${pharbitCoreManufacturer ? '✅' : '❌'}`);
  console.log(`   PharbitCore Distributor: ${pharbitCoreDistributor ? '✅' : '❌'}`);
  console.log(`   PharbitCore Pharmacy: ${pharbitCorePharmacy ? '✅' : '❌'}`);
  console.log(`   PharbitCore Inspector: ${pharbitCoreInspector ? '✅' : '❌'}`);
  console.log(`   PharbitCore FDA: ${pharbitCoreFDA ? '✅' : '❌'}`);

  // ComplianceManager roles
  const complianceAdmin = await complianceManagerContract.hasRole(complianceManagerContract.ADMIN_ROLE(), admin.address);
  const complianceInspector = await complianceManagerContract.hasRole(complianceManagerContract.INSPECTOR_ROLE(), inspector.address);
  const complianceFDA = await complianceManagerContract.hasRole(complianceManagerContract.FDA_ROLE(), fda.address);

  console.log(`   ComplianceManager Admin: ${complianceAdmin ? '✅' : '❌'}`);
  console.log(`   ComplianceManager Inspector: ${complianceInspector ? '✅' : '❌'}`);
  console.log(`   ComplianceManager FDA: ${complianceFDA ? '✅' : '❌'}`);

  // BatchNFT roles
  const nftAdmin = await batchNFTContract.hasRole(batchNFTContract.ADMIN_ROLE(), admin.address);
  const nftMinter = await batchNFTContract.hasRole(batchNFTContract.MINTER_ROLE(), manufacturer.address);
  const nftMetadata = await batchNFTContract.hasRole(batchNFTContract.METADATA_ROLE(), manufacturer.address);

  console.log(`   BatchNFT Admin: ${nftAdmin ? '✅' : '❌'}`);
  console.log(`   BatchNFT Minter: ${nftMinter ? '✅' : '❌'}`);
  console.log(`   BatchNFT Metadata: ${nftMetadata ? '✅' : '❌'}`);

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: 1337,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      pharbitDeployer: pharbitDeployerAddress,
      pharbitCore: pharbitCore,
      complianceManager: complianceManager,
      batchNFT: batchNFT
    },
    roles: {
      admin: admin.address,
      manufacturer: manufacturer.address,
      distributor: distributor.address,
      pharmacy: pharmacy.address,
      inspector: inspector.address,
      fda: fda.address
    },
    deploymentParams: deploymentParams
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Create .env.local file for frontend
  const envContent = `# PharbitChain Local Deployment
REACT_APP_NETWORK_ID=1337
REACT_APP_CHAIN_ID=0x539
REACT_APP_PHARBIT_CORE_ADDRESS=${pharbitCore}
REACT_APP_COMPLIANCE_MANAGER_ADDRESS=${complianceManager}
REACT_APP_BATCH_NFT_ADDRESS=${batchNFT}
REACT_APP_PHARBIT_DEPLOYER_ADDRESS=${pharbitDeployerAddress}
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_BLOCK_EXPLORER_URL=
`;

  const envFile = path.join(__dirname, "../frontend/.env.local");
  fs.writeFileSync(envFile, envContent);
  console.log(`💾 Frontend environment file created: ${envFile}`);

  console.log("\n🎉 Local deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("   1. Start your local blockchain (Hardhat node)");
  console.log("   2. Run: npm run frontend");
  console.log("   3. Connect MetaMask to localhost:8545");
  console.log("   4. Import test accounts with private keys from Hardhat");
  console.log("   5. Start testing your pharmaceutical blockchain!");

  console.log("\n🔗 Contract Addresses:");
  console.log(`   PharbitDeployer: ${pharbitDeployerAddress}`);
  console.log(`   PharbitCore: ${pharbitCore}`);
  console.log(`   ComplianceManager: ${complianceManager}`);
  console.log(`   BatchNFT: ${batchNFT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });