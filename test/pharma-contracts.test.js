const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pharmaceutical Supply Chain Contracts", function () {
    let pharmaceuticalBatch;
    let batchNFT;
    let complianceManager;
    let owner;
    let manufacturer;
    let distributor;
    let pharmacy;
    let auditor;
    let regulator;

    const BATCH_DATA = {
        drugName: "Aspirin 100mg",
        drugCode: "ASP-100-2024-001",
        manufacturer: "PharmaCorp Inc.",
        manufactureDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        quantity: 1000,
        serialNumbers: "SN001-SN1000",
        metadataKeys: ["storageTemperature", "batchSize", "qualityGrade"],
        metadataValues: ["2-8°C", "1000 units", "A+"]
    };

    beforeEach(async function () {
        [owner, manufacturer, distributor, pharmacy, auditor, regulator] = await ethers.getSigners();

        // Deploy PharmaceuticalBatch
        const PharmaceuticalBatch = await ethers.getContractFactory("PharmaceuticalBatch");
        pharmaceuticalBatch = await PharmaceuticalBatch.deploy();
        await pharmaceuticalBatch.waitForDeployment();

        // Deploy BatchNFT
        const BatchNFT = await ethers.getContractFactory("BatchNFT");
        batchNFT = await BatchNFT.deploy(
            "PharmaBatchNFT",
            "PBNFT",
            await pharmaceuticalBatch.getAddress()
        );
        await batchNFT.waitForDeployment();

        // Deploy ComplianceManager
        const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
        complianceManager = await ComplianceManager.deploy(await pharmaceuticalBatch.getAddress());
        await complianceManager.waitForDeployment();

        // Setup roles
        const MANUFACTURER_ROLE = await pharmaceuticalBatch.MANUFACTURER_ROLE();
        const DISTRIBUTOR_ROLE = await pharmaceuticalBatch.DISTRIBUTOR_ROLE();
        const PHARMACY_ROLE = await pharmaceuticalBatch.PHARMACY_ROLE();
        const AUDITOR_ROLE = await complianceManager.AUDITOR_ROLE();
        const REGULATOR_ROLE = await complianceManager.REGULATOR_ROLE();

        await pharmaceuticalBatch.grantRole(MANUFACTURER_ROLE, manufacturer.address);
        await pharmaceuticalBatch.grantRole(DISTRIBUTOR_ROLE, distributor.address);
        await pharmaceuticalBatch.grantRole(PHARMACY_ROLE, pharmacy.address);
        await complianceManager.grantRole(AUDITOR_ROLE, auditor.address);
        await complianceManager.grantRole(REGULATOR_ROLE, regulator.address);
    });

    describe("PharmaceuticalBatch Contract", function () {
        it("Should create a batch successfully", async function () {
            const tx = await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            await expect(tx)
                .to.emit(pharmaceuticalBatch, "BatchCreated")
                .withArgs(
                    1,
                    BATCH_DATA.drugName,
                    BATCH_DATA.drugCode,
                    BATCH_DATA.manufacturer,
                    BATCH_DATA.quantity,
                    BATCH_DATA.manufactureDate,
                    BATCH_DATA.expiryDate,
                    manufacturer.address
                );

            const batch = await pharmaceuticalBatch.getBatch(1);
            expect(batch.batchId).to.equal(1);
            expect(batch.drugName).to.equal(BATCH_DATA.drugName);
            expect(batch.currentOwner).to.equal(manufacturer.address);
        });

        it("Should transfer batch ownership", async function () {
            // Create batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            const tx = await pharmaceuticalBatch.connect(manufacturer).transferBatch(
                1,
                distributor.address,
                "Transfer to distributor",
                "Warehouse A",
                "Standard transfer"
            );

            await expect(tx)
                .to.emit(pharmaceuticalBatch, "BatchTransferred")
                .withArgs(1, manufacturer.address, distributor.address, "Transfer to distributor", "Warehouse A", "Standard transfer");

            const batch = await pharmaceuticalBatch.getBatch(1);
            expect(batch.currentOwner).to.equal(distributor.address);
        });

        it("Should update batch status", async function () {
            // Create batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            const tx = await pharmaceuticalBatch.connect(manufacturer).updateBatchStatus(
                1,
                1, // IN_PRODUCTION
                "Batch entered production phase"
            );

            await expect(tx)
                .to.emit(pharmaceuticalBatch, "BatchStatusUpdated")
                .withArgs(1, 0, 1, manufacturer.address, "Batch entered production phase");

            const batch = await pharmaceuticalBatch.getBatch(1);
            expect(batch.status).to.equal(1); // IN_PRODUCTION
        });

        it("Should not allow unauthorized batch creation", async function () {
            await expect(
                pharmaceuticalBatch.connect(distributor).createBatch(
                    BATCH_DATA.drugName,
                    BATCH_DATA.drugCode,
                    BATCH_DATA.manufacturer,
                    BATCH_DATA.manufactureDate,
                    BATCH_DATA.expiryDate,
                    BATCH_DATA.quantity,
                    BATCH_DATA.serialNumbers,
                    BATCH_DATA.metadataKeys,
                    BATCH_DATA.metadataValues
                )
            ).to.be.revertedWith("AccessControl: account " + distributor.address.toLowerCase() + " is missing role " + await pharmaceuticalBatch.MANUFACTURER_ROLE());
        });

        it("Should not allow transfer to same address", async function () {
            // Create batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            await expect(
                pharmaceuticalBatch.connect(manufacturer).transferBatch(
                    1,
                    manufacturer.address,
                    "Invalid transfer",
                    "Same location",
                    "Should fail"
                )
            ).to.be.revertedWith("Cannot transfer to self");
        });
    });

    describe("BatchNFT Contract", function () {
        beforeEach(async function () {
            // Create a batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );
        });

        it("Should mint NFT for batch", async function () {
            const tokenURI = "https://api.pharbitchain.com/metadata/batch/1";
            const metadata = "Aspirin 100mg Batch NFT";
            const attributesKeys = ["drugName", "batchNumber"];
            const attributesValues = ["Aspirin 100mg", "ASP-100-2024-001"];

            const tx = await batchNFT.connect(manufacturer).mintBatchNFT(
                manufacturer.address,
                1, // batchId
                tokenURI,
                metadata,
                attributesKeys,
                attributesValues
            );

            await expect(tx)
                .to.emit(batchNFT, "BatchNFTMinted")
                .withArgs(1, 1, BATCH_DATA.drugName, BATCH_DATA.drugCode, manufacturer.address);

            expect(await batchNFT.ownerOf(1)).to.equal(manufacturer.address);
            expect(await batchNFT.getBatchFromToken(1)).to.equal(1);
            expect(await batchNFT.getTokenFromBatch(1)).to.equal(1);
        });

        it("Should not allow minting for non-existent batch", async function () {
            const tokenURI = "https://api.pharbitchain.com/metadata/batch/999";
            const metadata = "Non-existent batch NFT";
            const attributesKeys = ["drugName"];
            const attributesValues = ["Unknown"];

            await expect(
                batchNFT.connect(manufacturer).mintBatchNFT(
                    manufacturer.address,
                    999, // Non-existent batchId
                    tokenURI,
                    metadata,
                    attributesKeys,
                    attributesValues
                )
            ).to.be.revertedWith("Batch does not exist");
        });

        it("Should not allow minting for already tokenized batch", async function () {
            const tokenURI = "https://api.pharbitchain.com/metadata/batch/1";
            const metadata = "Aspirin 100mg Batch NFT";
            const attributesKeys = ["drugName"];
            const attributesValues = ["Aspirin 100mg"];

            // First mint
            await batchNFT.connect(manufacturer).mintBatchNFT(
                manufacturer.address,
                1,
                tokenURI,
                metadata,
                attributesKeys,
                attributesValues
            );

            // Second mint should fail
            await expect(
                batchNFT.connect(manufacturer).mintBatchNFT(
                    manufacturer.address,
                    1,
                    tokenURI,
                    metadata,
                    attributesKeys,
                    attributesValues
                )
            ).to.be.revertedWith("Batch already tokenized");
        });

        it("Should burn NFT", async function () {
            // Mint NFT first
            const tokenURI = "https://api.pharbitchain.com/metadata/batch/1";
            const metadata = "Aspirin 100mg Batch NFT";
            const attributesKeys = ["drugName"];
            const attributesValues = ["Aspirin 100mg"];

            await batchNFT.connect(manufacturer).mintBatchNFT(
                manufacturer.address,
                1,
                tokenURI,
                metadata,
                attributesKeys,
                attributesValues
            );

            const tx = await batchNFT.connect(manufacturer).burnBatchNFT(1);

            await expect(tx)
                .to.emit(batchNFT, "BatchNFTBurned")
                .withArgs(1, 1, manufacturer.address);

            expect(await batchNFT.isBatchTokenized(1)).to.be.false;
        });
    });

    describe("ComplianceManager Contract", function () {
        beforeEach(async function () {
            // Create a batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );
        });

        it("Should add compliance check", async function () {
            const evidenceHashes = ["hash1", "hash2"];
            const additionalDataKeys = ["temperature", "humidity"];
            const additionalDataValues = ["22°C", "45%"];

            const tx = await complianceManager.connect(auditor).addComplianceCheck(
                1, // batchId
                0, // CheckType.QUALITY_CONTROL
                "Quality control check",
                "All parameters within limits",
                "No actions required",
                evidenceHashes,
                additionalDataKeys,
                additionalDataValues
            );

            await expect(tx)
                .to.emit(complianceManager, "ComplianceRecordCreated")
                .withArgs(1, 1, 0, auditor.address, 0); // PENDING status

            const record = await complianceManager.getComplianceRecord(1);
            expect(record.batchId).to.equal(1);
            expect(record.checkType).to.equal(0); // QUALITY_CONTROL
            expect(record.auditor).to.equal(auditor.address);
        });

        it("Should update compliance status", async function () {
            // Add compliance check first
            await complianceManager.connect(auditor).addComplianceCheck(
                1,
                0,
                "Quality control check",
                "All parameters within limits",
                "No actions required",
                ["hash1"],
                ["temperature"],
                ["22°C"]
            );

            const tx = await complianceManager.connect(auditor).updateComplianceStatus(
                1,
                1, // PASSED
                true,
                "Check passed successfully"
            );

            await expect(tx)
                .to.emit(complianceManager, "ComplianceStatusUpdated")
                .withArgs(1, 0, 1, auditor.address);

            const record = await complianceManager.getComplianceRecord(1);
            expect(record.status).to.equal(1); // PASSED
            expect(record.passed).to.be.true;
        });

        it("Should set compliance standard", async function () {
            const requirements = [
                "Batch must pass quality control tests",
                "Manufacturing date must be within 30 days"
            ];

            const tx = await complianceManager.connect(regulator).setComplianceStandard(
                "FDA_21_CFR_PART_11",
                "FDA 21 CFR Part 11 Electronic Records and Signatures",
                "1.0",
                true,
                requirements
            );

            await expect(tx)
                .to.emit(complianceManager, "ComplianceStandardSet")
                .withArgs("FDA_21_CFR_PART_11", "1.0", true, regulator.address);

            const standard = await complianceManager.getComplianceStandard("FDA_21_CFR_PART_11");
            expect(standard.standardName).to.equal("FDA_21_CFR_PART_11");
            expect(standard.isActive).to.be.true;
        });

        it("Should record audit trail", async function () {
            const evidenceHashes = ["audit_hash1", "audit_hash2"];

            const tx = await complianceManager.connect(auditor).recordAuditTrail(
                1, // batchId
                0, // CheckType.QUALITY_CONTROL
                "Audit findings",
                "Recommendations",
                1, // PASSED
                evidenceHashes
            );

            await expect(tx)
                .to.emit(complianceManager, "AuditTrailRecorded")
                .withArgs(1, 1, auditor.address, 0, 1);

            const audit = await complianceManager.getAuditTrail(1);
            expect(audit.batchId).to.equal(1);
            expect(audit.auditor).to.equal(auditor.address);
            expect(audit.result).to.equal(1); // PASSED
        });

        it("Should not allow unauthorized compliance check", async function () {
            await expect(
                complianceManager.connect(manufacturer).addComplianceCheck(
                    1,
                    0,
                    "Unauthorized check",
                    "Findings",
                    "Actions",
                    ["hash1"],
                    ["key1"],
                    ["value1"]
                )
            ).to.be.revertedWith("Unauthorized role");
        });
    });

    describe("Integration Tests", function () {
        it("Should complete full pharmaceutical supply chain workflow", async function () {
            // 1. Create batch
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            // 2. Update batch status to IN_PRODUCTION
            await pharmaceuticalBatch.connect(manufacturer).updateBatchStatus(1, 1, "Production started");

            // 3. Add compliance check
            await complianceManager.connect(auditor).addComplianceCheck(
                1,
                0,
                "Quality control check",
                "All parameters within limits",
                "No actions required",
                ["hash1"],
                ["temperature"],
                ["22°C"]
            );

            // 4. Update compliance status to PASSED
            await complianceManager.connect(auditor).updateComplianceStatus(1, 1, true, "Check passed");

            // 5. Update batch status to PACKAGED
            await pharmaceuticalBatch.connect(manufacturer).updateBatchStatus(1, 3, "Batch packaged");

            // 6. Transfer to distributor
            await pharmaceuticalBatch.connect(manufacturer).transferBatch(
                1,
                distributor.address,
                "Transfer to distributor",
                "Warehouse A",
                "Standard transfer"
            );

            // 7. Mint NFT for the batch
            await batchNFT.connect(manufacturer).mintBatchNFT(
                manufacturer.address,
                1,
                "https://api.pharbitchain.com/metadata/batch/1",
                "Aspirin 100mg Batch NFT",
                ["drugName"],
                ["Aspirin 100mg"]
            );

            // 8. Transfer NFT to distributor
            await batchNFT.connect(manufacturer).transferFrom(manufacturer.address, distributor.address, 1);

            // Verify final state
            const batch = await pharmaceuticalBatch.getBatch(1);
            expect(batch.currentOwner).to.equal(distributor.address);
            expect(batch.status).to.equal(3); // PACKAGED

            const isCompliant = await complianceManager.isBatchCompliant(1);
            expect(isCompliant).to.be.true;

            const nftOwner = await batchNFT.ownerOf(1);
            expect(nftOwner).to.equal(distributor.address);
        });
    });

    describe("Error Handling", function () {
        it("Should handle invalid batch operations", async function () {
            await expect(pharmaceuticalBatch.getBatch(999)).to.be.revertedWith("Batch does not exist");
            await expect(complianceManager.getComplianceRecord(999)).to.be.revertedWith("Record does not exist");
            await expect(batchNFT.getBatchFromToken(999)).to.be.revertedWith("Token does not exist");
        });

        it("Should handle invalid status transitions", async function () {
            // Create batch first
            await pharmaceuticalBatch.connect(manufacturer).createBatch(
                BATCH_DATA.drugName,
                BATCH_DATA.drugCode,
                BATCH_DATA.manufacturer,
                BATCH_DATA.manufactureDate,
                BATCH_DATA.expiryDate,
                BATCH_DATA.quantity,
                BATCH_DATA.serialNumbers,
                BATCH_DATA.metadataKeys,
                BATCH_DATA.metadataValues
            );

            // Try invalid status transition
            await expect(
                pharmaceuticalBatch.connect(manufacturer).updateBatchStatus(1, 10, "Invalid status")
            ).to.be.revertedWith("Invalid status transition");
        });
    });
});