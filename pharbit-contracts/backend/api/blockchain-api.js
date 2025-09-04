import express from "express";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJSON(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function toJSONSafe(obj) {
  return JSON.parse(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
}

// Load addresses and ABIs
const ROOT = path.resolve(__dirname, "../../");
const addressesPath = path.join(ROOT, "deployments", "addresses.local.json");
let addresses = {};
try { 
  addresses = loadJSON(addressesPath) || {}; 
} catch (_) { 
  addresses = {}; 
}

// Load PharmaTracker ABI
const abiPath = path.join(ROOT, "backend", "contracts", "PharmaTracker.json");
let PharmaTrackerABI = null;
try {
  const abiData = loadJSON(abiPath);
  PharmaTrackerABI = abiData?.abi;
} catch (e) {
  console.warn("PharmaTracker ABI not found, using demo mode");
}

// Provider/signer
const RPC_URL = process.env.RPC_URL || process.env.HARDHAT_RPC || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// Demo mode flag
const DEMO_MODE = !addresses.contracts?.PharmaTracker || !PharmaTrackerABI || !signer;

function getPharmaTrackerContract() {
  if (DEMO_MODE) return null;
  const address = addresses.contracts.PharmaTracker;
  if (!address || !PharmaTrackerABI) throw new Error("PharmaTracker contract not configured");
  return new ethers.Contract(address, PharmaTrackerABI, signer);
}

// Health check
router.get('/health', async (_req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    network: RPC_URL,
    hasSigner: !!signer,
    demoMode: DEMO_MODE,
    contractAddress: addresses.contracts?.PharmaTracker || null
  };
  
  if (!DEMO_MODE) {
    try {
      const contract = getPharmaTrackerContract();
      const totalDrugs = await contract.getTotalDrugs();
      health.totalDrugs = totalDrugs.toString();
    } catch (e) {
      health.contractError = e.message;
    }
  }
  
  res.json(health);
});

// Get all drugs
router.get('/drugs', async (_req, res) => {
  if (DEMO_MODE) {
    return res.json({
      drugs: [
        {
          id: 1,
          name: "Aspirin",
          manufacturer: "PharmaCorp",
          currentOwner: "0x1234567890123456789012345678901234567890",
          expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          expired: false,
          batchNumber: "ASP2024001",
          quantity: 1000
        }
      ],
      total: 1,
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const totalDrugs = await contract.getTotalDrugs();
    const drugs = [];

    for (let i = 1; i <= totalDrugs; i++) {
      try {
        const basicInfo = await contract.getDrugBasicInfo(i);
        drugs.push({
          id: i,
          name: basicInfo.name,
          manufacturer: basicInfo.manufacturer,
          currentOwner: basicInfo.currentOwner,
          expiryDate: basicInfo.expiryDate.toString(),
          expired: basicInfo.expired,
          batchNumber: `BATCH${i}`,
          quantity: 1000
        });
      } catch (e) {
        // Drug might be inactive, skip
        continue;
      }
    }

    res.json({
      drugs: toJSONSafe(drugs),
      total: drugs.length,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get drug by ID
router.get('/drug/:id', async (req, res) => {
  const drugId = req.params.id;

  if (DEMO_MODE) {
    return res.json({
      id: drugId,
      name: "Aspirin",
      manufacturer: "PharmaCorp",
      manufactureDate: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60),
      expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      currentOwner: "0x1234567890123456789012345678901234567890",
      batchNumber: "ASP2024001",
      quantity: 1000,
      storageConditions: "Store at room temperature",
      transferHistory: ["0x1234567890123456789012345678901234567890"],
      isActive: true,
      expired: false,
      daysUntilExpiry: 365,
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const drug = await contract.getDrug(drugId);
    const transferHistory = await contract.getTransferHistory(drugId);
    const daysUntilExpiry = await contract.getDaysUntilExpiry(drugId);

    res.json({
      id: drug.id.toString(),
      name: drug.name,
      manufacturer: drug.manufacturer,
      manufactureDate: drug.manufactureDate.toString(),
      expiryDate: drug.expiryDate.toString(),
      currentOwner: drug.currentOwner,
      batchNumber: drug.batchNumber,
      quantity: drug.quantity.toString(),
      storageConditions: drug.storageConditions,
      transferHistory: transferHistory,
      isActive: drug.isActive,
      expired: drug.expired,
      daysUntilExpiry: daysUntilExpiry.toString(),
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Register new drug
router.post('/drugs/register', async (req, res) => {
  const {
    name,
    manufacturer,
    manufactureDate,
    expiryDate,
    batchNumber,
    quantity,
    storageConditions
  } = req.body;

  if (DEMO_MODE) {
    return res.json({
      success: true,
      drugId: Math.floor(Math.random() * 1000),
      message: "Drug registered in demo mode",
      demoMode: true
    });
  }

  try {
    if (!signer) {
      return res.status(501).json({ error: 'No signer configured on server' });
    }

    const contract = getPharmaTrackerContract();
    const tx = await contract.registerDrug(
      name,
      manufacturer,
      manufactureDate,
      expiryDate,
      batchNumber,
      quantity,
      storageConditions
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === 'DrugRegistered');
    const drugId = event?.args?.drugId?.toString();

    res.json({
      success: true,
      drugId: drugId,
      txHash: receipt.transactionHash,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Transfer drug
router.post('/drugs/:id/transfer', async (req, res) => {
  const drugId = req.params.id;
  const { to } = req.body;

  if (DEMO_MODE) {
    return res.json({
      success: true,
      message: "Drug transferred in demo mode",
      demoMode: true
    });
  }

  try {
    if (!signer) {
      return res.status(501).json({ error: 'No signer configured on server' });
    }

    const contract = getPharmaTrackerContract();
    const tx = await contract.transferDrug(drugId, to);
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.transactionHash,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get drugs by owner
router.get('/drugs/owner/:address', async (req, res) => {
  const ownerAddress = req.params.address;

  if (DEMO_MODE) {
    return res.json({
      owner: ownerAddress,
      drugs: [1, 2, 3],
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const drugIds = await contract.getDrugsByOwner(ownerAddress);

    res.json({
      owner: ownerAddress,
      drugs: drugIds.map(id => id.toString()),
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Check drug expiry
router.get('/drugs/:id/expiry', async (req, res) => {
  const drugId = req.params.id;

  if (DEMO_MODE) {
    return res.json({
      drugId: drugId,
      expired: false,
      daysUntilExpiry: 365,
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const expired = await contract.isDrugExpired(drugId);
    const daysUntilExpiry = await contract.getDaysUntilExpiry(drugId);

    res.json({
      drugId: drugId,
      expired: expired,
      daysUntilExpiry: daysUntilExpiry.toString(),
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Authorize manufacturer
router.post('/manufacturers/authorize', async (req, res) => {
  const { address } = req.body;

  if (DEMO_MODE) {
    return res.json({
      success: true,
      message: "Manufacturer authorized in demo mode",
      demoMode: true
    });
  }

  try {
    if (!signer) {
      return res.status(501).json({ error: 'No signer configured on server' });
    }

    const contract = getPharmaTrackerContract();
    const tx = await contract.authorizeManufacturer(address);
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.transactionHash,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Check if address is authorized manufacturer
router.get('/manufacturers/:address/authorized', async (req, res) => {
  const address = req.params.address;

  if (DEMO_MODE) {
    return res.json({
      address: address,
      authorized: true,
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const authorized = await contract.isAuthorizedManufacturer(address);

    res.json({
      address: address,
      authorized: authorized,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get contract statistics
router.get('/stats', async (_req, res) => {
  if (DEMO_MODE) {
    return res.json({
      totalDrugs: 5,
      totalManufacturers: 3,
      expiredDrugs: 1,
      demoMode: true
    });
  }

  try {
    const contract = getPharmaTrackerContract();
    const totalDrugs = await contract.getTotalDrugs();

    // Count expired drugs
    let expiredCount = 0;
    for (let i = 1; i <= totalDrugs; i++) {
      try {
        const expired = await contract.isDrugExpired(i);
        if (expired) expiredCount++;
      } catch (e) {
        // Drug might be inactive, skip
        continue;
      }
    }

    res.json({
      totalDrugs: totalDrugs.toString(),
      expiredDrugs: expiredCount,
      activeDrugs: totalDrugs - expiredCount,
      demoMode: false
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;