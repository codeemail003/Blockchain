const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting Pharmaceutical Supply Chain Contract Deployment...\n");

    // Get the contract factories
    const PharmaceuticalBatch = await ethers.getContractFactory("PharmaceuticalBatch");
    const BatchNFT = await ethers.getContractFactory("BatchNFT");
    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // Deploy PharmaceuticalBatch contract
    console.log("📦 Deploying PharmaceuticalBatch contract...");
    const pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
    await pharmaceuticalBatch.waitForDeployment();
    const pharmaceuticalBatchAddress = await pharmaceuticalBatch.getAddress();
    console.log("✅ PharmaceuticalBatch deployed to:", pharmaceuticalBatchAddress);

    // Deploy BatchNFT contract
    console.log("🎨 Deploying BatchNFT contract...");
    const batchNFT = await BatchNFT.deploy(
        "PharmaBatchNFT",
        "PBNFT",
        pharmaceuticalBatchAddress
    );
    await batchNFT.waitForDeployment();
    const batchNFTAddress = await batchNFT.getAddress();
    console.log("✅ BatchNFT deployed to:", batchNFTAddress);

    // Deploy ComplianceManager contract
    console.log("📋 Deploying ComplianceManager contract...");
    const complianceManager = await ComplianceManager.deploy(pharmaceuticalBatchAddress);
    await complianceManager.waitForDeployment();
    const complianceManagerAddress = await complianceManager.getAddress();
    console.log("✅ ComplianceManager deployed to:", complianceManagerAddress);

    // Setup roles and permissions
    console.log("\n🔐 Setting up roles and permissions...");

    // Grant MINTER_ROLE to BatchNFT contract
    const MINTER_ROLE = await batchNFT.MINTER_ROLE();
    await pharmaceuticalBatch.grantRole(MINTER_ROLE, batchNFTAddress);
    console.log("✅ Granted MINTER_ROLE to BatchNFT contract");

    // Grant AUDITOR_ROLE to ComplianceManager
    const AUDITOR_ROLE = await complianceManager.AUDITOR_ROLE();
    await complianceManager.grantRole(AUDITOR_ROLE, deployer.address);
    console.log("✅ Granted AUDITOR_ROLE to deployer");

    // Grant REGULATOR_ROLE to deployer
    const REGULATOR_ROLE = await complianceManager.REGULATOR_ROLE();
    await complianceManager.grantRole(REGULATOR_ROLE, deployer.address);
    console.log("✅ Granted REGULATOR_ROLE to deployer");

    // Grant COMPLIANCE_OFFICER_ROLE to deployer
    const COMPLIANCE_OFFICER_ROLE = await complianceManager.COMPLIANCE_OFFICER_ROLE();
    await complianceManager.grantRole(COMPLIANCE_OFFICER_ROLE, deployer.address);
    console.log("✅ Granted COMPLIANCE_OFFICER_ROLE to deployer");

    // Grant QUALITY_MANAGER_ROLE to deployer
    const QUALITY_MANAGER_ROLE = await complianceManager.QUALITY_MANAGER_ROLE();
    await complianceManager.grantRole(QUALITY_MANAGER_ROLE, deployer.address);
    console.log("✅ Granted QUALITY_MANAGER_ROLE to deployer");

    // Grant MANUFACTURER_ROLE to deployer
    const MANUFACTURER_ROLE = await pharmaceuticalBatch.MANUFACTURER_ROLE();
    await pharmaceuticalBatch.grantRole(MANUFACTURER_ROLE, deployer.address);
    console.log("✅ Granted MANUFACTURER_ROLE to deployer");

    // Grant DISTRIBUTOR_ROLE to deployer
    const DISTRIBUTOR_ROLE = await pharmaceuticalBatch.DISTRIBUTOR_ROLE();
    await pharmaceuticalBatch.grantRole(DISTRIBUTOR_ROLE, deployer.address);
    console.log("✅ Granted DISTRIBUTOR_ROLE to deployer");

    // Grant PHARMACY_ROLE to deployer
    const PHARMACY_ROLE = await pharmaceuticalBatch.PHARMACY_ROLE();
    await pharmaceuticalBatch.grantRole(PHARMACY_ROLE, deployer.address);
    console.log("✅ Granted PHARMACY_ROLE to deployer");

    // Create a sample compliance standard
    console.log("\n📊 Setting up compliance standards...");
    const requirements = [
        "Batch must pass quality control tests",
        "Manufacturing date must be within 30 days",
        "Storage conditions must meet FDA standards",
        "All documentation must be complete"
    ];
    
    await complianceManager.setComplianceStandard(
        "FDA_21_CFR_PART_11",
        "FDA 21 CFR Part 11 Electronic Records and Signatures",
        "1.0",
        true,
        requirements
    );
    console.log("✅ Created FDA 21 CFR Part 11 compliance standard");

    // Create a sample batch for testing
    console.log("\n🧪 Creating sample batch for testing...");
    const currentTime = Math.floor(Date.now() / 1000);
    const manufactureDate = currentTime;
    const expiryDate = currentTime + (365 * 24 * 60 * 60); // 1 year from now

    const metadataKeys = ["storageTemperature", "batchSize", "qualityGrade"];
    const metadataValues = ["2-8°C", "1000 units", "A+"];

    const tx = await pharmaceuticalBatch.createBatch(
        "Aspirin 100mg",
        "ASP-100-2024-001",
        "PharmaCorp Inc.",
        manufactureDate,
        expiryDate,
        1000,
        "SN001-SN1000",
        metadataKeys,
        metadataValues
    );
    await tx.wait();
    console.log("✅ Created sample batch (ID: 1)");

    // Update batch status to IN_PRODUCTION
    await pharmaceuticalBatch.updateBatchStatus(1, 1, "Batch entered production phase");
    console.log("✅ Updated batch status to IN_PRODUCTION");

    // Create compliance check for the sample batch
    console.log("\n🔍 Creating compliance check for sample batch...");
    const evidenceHashes = ["hash1", "hash2", "hash3"];
    const additionalDataKeys = ["temperature", "humidity", "pressure"];
    const additionalDataValues = ["22°C", "45%", "1013 hPa"];

    await complianceManager.addComplianceCheck(
        1, // batchId
        0, // CheckType.QUALITY_CONTROL
        "Initial quality control check for Aspirin batch",
        "All quality parameters within acceptable limits",
        "No corrective actions required",
        evidenceHashes,
        additionalDataKeys,
        additionalDataValues
    );
    console.log("✅ Created compliance check for sample batch");

    // Update compliance status to PASSED
    await complianceManager.updateComplianceStatus(1, 1, true, "Quality control check passed successfully");
    console.log("✅ Updated compliance status to PASSED");

    // Mint NFT for the sample batch
    console.log("\n🎨 Minting NFT for sample batch...");
    const tokenURI = "https://api.pharbitchain.com/metadata/batch/1";
    const nftMetadata = "Aspirin 100mg Batch NFT - High Quality Pharmaceutical Batch";
    const attributesKeys = ["drugName", "batchNumber", "manufacturer", "quantity"];
    const attributesValues = ["Aspirin 100mg", "ASP-100-2024-001", "PharmaCorp Inc.", "1000"];

    await batchNFT.mintBatchNFT(
        deployer.address,
        1, // batchId
        tokenURI,
        nftMetadata,
        attributesKeys,
        attributesValues
    );
    console.log("✅ Minted NFT for sample batch (Token ID: 1)");

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 PHARMACEUTICAL SUPPLY CHAIN DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("📦 PharmaceuticalBatch:", pharmaceuticalBatchAddress);
    console.log("🎨 BatchNFT:", batchNFTAddress);
    console.log("📋 ComplianceManager:", complianceManagerAddress);
    console.log("\n🔐 Roles Setup:");
    console.log("   • Deployer has all necessary roles");
    console.log("   • BatchNFT can mint tokens for batches");
    console.log("   • ComplianceManager can audit batches");
    console.log("\n🧪 Sample Data Created:");
    console.log("   • Sample batch (ID: 1) - Aspirin 100mg");
    console.log("   • Compliance check (ID: 1) - Quality Control");
    console.log("   • NFT (Token ID: 1) - Linked to batch");
    console.log("   • FDA 21 CFR Part 11 compliance standard");
    console.log("\n🚀 Ready for production use!");
    console.log("=".repeat(60));

    // Save deployment info to file
    const deploymentInfo = {
        network: await ethers.provider.getNetwork(),
        contracts: {
            PharmaceuticalBatch: {
                address: pharmaceuticalBatchAddress,
                abi: PharmaceuticalBatch.interface.format("json")
            },
            BatchNFT: {
                address: batchNFTAddress,
                abi: BatchNFT.interface.format("json")
            },
            ComplianceManager: {
                address: complianceManagerAddress,
                abi: ComplianceManager.interface.format("json")
            }
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        sampleData: {
            batchId: 1,
            tokenId: 1,
            complianceRecordId: 1
        }
    };

    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'pharma-contracts.json');
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });