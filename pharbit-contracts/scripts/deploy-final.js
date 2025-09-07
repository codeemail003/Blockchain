const hre = require("hardhat");

async function main() {
  console.log("Deploying Final 2 Pharbit Contracts to Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Already deployed addresses
  const governanceAddress = "0xC0Aa3e906C29427b6fF874812dccF5458356e141";
  const sensorDataAddress = "0x5FD48B4130f5a87F3D37E2B14f938B5Ea017038C";
  const stakeholderAddress = "0x92739707801c23A2678cC176fdCda5e43C578413";

  console.log("Deploying BatchContract...");
  const BatchContract = await hre.ethers.getContractFactory("BatchContract");
  const batch = await BatchContract.deploy(deployer.address);
  await batch.waitForDeployment();
  const batchAddress = await batch.getAddress();
  console.log("BatchContract deployed to:", batchAddress);

  console.log("Deploying SupplyChainContract...");
  const SupplyChainContract = await hre.ethers.getContractFactory("SupplyChainContract");
  const supplyChain = await SupplyChainContract.deploy(deployer.address, stakeholderAddress);
  await supplyChain.waitForDeployment();
  const supplyChainAddress = await supplyChain.getAddress();
  console.log("SupplyChainContract deployed to:", supplyChainAddress);

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
  console.log("All contracts deployed successfully!");
}

main().then(() => process.exit(0)).catch(console.error);
