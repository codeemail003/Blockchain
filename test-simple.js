const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting PharbitChain Simple Test...\n");

    // Get the contract factory
    const PharbitCore = await ethers.getContractFactory("PharbitCoreSimple");
    console.log("✅ Contract factory loaded");

    // Deploy the contract
    console.log("📦 Deploying PharbitCore contract...");
    const pharbitCore = await PharbitCore.deploy();
    await pharbitCore.waitForDeployment();
    
    const contractAddress = await pharbitCore.getAddress();
    console.log(`✅ PharbitCore deployed to: ${contractAddress}`);

    // Get the deployer address
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer address: ${deployer.address}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Check if deployer has admin role
    const hasAdminRole = await pharbitCore.hasRole(await pharbitCore.ADMIN_ROLE(), deployer.address);
    console.log(`✅ Deployer has admin role: ${hasAdminRole}`);

    // Check if deployer has manufacturer role
    const hasManufacturerRole = await pharbitCore.hasRole(await pharbitCore.MANUFACTURER_ROLE(), deployer.address);
    console.log(`✅ Deployer has manufacturer role: ${hasManufacturerRole}`);

    // Grant manufacturer role to deployer
    console.log("🔐 Granting manufacturer role to deployer...");
    const grantTx = await pharbitCore.grantRole(await pharbitCore.MANUFACTURER_ROLE(), deployer.address);
    await grantTx.wait();
    console.log("✅ Manufacturer role granted");

    // Create a test batch
    console.log("\n💊 Creating test batch...");
    const createBatchTx = await pharbitCore.createBatch(
        "Aspirin 100mg",
        "ASP-100-001",
        "PharmaCorp Inc.",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
        "BATCH-001-2024",
        "SN001,SN002,SN003",
        ["temperature", "humidity", "quality_grade"],
        ["20°C", "45%", "A+"]
    );
    await createBatchTx.wait();
    console.log("✅ Test batch created");

    // Get batch information
    console.log("\n📋 Retrieving batch information...");
    const batchInfo = await pharbitCore.getBatch(1);
    console.log("Batch Details:");
    console.log(`  - ID: ${batchInfo[0]}`);
    console.log(`  - Drug Name: ${batchInfo[1]}`);
    console.log(`  - Drug Code: ${batchInfo[2]}`);
    console.log(`  - Manufacturer: ${batchInfo[3]}`);
    console.log(`  - Quantity: ${batchInfo[4]}`);
    console.log(`  - Batch Number: ${batchInfo[7]}`);
    console.log(`  - Current Owner: ${batchInfo[9]}`);
    console.log(`  - Status: ${batchInfo[10]}`);

    // Get total batches
    const totalBatches = await pharbitCore.getTotalBatches();
    console.log(`\n📊 Total batches: ${totalBatches}`);

    // Get user batches
    const userBatches = await pharbitCore.getUserBatches(deployer.address);
    console.log(`📦 User batches: ${userBatches.length}`);

    // Test status update
    console.log("\n🔄 Testing status update...");
    const updateStatusTx = await pharbitCore.updateBatchStatus(
        1,
        1, // IN_TRANSIT
        "Batch ready for shipment"
    );
    await updateStatusTx.wait();
    console.log("✅ Batch status updated to IN_TRANSIT");

    // Get updated batch info
    const updatedBatchInfo = await pharbitCore.getBatch(1);
    console.log(`📋 Updated status: ${updatedBatchInfo[10]}`);

    // Test emergency pause
    console.log("\n🚨 Testing emergency pause...");
    const pauseTx = await pharbitCore.emergencyPause();
    await pauseTx.wait();
    console.log("✅ Contract paused for emergency");

    // Test emergency unpause
    console.log("🔄 Testing emergency unpause...");
    const unpauseTx = await pharbitCore.emergencyUnpause();
    await unpauseTx.wait();
    console.log("✅ Contract unpaused");

    console.log("\n🎉 All tests completed successfully!");
    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💊 Test Batch ID: 1`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });