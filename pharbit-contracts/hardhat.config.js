import dotenv from "dotenv";
import "@nomicfoundation/hardhat-viem";

dotenv.config();

const { PRIVATE_KEY, RPC_URL, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY } = process.env;

const networks = { hardhat: { type: "edr-simulated" } };
if (RPC_URL && PRIVATE_KEY) {
	networks.polygonTestnet = { type: "http", url: RPC_URL, accounts: [PRIVATE_KEY] };
}

export default {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  paths: {
    root: ".",
    sources: "contracts",
    tests: "tests/contracts",
    cache: "cache",
    artifacts: "artifacts"
  },
  networks,
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY || "",
      polygonMumbai: POLYGONSCAN_API_KEY || "",
      sepolia: ETHERSCAN_API_KEY || ""
    }
  }
};
