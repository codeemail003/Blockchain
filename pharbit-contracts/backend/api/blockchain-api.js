import express from "express";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJSON(p) {
	return JSON.parse(readFileSync(p, 'utf-8'));
}

function toJSONSafe(obj) {
	return JSON.parse(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
}

// Load addresses and ABIs
const ROOT = path.resolve(__dirname, "../../");
const addressesPath = path.join(ROOT, "deployments", "addresses.local.json");
let addresses = {};
try { addresses = loadJSON(addressesPath); } catch (_) { addresses = {}; }

const abisDir = path.join(ROOT, "frontend", "src", "contracts");
const ABIS = {};
try {
	ABIS.PharbitBatch = loadJSON(path.join(abisDir, "PharbitBatch.json")).abi;
	ABIS.PharbitStakeholder = loadJSON(path.join(abisDir, "PharbitStakeholder.json")).abi;
	ABIS.PharbitSensor = loadJSON(path.join(abisDir, "PharbitSensor.json")).abi;
	ABIS.PharbitSupplyChain = loadJSON(path.join(abisDir, "PharbitSupplyChain.json")).abi;
	ABIS.PharbitGovernance = loadJSON(path.join(abisDir, "PharbitGovernance.json")).abi;
} catch (e) {
	// ABIs not present yet
}

// Provider/signer
const RPC_URL = process.env.RPC_URL || process.env.HARDHAT_RPC || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

function getContract(name, addressKey) {
	const address = addresses[addressKey];
	const abi = ABIS[name];
	if (!address || !abi) throw new Error(`Contract ${name} not configured`);
	return new ethers.Contract(address, abi, signer || provider);
}

// Health
router.get('/health', async (_req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString(), network: RPC_URL, hasSigner: !!signer });
});

// Batch read
router.get('/batch/:id', async (req, res) => {
	try {
		const batchC = getContract('PharbitBatch', 'batch');
		const id = req.params.id;
		const info = await batchC.getBatch(id);
		const sensors = await batchC.getSensorData(id);
		res.json({ batchId: id, info: toJSONSafe(info), sensors: toJSONSafe(sensors) });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Verify batch
router.get('/verify/:batchId', async (req, res) => {
	try {
		const batchC = getContract('PharbitBatch', 'batch');
		const id = req.params.batchId;
		const result = await batchC.verifyBatch(id);
		res.json({ batchId: id, info: toJSONSafe(result[0]), valid: !!result[1] });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Sensor data (requires signer)
router.post('/sensor-data', async (req, res) => {
	try {
		if (!signer) return res.status(501).json({ error: 'No signer configured on server' });
		const { batchId, temperature, humidity, gps, tampering, timestamp } = req.body || {};
		if (!batchId) return res.status(400).json({ error: 'batchId required' });
		const batchC = getContract('PharbitBatch', 'batch');
		const sd = {
			temperatureC: Math.round((temperature ?? 5) * 10),
			humidity: Math.max(0, Math.min(100, Math.round(humidity ?? 50))),
			latE7: Math.round(((gps?.lat ?? 0) * 1e7)),
			lonE7: Math.round(((gps?.lon ?? 0) * 1e7)),
			tampering: !!tampering,
			timestamp: timestamp || Math.floor(Date.now() / 1000)
		};
		const tx = await batchC.recordSensorData(batchId, sd);
		const receipt = await tx.wait();
		res.json({ ok: true, txHash: receipt.hash });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Supply chain journey placeholder
router.get('/supply-chain/:batchId', async (req, res) => {
	try {
		const id = req.params.batchId;
		res.json({ batchId: id, journey: [] });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Alerts placeholder
router.get('/alerts', async (_req, res) => {
	res.json({ alerts: [] });
});

export default router;