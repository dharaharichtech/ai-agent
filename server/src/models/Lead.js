const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: [true, 'User ID is required']
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot be more than 100 characters']
  },
  hindi_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Hindi name cannot be more than 100 characters']
  },
  contact_number: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [
      /^\+?[\d\s-()]+$/,
      'Please enter a valid contact number'
    ]
  },
  callConnectionStatus: {
    type: String,
    enum: ['pending', 'connected', 'failed', 'completed', 'cancelled', 'in-progress'],
    default: 'pending'
  },
  leadtype: {
    type: String,
    enum: ['cold', 'hot'],
    // required: [true, 'Lead type is required']
  },
  project_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters'],
    index: true // Add index for better query performance
  },
  // Auto-call attempt tracking
  autoCallAttempts: {
    type: Number,
    default: 0
  },
  lastCallTime: {
    type: Date,
    default: null
  },
  lastAutoCallId: {
    type: String,
    default: null
  },
  callCycleStartTime: {
    type: Date,
    default: null
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt fields
})

// Index for better query performance
leadSchema.index({ user_id: 1 })
leadSchema.index({ callConnectionStatus: 1 })
leadSchema.index({ leadtype: 1 })
leadSchema.index({ deletedat: 1 })

// Soft delete method
leadSchema.methods.softDelete = function() {
  this.deletedat = new Date()
  return this.save()
}

// Check if lead is deleted
leadSchema.methods.isDeleted = function() {
  return !!this.deletedat
}

// Static method to find non-deleted leads
leadSchema.statics.findActive = function() {
  return this.find({ deletedat: null })
}

// Remove sensitive data when converting to JSON (if any in future)
leadSchema.methods.toJSON = function() {
  const lead = this.toObject()
  return lead
}

module.exports = mongoose.model('Lead', leadSchema)