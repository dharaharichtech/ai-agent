const CallHistory = require('../models/CallHistory');

class CallRepository {
  // Create a new call history record
  async createCallHistory(callData) {
    try {
      const callHistory = new CallHistory(callData);
      return await callHistory.save();
    } catch (error) {
      throw error;
    }
  }

  // Get call history by call ID
  async getCallHistoryByCallId(callId) {
    try {
      return await CallHistory.findOne({ callId });
    } catch (error) {
      throw error;
    }
  }

  // Get call history by ID
  async getCallHistoryById(id) {
    try {
      return await CallHistory.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Get call history with populated assistant details
  async getCallHistoryWithAssistant(callId) {
    try {
      return await CallHistory.findOne({ callId })
        .populate('assistantId', 'name owner');
    } catch (error) {
      throw error;
    }
  }

  // Update call history by call ID
  async updateCallHistoryByCallId(callId, updateData) {
    try {
      return await CallHistory.findOneAndUpdate(
        { callId: callId },
        updateData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get call history for an assistant with pagination and filtering
  async getAssistantCallHistory(assistantId, filter = {}, sort = { startedAt: -1 }, skip = 0, limit = 10) {
    try {
      const query = { assistantId: assistantId, ...filter };
      
      const callHistory = await CallHistory.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assistantId', 'name');

      const total = await CallHistory.countDocuments(query);

      return { callHistory, total };
    } catch (error) {
      throw error;
    }
  }

  // Get call history for multiple assistants (user's all calls)
  async getUserCallHistory(assistantIds, filter = {}, sort = { startedAt: -1 }, skip = 0, limit = 10) {
    try {
      const query = { assistantId: { $in: assistantIds }, ...filter };
      
      const callHistory = await CallHistory.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assistantId', 'name');

      const total = await CallHistory.countDocuments(query);

      return { callHistory, total };
    } catch (error) {
      throw error;
    }
  }

  // Get call statistics for an assistant
  async getAssistantCallStats(assistantId) {
    try {
      const stats = await CallHistory.aggregate([
        { $match: { assistantId: assistantId } },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            completedCalls: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalDuration: { $sum: '$duration' },
            totalCost: { $sum: '$cost' },
            averageDuration: { $avg: '$duration' }
          }
        }
      ]);

      return stats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        totalDuration: 0,
        totalCost: 0,
        averageDuration: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Get call statistics for multiple assistants (user stats)
  async getUserCallStats(assistantIds) {
    try {
      const stats = await CallHistory.aggregate([
        { $match: { assistantId: { $in: assistantIds } } },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            completedCalls: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalDuration: { $sum: '$duration' },
            totalCost: { $sum: '$cost' },
            averageDuration: { $avg: '$duration' }
          }
        }
      ]);

      return stats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        totalDuration: 0,
        totalCost: 0,
        averageDuration: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete call history records for an assistant
  async deleteAssistantCallHistory(assistantId) {
    try {
      return await CallHistory.deleteMany({ assistantId: assistantId });
    } catch (error) {
      throw error;
    }
  }

  // Get call history by date range
  async getCallHistoryByDateRange(assistantIds, startDate, endDate, filter = {}) {
    try {
      const query = { 
        assistantId: { $in: assistantIds },
        startedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        ...filter
      };

      return await CallHistory.find(query)
        .sort({ startedAt: -1 })
        .populate('assistantId', 'name');
    } catch (error) {
      throw error;
    }
  }

  // Get call statistics by status
  async getCallStatsByStatus(assistantIds) {
    try {
      const stats = await CallHistory.aggregate([
        { $match: { assistantId: { $in: assistantIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            totalCost: { $sum: '$cost' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Search call history by phone number or metadata
  async searchCallHistory(assistantIds, searchTerm) {
    try {
      const query = {
        assistantId: { $in: assistantIds },
        $or: [
          { phoneNumber: { $regex: searchTerm, $options: 'i' } },
          { 'metadata.customerName': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      return await CallHistory.find(query)
        .sort({ startedAt: -1 })
        .populate('assistantId', 'name');
    } catch (error) {
      throw error;
    }
  }

  // Get recent call history
  async getRecentCallHistory(assistantIds, limit = 5) {
    try {
      return await CallHistory.find({ assistantId: { $in: assistantIds } })
        .sort({ startedAt: -1 })
        .limit(limit)
        .populate('assistantId', 'name');
    } catch (error) {
      throw error;
    }
  }

  // Update call recording URL
  async updateCallRecording(callId, recordingUrl) {
    try {
      return await CallHistory.findOneAndUpdate(
        { callId: callId },
        { recordingUrl: recordingUrl },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Update call transcript
  async updateCallTranscript(callId, transcript) {
    try {
      return await CallHistory.findOneAndUpdate(
        { callId: callId },
        { transcript: transcript },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CallRepository();