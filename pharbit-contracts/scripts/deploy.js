import hre from "hardhat";
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { dirname } from "path";

function ensureDir(p) { try { mkdirSync(p, { recursive: true }); } catch (e) {} }

async function main() {
	// Deploy Stakeholder (admin = zero will be replaced after)
	const stakeholder = await hre.viem.deployContract("PharbitStakeholder", ["0x0000000000000000000000000000000000000001"]);
	console.log(`PharbitStakeholder: ${stakeholder.address}`);

	// Deploy Sensor registry (admin)
	const sensor = await hre.viem.deployContract("PharbitSensor", ["0x0000000000000000000000000000000000000001"]);
	console.log(`PharbitSensor:     ${sensor.address}`);

	// Deploy Governance
	const governance = await hre.viem.deployContract("PharbitGovernance", [
		"0x0000000000000000000000000000000000000001",
		20, 80, 3600
	]);
	console.log(`PharbitGovernance: ${governance.address}`);

	// Deploy Batch (stakeholder, admin)
	const batch = await hre.viem.deployContract("PharbitBatch", [stakeholder.address, "0x0000000000000000000000000000000000000001"]);
	console.log(`PharbitBatch:      ${batch.address}`);

	// Deploy SupplyChain (batch, stakeholder)
	const supplyChain = await hre.viem.deployContract("PharbitSupplyChain", [batch.address, stakeholder.address]);
	console.log(`PharbitSupplyChain:${supplyChain.address}`);

	const out = {
		network: process.env.HARDHAT_NETWORK || 'hardhat',
		stakeholder: stakeholder.address,
		sensor: sensor.address,
		governance: governance.address,
		batch: batch.address,
		supplyChain: supplyChain.address
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