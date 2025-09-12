/**
 * @fileoverview Smart contract deployment script for pharmaceutical blockchain
 * Deploys contracts to various networks (Ethereum, Polygon, BSC, etc.)
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🚀 Starting pharmaceutical smart contract deployment...');

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);

    // Get account balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance), 'ETH');

    // Deploy PharmaceuticalSupplyChain contract
    console.log('\n📋 Deploying PharmaceuticalSupplyChain contract...');
    const PharmaceuticalSupplyChain = await ethers.getContractFactory('PharmaceuticalSupplyChain');
    const pharmaContract = await PharmaceuticalSupplyChain.deploy();
    await pharmaContract.waitForDeployment();

    const pharmaContractAddress = await pharmaContract.getAddress();
    console.log('✅ PharmaceuticalSupplyChain deployed to:', pharmaContractAddress);

    // Get deployment info
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    const gasPrice = await ethers.provider.getGasPrice();

    const deploymentInfo = {
        network: {
            name: network.name,
            chainId: network.chainId.toString(),
            blockNumber: blockNumber
        },
        contracts: {
            PharmaceuticalSupplyChain: {
                address: pharmaContractAddress,
                transactionHash: pharmaContract.deploymentTransaction().hash,
                gasPrice: gasPrice.toString()
            }
        },
        deployer: {
            address: deployer.address,
            balance: ethers.formatEther(balance)
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    };

    // Save deployment info
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to:', deploymentFile);

    // Update contract addresses file
    const addressesFile = path.join(__dirname, '../contract-addresses.json');
    let addresses = {};
    
    if (fs.existsSync(addressesFile)) {
        addresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
    }

    addresses[network.name] = {
        PharmaceuticalSupplyChain: pharmaContractAddress,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
    console.log('📄 Contract addresses updated in:', addressesFile);

    // Verify contract on block explorer (if not localhost)
    if (network.name !== 'localhost' && network.name !== 'hardhat') {
        console.log('\n🔍 Verifying contract on block explorer...');
        try {
            await hre.run('verify:verify', {
                address: pharmaContractAddress,
                constructorArguments: []
            });
            console.log('✅ Contract verified successfully');
        } catch (error) {
            console.log('⚠️ Contract verification failed:', error.message);
        }
    }

    // Setup initial roles and permissions
    console.log('\n🔐 Setting up initial roles and permissions...');
    
    // Grant roles to deployer
    const roles = [
        'MANUFACTURER_ROLE',
        'DISTRIBUTOR_ROLE', 
        'PHARMACY_ROLE',
        'REGULATOR_ROLE',
        'AUDITOR_ROLE'
    ];

    for (const role of roles) {
        const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
        await pharmaContract.grantRole(roleHash, deployer.address);
        console.log(`✅ Granted ${role} to deployer`);
    }

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Contract Information:');
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   PharmaceuticalSupplyChain: ${pharmaContractAddress}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Block Number: ${blockNumber}`);
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Update your frontend with the new contract address');
    console.log('   2. Configure MetaMask to use the correct network');
    console.log('   3. Test the contract functions');
    console.log('   4. Deploy to production network when ready');

    return {
        pharmaContract,
        pharmaContractAddress,
        deploymentInfo
    };
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });