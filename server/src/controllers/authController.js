const authService = require('../services/authService')
const { validationResult } = require('express-validator')

class AuthController {
  async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const result = await authService.register(req.body)
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      })
    }
  }

  async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { email, password } = req.body
      const result = await authService.login(email, password)
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      })
    } catch (error) {
      console.error('Login error:', error)
      
      let statusCode = 401
      if (error.message.includes('locked') || error.message.includes('deactivated')) {
        statusCode = 423 // Locked
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed'
      })
    }
  }

  async sendPasswordResetOTP(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { email } = req.body
      const result = await authService.sendPasswordResetOTP(email)
      
      res.json({
        success: true,
        message: result.message,
        data: { email: result.email }
      })
    } catch (error) {
      console.error('Send OTP error:', error)
      
      // Always return success for security (don't reveal if email exists)
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset code.',
        data: { email: req.body.email?.replace(/(.{2}).*(@.*)/, '$1***$2') }
      })
    }
  }

  async verifyPasswordResetOTP(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { email, otp } = req.body
      const result = await authService.verifyPasswordResetOTP(email, otp)
      
      res.json({
        success: true,
        message: result.message,
        data: { resetToken: result.resetToken }
      })
    } catch (error) {
      console.error('Verify OTP error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed'
      })
    }
  }

  async resetPassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { email, otp, newPassword } = req.body
      const result = await authService.resetPassword(email, otp, newPassword)
      
      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed'
      })
    }
  }

  async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { currentPassword, newPassword } = req.body
      const userId = req.user.id
      
      const result = await authService.changePassword(userId, currentPassword, newPassword)
      
      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed'
      })
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id
      const result = await authService.getProfile(userId)
      
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(404).json({
        success: false,
        message: error.message || 'User not found'
      })
    }
  }

  async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const userId = req.user.id
      const result = await authService.updateProfile(userId, req.body)
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Profile update failed'
      })
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.id
      const result = await authService.logout(userId)
      
      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      })
    }
  }

  // Update user's Vapi API key
  async updateVapiApiKey(req, res) {
    try {
      const { vapiApiKey } = req.body
      const userId = req.user.id

      if (!vapiApiKey || vapiApiKey.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vapi API key is required'
        })
      }

      const result = await authService.updateVapiApiKey(userId, vapiApiKey.trim())
      
      res.json({
        success: true,
        message: 'Vapi API key updated successfully',
        data: result
      })
    } catch (error) {
      console.error('Update Vapi API key error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update Vapi API key'
      })
    }
  }

  // Get user's Vapi API key status (not the key itself)
  async getVapiApiKeyStatus(req, res) {
    try {
      const userId = req.user.id
      const result = await authService.getVapiApiKeyStatus(userId)
      
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Get Vapi API key status error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get Vapi API key status'
      })
    }
  }

  // Remove user's Vapi API key
  async removeVapiApiKey(req, res) {
    try {
      const userId = req.user.id
      const result = await authService.removeVapiApiKey(userId)
      
      res.json({
        success: true,
        message: 'Vapi API key removed successfully',
        data: result
      })
    } catch (error) {
      console.error('Remove Vapi API key error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove Vapi API key'
      })
    }
  }

  // Health check for auth routes
  async healthCheck(req, res) {
    res.json({
      success: true,
      message: 'Auth service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }
}

module.exports = new AuthController()