const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ComplianceManager", function () {
  async function deployComplianceManagerFixture() {
    const [owner, inspector, fda, auditor] = await ethers.getSigners();

    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    const complianceManager = await ComplianceManager.deploy();

    // Grant roles
    await complianceManager.grantRole(complianceManager.INSPECTOR_ROLE(), inspector.address);
    await complianceManager.grantRole(complianceManager.FDA_ROLE(), fda.address);
    await complianceManager.grantRole(complianceManager.AUDITOR_ROLE(), auditor.address);

    return { complianceManager, owner, inspector, fda, auditor };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);
      expect(await complianceManager.hasRole(complianceManager.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with zero records", async function () {
      const { complianceManager } = await loadFixture(deployComplianceManagerFixture);
      // This would require a getter function for total records
      // expect(await complianceManager.getTotalRecords()).to.equal(0);
    });
  });

  describe("Compliance Record Management", function () {
    it("Should create compliance record successfully", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(inspector).createComplianceRecord(
        1, // batchId
        "FDA_21_CFR_PART_11", // complianceType
        true, // isCompliant
        "CERT001", // certificate
        "All tests passed", // findings
        "No action required" // correctiveActions
      )).to.emit(complianceManager, "ComplianceRecordCreated");

      // Verify batch compliance status
      expect(await complianceManager.isBatchCompliant(1)).to.be.true;
    });

    it("Should fail to create compliance record with empty compliance type", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(inspector).createComplianceRecord(
        1,
        "", // Empty compliance type
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      )).to.be.revertedWith("Compliance type required");
    });

    it("Should fail to create compliance record with empty findings", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "", // Empty findings
        "No action required"
      )).to.be.revertedWith("Findings required");
    });

    it("Should fail if non-inspector tries to create compliance record", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(fda).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      )).to.be.revertedWith("AccessControl: account");
    });

    it("Should update compliance record successfully", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      // Create initial record
      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      // Update record
      await expect(complianceManager.connect(inspector).updateComplianceRecord(
        1, // recordId
        false, // new compliance status
        "New findings discovered",
        "Immediate action required"
      )).to.emit(complianceManager, "BatchComplianceUpdated");

      expect(await complianceManager.isBatchCompliant(1)).to.be.false;
    });
  });

  describe("Regulatory Approval Management", function () {
    it("Should grant regulatory approval successfully", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      const approvalData = {
        drugCode: "ASP001",
        approvalNumber: "FDA-2024-001",
        regulatoryBody: "FDA",
        approvalDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        conditions: "Standard manufacturing practices"
      };

      await expect(complianceManager.connect(fda).grantRegulatoryApproval(
        approvalData.drugCode,
        approvalData.approvalNumber,
        approvalData.regulatoryBody,
        approvalData.approvalDate,
        approvalData.expiryDate,
        approvalData.conditions
      )).to.emit(complianceManager, "RegulatoryApprovalGranted");

      expect(await complianceManager.isDrugApproved(approvalData.drugCode)).to.be.true;
    });

    it("Should fail to grant approval with empty drug code", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(fda).grantRegulatoryApproval(
        "", // Empty drug code
        "FDA-2024-001",
        "FDA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "Standard manufacturing practices"
      )).to.be.revertedWith("Drug code required");
    });

    it("Should fail to grant approval with invalid expiry date", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      const now = Math.floor(Date.now() / 1000);
      await expect(complianceManager.connect(fda).grantRegulatoryApproval(
        "ASP001",
        "FDA-2024-001",
        "FDA",
        now,
        now - 86400, // Expiry before approval
        "Standard manufacturing practices"
      )).to.be.revertedWith("Invalid expiry date");
    });

    it("Should revoke regulatory approval successfully", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      // Grant approval first
      await complianceManager.connect(fda).grantRegulatoryApproval(
        "ASP001",
        "FDA-2024-001",
        "FDA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "Standard manufacturing practices"
      );

      // Revoke approval
      await expect(complianceManager.connect(fda).revokeRegulatoryApproval(
        1, // approvalId
        "Safety concerns"
      )).to.emit(complianceManager, "BatchComplianceUpdated");

      expect(await complianceManager.isDrugApproved("ASP001")).to.be.false;
    });
  });

  describe("Audit Management", function () {
    it("Should conduct audit successfully", async function () {
      const { complianceManager, auditor } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(auditor).conductAudit(
        1, // batchId
        "Routine Inspection", // auditType
        "Minor issues found", // findings
        "Implement corrective measures" // recommendations
      )).to.emit(complianceManager, "AuditConducted");
    });

    it("Should fail to conduct audit with empty audit type", async function () {
      const { complianceManager, auditor } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(auditor).conductAudit(
        1,
        "", // Empty audit type
        "Minor issues found",
        "Implement corrective measures"
      )).to.be.revertedWith("Audit type required");
    });

    it("Should fail to conduct audit with empty findings", async function () {
      const { complianceManager, auditor } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(auditor).conductAudit(
        1,
        "Routine Inspection",
        "", // Empty findings
        "Implement corrective measures"
      )).to.be.revertedWith("Findings required");
    });

    it("Should resolve audit successfully", async function () {
      const { complianceManager, auditor, inspector } = await loadFixture(deployComplianceManagerFixture);

      // Conduct audit first
      await complianceManager.connect(auditor).conductAudit(
        1,
        "Routine Inspection",
        "Minor issues found",
        "Implement corrective measures"
      );

      // Resolve audit
      await expect(complianceManager.connect(inspector).resolveAudit(
        1, // auditId
        "All issues resolved" // resolution
      )).to.emit(complianceManager, "BatchComplianceUpdated");
    });
  });

  describe("Compliance Standards Management", function () {
    it("Should add compliance standard successfully", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);

      const standardData = {
        standardName: "FDA_21_CFR_PART_11",
        version: "1.0",
        description: "Electronic Records and Signatures",
        requirements: ["Digital signatures", "Audit trails", "Access controls"]
      };

      await expect(complianceManager.connect(owner).addComplianceStandard(
        standardData.standardName,
        standardData.version,
        standardData.description,
        standardData.requirements
      )).to.emit(complianceManager, "ComplianceStandardAdded");
    });

    it("Should fail to add standard with empty name", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(owner).addComplianceStandard(
        "", // Empty standard name
        "1.0",
        "Electronic Records and Signatures",
        ["Digital signatures", "Audit trails"]
      )).to.be.revertedWith("Standard name required");
    });

    it("Should fail to add standard with empty version", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(owner).addComplianceStandard(
        "FDA_21_CFR_PART_11",
        "", // Empty version
        "Electronic Records and Signatures",
        ["Digital signatures", "Audit trails"]
      )).to.be.revertedWith("Version required");
    });

    it("Should fail to add standard with empty requirements", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);

      await expect(complianceManager.connect(owner).addComplianceStandard(
        "FDA_21_CFR_PART_11",
        "1.0",
        "Electronic Records and Signatures",
        [] // Empty requirements
      )).to.be.revertedWith("Requirements required");
    });

    it("Should deactivate compliance standard successfully", async function () {
      const { complianceManager, owner } = await loadFixture(deployComplianceManagerFixture);

      // Add standard first
      await complianceManager.connect(owner).addComplianceStandard(
        "FDA_21_CFR_PART_11",
        "1.0",
        "Electronic Records and Signatures",
        ["Digital signatures", "Audit trails"]
      );

      // Deactivate standard
      await complianceManager.connect(owner).deactivateComplianceStandard("FDA_21_CFR_PART_11");
    });
  });

  describe("View Functions", function () {
    it("Should return correct compliance record", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      const recordData = {
        batchId: 1,
        complianceType: "FDA_21_CFR_PART_11",
        isCompliant: true,
        certificate: "CERT001",
        findings: "All tests passed",
        correctiveActions: "No action required"
      };

      await complianceManager.connect(inspector).createComplianceRecord(
        recordData.batchId,
        recordData.complianceType,
        recordData.isCompliant,
        recordData.certificate,
        recordData.findings,
        recordData.correctiveActions
      );

      const record = await complianceManager.getComplianceRecord(1);
      expect(record.batchId).to.equal(recordData.batchId);
      expect(record.complianceType).to.equal(recordData.complianceType);
      expect(record.isCompliant).to.equal(recordData.isCompliant);
      expect(record.certificate).to.equal(recordData.certificate);
      expect(record.findings).to.equal(recordData.findings);
      expect(record.correctiveActions).to.equal(recordData.correctiveActions);
    });

    it("Should return correct regulatory approval", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      const approvalData = {
        drugCode: "ASP001",
        approvalNumber: "FDA-2024-001",
        regulatoryBody: "FDA",
        approvalDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        conditions: "Standard manufacturing practices"
      };

      await complianceManager.connect(fda).grantRegulatoryApproval(
        approvalData.drugCode,
        approvalData.approvalNumber,
        approvalData.regulatoryBody,
        approvalData.approvalDate,
        approvalData.expiryDate,
        approvalData.conditions
      );

      const approval = await complianceManager.getRegulatoryApproval(1);
      expect(approval.drugCode).to.equal(approvalData.drugCode);
      expect(approval.approvalNumber).to.equal(approvalData.approvalNumber);
      expect(approval.regulatoryBody).to.equal(approvalData.regulatoryBody);
      expect(approval.isActive).to.be.true;
    });

    it("Should return correct audit trail", async function () {
      const { complianceManager, auditor } = await loadFixture(deployComplianceManagerFixture);

      const auditData = {
        batchId: 1,
        auditType: "Routine Inspection",
        findings: "Minor issues found",
        recommendations: "Implement corrective measures"
      };

      await complianceManager.connect(auditor).conductAudit(
        auditData.batchId,
        auditData.auditType,
        auditData.findings,
        auditData.recommendations
      );

      const audit = await complianceManager.getAuditTrail(1);
      expect(audit.batchId).to.equal(auditData.batchId);
      expect(audit.auditType).to.equal(auditData.auditType);
      expect(audit.findings).to.equal(auditData.findings);
      expect(audit.recommendations).to.equal(auditData.recommendations);
      expect(audit.isResolved).to.be.false;
    });

    it("Should return batch compliance records", async function () {
      const { complianceManager, inspector } = await loadFixture(deployComplianceManagerFixture);

      // Create multiple compliance records for same batch
      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "FDA_21_CFR_PART_11",
        true,
        "CERT001",
        "All tests passed",
        "No action required"
      );

      await complianceManager.connect(inspector).createComplianceRecord(
        1,
        "ISO_13485",
        true,
        "CERT002",
        "Quality management compliant",
        "No action required"
      );

      const records = await complianceManager.getBatchComplianceRecords(1);
      expect(records.length).to.equal(2);
      expect(records[0]).to.equal(1);
      expect(records[1]).to.equal(2);
    });

    it("Should return drug approvals", async function () {
      const { complianceManager, fda } = await loadFixture(deployComplianceManagerFixture);

      // Create multiple approvals for same drug
      await complianceManager.connect(fda).grantRegulatoryApproval(
        "ASP001",
        "FDA-2024-001",
        "FDA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "Standard manufacturing practices"
      );

      await complianceManager.connect(fda).grantRegulatoryApproval(
        "ASP001",
        "EMA-2024-001",
        "EMA",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        "European standards"
      );

      const approvals = await complianceManager.getDrugApprovals("ASP001");
      expect(approvals.length).to.equal(2);
      expect(approvals[0]).to.equal(1);
      expect(approvals[1]).to.equal(2);
    });
  });
});