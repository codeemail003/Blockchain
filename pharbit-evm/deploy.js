const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs and Bytecode
const contracts = {
  PharbitCore: require('./artifacts/contracts/PharbitCore.sol/PharbitCore.json'),
  ComplianceManager: require('./artifacts/contracts/ComplianceManager.sol/ComplianceManager.json'),
  BatchNFT: require('./artifacts/contracts/BatchNFT.sol/BatchNFT.json')
};

async function deploy() {
  try {
    // Connect to the network
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Deploying contracts with the account:', wallet.address);
    console.log('Account balance:', (await wallet.getBalance()).toString());

    // Deploy PharbitCore
    const PharbitCoreFactory = new ethers.ContractFactory(
      contracts.PharbitCore.abi,
      contracts.PharbitCore.bytecode,
      wallet
    );
    const pharbitCore = await PharbitCoreFactory.deploy();
    await pharbitCore.deployed();
    console.log('PharbitCore deployed to:', pharbitCore.address);

    // Deploy ComplianceManager
    const ComplianceManagerFactory = new ethers.ContractFactory(
      contracts.ComplianceManager.abi,
      contracts.ComplianceManager.bytecode,
      wallet
    );
    const complianceManager = await ComplianceManagerFactory.deploy(pharbitCore.address);
    await complianceManager.deployed();
    console.log('ComplianceManager deployed to:', complianceManager.address);

    // Deploy BatchNFT
    const BatchNFTFactory = new ethers.ContractFactory(
      contracts.BatchNFT.abi,
      contracts.BatchNFT.bytecode,
      wallet
    );
    const batchNFT = await BatchNFTFactory.deploy();
    await batchNFT.deployed();
    console.log('BatchNFT deployed to:', batchNFT.address);

    // Save addresses
    const addresses = {
      PharbitCore: pharbitCore.address,
      ComplianceManager: complianceManager.address,
      BatchNFT: batchNFT.address
    };

    console.log('Deployment complete! Contract addresses:', addresses);
    return addresses;
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy().then(() => process.exit(0));