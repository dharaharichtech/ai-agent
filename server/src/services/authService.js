const jwt = require('jsonwebtoken')
const userRepository = require('../repositories/userRepository')

class AuthService {
  async register(userData) {
    const { name, companyName, email, password, phone } = userData

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Create user
    const user = await userRepository.create({
      name,
      companyName,
      email,
      password,
      phone: phone || undefined
    })



    // Generate token
    const token = this.generateToken(user._id)

    return {
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved
      },
      token
    }
  }

  async login(email, password) {
    console.log('🔍 Login attempt for email:', email)
    
    // Find user with password and OTP fields
    const user = await userRepository.findByEmailWithPassword(email)
    console.log('🔍 User found:', !!user)
    
    if (!user) {
      console.log('❌ User not found for email:', email)
      throw new Error('Invalid credentials')
    }

    console.log('🔍 User details:', {
      id: user._id,
      email: user.email,
      isActive: user.isActive,
      isApproved: user.isApproved,
      loginAttempts: user.loginAttempts
    })

    // // Check if account is locked
    // if (user.isLocked) {
    //   const lockTime = Math.round((user.lockUntil - Date.now()) / 60000)
    //   throw new Error(`Account locked due to too many failed attempts. Try again in ${lockTime} minutes.`)
    // }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // Check if user is approved by admin
    // if (!user.isApproved) {
    //   throw new Error('Your account is pending admin approval. Please wait for approval to login.')
    // }

    // Check password
    console.log('🔍 Checking password...')
    const isMatch = await user.comparePassword(password)
    console.log('🔍 Password match:', isMatch)
    
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.email)
      // Increment login attempts
      await user.incLoginAttempts()
      throw new Error('Invalid credentials')
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Generate token
    const token = this.generateToken(user._id)

    return {
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved
      },
      token
    }
  }

  async sendPasswordResetOTP(email) {
    // Find user
    const user = await userRepository.findByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      throw new Error('If an account with that email exists, we have sent a password reset code.')
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // Generate OTP
    const otp = user.createPasswordResetOTP()
    await user.save()

  

    return {
      message: 'Password reset code sent to your email',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially hide email
    }
  }

  async verifyPasswordResetOTP(email, otp) {
    // Find user with OTP fields
    const user = await userRepository.findByEmailWithOTP(email)
    if (!user) {
      throw new Error('Invalid or expired verification code')
    }

    // Verify OTP
    const isValidOTP = user.verifyPasswordResetOTP(otp)
    if (!isValidOTP) {
      throw new Error('Invalid or expired verification code')
    }

    return {
      message: 'OTP verified successfully',
      resetToken: this.generateResetToken(user._id, otp)
    }
  }

  async resetPassword(email, otp, newPassword) {
    // Find user with OTP fields
    const user = await userRepository.findByEmailWithOTP(email)
    if (!user) {
      throw new Error('Invalid or expired verification code')
    }

    // Verify OTP again
    const isValidOTP = user.verifyPasswordResetOTP(otp)
    if (!isValidOTP) {
      throw new Error('Invalid or expired verification code')
    }

    // Update password
    user.password = newPassword
    user.clearPasswordResetOTP()
    
    // Reset login attempts if any
    user.loginAttempts = 0
    user.lockUntil = undefined

    await user.save()

    return {
      message: 'Password reset successfully'
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Find user with password
    const user = await userRepository.findByIdWithPassword(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new Error('Current password is incorrect')
    }

    // Update password
    user.password = newPassword
    await user.save()

    return {
      message: 'Password changed successfully'
    }
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved,
        createdAt: user.createdAt
      }
    }
  }

  async updateProfile(userId, updateData) {
    const { name, companyName, phone } = updateData

    // Check if email is being changed and if it already exists
    if (updateData.email) {
      const existingUser = await userRepository.findByEmail(updateData.email)
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Email already exists')
      }
    }

    const user = await userRepository.update(userId, {
      name,
      companyName,
      phone,
      email: updateData.email
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved
      }
    }
  }

  async logout(userId) {
    // In a more sophisticated setup, you might want to maintain a blacklist of tokens
    // For now, we'll just return a success message
    // The client should remove the token from storage
    
    return {
      message: 'Logged out successfully'
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    )
  }

  generateResetToken(userId, otp) {
    return jwt.sign(
      { userId, otp, type: 'reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '10m' }
    )
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  // Update user's Vapi API key
  async updateVapiApiKey(userId, vapiApiKey) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Update the Vapi API key
    const updatedUser = await userRepository.updateById(userId, { 
      vapiApiKey: vapiApiKey 
    })

    return {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasVapiApiKey: true
      }
    }
  }

  // Get Vapi API key status (not the key itself for security)
  async getVapiApiKeyStatus(userId) {
    const user = await userRepository.findById(userId, '+vapiApiKey')
    if (!user) {
      throw new Error('User not found')
    }

    return {
      hasVapiApiKey: !!(user.vapiApiKey && user.vapiApiKey.trim() !== ''),
      keyLength: user.vapiApiKey ? user.vapiApiKey.length : 0,
      lastUpdated: user.updatedAt
    }
  }

  // Remove user's Vapi API key
  async removeVapiApiKey(userId) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Remove the Vapi API key
    const updatedUser = await userRepository.updateById(userId, { 
      vapiApiKey: undefined 
    })

    return {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasVapiApiKey: false
      }
    }
  }
}

module.exports = new AuthService()