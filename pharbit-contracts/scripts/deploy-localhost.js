const hre = require("hardhat");
const { writeFileSync, mkdirSync } = require("fs");
const { dirname } = require("path");

// Utility function to ensure directory exists
function ensureDir(p) { 
    try { 
        mkdirSync(p, { recursive: true }); 
    } catch (e) {
        // Directory already exists or other error, ignore
    } 
}

async function main() {
    console.log("🚀 Starting Pharbit Contracts Deployment to Localhost");
    console.log("=====================================================");
    
    try {
        // Get the deployer account
        const [deployer] = await hre.ethers.getSigners();
        console.log("📋 Deploying contracts with account:", deployer.address);
        
        // Check account balance
        const balance = await hre.ethers.provider.getBalance(deployer.address);
        console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
        
        if (balance === 0n) {
            console.log("⚠️  Warning: Account has no ETH. Make sure Hardhat node is running with funded accounts.");
        }

        const deploymentData = {
            network: "localhost",
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {}
        };

        // Deploy PharbitGovernance first
        console.log("\n📋 Deploying PharbitGovernance...");
        const PharbitGovernance = await hre.ethers.getContractFactory("PharbitGovernance");
        const governance = await PharbitGovernance.deploy(
            deployer.address, // admin
            20,               // proposalThreshold
            80,               // quorumThreshold (80%)
            3600              // votingPeriod (1 hour)
        );
        await governance.waitForDeployment();
        const governanceAddress = await governance.getAddress();
        deploymentData.contracts.governance = governanceAddress;
        console.log(`✅ PharbitGovernance deployed to: ${governanceAddress}`);

        // Deploy PharbitStakeholder
        console.log("\n👥 Deploying PharbitStakeholder...");
        const PharbitStakeholder = await hre.ethers.getContractFactory("PharbitStakeholder");
        const stakeholder = await PharbitStakeholder.deploy(deployer.address);
        await stakeholder.waitForDeployment();
        const stakeholderAddress = await stakeholder.getAddress();
        deploymentData.contracts.stakeholder = stakeholderAddress;
        console.log(`✅ PharbitStakeholder deployed to: ${stakeholderAddress}`);

        // Deploy PharbitSensor
        console.log("\n📡 Deploying PharbitSensor...");
        const PharbitSensor = await hre.ethers.getContractFactory("PharbitSensor");
        const sensor = await PharbitSensor.deploy(deployer.address);
        await sensor.waitForDeployment();
        const sensorAddress = await sensor.getAddress();
        deploymentData.contracts.sensor = sensorAddress;
        console.log(`✅ PharbitSensor deployed to: ${sensorAddress}`);

        // Deploy PharbitBatch
        console.log("\n📦 Deploying PharbitBatch...");
        const PharbitBatch = await hre.ethers.getContractFactory("PharbitBatch");
        const batch = await PharbitBatch.deploy(stakeholderAddress, deployer.address);
        await batch.waitForDeployment();
        const batchAddress = await batch.getAddress();
        deploymentData.contracts.batch = batchAddress;
        console.log(`✅ PharbitBatch deployed to: ${batchAddress}`);

        // Deploy PharbitSupplyChain
        console.log("\n🔗 Deploying PharbitSupplyChain...");
        const PharbitSupplyChain = await hre.ethers.getContractFactory("PharbitSupplyChain");
        const supplyChain = await PharbitSupplyChain.deploy(batchAddress, stakeholderAddress);
        await supplyChain.waitForDeployment();
        const supplyChainAddress = await supplyChain.getAddress();
        deploymentData.contracts.supplyChain = supplyChainAddress;
        console.log(`✅ PharbitSupplyChain deployed to: ${supplyChainAddress}`);

        // Save addresses to deployments directory
        const deploymentsDir = `${process.cwd()}/deployments`;
        ensureDir(deploymentsDir);
        
        const addressesPath = `${deploymentsDir}/addresses.localhost.json`;
        writeFileSync(addressesPath, JSON.stringify(deploymentData, null, 2));
        console.log(`\n💾 Saved addresses to ${addressesPath}`);

        // Also save as local.json for compatibility
        const localPath = `${deploymentsDir}/addresses.local.json`;
        writeFileSync(localPath, JSON.stringify(deploymentData, null, 2));
        console.log(`💾 Saved addresses to ${localPath}`);

        // Display deployment summary
        console.log("\n🎉 Deployment completed successfully!");
        console.log("\n📊 Deployment Summary:");
        console.log("=" * 50);
        console.log(`Network: ${deploymentData.network}`);
        console.log(`Deployer: ${deploymentData.deployer}`);
        console.log(`Timestamp: ${deploymentData.timestamp}`);
        console.log("\nContract Addresses:");
        console.log(`  Governance:    ${governanceAddress}`);
        console.log(`  Stakeholder:   ${stakeholderAddress}`);
        console.log(`  Sensor:        ${sensorAddress}`);
        console.log(`  Batch:         ${batchAddress}`);
        console.log(`  SupplyChain:   ${supplyChainAddress}`);
        console.log("=" * 50);

        return deploymentData;

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

// Execute deployment
main()
    .then(() => {
        console.log("\n✅ Deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment script failed:", error);
        process.exit(1);
    });