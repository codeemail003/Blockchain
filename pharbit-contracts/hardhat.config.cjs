require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-ignition');

const { PRIVATE_KEY, RPC_URL, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY } = process.env;

const networks = { hardhat: {}, localhost: { url: 'http://127.0.0.1:8545' } };
if (RPC_URL && PRIVATE_KEY) {
	networks.polygonTestnet = { url: RPC_URL, accounts: [PRIVATE_KEY] };
}

module.exports = {
	solidity: { version: '0.8.20', settings: { optimizer: { enabled: true, runs: 200 } } },
	paths: { sources: 'contracts', tests: 'tests/contracts', cache: 'cache', artifacts: 'artifacts' },
	networks,
	etherscan: { apiKey: { polygon: POLYGONSCAN_API_KEY || '', polygonMumbai: POLYGONSCAN_API_KEY || '', sepolia: ETHERSCAN_API_KEY || '' } }
};
