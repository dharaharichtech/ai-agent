const express = require('express')
const authController = require('../controllers/authController')
const { authMiddleware } = require('../middleware/authMiddleware')
const { authValidation } = require('../utils/validation')

const router = express.Router()

// Health check
router.get('/health', authController.healthCheck)

// Public routes
router.post('/register', authValidation.register, authController.register)
router.post('/login', authValidation.login, authController.login)

// Password reset routes
router.post('/forgot-password', authValidation.forgotPassword, authController.sendPasswordResetOTP)
router.post('/verify-otp', authValidation.verifyOTP, authController.verifyPasswordResetOTP)
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword)

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, authValidation.updateProfile, authController.updateProfile)
router.put('/change-password', authMiddleware, authValidation.changePassword, authController.changePassword)
router.post('/logout', authMiddleware, authController.logout)

// Vapi API Key management routes
router.put('/vapi-api-key', authMiddleware, authValidation.updateVapiApiKey, authController.updateVapiApiKey)
router.get('/vapi-api-key/status', authMiddleware, authController.getVapiApiKeyStatus)
router.delete('/vapi-api-key', authMiddleware, authController.removeVapiApiKey)

module.exports = router