const hre = require("hardhat");

async function main() {
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();

  await simpleStorage.waitForDeployment();
  
  const address = await simpleStorage.getAddress();
  console.log("SimpleStorage deployed to:", address);

  // Test the contract
  console.log("\nTesting contract functionality...");
  
  const initialValue = await simpleStorage.getValue();
  console.log("Initial value:", initialValue.toString());
  
  console.log("\nSetting value to 42...");
  const tx = await simpleStorage.setValue(42);
  await tx.wait();
  console.log("Value set successfully!");
  
  const newValue = await simpleStorage.getValue();
  console.log("New value:", newValue.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});