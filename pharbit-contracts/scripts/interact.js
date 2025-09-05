const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Using signer:", signer.address);
  // Placeholder for manual interactions post-deploy
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
