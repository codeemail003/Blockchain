const { writeFileSync, mkdirSync, copyFileSync, readFileSync, existsSync } = require('fs');
const { dirname } = require('path');

// Utility function to ensure directory exists
function ensureDir(p) { 
    try { 
        mkdirSync(p, { recursive: true }); 
    } catch (e) {
        // Directory already exists or other error, ignore
    } 
}

// Function to copy contract ABIs to frontend
function copyContractABIs() {
    console.log("📋 Copying contract ABIs to frontend...");
    
    const root = process.cwd();
    const abiSrc = `${root}/artifacts/contracts`;
    const abiDest = `${root}/frontend/src/contracts`;
    
    ensureDir(abiDest);
    
    const contracts = [
        { name: "PharbitGovernance", file: "PharbitGovernance.sol/PharbitGovernance.json" },
        { name: "PharbitStakeholder", file: "PharbitStakeholder.sol/PharbitStakeholder.json" },
        { name: "PharbitSensor", file: "PharbitSensor.sol/PharbitSensor.json" },
        { name: "PharbitBatch", file: "PharbitBatch.sol/PharbitBatch.json" },
        { name: "PharbitSupplyChain", file: "PharbitSupplyChain.sol/PharbitSupplyChain.json" }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const contract of contracts) {
        const src = `${abiSrc}/${contract.file}`;
        const dest = `${abiDest}/${contract.name}.json`;
        
        try {
            if (existsSync(src)) {
                ensureDir(dirname(dest));
                copyFileSync(src, dest);
                console.log(`✅ Copied ABI: ${contract.name}.json`);
                successCount++;
            } else {
                console.log(`⚠️  ABI file not found: ${src}`);
                failCount++;
            }
        } catch (e) {
            console.log(`❌ Failed to copy ABI for ${contract.name}: ${e.message}`);
            failCount++;
        }
    }

    console.log(`\n📊 ABI Copy Summary: ${successCount} successful, ${failCount} failed`);
    return { successCount, failCount };
}

// Function to create consolidated addresses file
function createConsolidatedAddresses() {
    console.log("📋 Creating consolidated addresses file...");
    
    const deploymentsDir = `${process.cwd()}/deployments`;
    const localhostFile = `${deploymentsDir}/addresses.localhost.json`;
    const localFile = `${deploymentsDir}/addresses.local.json`;
    
    let addresses = null;
    
    // Try to read localhost addresses first, then local
    if (existsSync(localhostFile)) {
        try {
            addresses = JSON.parse(readFileSync(localhostFile, 'utf8'));
            console.log("✅ Loaded addresses from localhost deployment");
        } catch (e) {
            console.log(`⚠️  Failed to read localhost addresses: ${e.message}`);
        }
    } else if (existsSync(localFile)) {
        try {
            addresses = JSON.parse(readFileSync(localFile, 'utf8'));
            console.log("✅ Loaded addresses from local deployment");
        } catch (e) {
            console.log(`⚠️  Failed to read local addresses: ${e.message}`);
        }
    }

    if (!addresses) {
        console.log("⚠️  No deployment addresses found. Run deployment first.");
        return false;
    }

    // Create a simplified addresses file for frontend use
    const frontendAddresses = {
        network: addresses.network || "localhost",
        deployer: addresses.deployer,
        timestamp: addresses.timestamp,
        contracts: addresses.contracts || {}
    };

    // Save to frontend directory
    const frontendDir = `${process.cwd()}/frontend/src`;
    ensureDir(frontendDir);
    
    const frontendAddressesPath = `${frontendDir}/contract-addresses.json`;
    writeFileSync(frontendAddressesPath, JSON.stringify(frontendAddresses, null, 2));
    console.log(`✅ Saved frontend addresses to: ${frontendAddressesPath}`);

    // Also save to root for easy access
    const rootAddressesPath = `${process.cwd()}/contract-addresses.json`;
    writeFileSync(rootAddressesPath, JSON.stringify(frontendAddresses, null, 2));
    console.log(`✅ Saved root addresses to: ${rootAddressesPath}`);

    return true;
}

// Function to display current deployment status
function displayDeploymentStatus() {
    console.log("\n📊 Current Deployment Status:");
    console.log("=" * 40);
    
    const deploymentsDir = `${process.cwd()}/deployments`;
    const localhostFile = `${deploymentsDir}/addresses.localhost.json`;
    const localFile = `${deploymentsDir}/addresses.local.json`;
    
    if (existsSync(localhostFile)) {
        try {
            const addresses = JSON.parse(readFileSync(localhostFile, 'utf8'));
            console.log(`Network: ${addresses.network}`);
            console.log(`Deployer: ${addresses.deployer}`);
            console.log(`Timestamp: ${addresses.timestamp}`);
            console.log("\nContract Addresses:");
            
            if (addresses.contracts) {
                Object.entries(addresses.contracts).forEach(([name, address]) => {
                    console.log(`  ${name}: ${address}`);
                });
            }
        } catch (e) {
            console.log("❌ Failed to read deployment addresses");
        }
    } else if (existsSync(localFile)) {
        console.log("📋 Found local deployment addresses");
    } else {
        console.log("⚠️  No deployment addresses found");
    }
    
    console.log("=" * 40);
}

// Main function
function main() {
    console.log("📤 Exporting Contract Addresses and ABIs");
    console.log("========================================");
    
    try {
        // Copy ABIs
        const abiResult = copyContractABIs();
        
        // Create consolidated addresses
        const addressesResult = createConsolidatedAddresses();
        
        // Display status
        displayDeploymentStatus();
        
        console.log("\n🎉 Export completed successfully!");
        
        if (abiResult.failCount > 0) {
            console.log(`⚠️  ${abiResult.failCount} ABI files failed to copy. Make sure contracts are compiled.`);
        }
        
        if (!addressesResult) {
            console.log("⚠️  No deployment addresses found. Run deployment first.");
        }
        
    } catch (error) {
        console.error("❌ Export failed:", error);
        process.exit(1);
    }
}

// Execute export
main();