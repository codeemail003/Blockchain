import hre from "hardhat";

async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const publicClient = await hre.viem.getPublicClient();

	console.log(`Deployer: ${deployer.account.address}`);
	console.log(`Network: ${publicClient.chain?.name || 'hardhat'}`);

	// Deploy Stakeholder (admin = deployer)
	const stakeholder = await hre.viem.deployContract("PharbitStakeholder", [deployer.account.address]);
	console.log(`PharbitStakeholder: ${stakeholder.address}`);

	// Deploy Sensor registry (admin = deployer)
	const sensor = await hre.viem.deployContract("PharbitSensor", [deployer.account.address]);
	console.log(`PharbitSensor:     ${sensor.address}`);

	// Deploy Governance (admin, minC, maxC, window)
	const governance = await hre.viem.deployContract("PharbitGovernance", [
		deployer.account.address,
		/* minTempC */ 20, /* 2.0C */
		/* maxTempC */ 80, /* 8.0C */
		/* window */ 3600
	]);
	console.log(`PharbitGovernance: ${governance.address}`);

	// Deploy Batch (stakeholder, admin)
	const batch = await hre.viem.deployContract("PharbitBatch", [stakeholder.address, deployer.account.address]);
	console.log(`PharbitBatch:      ${batch.address}`);

	// Deploy SupplyChain (batch, stakeholder)
	const supplyChain = await hre.viem.deployContract("PharbitSupplyChain", [batch.address, stakeholder.address]);
	console.log(`PharbitSupplyChain:${supplyChain.address}`);

	console.log("\nDeployment complete.");
	console.log(JSON.stringify({
		stakeholder: stakeholder.address,
		sensor: sensor.address,
		governance: governance.address,
		batch: batch.address,
		supplyChain: supplyChain.address
	}, null, 2));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});