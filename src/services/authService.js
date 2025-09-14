/**
 * @fileoverview Authentication Service for PharbitChain
 * JWT-based authentication with role-based access control
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AuthService {
    constructor(credentials) {
        this.credentials = credentials;
        this.jwtSecret = credentials.JWT_SECRET;
        this.jwtExpiresIn = credentials.JWT_EXPIRES_IN || '24h';
        this.jwtRefreshExpiresIn = credentials.JWT_REFRESH_EXPIRES_IN || '7d';
        this.bcryptRounds = parseInt(credentials.BCRYPT_ROUNDS) || 12;
        
        // Role-based permissions
        this.permissions = {
            admin: ['*'],
            manufacturer: [
                'batch:create', 'batch:read', 'batch:update',
                'document:upload', 'document:read', 'document:update',
                'compliance:read', 'compliance:create'
            ],
            distributor: [
                'batch:read', 'batch:update',
                'document:read',
                'compliance:read'
            ],
            pharmacy: [
                'batch:read',
                'document:read',
                'compliance:read'
            ],
            regulator: [
                'batch:read', 'batch:audit',
                'document:read', 'document:audit',
                'compliance:read', 'compliance:audit',
                'audit:read', 'audit:create'
            ],
            auditor: [
                'batch:read', 'batch:audit',
                'document:read', 'document:audit',
                'compliance:read', 'compliance:audit',
                'audit:read', 'audit:create'
            ]
        };
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.bcryptRounds);
        } catch (error) {
            logger.error('Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * Verify password against hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Verification result
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password verification failed:', error);
            return false;
        }
    }

    /**
     * Generate JWT token
     * @param {Object} payload - Token payload
     * @param {string} expiresIn - Token expiration
     * @returns {string} JWT token
     */
    generateToken(payload, expiresIn = this.jwtExpiresIn) {
        try {
            return jwt.sign(payload, this.jwtSecret, { expiresIn });
        } catch (error) {
            logger.error('Token generation failed:', error);
            throw new Error('Token generation failed');
        }
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            logger.error('Token verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Generate refresh token
     * @param {string} userId - User ID
     * @returns {string} Refresh token
     */
    generateRefreshToken(userId) {
        const payload = {
            userId,
            type: 'refresh',
            jti: uuidv4()
        };
        
        return this.generateToken(payload, this.jwtRefreshExpiresIn);
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Registration result
     */
    async register(userData, databaseService) {
        try {
            const { email, password, firstName, lastName, role, organization } = userData;

            // Validate input
            if (!email || !password || !firstName || !lastName || !organization) {
                throw new Error('Missing required fields');
            }

            // Check if user already exists
            const existingUser = await databaseService.getModel('User').findOne({
                where: { email }
            });

            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const hashedPassword = await this.hashPassword(password);

            // Create user
            const user = await databaseService.getModel('User').create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'manufacturer',
                organization,
                complianceData: {
                    registrationDate: new Date().toISOString(),
                    complianceMode: this.credentials.COMPLIANCE_MODE || 'FDA_21CFR11',
                    digitalSignatureRequired: this.credentials.DIGITAL_SIGNATURE_REQUIRED === 'true'
                }
            });

            // Generate tokens
            const accessToken = this.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                organization: user.organization
            });

            const refreshToken = this.generateRefreshToken(user.id);

            // Log user registration
            logger.logUserAction(user.id, 'USER_REGISTER', {
                email: user.email,
                role: user.role,
                organization: user.organization
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organization: user.organization,
                    isActive: user.isActive
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: this.jwtExpiresIn
                }
            };

        } catch (error) {
            logger.error('User registration failed:', error);
            throw error;
        }
    }

    /**
     * Authenticate user login
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Authentication result
     */
    async login(email, password, databaseService) {
        try {
            // Find user
            const user = await databaseService.getModel('User').findOne({
                where: { email, isActive: true }
            });

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.password);
            if (!isValidPassword) {
                logger.security('Failed login attempt', {
                    email,
                    ip: 'unknown',
                    userAgent: 'unknown'
                });
                throw new Error('Invalid credentials');
            }

            // Update last login
            await user.update({ lastLogin: new Date() });

            // Generate tokens
            const accessToken = this.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                organization: user.organization
            });

            const refreshToken = this.generateRefreshToken(user.id);

            // Log successful login
            logger.logUserAction(user.id, 'USER_LOGIN', {
                email: user.email,
                role: user.role,
                organization: user.organization
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organization: user.organization,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: this.jwtExpiresIn
                }
            };

        } catch (error) {
            logger.error('User login failed:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Token refresh result
     */
    async refreshToken(refreshToken, databaseService) {
        try {
            // Verify refresh token
            const decoded = this.verifyToken(refreshToken);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Find user
            const user = await databaseService.getModel('User').findByPk(decoded.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }

            // Generate new access token
            const accessToken = this.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                organization: user.organization
            });

            // Generate new refresh token
            const newRefreshToken = this.generateRefreshToken(user.id);

            return {
                success: true,
                tokens: {
                    accessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: this.jwtExpiresIn
                }
            };

        } catch (error) {
            logger.error('Token refresh failed:', error);
            throw error;
        }
    }

    /**
     * Authenticate request middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please provide a valid token'
                });
            }

            const token = authHeader.substring(7);
            const decoded = this.verifyToken(token);

            // Add user info to request
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                organization: decoded.organization
            };

            next();

        } catch (error) {
            logger.security('Authentication failed', {
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid or expired token'
            });
        }
    }

    /**
     * Check user permissions
     * @param {string} role - User role
     * @param {string} permission - Required permission
     * @returns {boolean} Permission check result
     */
    hasPermission(role, permission) {
        const rolePermissions = this.permissions[role] || [];
        return rolePermissions.includes('*') || rolePermissions.includes(permission);
    }

    /**
     * Authorization middleware
     * @param {string} permission - Required permission
     * @returns {Function} Express middleware function
     */
    authorize(permission) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                if (!this.hasPermission(req.user.role, permission)) {
                    logger.security('Authorization failed', {
                        userId: req.user.id,
                        role: req.user.role,
                        requiredPermission: permission,
                        ip: req.ip
                    });

                    return res.status(403).json({
                        error: 'Insufficient permissions',
                        message: `Required permission: ${permission}`
                    });
                }

                next();

            } catch (error) {
                logger.error('Authorization check failed:', error);
                return res.status(500).json({
                    error: 'Authorization check failed'
                });
            }
        };
    }

    /**
     * Role-based authorization middleware
     * @param {Array} roles - Allowed roles
     * @returns {Function} Express middleware function
     */
    requireRole(roles) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                if (!roles.includes(req.user.role)) {
                    logger.security('Role authorization failed', {
                        userId: req.user.id,
                        userRole: req.user.role,
                        requiredRoles: roles,
                        ip: req.ip
                    });

                    return res.status(403).json({
                        error: 'Insufficient role',
                        message: `Required roles: ${roles.join(', ')}`
                    });
                }

                next();

            } catch (error) {
                logger.error('Role authorization check failed:', error);
                return res.status(500).json({
                    error: 'Role authorization check failed'
                });
            }
        };
    }

    /**
     * Generate password reset token
     * @param {string} email - User email
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Password reset result
     */
    async generatePasswordResetToken(email, databaseService) {
        try {
            const user = await databaseService.getModel('User').findOne({
                where: { email, isActive: true }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token in user record
            await user.update({
                passwordResetToken: resetToken,
                passwordResetExpiry: resetTokenExpiry
            });

            // Log password reset request
            logger.logUserAction(user.id, 'PASSWORD_RESET_REQUEST', {
                email: user.email,
                resetToken: resetToken.substring(0, 8) + '...'
            });

            return {
                success: true,
                resetToken,
                expiresAt: resetTokenExpiry
            };

        } catch (error) {
            logger.error('Password reset token generation failed:', error);
            throw error;
        }
    }

    /**
     * Reset password with token
     * @param {string} resetToken - Password reset token
     * @param {string} newPassword - New password
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Password reset result
     */
    async resetPassword(resetToken, newPassword, databaseService) {
        try {
            const user = await databaseService.getModel('User').findOne({
                where: {
                    passwordResetToken: resetToken,
                    passwordResetExpiry: {
                        [databaseService.getSequelize().Op.gt]: new Date()
                    }
                }
            });

            if (!user) {
                throw new Error('Invalid or expired reset token');
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update password and clear reset token
            await user.update({
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null
            });

            // Log password reset
            logger.logUserAction(user.id, 'PASSWORD_RESET_COMPLETE', {
                email: user.email
            });

            return {
                success: true,
                message: 'Password reset successfully'
            };

        } catch (error) {
            logger.error('Password reset failed:', error);
            throw error;
        }
    }

    /**
     * Change password for authenticated user
     * @param {string} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Password change result
     */
    async changePassword(userId, currentPassword, newPassword, databaseService) {
        try {
            const user = await databaseService.getModel('User').findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValidPassword = await this.verifyPassword(currentPassword, user.password);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update password
            await user.update({ password: hashedPassword });

            // Log password change
            logger.logUserAction(user.id, 'PASSWORD_CHANGE', {
                email: user.email
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            logger.error('Password change failed:', error);
            throw error;
        }
    }

    /**
     * Logout user (invalidate tokens)
     * @param {string} userId - User ID
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Logout result
     */
    async logout(userId, databaseService) {
        try {
            // Log logout
            logger.logUserAction(userId, 'USER_LOGOUT', {
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            logger.error('Logout failed:', error);
            throw error;
        }
    }
}

module.exports = AuthService;