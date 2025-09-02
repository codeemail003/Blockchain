import express from "express";
import cors from "cors";
import api from "./api/blockchain-api.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'OK' }));
app.use('/api', api);

// Serve frontend static dashboard
app.use('/', express.static(path.join(__dirname, '../frontend/public')));

app.listen(PORT, () => {
	console.log(`Pharbit Web3 API listening on http://localhost:${PORT}`);
	console.log(`Dashboard: http://localhost:${PORT}/`);
});