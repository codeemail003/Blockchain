import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { getProvider, getSigner, getContract } from "./blockchain.mjs";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Addresses should be provided via env or a deployments file in production
const addresses = {
  governance: process.env.GOVERNANCE_ADDRESS,
  sensor: process.env.SENSOR_ADDRESS,
  stakeholders: process.env.STAKEHOLDERS_ADDRESS,
  batches: process.env.BATCHES_ADDRESS,
  supply: process.env.SUPPLY_ADDRESS,
};

const provider = getProvider();
const signer = getSigner(provider) || provider;

function contract(name, address) {
  if (!address) throw new Error(`${name} address not configured`);
  return getContract(address, name, signer);
}

// Stakeholders
app.post("/api/stakeholders/register", async (req, res) => {
  try {
    const { wallet, name, role } = req.body;
    const c = contract("StakeholderContract", addresses.stakeholders);
    const tx = await c.registerCompany(wallet, name, role);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/stakeholders", async (req, res) => {
  try {
    const c = contract("StakeholderContract", addresses.stakeholders);
    const list = await c.listCompanies();
    res.json(list);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Batches
app.post("/api/batches/create", async (req, res) => {
  try {
    const { productName, metadataURI, manufactureDate, expiryDate, manufacturer } = req.body;
    const c = contract("BatchContract", addresses.batches);
    const tx = await c.createBatch(productName, metadataURI, manufactureDate, expiryDate, manufacturer);
    const receipt = await tx.wait();
    const ev = receipt.logs.find(() => true);
    res.json({ txHash: tx.hash, eventCount: receipt.logs.length, firstLog: ev });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/batches/:id", async (req, res) => {
  try {
    const c = contract("BatchContract", addresses.batches);
    const batch = await c.getBatch(Number(req.params.id));
    res.json(batch);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Sensor data
app.post("/api/sensor-data/record", async (req, res) => {
  try {
    const { batchId, temperatureMilliC, humidityPermille, location, timestamp } = req.body;
    const c = contract("SensorDataContract", addresses.sensor);
    const tx = await c.recordTelemetry(batchId, temperatureMilliC, humidityPermille, location, timestamp || 0);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/sensor-data/:batchId", async (req, res) => {
  try {
    const c = contract("SensorDataContract", addresses.sensor);
    const len = await c.getHistoryLength(Number(req.params.batchId));
    const out = [];
    for (let i = 0; i < Number(len); i++) {
      out.push(await c.getByIndex(Number(req.params.batchId), i));
    }
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Supply chain
app.post("/api/supply-chain/transfer", async (req, res) => {
  try {
    const { batchId, to, location } = req.body;
    const c = contract("SupplyChainContract", addresses.supply);
    const tx = await c.transferBatch(batchId, to, location);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/supply-chain/track/:batchId", async (req, res) => {
  try {
    const c = contract("SupplyChainContract", addresses.supply);
    const history = await c.getTransfers(Number(req.params.batchId));
    res.json(history);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Governance
app.get("/api/governance/proposals", async (req, res) => {
  try {
    res.json({ message: "List proposals requires off-chain index; use events." });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/governance/propose", async (req, res) => {
  try {
    const { description, votingPeriodSeconds } = req.body;
    const c = contract("GovernanceContract", addresses.governance);
    const tx = await c.createProposal(description, votingPeriodSeconds);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/governance/vote", async (req, res) => {
  try {
    const { proposalId, support } = req.body;
    const c = contract("GovernanceContract", addresses.governance);
    const tx = await c.vote(proposalId, !!support);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
