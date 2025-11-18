const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'in-progress', 'completed', 'failed', 'no-answer', 'busy'],
    default: 'initiated'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number // Duration in seconds
  },
  recordingUrl: {
    type: String
  },
  transcript: {
    type: String
  },
  cost: {
    type: Number // Call cost
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // For additional webhook data
  },
  bolnaCallData: {
    type: mongoose.Schema.Types.Mixed // Store complete Bolna webhook data
  }
}, {
  timestamps: true
});

// Index for efficient queries
callHistorySchema.index({ assistantId: 1, startedAt: -1 });
callHistorySchema.index({ phoneNumber: 1 });
callHistorySchema.index({ status: 1 });

const CallHistory = mongoose.model('CallHistory', callHistorySchema);

module.exports = CallHistory;