const { validationResult } = require('express-validator')
const userRepository = require('../repositories/userRepository')

/**
 * Get all pending user registrations
 */
const getPendingUsers = async (req, res) => {
  try {
    const users = await userRepository.findPendingUsers()
    
    res.json({
      success: true,
      message: 'Pending users retrieved successfully',
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
          isApproved: user.isApproved
        }))
      }
    })
  } catch (error) {
    console.error('Get pending users error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

/**
 * Approve a user registration
 */
const approveUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { userId } = req.params

    // Find user
    const user = await userRepository.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if already approved
    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      })
    }

    // Approve user
    user.isApproved = true
    await user.save()

    res.json({
      success: true,
      message: 'User approved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
          isApproved: user.isApproved,
          createdAt: user.createdAt
        }
      }
    })
  } catch (error) {
    console.error('Approve user error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

/**
 * Reject a user registration
 */
const rejectUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { userId } = req.params

    // Find user
    const user = await userRepository.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Delete user (reject registration)
    await userRepository.deleteById(userId)

    res.json({
      success: true,
      message: 'User registration rejected and account deleted'
    })
  } catch (error) {
    console.error('Reject user error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

/**
 * Get all users (approved and pending)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.findAll()
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
          isActive: user.isActive,
          createdAt: user.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers
}