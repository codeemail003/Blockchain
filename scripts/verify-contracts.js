const { run } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification...");

  const network = process.env.NETWORK || "sepolia";
  const contractAddresses = {
    sepolia: {
      pharbitDeployer: process.env.PHARBIT_DEPLOYER_ADDRESS,
      pharbitCore: process.env.PHARBIT_CORE_ADDRESS,
      complianceManager: process.env.COMPLIANCE_MANAGER_ADDRESS,
      batchNFT: process.env.BATCH_NFT_ADDRESS
    },
    mainnet: {
      pharbitDeployer: process.env.PHARBIT_DEPLOYER_ADDRESS,
      pharbitCore: process.env.PHARBIT_CORE_ADDRESS,
      complianceManager: process.env.COMPLIANCE_MANAGER_ADDRESS,
      batchNFT: process.env.BATCH_NFT_ADDRESS
    }
  };

  const addresses = contractAddresses[network];
  
  if (!addresses) {
    throw new Error(`Unsupported network: ${network}`);
  }

  console.log(`📋 Verifying contracts on ${network}...`);
  console.log("");

  // Verify PharbitDeployer
  if (addresses.pharbitDeployer) {
    console.log(`🔍 Verifying PharbitDeployer at ${addresses.pharbitDeployer}...`);
    try {
      await run("verify:verify", {
        address: addresses.pharbitDeployer,
        constructorArguments: [],
        network: network
      });
      console.log("✅ PharbitDeployer verified successfully!");
    } catch (error) {
      console.error("❌ PharbitDeployer verification failed:", error.message);
    }
  }

  // Verify PharbitCore
  if (addresses.pharbitCore) {
    console.log(`🔍 Verifying PharbitCore at ${addresses.pharbitCore}...`);
    try {
      await run("verify:verify", {
        address: addresses.pharbitCore,
        constructorArguments: [],
        network: network
      });
      console.log("✅ PharbitCore verified successfully!");
    } catch (error) {
      console.error("❌ PharbitCore verification failed:", error.message);
    }
  }

  // Verify ComplianceManager
  if (addresses.complianceManager) {
    console.log(`🔍 Verifying ComplianceManager at ${addresses.complianceManager}...`);
    try {
      await run("verify:verify", {
        address: addresses.complianceManager,
        constructorArguments: [],
        network: network
      });
      console.log("✅ ComplianceManager verified successfully!");
    } catch (error) {
      console.error("❌ ComplianceManager verification failed:", error.message);
    }
  }

  // Verify BatchNFT
  if (addresses.batchNFT) {
    console.log(`🔍 Verifying BatchNFT at ${addresses.batchNFT}...`);
    try {
      await run("verify:verify", {
        address: addresses.batchNFT,
        constructorArguments: [
          "PharbitBatch",
          "PBT",
          "https://api.pharbit.com/metadata/",
          "https://api.pharbit.com/contract"
        ],
        network: network
      });
      console.log("✅ BatchNFT verified successfully!");
    } catch (error) {
      console.error("❌ BatchNFT verification failed:", error.message);
    }
  }

  console.log("\n🎉 Contract verification completed!");
  console.log("\n📋 Verification Summary:");
  console.log(`   Network: ${network}`);
  console.log(`   PharbitDeployer: ${addresses.pharbitDeployer || 'Not provided'}`);
  console.log(`   PharbitCore: ${addresses.pharbitCore || 'Not provided'}`);
  console.log(`   ComplianceManager: ${addresses.complianceManager || 'Not provided'}`);
  console.log(`   BatchNFT: ${addresses.batchNFT || 'Not provided'}`);

  console.log("\n🌐 Block Explorer Links:");
  const baseUrl = network === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";
  
  if (addresses.pharbitDeployer) {
    console.log(`   PharbitDeployer: ${baseUrl}/address/${addresses.pharbitDeployer}`);
  }
  if (addresses.pharbitCore) {
    console.log(`   PharbitCore: ${baseUrl}/address/${addresses.pharbitCore}`);
  }
  if (addresses.complianceManager) {
    console.log(`   ComplianceManager: ${baseUrl}/address/${addresses.complianceManager}`);
  }
  if (addresses.batchNFT) {
    console.log(`   BatchNFT: ${baseUrl}/address/${addresses.batchNFT}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });