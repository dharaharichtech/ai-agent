const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^\+?[\d\s-()]+$/,
      'Please enter a valid phone number'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true // Changed to true for development
  },
  resetPasswordOTP: {
    type: String,
    select: false
  },
  resetPasswordOTPExpires: {
    type: Date,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  vapiApiKey: {
    type: String,
    trim: true,
    select: false // Don't include in normal queries for security
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate OTP for password reset
userSchema.methods.createPasswordResetOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Hash OTP before storing
  const salt = bcrypt.genSaltSync(10)
  this.resetPasswordOTP = bcrypt.hashSync(otp, salt)
  
  // OTP expires in 10 minutes
  this.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000
  
  return otp
}

// Verify OTP for password reset
userSchema.methods.verifyPasswordResetOTP = function(otp) {
  if (!this.resetPasswordOTP || !this.resetPasswordOTPExpires) {
    return false
  }
  
  if (Date.now() > this.resetPasswordOTPExpires) {
    return false
  }
  
  return bcrypt.compareSync(otp, this.resetPasswordOTP)
}

// Clear OTP data
userSchema.methods.clearPasswordResetOTP = function() {
  this.resetPasswordOTP = undefined
  this.resetPasswordOTPExpires = undefined
}

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates = { $inc: { loginAttempts: 1 } }
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }
  
  return this.updateOne(updates)
}

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.resetPasswordOTP
  delete user.resetPasswordOTPExpires
  delete user.loginAttempts
  delete user.lockUntil
  return user
}

module.exports = mongoose.model('User', userSchema)