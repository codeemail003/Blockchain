import express from "express";
import cors from "cors";
import api from "./api/blockchain-api.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'OK' }));
app.use('/api', api);

app.listen(PORT, () => {
	console.log(`Pharbit Web3 API listening on http://localhost:${PORT}`);
});