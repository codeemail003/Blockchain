class SecurityManager {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.roles = new Set(['administrator', 'manufacturer', 'qualityControl', 'distributor', 'regulator', 'auditor']);
        this.permissions = new Map([
            ['administrator', ['*']], // All permissions
            ['manufacturer', ['createBatch', 'updateBatch', 'viewBatch', 'addQualityData']],
            ['qualityControl', ['viewBatch', 'approveBatch', 'rejectBatch', 'addQualityData']],
            ['distributor', ['viewBatch', 'updateShipping', 'viewTemperature']],
            ['regulator', ['viewBatch', 'viewAudit', 'viewCompliance']],
            ['auditor', ['viewBatch', 'viewAudit', 'exportReports']]
        ]);
    }

    // User Management
    createUser(username, passwordHash, role) {
        if (!this.roles.has(role)) {
            throw new Error('Invalid role');
        }

        const user = {
            username,
            passwordHash,
            role,
            active: true,
            created: new Date().toISOString(),
            lastLogin: null
        };

        this.users.set(username, user);
        return user;
    }

    // Authentication
    authenticate(username, passwordHash) {
        const user = this.users.get(username);
        if (!user || user.passwordHash !== passwordHash || !user.active) {
            return null;
        }

        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            username,
            role: user.role,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
        };

        this.sessions.set(sessionId, session);
        user.lastLogin = session.created;

        return session;
    }

    // Authorization
    hasPermission(sessionId, permission) {
        const session = this.sessions.get(sessionId);
        if (!session || new Date() > new Date(session.expires)) {
            return false;
        }

        const userPermissions = this.permissions.get(session.role);
        return userPermissions && (
            userPermissions.includes('*') || 
            userPermissions.includes(permission)
        );
    }

    // Session Management
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || new Date() > new Date(session.expires)) {
            return false;
        }
        return true;
    }

    invalidateSession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    // Multi-signature Transaction Management
    createMultiSigTransaction(transaction, requiredSignatures) {
        return {
            transaction,
            requiredSignatures,
            signatures: new Map(),
            status: 'pending',
            created: new Date().toISOString()
        };
    }

    addSignature(transactionId, username, signature) {
        // Implementation for adding signatures to multi-sig transactions
    }

    // Audit Logging
    logAuditEvent(event) {
        const auditEntry = {
            ...event,
            timestamp: new Date().toISOString()
        };
        // Store audit entry (would typically go to a secure storage)
        console.log('Audit:', auditEntry);
    }

    // Helper Methods
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9);
    }

    getUserRole(username) {
        const user = this.users.get(username);
        return user ? user.role : null;
    }

    getRolePermissions(role) {
        return this.permissions.get(role) || [];
    }
}

// Export the security manager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}