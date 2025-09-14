const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Pharbit Contracts Deployment to Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  try {
    // Deploy GovernanceContract with constructor arguments
    console.log("📋 Deploying GovernanceContract...");
    const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
    // GovernanceContract(address[] memory initialOwners, uint256 initialQuorum, address admin)
    const initialOwners = [deployer.address]; // Start with deployer as initial owner
    const initialQuorum = 1; // Start with quorum of 1 for testing
    const governance = await GovernanceContract.deploy(initialOwners, initialQuorum, deployer.address);
    await governance.waitForDeployment();
    const governanceAddress = await governance.getAddress();
    console.log("✅ GovernanceContract deployed to:", governanceAddress);

    // Deploy SensorDataContract with constructor arguments
    console.log("📡 Deploying SensorDataContract...");
    const SensorDataContract = await hre.ethers.getContractFactory("SensorDataContract");
    // SensorDataContract(int256 minTempMilliC, int256 maxTempMilliC, uint256 maxHumidityPermille, address admin)
    const minTempMilliC = 2000;  // 2°C in millicelsius
    const maxTempMilliC = 8000;  // 8°C in millicelsius (typical pharma cold chain)
    const maxHumidityPermille = 600; // 60% humidity in permille
    const sensorData = await SensorDataContract.deploy(minTempMilliC, maxTempMilliC, maxHumidityPermille, deployer.address);
    await sensorData.waitForDeployment();
    const sensorDataAddress = await sensorData.getAddress();
    console.log("✅ SensorDataContract deployed to:", sensorDataAddress);

    // Deploy StakeholderContract with constructor arguments
    console.log("👥 Deploying StakeholderContract...");
    const StakeholderContract = await hre.ethers.getContractFactory("StakeholderContract");
    // StakeholderContract(address admin)
    const stakeholder = await StakeholderContract.deploy(deployer.address);
    await stakeholder.waitForDeployment();
    const stakeholderAddress = await stakeholder.getAddress();
    console.log("✅ StakeholderContract deployed to:", stakeholderAddress);

    // Deploy BatchContract with constructor arguments
    console.log("📦 Deploying BatchContract...");
    const BatchContract = await hre.ethers.getContractFactory("BatchContract");
    // BatchContract(address admin)
    const batch = await BatchContract.deploy(deployer.address);
    await batch.waitForDeployment();
    const batchAddress = await batch.getAddress();
    console.log("✅ BatchContract deployed to:", batchAddress);

    // Deploy SupplyChainContract with constructor arguments
    console.log("🔗 Deploying SupplyChainContract...");
    const SupplyChainContract = await hre.ethers.getContractFactory("SupplyChainContract");
    // SupplyChainContract(address admin, address _stakeholderContract)
    const supplyChain = await SupplyChainContract.deploy(deployer.address, stakeholderAddress);
    await supplyChain.waitForDeployment();
    const supplyChainAddress = await supplyChain.getAddress();
    console.log("✅ SupplyChainContract deployed to:", supplyChainAddress);

    // Save contract addresses
    const addresses = {
      GovernanceContract: governanceAddress,
      SensorDataContract: sensorDataAddress,
      StakeholderContract: stakeholderAddress,
      BatchContract: batchAddress,
      SupplyChainContract: supplyChainAddress,
      network: "sepolia",
      chainId: 11155111,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      gasUsed: "Calculated after deployment"
    };

    // Write to contract-addresses.json
    const fs = require('fs');
    fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
    
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("📄 Contract addresses saved to contract-addresses.json");
    
    console.log("\n📋 Deployment Summary:");
    console.log("=" + "=".repeat(50));
    Object.keys(addresses).forEach(name => {
      if (name !== 'network' && name !== 'chainId' && name !== 'deployer' && name !== 'deployedAt' && name !== 'gasUsed') {
        console.log(`${name.padEnd(25)}: ${addresses[name]}`);
      }
    });
    
    console.log("\n🔍 Verify contracts on Etherscan:");
    console.log("=" + "=".repeat(50));
    console.log(`npx hardhat verify --network sepolia ${governanceAddress} '[${JSON.stringify(initialOwners)}]' ${initialQuorum} ${deployer.address}`);
    console.log(`npx hardhat verify --network sepolia ${sensorDataAddress} ${minTempMilliC} ${maxTempMilliC} ${maxHumidityPermille} ${deployer.address}`);
    console.log(`npx hardhat verify --network sepolia ${stakeholderAddress} ${deployer.address}`);
    console.log(`npx hardhat verify --network sepolia ${batchAddress} ${deployer.address}`);
    console.log(`npx hardhat verify --network sepolia ${supplyChainAddress} ${deployer.address} ${stakeholderAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    // If it's a constructor argument error, let's get more specific info
    if (error.message.includes("incorrect number of arguments")) {
      console.log("\n🔍 Let's check the contract constructors...");
      console.log("Run this to see constructor requirements:");
      console.log("grep -n 'constructor' contracts/*.sol");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
