const hre = require("hardhat");
const { writeFileSync, mkdirSync, copyFileSync } = require("fs");
const { dirname } = require("path");

function ensureDir(p) { try { mkdirSync(p, { recursive: true }); } catch (e) {} }

async function main() {
	// Get the deployer account
	const [deployer] = await hre.ethers.getSigners();
	console.log("Deploying contracts with account:", deployer.address);

	// Deploy Stakeholder (admin = deployer)
	const PharbitStakeholder = await hre.ethers.getContractFactory("PharbitStakeholder");
	const stakeholder = await PharbitStakeholder.deploy(deployer.address);
	await stakeholder.waitForDeployment();
	const stakeholderAddress = await stakeholder.getAddress();
	console.log(`PharbitStakeholder: ${stakeholderAddress}`);

	// Deploy Sensor registry (admin)
	const PharbitSensor = await hre.ethers.getContractFactory("PharbitSensor");
	const sensor = await PharbitSensor.deploy(deployer.address);
	await sensor.waitForDeployment();
	const sensorAddress = await sensor.getAddress();
	console.log(`PharbitSensor:     ${sensorAddress}`);

	// Deploy Governance
	const PharbitGovernance = await hre.ethers.getContractFactory("PharbitGovernance");
	const governance = await PharbitGovernance.deploy(deployer.address, 20, 80, 3600);
	await governance.waitForDeployment();
	const governanceAddress = await governance.getAddress();
	console.log(`PharbitGovernance: ${governanceAddress}`);

	// Deploy Batch (stakeholder, admin)
	const PharbitBatch = await hre.ethers.getContractFactory("PharbitBatch");
	const batch = await PharbitBatch.deploy(stakeholderAddress, deployer.address);
	await batch.waitForDeployment();
	const batchAddress = await batch.getAddress();
	console.log(`PharbitBatch:      ${batchAddress}`);

	// Deploy SupplyChain (batch, stakeholder)
	const PharbitSupplyChain = await hre.ethers.getContractFactory("PharbitSupplyChain");
	const supplyChain = await PharbitSupplyChain.deploy(batchAddress, stakeholderAddress);
	await supplyChain.waitForDeployment();
	const supplyChainAddress = await supplyChain.getAddress();
	console.log(`PharbitSupplyChain:${supplyChainAddress}`);

	const out = {
		network: process.env.HARDHAT_NETWORK || 'hardhat',
		stakeholder: stakeholderAddress,
		sensor: sensorAddress,
		governance: governanceAddress,
		batch: batchAddress,
		supplyChain: supplyChainAddress
	};

	const deploymentsDir = `${process.cwd()}/deployments`;
	ensureDir(deploymentsDir);
	const addressesPath = `${deploymentsDir}/addresses.local.json`;
	writeFileSync(addressesPath, JSON.stringify(out, null, 2));
	console.log(`\nSaved addresses to ${addressesPath}`);

	const abiSrc = `${process.cwd()}/artifacts/contracts`;
	const abiDest = `${process.cwd()}/frontend/src/contracts`;
	ensureDir(abiDest);
	const contracts = [
		"PharbitBatch.sol/PharbitBatch.json",
		"PharbitStakeholder.sol/PharbitStakeholder.json",
		"PharbitSensor.sol/PharbitSensor.json",
		"PharbitSupplyChain.sol/PharbitSupplyChain.json",
		"PharbitGovernance.sol/PharbitGovernance.json"
	];
	for (const rel of contracts) {
		const src = `${abiSrc}/${rel}`;
		const dest = `${abiDest}/${rel.split('/').pop()}`;
		try { ensureDir(dirname(dest)); copyFileSync(src, dest); console.log(`Copied ABI: ${dest}`); } catch (e) { console.warn(`ABI copy failed for ${rel}: ${e.message}`); }
	}

	console.log("\nDeployment complete.");
	console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});