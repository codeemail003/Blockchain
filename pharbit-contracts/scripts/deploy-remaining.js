const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Remaining Pharbit Contracts to Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("�� Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Already deployed
  const governanceAddress = "0xC0Aa3e906C29427b6fF874812dccF5458356e141";
  console.log("✅ GovernanceContract (already deployed):", governanceAddress);

  // Deploy remaining contracts
  console.log("📡 Deploying SensorDataContract...");
  const SensorDataContract = await hre.ethers.getContractFactory("SensorDataContract");
  const minTempMilliC = 2000;
  const maxTempMilliC = 8000;
  const maxHumidityPermille = 600;
  const sensorData = await SensorDataContract.deploy(minTempMilliC, maxTempMilliC, maxHumidityPermille, deployer.address);
  await sensorData.waitForDeployment();
  const sensorDataAddress = await sensorData.getAddress();
  console.log("✅ SensorDataContract deployed to:", sensorDataAddress);

  console.log("👥 Deploying StakeholderContract...");
  const StakeholderContract = await hre.ethers.getContractFactory("StakeholderContract");
  const stakeholder = await StakeholderContract.deploy(deployer.address);
  await stakeholder.waitForDeployment();
  const stakeholderAddress = await stakeholder.getAddress();
  console.log("✅ StakeholderContract deployed to:", stakeholderAddress);

  console.log("�� Deploying BatchContract...");
  const BatchContract = await hre.ethers.getContractFactory("BatchContract");
  const batch = await BatchContract.deploy(deployer.address);
  await batch.waitForDeployment();
  const batchAddress = await batch.getAddress();
  console.log("✅ BatchContract deployed to:", batchAddress);

  console.log("🔗 Deploying SupplyChainContract...");
  const SupplyChainContract = await hre.ethers.getContractFactory("SupplyChainContract");
  const supplyChain = await SupplyChainContract.deploy(deployer.address, stakeholderAddress);
  await supplyChain.waitForDeployment();
  const supplyChainAddress = await supplyChain.getAddress();
  console.log("✅ SupplyChainContract deployed to:", supplyChainAddress);

  // Save all addresses
  const addresses = {
    GovernanceContract: governanceAddress,
    SensorDataContract: sensorDataAddress,
    StakeholderContract: stakeholderAddress,
    BatchContract: batchAddress,
    SupplyChainContract: supplyChainAddress,
    network: "sepolia",
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("🎉 All contracts deployed successfully!");
  console.log("📄 Contract addresses saved to contract-addresses.json");
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
