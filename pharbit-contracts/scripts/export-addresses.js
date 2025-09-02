const { writeFileSync, mkdirSync, copyFileSync } = require('fs');
const { execSync } = require('child_process');
const { dirname } = require('path');

function ensureDir(p) { try { mkdirSync(p, { recursive: true }); } catch (e) {} }

function copyAbis() {
	const root = process.cwd();
	const abiSrc = `${root}/artifacts/contracts`;
	const abiDest = `${root}/frontend/src/contracts`;
	ensureDir(abiDest);
	const files = [
		['PharbitBatch.sol/PharbitBatch.json', 'PharbitBatch.json'],
		['PharbitStakeholder.sol/PharbitStakeholder.json', 'PharbitStakeholder.json'],
		['PharbitSensor.sol/PharbitSensor.json', 'PharbitSensor.json'],
		['PharbitSupplyChain.sol/PharbitSupplyChain.json', 'PharbitSupplyChain.json'],
		['PharbitGovernance.sol/PharbitGovernance.json', 'PharbitGovernance.json'],
	];
	for (const [rel, name] of files) {
		try {
			copyFileSync(`${abiSrc}/${rel}`, `${abiDest}/${name}`);
			console.log(`Copied ABI -> frontend/src/contracts/${name}`);
		} catch (e) {
			console.warn(`ABI copy failed for ${rel}: ${e.message}`);
		}
	}
}

function exportAddresses(addresses) {
	const outDir = `${process.cwd()}/deployments`;
	ensureDir(outDir);
	const outPath = `${outDir}/addresses.local.json`;
	writeFileSync(outPath, JSON.stringify(addresses, null, 2));
	console.log(`Saved addresses -> ${outPath}`);
}

function main() {
	// For local hardhat network, Ignition prints standard addresses, capture via dry run
	let addresses = null;
	try {
		const output = execSync('npx hardhat ignition deploy ./ignition/modules/PharbitModule.ts --network hardhat', { encoding: 'utf-8' });
		const lines = output.split('\n').filter(l => l.includes('PharbitModule#'));
		const map = {};
		for (const line of lines) {
			const parts = line.trim().split(' - ');
			if (parts.length === 2) {
				const key = parts[0].split('#')[1].trim().replace('Pharbit', '').toLowerCase();
				map[key] = parts[1].trim();
			}
		}
		addresses = {
			network: 'hardhat',
			stakeholder: map.stakeholder,
			sensor: map.sensor,
			governance: map.governance,
			batch: map.batch,
			supplyChain: map.supplychain
		};
		console.log('Captured addresses from Ignition output');
	} catch (e) {
		console.warn('Failed to capture addresses from Ignition. You can fill them manually.');
		addresses = { network: 'hardhat' };
	}

	exportAddresses(addresses);
	copyAbis();
}

main();