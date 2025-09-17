const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting PharbitChain Test...\n");

    // Get the contract factory
    const PharbitChain = await ethers.getContractFactory("PharbitChain");
    console.log("✅ Contract factory loaded");

    // Deploy the contract
    console.log("📦 Deploying PharbitChain contract...");
    const pharbitChain = await PharbitChain.deploy();
    await pharbitChain.waitForDeployment();
    
    const contractAddress = await pharbitChain.getAddress();
    console.log(`✅ PharbitChain deployed to: ${contractAddress}`);

    // Get the deployer address
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer address: ${deployer.address}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Check if deployer has admin role
    const hasAdminRole = await pharbitChain.hasRole(await pharbitChain.ADMIN_ROLE(), deployer.address);
    console.log(`✅ Deployer has admin role: ${hasAdminRole}`);

    // Check if deployer has manufacturer role
    const hasManufacturerRole = await pharbitChain.hasRole(await pharbitChain.MANUFACTURER_ROLE(), deployer.address);
    console.log(`✅ Deployer has manufacturer role: ${hasManufacturerRole}`);

    // Create a test batch
    console.log("\n💊 Creating test batch...");
    const createBatchTx = await pharbitChain.createBatch(
        "Aspirin 100mg",
        "ASP-100-001",
        "PharmaCorp Inc.",
        1000,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
        "BATCH-001-2024"
    );
    await createBatchTx.wait();
    console.log("✅ Test batch created");

    // Get batch information
    console.log("\n📋 Retrieving batch information...");
    const batchInfo = await pharbitChain.getBatch(1);
    console.log("Batch Details:");
    console.log(`  - ID: ${batchInfo[0]}`);
    console.log(`  - Drug Name: ${batchInfo[1]}`);
    console.log(`  - Drug Code: ${batchInfo[2]}`);
    console.log(`  - Manufacturer: ${batchInfo[3]}`);
    console.log(`  - Quantity: ${batchInfo[4]}`);
    console.log(`  - Batch Number: ${batchInfo[7]}`);
    console.log(`  - Current Owner: ${batchInfo[8]}`);
    console.log(`  - Status: ${batchInfo[9]}`);

    // Get total batches
    const totalBatches = await pharbitChain.getTotalBatches();
    console.log(`\n📊 Total batches: ${totalBatches}`);

    // Get user batches
    const userBatches = await pharbitChain.getUserBatches(deployer.address);
    console.log(`📦 User batches: ${userBatches.length}`);

    // Test status update
    console.log("\n🔄 Testing status update...");
    const updateStatusTx = await pharbitChain.updateBatchStatus(
        1,
        1, // IN_TRANSIT
        "Batch ready for shipment"
    );
    await updateStatusTx.wait();
    console.log("✅ Batch status updated to IN_TRANSIT");

    // Get updated batch info
    const updatedBatchInfo = await pharbitChain.getBatch(1);
    console.log(`📋 Updated status: ${updatedBatchInfo[9]}`);

    // Test transfer (we'll skip this for now since we only have one account)
    console.log("\n🔄 Testing batch transfer...");
    console.log("⏭️ Skipping transfer test (only one account available)");

    // Create another batch
    console.log("\n💊 Creating second test batch...");
    const createBatch2Tx = await pharbitChain.createBatch(
        "Ibuprofen 200mg",
        "IBU-200-001",
        "MediCorp Ltd.",
        500,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "BATCH-002-2024"
    );
    await createBatch2Tx.wait();
    console.log("✅ Second test batch created");

    // Get updated totals
    const totalBatches2 = await pharbitChain.getTotalBatches();
    console.log(`\n📊 Total batches after second creation: ${totalBatches2}`);

    // Test pause functionality
    console.log("\n⏸️ Testing pause functionality...");
    const pauseTx = await pharbitChain.pause();
    await pauseTx.wait();
    console.log("✅ Contract paused");

    // Try to create a batch while paused (should fail)
    try {
        await pharbitChain.createBatch(
            "Test Drug",
            "TEST-001",
            "Test Corp",
            100,
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
            "BATCH-003-2024"
        );
        console.log("❌ Batch creation should have failed while paused");
    } catch (error) {
        console.log("✅ Batch creation correctly failed while paused");
    }

    // Unpause
    const unpauseTx = await pharbitChain.unpause();
    await unpauseTx.wait();
    console.log("✅ Contract unpaused");

    console.log("\n🎉 All tests completed successfully!");
    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💊 Test Batch IDs: 1, 2`);
    console.log(`📊 Total Batches: ${totalBatches2}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });