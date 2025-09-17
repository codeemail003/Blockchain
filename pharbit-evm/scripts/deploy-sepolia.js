const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Deploying contracts with account:", wallet.address);

    // Get contract artifacts
    const PharbitCore = JSON.parse(fs.readFileSync('./artifacts/contracts/PharbitCore.sol/PharbitCore.json'));
    const ComplianceManager = JSON.parse(fs.readFileSync('./artifacts/contracts/ComplianceManager.sol/ComplianceManager.json'));
    const BatchNFT = JSON.parse(fs.readFileSync('./artifacts/contracts/BatchNFT.sol/BatchNFT.json'));

    // Deploy PharbitCore
    console.log("Deploying PharbitCore...");
    const PharbitCoreFactory = new ethers.ContractFactory(PharbitCore.abi, PharbitCore.bytecode, wallet);
    const pharbitCore = await PharbitCoreFactory.deploy();
    await pharbitCore.deployed();
    console.log("PharbitCore deployed to:", pharbitCore.address);

    // Deploy ComplianceManager
    console.log("Deploying ComplianceManager...");
    const ComplianceManagerFactory = new ethers.ContractFactory(ComplianceManager.abi, ComplianceManager.bytecode, wallet);
    const complianceManager = await ComplianceManagerFactory.deploy(pharbitCore.address);
    await complianceManager.deployed();
    console.log("ComplianceManager deployed to:", complianceManager.address);

    // Deploy BatchNFT
    console.log("Deploying BatchNFT...");
    const BatchNFTFactory = new ethers.ContractFactory(BatchNFT.abi, BatchNFT.bytecode, wallet);
    const batchNFT = await BatchNFTFactory.deploy();
    await batchNFT.deployed();
    console.log("BatchNFT deployed to:", batchNFT.address);

    // Save the contract addresses
    const addresses = {
        PharbitCore: pharbitCore.address,
        ComplianceManager: complianceManager.address,
        BatchNFT: batchNFT.address
    };

    fs.writeFileSync(
        './deployed-addresses.json',
        JSON.stringify(addresses, null, 2)
    );

    console.log("Contract addresses saved to deployed-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });