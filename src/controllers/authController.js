/**
 * @fileoverview Authentication Controller for PharbitChain
 * Handles user registration, login, and authentication endpoints
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - organization
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               organization:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manufacturer, distributor, pharmacy, regulator, auditor]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('organization').notEmpty().trim(),
    body('role').optional().isIn(['admin', 'manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const result = await req.authService.register(req.body, req.databaseService);
        
        logger.logUserAction(result.user.id, 'USER_REGISTER', {
            email: result.user.email,
            role: result.user.role,
            organization: result.user.organization
        });

        res.status(201).json(result);

    } catch (error) {
        logger.error('User registration failed:', error);
        res.status(400).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;
        const result = await req.authService.login(email, password, req.databaseService);
        
        logger.logUserAction(result.user.id, 'USER_LOGIN', {
            email: result.user.email,
            role: result.user.role,
            organization: result.user.organization
        });

        res.json(result);

    } catch (error) {
        logger.security('Login failed', {
            email: req.body.email,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(401).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', [
    body('refreshToken').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { refreshToken } = req.body;
        const result = await req.authService.refreshToken(refreshToken, req.databaseService);
        
        res.json(result);

    } catch (error) {
        logger.error('Token refresh failed:', error);
        res.status(401).json({
            error: 'Token refresh failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', req.authService.authenticate, async (req, res) => {
    try {
        const result = await req.authService.logout(req.user.id, req.databaseService);
        res.json(result);

    } catch (error) {
        logger.error('Logout failed:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/me', req.authService.authenticate, async (req, res) => {
    try {
        const user = await req.databaseService.getModel('User').findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organization: user.organization,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        logger.error('Get user profile failed:', error);
        res.status(500).json({
            error: 'Failed to get user profile',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or invalid current password
 */
router.post('/change-password', [
    req.authService.authenticate,
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const result = await req.authService.changePassword(
            req.user.id,
            currentPassword,
            newPassword,
            req.databaseService
        );

        logger.logUserAction(req.user.id, 'PASSWORD_CHANGE', {
            email: req.user.email
        });

        res.json(result);

    } catch (error) {
        logger.error('Password change failed:', error);
        res.status(400).json({
            error: 'Password change failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email } = req.body;
        const result = await req.authService.generatePasswordResetToken(email, req.databaseService);
        
        // In a real application, you would send an email here
        logger.logUserAction('system', 'PASSWORD_RESET_REQUEST', {
            email,
            resetToken: result.resetToken.substring(0, 8) + '...'
        });

        res.json({
            success: true,
            message: 'Password reset email sent',
            resetToken: result.resetToken, // Only for development/testing
            expiresAt: result.expiresAt
        });

    } catch (error) {
        logger.error('Password reset request failed:', error);
        res.status(400).json({
            error: 'Password reset request failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', [
    body('resetToken').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { resetToken, newPassword } = req.body;
        const result = await req.authService.resetPassword(resetToken, newPassword, req.databaseService);
        
        res.json(result);

    } catch (error) {
        logger.error('Password reset failed:', error);
        res.status(400).json({
            error: 'Password reset failed',
            message: error.message
        });
    }
});

module.exports = router;