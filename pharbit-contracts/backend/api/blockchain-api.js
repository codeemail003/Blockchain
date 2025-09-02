import express from "express";

const router = express.Router();

// Placeholder: In Phase 2, wire with ethers/web3 and deployed addresses
const Contracts = {
	PharbitBatch: { address: null, abi: [] },
	PharbitStakeholder: { address: null, abi: [] },
	PharbitSensor: { address: null, abi: [] },
	PharbitSupplyChain: { address: null, abi: [] }
};

router.get('/health', (_req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.post('/batch', async (req, res) => {
	// TODO: call createBatch on-chain
	res.json({ ok: true, action: 'createBatch', data: req.body });
});

router.get('/batch/:id', async (req, res) => {
	// TODO: read batch info from contract
	res.json({ ok: true, batchId: req.params.id });
});

router.post('/sensor-data', async (req, res) => {
	// TODO: submit sensor data to contract
	res.json({ ok: true, action: 'sensorData', data: req.body });
});

router.get('/supply-chain/:batchId', async (req, res) => {
	// TODO: assemble journey from events
	res.json({ ok: true, batchId: req.params.batchId, journey: [] });
});

router.get('/verify/:batchId', async (req, res) => {
	// TODO: call verifyBatch
	res.json({ ok: true, batchId: req.params.batchId, valid: true });
});

router.get('/alerts', async (_req, res) => {
	// TODO: compute alerts from events
	res.json({ ok: true, alerts: [] });
});

export default router;