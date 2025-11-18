const Assistant = require('../models/Assistant');

class AssistantRepository {
  // Create a new assistant in database
  async createAssistant(assistantData) {
    try {
      const assistant = new Assistant(assistantData);
      return await assistant.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all assistants for a user with filtering and pagination
  async getUserAssistants(userId, filter = {}, sort = {}, skip = 0, limit = 10) {
    try {
      const query = { owner: userId, ...filter };
      
      const assistants = await Assistant.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Assistant.countDocuments(query);

      return { assistants, total };
    } catch (error) {
      throw error;
    }
  }

  // Get assistant by ID and owner
  async getAssistantByIdAndOwner(assistantId, userId) {
    try {
      return await Assistant.findOne({
        _id: assistantId,
        owner: userId
      });
    } catch (error) {
      throw error;
    }
  }

  // Get assistant by ID only
  async getAssistantById(assistantId) {
    try {
      return await Assistant.findById(assistantId);
    } catch (error) {
      throw error;
    }
  }

  // Get assistant by Bolna Assistant ID
  async getAssistantByBolnaId(bolnaAssistantId) {
    try {
      return await Assistant.findOne({
        bolnaAssistantId: bolnaAssistantId
      });
    } catch (error) {
      throw error;
    }
  }

  // Update assistant by ID
  async updateAssistantById(assistantId, updateData) {
    try {
      return await Assistant.findByIdAndUpdate(
        assistantId,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Alias for updateAssistantById (for consistency)
  async updateAssistant(assistantId, updateData) {
    return await this.updateAssistantById(assistantId, updateData);
  }

  // Delete assistant by ID
  async deleteAssistantById(assistantId) {
    try {
      return await Assistant.findByIdAndDelete(assistantId);
    } catch (error) {
      throw error;
    }
  }

  // Get assistants summary for a user
  async getUserAssistantsSummary(userId) {
    try {
      const assistants = await Assistant.find({ owner: userId });

      const summary = {
        total: assistants.length,
        active: assistants.filter(a => a.status === 'active').length,
        inactive: assistants.filter(a => a.status === 'inactive').length,
        testing: assistants.filter(a => a.status === 'testing').length,
        archived: assistants.filter(a => a.status === 'archived').length,
        totalCalls: assistants.reduce((sum, a) => sum + (a.stats?.totalCalls || 0), 0),
        totalCallDuration: assistants.reduce((sum, a) => sum + (a.stats?.totalCallDuration || 0), 0)
      };

      return summary;
    } catch (error) {
      throw error;
    }
  }

  // Get assistants by owner (all assistants for a user)
  async getAssistantsByOwner(userId) {
    try {
      return await Assistant.find({ owner: userId });
    } catch (error) {
      throw error;
    }
  }

  // Update assistant call stats
  async updateAssistantCallStats(assistantId, duration, isSuccessful) {
    try {
      const assistant = await Assistant.findById(assistantId);
      if (assistant) {
        await assistant.updateCallStats(duration, isSuccessful);
        return assistant;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update sync status
  async updateSyncStatus(assistantId, syncStatus, lastSyncDate = new Date()) {
    try {
      return await Assistant.findByIdAndUpdate(
        assistantId,
        { 
          syncStatus: syncStatus,
          lastSyncDate: lastSyncDate 
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Search assistants by various criteria
  async searchAssistants(userId, searchCriteria = {}) {
    try {
      const query = { owner: userId };
      
      if (searchCriteria.name) {
        query.name = { $regex: searchCriteria.name, $options: 'i' };
      }
      
      if (searchCriteria.status) {
        query.status = searchCriteria.status;
      }
      
      if (searchCriteria.type) {
        query['metadata.type'] = searchCriteria.type;
      }

      return await Assistant.find(query);
    } catch (error) {
      throw error;
    }
  }

  // Get assistant stats
  async getAssistantStats(assistantId) {
    try {
      const assistant = await Assistant.findById(assistantId);
      if (assistant) {
        return assistant.getPerformanceMetrics();
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AssistantRepository();