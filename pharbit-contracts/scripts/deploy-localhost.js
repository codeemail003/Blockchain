const hre = require("hardhat");
const { writeFileSync, mkdirSync, copyFileSync } = require("fs");
const { dirname } = require("path");

function ensureDir(p) { 
    try { 
        mkdirSync(p, { recursive: true }); 
    } catch (e) {
        // Directory already exists or other error, ignore
    } 
}

async function main() {
    console.log("🚀 Starting deployment to localhost...");
    
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    try {
        // Deploy PharbitGovernance first (needed by others)
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
        console.log(`✅ PharbitGovernance deployed to: ${governanceAddress}`);

        // Deploy PharbitStakeholder
        console.log("\n👥 Deploying PharbitStakeholder...");
        const PharbitStakeholder = await hre.ethers.getContractFactory("PharbitStakeholder");
        const stakeholder = await PharbitStakeholder.deploy(deployer.address);
        await stakeholder.waitForDeployment();
        const stakeholderAddress = await stakeholder.getAddress();
        console.log(`✅ PharbitStakeholder deployed to: ${stakeholderAddress}`);

        // Deploy PharbitSensor
        console.log("\n📡 Deploying PharbitSensor...");
        const PharbitSensor = await hre.ethers.getContractFactory("PharbitSensor");
        const sensor = await PharbitSensor.deploy(deployer.address);
        await sensor.waitForDeployment();
        const sensorAddress = await sensor.getAddress();
        console.log(`✅ PharbitSensor deployed to: ${sensorAddress}`);

        // Deploy PharbitBatch
        console.log("\n📦 Deploying PharbitBatch...");
        const PharbitBatch = await hre.ethers.getContractFactory("PharbitBatch");
        const batch = await PharbitBatch.deploy(stakeholderAddress, deployer.address);
        await batch.waitForDeployment();
        const batchAddress = await batch.getAddress();
        console.log(`✅ PharbitBatch deployed to: ${batchAddress}`);

        // Deploy PharbitSupplyChain
        console.log("\n🔗 Deploying PharbitSupplyChain...");
        const PharbitSupplyChain = await hre.ethers.getContractFactory("PharbitSupplyChain");
        const supplyChain = await PharbitSupplyChain.deploy(batchAddress, stakeholderAddress);
        await supplyChain.waitForDeployment();
        const supplyChainAddress = await supplyChain.getAddress();
        console.log(`✅ PharbitSupplyChain deployed to: ${supplyChainAddress}`);

        // Prepare deployment output
        const deploymentData = {
            network: "localhost",
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                governance: governanceAddress,
                stakeholder: stakeholderAddress,
                sensor: sensorAddress,
                batch: batchAddress,
                supplyChain: supplyChainAddress
            }
        };

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

        // Copy ABIs to frontend
        console.log("\n📋 Copying ABIs to frontend...");
        const abiSrc = `${process.cwd()}/artifacts/contracts`;
        const abiDest = `${process.cwd()}/frontend/src/contracts`;
        ensureDir(abiDest);

        const contracts = [
            { name: "PharbitGovernance", file: "PharbitGovernance.sol/PharbitGovernance.json" },
            { name: "PharbitStakeholder", file: "PharbitStakeholder.sol/PharbitStakeholder.json" },
            { name: "PharbitSensor", file: "PharbitSensor.sol/PharbitSensor.json" },
            { name: "PharbitBatch", file: "PharbitBatch.sol/PharbitBatch.json" },
            { name: "PharbitSupplyChain", file: "PharbitSupplyChain.sol/PharbitSupplyChain.json" }
        ];

        for (const contract of contracts) {
            const src = `${abiSrc}/${contract.file}`;
            const dest = `${abiDest}/${contract.name}.json`;
            try {
                ensureDir(dirname(dest));
                copyFileSync(src, dest);
                console.log(`✅ Copied ABI: ${contract.name}.json`);
            } catch (e) {
                console.warn(`⚠️  ABI copy failed for ${contract.name}: ${e.message}`);
            }
        }

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