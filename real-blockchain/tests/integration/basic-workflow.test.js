/**
 * @fileoverview Integration tests for basic pharmaceutical blockchain workflow
 * Tests end-to-end functionality of core features
 */

const { expect } = require('chai');
const { Blockchain } = require('../src/blockchain');
const { SecurityAndCompliance } = require('../src/security/SecurityAndCompliance');
const { MultiSigWallet } = require('../src/security/multi-sig-wallet');
const { HealthChecker } = require('../src/monitoring/health-checker');
const { MonitoringAnalytics } = require('../src/monitoring/MonitoringAnalytics');

describe('Pharmaceutical Blockchain Integration Tests', () => {
    let blockchain;
    let security;
    let wallet;
    let healthChecker;
    let monitoring;

    before(async () => {
        // Initialize all components
        blockchain = new Blockchain();
        security = new SecurityAndCompliance(blockchain);
        wallet = new MultiSigWallet();
        healthChecker = new HealthChecker();
        monitoring = new MonitoringAnalytics(blockchain);

        await Promise.all([
            blockchain.initialize(),
            security.initialize(),
            wallet.initialize(),
            healthChecker.startHealthChecks(),
            monitoring.startMonitoring()
        ]);
    });

    after(async () => {
        // Cleanup
        healthChecker.stop();
        monitoring.stopMonitoring();
    });

    describe('End-to-End Batch Lifecycle', () => {
        let batchId;
        let walletId;
        let txId;

        it('should create a multi-signature wallet', async () => {
            const owners = ['manufacturer1', 'qa1', 'regulator1'];
            walletId = await wallet.createWallet({
                name: 'Test Batch Wallet',
                owners,
                requiredSignatures: 2
            });

            const walletInfo = await wallet.getWallet(walletId);
            expect(walletInfo.owners).to.have.members(owners);
            expect(walletInfo.requiredSignatures).to.equal(2);
        });

        it('should create a new pharmaceutical batch', async () => {
            const batch = {
                product: 'Test Medicine',
                quantity: 1000,
                manufacturer: 'Test Labs',
                manufacturingDate: new Date(),
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                temperature: {
                    min: 2,
                    max: 8
                }
            };

            // Create batch transaction
            txId = await wallet.createTransaction({
                walletId,
                type: 'CREATE_BATCH',
                metadata: batch
            });

            // Add required signatures
            await wallet.addSignature({
                txId,
                signerId: 'manufacturer1',
                signature: 'sig1'
            });

            await wallet.addSignature({
                txId,
                signerId: 'qa1',
                signature: 'sig2'
            });

            const tx = await wallet.getTransaction(txId);
            expect(tx.status).to.equal('completed');

            batchId = tx.blockchainTxId;
        });

        it('should monitor batch temperature', async () => {
            // Simulate temperature readings
            const readings = [
                { timestamp: Date.now(), temperature: 5 },
                { timestamp: Date.now() + 1000, temperature: 6 },
                { timestamp: Date.now() + 2000, temperature: 7 }
            ];

            for (const reading of readings) {
                await blockchain.addTemperatureReading(batchId, reading);
            }

            const metrics = monitoring.getDashboardData();
            expect(metrics.metrics.coldChainStatus).to.equal('normal');
        });

        it('should validate batch compliance', async () => {
            const validationResults = await security.runValidationChecks('FDA_21_CFR_11');
            expect(validationResults).to.be.an('array');
            expect(validationResults.every(v => v[1].passed)).to.be.true;
        });

        it('should track batch location', async () => {
            const locations = [
                { timestamp: Date.now(), location: 'Manufacturing', status: 'produced' },
                { timestamp: Date.now() + 1000, location: 'QA Lab', status: 'testing' },
                { timestamp: Date.now() + 2000, location: 'Warehouse', status: 'stored' }
            ];

            for (const loc of locations) {
                await blockchain.updateBatchLocation(batchId, loc);
            }

            const batchInfo = await blockchain.getBatchInfo(batchId);
            expect(batchInfo.currentLocation).to.equal('Warehouse');
        });

        it('should generate compliance report', async () => {
            const report = await security.createComplianceReport('FDA_21_CFR_11');
            expect(report.report.systemStatus).to.be.true;
            expect(report.report.validationResults).to.be.an('array');
        });

        it('should verify batch authenticity', async () => {
            const verification = await blockchain.verifyBatch(batchId);
            expect(verification.authentic).to.be.true;
            expect(verification.tempCompliance).to.be.true;
            expect(verification.locationTracking).to.be.true;
        });
    });

    describe('System Health and Monitoring', () => {
        it('should report healthy system status', async () => {
            const health = healthChecker.getHealthReport();
            expect(health.status).to.equal('healthy');
            expect(health.components.blockchain.status).to.equal('healthy');
            expect(health.components.database.status).to.equal('healthy');
        });

        it('should collect system metrics', async () => {
            const metrics = await healthChecker.collectSystemMetrics();
            expect(metrics.cpu).to.exist;
            expect(metrics.memory).to.exist;
            expect(metrics.network).to.exist;
        });

        it('should monitor blockchain performance', async () => {
            const analytics = monitoring.getDashboardData();
            expect(analytics.metrics).to.exist;
            expect(analytics.performance).to.be.an('array');
        });
    });

    describe('Security and Access Control', () => {
        it('should enforce role-based access', async () => {
            const manufacturerPermissions = await security.rbac.getUserPermissions('manufacturer1');
            expect(manufacturerPermissions).to.include('CREATE_BATCH');
            expect(manufacturerPermissions).to.not.include('APPROVE_RECALL');
        });

        it('should validate multi-signature requirements', async () => {
            const tx = await wallet.createTransaction({
                walletId,
                type: 'RECALL_BATCH',
                metadata: { reason: 'test' }
            });

            // One signature shouldn't be enough
            await wallet.addSignature({
                txId: tx.id,
                signerId: 'manufacturer1',
                signature: 'sig1'
            });

            const txInfo = await wallet.getTransaction(tx.id);
            expect(txInfo.status).to.equal('pending');
        });

        it('should maintain audit trail', async () => {
            const auditTrail = await security.validateAuditTrail(security.auditLog);
            expect(auditTrail).to.be.true;
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle temperature violations', async () => {
            // Simulate temperature violation
            await blockchain.addTemperatureReading(batchId, {
                timestamp: Date.now(),
                temperature: 15 // Outside acceptable range
            });

            const alerts = monitoring.metrics.alerts;
            expect(alerts.some(a => a.type === 'TEMPERATURE_VIOLATION')).to.be.true;
        });

        it('should handle network disruptions', async () => {
            // Simulate network issue
            await healthChecker.handleComponentFailure('network', new Error('Connection lost'));

            const health = healthChecker.getHealthReport();
            expect(health.components.network.status).to.equal('error');
            expect(health.status).to.equal('error');
        });

        it('should recover from disruptions', async () => {
            // Simulate network recovery
            await healthChecker.updateComponentHealth('network', {
                status: 'healthy',
                checks: { connectivity: { status: 'healthy' } }
            });

            const health = healthChecker.getHealthReport();
            expect(health.components.network.status).to.equal('healthy');
            expect(health.status).to.equal('healthy');
        });
    });
});