const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assistant name is required'],
    trim: true,
    maxlength: [100, 'Assistant name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Assistant description cannot exceed 500 characters']
  },
  // Reference to the user who owns this assistant
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assistant owner is required']
  },
  // Bolna assistant ID (from Bolna platform)
  bolnaAssistantId: {
    type: String,
    required: [true, 'Bolna Assistant ID is required'],
    unique: true
  },
  // Assistant configuration
  config: {
    // AI Model settings
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google'],
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    systemPrompt: {
      type: String,
      required: [true, 'System prompt is required'],
      maxlength: [5000, 'System prompt cannot exceed 5000 characters']
    },
    // Voice settings
  voiceProvider: {
  type: String,
  enum: ['openai', '11labs', 'azure', 'playht', 'deepgram', 'google'],
  default: 'openai'
},

    voiceId: {
      type: String,
      default: 'default'
    },
    voiceSettings: {
      speed: {
        type: Number,
        min: 0.5,
        max: 2.0,
        default: 1.0
      },
      pitch: {
        type: Number,
        min: 0.5,
        max: 2.0,
        default: 1.0
      }
    },
    // Call behavior
    firstMessage: {
      type: String,
      maxlength: [1000, 'First message cannot exceed 1000 characters']
    },
    firstMessageMode: {
      type: String,
      enum: ['assistant-speaks-first', 'wait-for-user'],
      default: 'assistant-speaks-first'
    },
    endCallMessage: {
      type: String,
      maxlength: [500, 'End call message cannot exceed 500 characters']
    },
    endCallPhrases: [String],
    recordingEnabled: {
      type: Boolean,
      default: true
    },
    // Advanced settings
    maxDuration: {
      type: Number, // in seconds
      min: 30,
      max: 3600, // 1 hour max
      default: 1800 // 30 minutes default
    }
  },
  // Assistant purpose and metadata
  metadata: {
    type: {
      type: String,
      enum: ['sales', 'support', 'lead-capture', 'follow-up', 'survey', 'appointment', 'general'],
      default: 'general'
    },
    purpose: String,
    tags: [String],
    industry: String,
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  // Status and availability
  status: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'archived'],
    default: 'testing'
  },
  // Usage statistics
  stats: {
    totalCalls: {
      type: Number,
      default: 0
    },
    totalCallDuration: {
      type: Number, // in seconds
      default: 0
    },
    averageCallDuration: {
      type: Number, // in seconds
      default: 0
    },
    successfulCalls: {
      type: Number,
      default: 0
    },
    lastCallDate: Date,
    callsThisMonth: {
      type: Number,
      default: 0
    }
  },
  // Bolna sync information
  lastSyncDate: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'out-of-sync', 'error'],
    default: 'pending'
  },
  lastSyncError: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
assistantSchema.index({ owner: 1, status: 1 });
assistantSchema.index({ 'metadata.type': 1 });
assistantSchema.index({ createdAt: -1 });

// Pre-save middleware
assistantSchema.pre('save', function(next) {
  // Calculate average call duration
  if (this.stats.totalCalls > 0) {
    this.stats.averageCallDuration = Math.round(this.stats.totalCallDuration / this.stats.totalCalls);
  }
  
  // Update last sync date if Bolna ID changed
  if (this.isModified('bolnaAssistantId')) {
    this.lastSyncDate = new Date();
    this.syncStatus = 'synced';
  }
  
  next();
});

// Instance methods
assistantSchema.methods.updateCallStats = function(callDuration, successful = true) {
  this.stats.totalCalls += 1;
  this.stats.totalCallDuration += callDuration;
  this.stats.lastCallDate = new Date();
  
  if (successful) {
    this.stats.successfulCalls += 1;
  }
  
  // Update monthly stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Simple monthly tracking
  if (!this.stats.lastCallDate || 
      this.stats.lastCallDate.getMonth() !== currentMonth || 
      this.stats.lastCallDate.getFullYear() !== currentYear) {
    this.stats.callsThisMonth = 1;
  } else {
    this.stats.callsThisMonth += 1;
  }
  
  // Calculate average
  this.stats.averageCallDuration = Math.round(this.stats.totalCallDuration / this.stats.totalCalls);
  
  return this.save();
};

assistantSchema.methods.getPerformanceMetrics = function() {
  return {
    totalCalls: this.stats.totalCalls,
    successRate: this.stats.totalCalls > 0 ? (this.stats.successfulCalls / this.stats.totalCalls) * 100 : 0,
    averageCallDuration: this.stats.averageCallDuration,
    callsThisMonth: this.stats.callsThisMonth,
    lastActive: this.stats.lastCallDate
  };
};

// Static methods
assistantSchema.statics.findByOwner = function(ownerId, status = null) {
  const query = { owner: ownerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('owner', 'username email')
    .sort({ updatedAt: -1 });
};

assistantSchema.statics.findByType = function(type, ownerId = null) {
  const query = { 'metadata.type': type };
  if (ownerId) query.owner = ownerId;
  
  return this.find(query)
    .populate('owner', 'username email')
    .sort({ 'stats.totalCalls': -1 });
};

const Assistant = mongoose.model('Assistant', assistantSchema);

module.exports = Assistant;