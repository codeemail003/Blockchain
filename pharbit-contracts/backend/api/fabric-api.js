import express from 'express';
import { withContract } from '../fabric-client.js';

const router = express.Router();

router.get('/health', async (_req, res) => {
  const enabled = !!process.env.FABRIC_CONNECTION_PROFILE;
  if (!enabled) return res.json({ enabled: false });
  try {
    await withContract(async (contract) => {
      await contract.evaluateTransaction('GetAllAssets'); // basic cc sanity
    });
    res.json({ enabled: true, ok: true });
  } catch (e) {
    res.status(500).json({ enabled: true, ok: false, error: e.message });
  }
});

// Example pass-through endpoints; map to your chaincode later
router.post('/invoke', async (req, res) => {
  const { fcn, args = [] } = req.body || {};
  if (!fcn) return res.status(400).json({ error: 'fcn required' });
  try {
    const result = await withContract(async (contract) => {
      const r = await contract.submitTransaction(fcn, ...args.map(String));
      return r?.toString();
    });
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/query', async (req, res) => {
  const { fcn, args = [] } = req.body || {};
  if (!fcn) return res.status(400).json({ error: 'fcn required' });
  try {
    const result = await withContract(async (contract) => {
      const r = await contract.evaluateTransaction(fcn, ...args.map(String));
      return r?.toString();
    });
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
