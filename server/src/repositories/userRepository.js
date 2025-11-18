const User = require('../models/User')

class UserRepository {
  async create(userData) {
    const user = new User(userData)
    return await user.save()
  }

  async findByEmail(email) {
    return await User.findOne({ email })
  }

  async findByEmailWithPassword(email) {
    return await User.findOne({ email }).select('+password +loginAttempts +lockUntil')
  }

  async findByEmailWithOTP(email) {
    return await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpires')
  }

  async findById(id) {
    return await User.findById(id)
  }

  async findByIdWithPassword(id) {
    return await User.findById(id).select('+password')
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })
  }

  async delete(id) {
    return await User.findByIdAndDelete(id)
  }

  async findAll(query = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = ''
    } = options

    const skip = (page - 1) * limit

    return await User.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
  }

  async countDocuments(query = {}) {
    return await User.countDocuments(query)
  }

  async exists(email) {
    const user = await User.findOne({ email })
    return !!user
  }

  async updatePassword(id, hashedPassword) {
    return await User.findByIdAndUpdate(id, { password: hashedPassword })
  }

  async markEmailAsVerified(id) {
    return await User.findByIdAndUpdate(id, { isEmailVerified: true })
  }

  async deactivateAccount(id) {
    return await User.findByIdAndUpdate(id, { isActive: false })
  }

  async activateAccount(id) {
    return await User.findByIdAndUpdate(id, { isActive: true })
  }

  async findPendingUsers() {
    return await User.find({ isApproved: false }).sort({ createdAt: -1 })
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id)
  }
}

module.exports = new UserRepository()