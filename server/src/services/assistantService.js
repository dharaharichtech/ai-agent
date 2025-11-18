const bolnaService = require('./bolnaService');
const assistantRepository = require('../repositories/assistantRepository');
const { validationResult } = require('express-validator');

class AssistantService {
  // Validate agent_config data as per Bolna API
  validateAssistantData(req) {
    const errors = [];
    const agentConfig = req.body.agent_config;
    if (!agentConfig) {
      errors.push({ type: 'field', msg: 'agent_config is required', path: 'agent_config', location: 'body' });
    } else {
      if (!agentConfig.agent_name || agentConfig.agent_name.length < 2 || agentConfig.agent_name.length > 100) {
        errors.push({ type: 'field', msg: 'Agent name is required and must be between 2 and 100 characters', path: 'agent_config.agent_name', location: 'body' });
      }
      // Validate system_prompt inside llm_agent
      const llmAgent = agentConfig.tasks?.[0]?.tools_config?.llm_agent;
      if (!llmAgent || !llmAgent.system_prompt) {
        errors.push({ type: 'field', msg: 'System prompt is required', path: 'agent_config.tasks[0].tools_config.llm_agent.system_prompt', location: 'body' });
      }
    }
    if (errors.length > 0) {
      throw new Error(JSON.stringify({ type: 'VALIDATION_ERROR', errors }));
    }
  }

  // Prepare Bolna agent_config data (pass-through)
  prepareBolnaAssistantData(requestData, userId) {
    // Just add userId and createdAt to metadata if present
    if (requestData.agent_config && requestData.agent_config.metadata) {
      requestData.agent_config.metadata.userId = userId;
      requestData.agent_config.metadata.createdAt = new Date().toISOString();
    }
    return requestData.agent_config;
  }


  // Prepare database assistant data
  prepareDatabaseAssistantData(requestData, bolnaAssistantId, userId) {
    return {
      name: requestData.name,
      description: requestData.description || "",
      owner: userId,
      bolnaAssistantId: bolnaAssistantId,
      config: {
        // Store individual fields as per database schema
        provider: requestData.provider || "openai",
        model: requestData.model === "gpt-4o-realtime-preview-2024-12-17" ? "gpt-4o" : requestData.model || "gpt-4o",
        systemPrompt: requestData.systemPrompt,
        voiceProvider: requestData.voice?.provider || requestData.voiceProvider || "11labs",
        voiceId: requestData.voice?.voiceId || requestData.voiceId || "default",
        firstMessage: requestData.firstMessage,
        firstMessageMode: requestData.firstMessageMode || "assistant-speaks-first",
        recordingEnabled: requestData.recordingEnabled ?? true
      },
      metadata: requestData.metadata || {},
      status: "testing",
      syncStatus: "synced"
    };
  }

  // 🔥 MAIN ASSISTANT FUNCTIONS - These are the ones you'll modify most often

  // Create assistant - MAIN FUNCTION
  async createAssistant(req) {
    try {
      this.validateAssistantData(req);

      // 1. Prepare data for Bolna
      const assistantData = this.prepareBolnaAssistantData(req.body, req.user.id);

      // 2. Create assistant in Bolna (will create new agent in Bolna dashboard)
      const bolnaResult = await bolnaService.callCreateAssistantAPI(assistantData);

      if (!bolnaResult.success) {
        console.error('Failed to create assistant in Bolna:', bolnaResult.error);
        // Bolna API fail ho to assistant create na karein, user ko error aur details return karein
        return {
          success: false,
          message: "Failed to create assistant in Bolna",
          error: bolnaResult.error,
          details: bolnaResult.details || null,
          bolnaPayload: assistantData // Debug ke liye payload bhi bhej rahe hain
        };
      }

      // Only create assistant if Bolna API returns success and new agent id
      if (!bolnaResult.data || !bolnaResult.data.id) {
        return {
          success: false,
          message: "Bolna API did not return agent id",
          error: bolnaResult.error || "No agent id returned",
          bolnaPayload: assistantData
        };
      }

      const dbAssistantData = this.prepareDatabaseAssistantData(req.body, bolnaResult.data.id, req.user.id);
      const dbAssistant = await assistantRepository.createAssistant(dbAssistantData);

      console.log(`✅ Assistant created: ${dbAssistant.name} with Bolna agent: ${bolnaResult.data.id}`);

      return {
        success: true,
        message: "Assistant created successfully",
        data: {
          assistant: dbAssistant,
          bolnaData: bolnaResult.data
        }
      };

    } catch (error) {
      console.error("createAssistant Error:", error);
      
      if (error.message.includes('VALIDATION_ERROR')) {
        const errorData = JSON.parse(error.message);
        return {
          success: false,
          message: "Validation failed",
          errors: errorData.errors
        };
      }

      return {
        success: false,
        message: "Failed to create assistant",
        error: error.message
      };
    }
  }

  // Get assistant - MAIN FUNCTION
  async getAssistant(assistantId, userId) {
    try {
      if (!assistantId) {
        return {
          success: false,
          message: 'Assistant ID is required'
        };
      }

      // 1. Get assistant from database
      const dbAssistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);

      if (!dbAssistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // 2. Get fresh data from Bolna (calls bolnaService internally)
      const bolnaResult = await bolnaService.callGetAssistantAPI(dbAssistant.bolnaAssistantId);

      let responseData = {
        assistant: dbAssistant,
        bolnaSyncStatus: bolnaResult.success ? 'synced' : 'error'
      };

      if (bolnaResult.success) {
        responseData.bolnaData = bolnaResult.data;
        
        // Update sync status if successful
        if (dbAssistant.syncStatus !== 'synced') {
          await assistantRepository.updateSyncStatus(dbAssistant._id, 'synced');
        }
      } else {
        responseData.bolnaError = bolnaResult.error;
      }

      return {
        success: true,
        message: 'Assistant retrieved successfully',
        data: responseData
      };

    } catch (error) {
      console.error('getAssistant Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve assistant',
        error: error.message
      };
    }
  }

  // Update assistant - MAIN FUNCTION
  async updateAssistant(req) {
    try {
      const { assistantId } = req.params;
      
      if (!assistantId) {
        return {
          success: false,
          message: 'Assistant ID is required'
        };
      }

      this.validateAssistantData(req);

      // 1. Get assistant from database
      const dbAssistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, req.user.id);

      if (!dbAssistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // 2. Prepare Bolna update data
      const bolnaUpdateData = this.prepareBolnaUpdateData(req.body, dbAssistant);

      // 3. Send updates to Bolna if needed (calls bolnaService internally)
      let bolnaResult = { success: true };
      if (Object.keys(bolnaUpdateData).length > 0) {
        bolnaResult = await bolnaService.callUpdateAssistantAPI(dbAssistant.bolnaAssistantId, bolnaUpdateData);

        if (!bolnaResult.success) {
          return {
            success: false,
            message: 'Failed to update assistant in Bolna',
            error: bolnaResult.error
          };
        }
      }

      // 4. Update database record
      const updateFields = this.prepareDatabaseUpdateData(req.body, dbAssistant);
      
      const updatedAssistant = await assistantRepository.updateAssistantById(
        assistantId,
        { ...updateFields, syncStatus: 'synced', lastSyncDate: new Date() }
      );

      return {
        success: true,
        message: 'Assistant updated successfully',
        data: {
          assistant: updatedAssistant,
          bolnaData: bolnaResult.data
        }
      };

    } catch (error) {
      console.error('updateAssistant Error:', error);
      
      if (error.message.includes('VALIDATION_ERROR')) {
        const errorData = JSON.parse(error.message);
        return {
          success: false,
          message: "Validation failed",
          errors: errorData.errors
        };
      }

      return {
        success: false,
        message: 'Failed to update assistant',
        error: error.message
      };
    }
  }

  // Delete assistant - MAIN FUNCTION
  async deleteAssistant(assistantId, userId) {
    try {
      if (!assistantId) {
        return {
          success: false,
          message: 'Assistant ID is required'
        };
      }

      // 1. Get assistant from database
      const dbAssistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);

      if (!dbAssistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // 2. Delete from Bolna first (calls bolnaService internally)
      const bolnaResult = await bolnaService.callDeleteAssistantAPI(dbAssistant.bolnaAssistantId);
      
      // 3. Delete from database regardless of Bolna result
      await assistantRepository.deleteAssistantById(assistantId);

      return {
        success: true,
        message: 'Assistant deleted successfully',
        data: {
          bolnaDeleted: bolnaResult.success,
          bolnaError: bolnaResult.success ? null : bolnaResult.error
        }
      };

    } catch (error) {
      console.error('deleteAssistant Error:', error);
      return {
        success: false,
        message: 'Failed to delete assistant',
        error: error.message
      };
    }
  }

  // 🔧 HELPER FUNCTIONS - You'll rarely need to modify these

  // Get user assistants with pagination and filtering
  async getUserAssistants(userId, queryParams) {
    try {
      const { 
        status, 
        type, 
        page = 1, 
        limit = 10,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = queryParams;

      const skip = (page - 1) * limit;
      const filter = {};

      // Apply filters
      if (status) filter.status = status;
      if (type) filter['metadata.type'] = type;

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get assistants and summary
      const { assistants, total } = await assistantRepository.getUserAssistants(
        userId, filter, sort, skip, parseInt(limit)
      );

      const summary = await assistantRepository.getUserAssistantsSummary(userId);

      return {
        success: true,
        message: 'Assistants retrieved successfully',
        data: {
          assistants,
          summary
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: assistants.length,
          totalRecords: total
        }
      };

    } catch (error) {
      console.error('getUserAssistants Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve assistants',
        error: error.message
      };
    }
  }

  // Get assistant statistics
  async getAssistantStats(assistantId, userId) {
    try {
      const dbAssistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);

      if (!dbAssistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      const stats = await assistantRepository.getAssistantStats(assistantId);

      return {
        success: true,
        message: 'Assistant statistics retrieved successfully',
        data: {
          assistant: {
            id: dbAssistant._id,
            name: dbAssistant.name,
            type: dbAssistant.metadata.type
          },
          stats
        }
      };

    } catch (error) {
      console.error('getAssistantStats Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve assistant statistics',
        error: error.message
      };
    }
  }

  // 🔧 HELPER FUNCTIONS - Rarely modified

  // Prepare Bolna update data
  prepareBolnaUpdateData(requestData, dbAssistant) {
    const vapiUpdateData = {};

    // Name update
    if (requestData.name) {
      vapiUpdateData.name = requestData.name;
    }

    // System Prompt update
    if (requestData.systemPrompt) {
      vapiUpdateData.model = {
        provider: requestData.provider || dbAssistant.config.provider,
        model: requestData.model || dbAssistant.config.model,
        messages: [
          {
            role: 'system',
            content: requestData.systemPrompt
          }
        ]
      };
    }

    // Voice update
    if (requestData.voiceProvider || requestData.voiceId) {
      vapiUpdateData.voice = {
        provider: requestData.voiceProvider || dbAssistant.config.voiceProvider,
        voiceId: requestData.voiceId || dbAssistant.config.voiceId
      };
    }

    // First Message update
    if (requestData.firstMessage) {
      vapiUpdateData.firstMessage = requestData.firstMessage;
      vapiUpdateData.firstMessageMode = requestData.firstMessageMode || "assistant-speaks-first";
    }

    return vapiUpdateData;
  }

  // Prepare database update data
  prepareDatabaseUpdateData(requestData, dbAssistant) {
    const updateFields = {};

    if (requestData.name) updateFields.name = requestData.name;
    if (requestData.description) updateFields.description = requestData.description;
    if (requestData.status) updateFields.status = requestData.status;

    updateFields.config = {
      ...dbAssistant.config,
      ...(requestData.provider && { provider: requestData.provider }),
      ...(requestData.model && { model: requestData.model }),
      ...(requestData.systemPrompt && { systemPrompt: requestData.systemPrompt }),
      ...(requestData.voiceProvider && { voiceProvider: requestData.voiceProvider }),
      ...(requestData.voiceId && { voiceId: requestData.voiceId }),
      ...(requestData.firstMessage && { firstMessage: requestData.firstMessage }),
      ...(requestData.recordingEnabled !== undefined && { recordingEnabled: requestData.recordingEnabled })
    };

    // Update metadata
    if (requestData.metadata) {
      updateFields.metadata = {
        ...dbAssistant.metadata,
        ...requestData.metadata
      };
    }

    return updateFields;
  }

  // 📞 BOLNA WRAPPER FUNCTIONS - These just call bolnaService

  // Get public key (agent ID) for client-side usage
  async getPublicKey() {
    try {
      const publicKey = bolnaService.getPublicKey();
      
      if (publicKey) {
        return {
          success: true,
          message: 'Public key retrieved successfully',
          data: { publicKey }
        };
      } else {
        return {
          success: false,
          message: 'Public key not configured'
        };
      }

    } catch (error) {
      console.error('getPublicKey Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve public key',
        error: error.message
      };
    }
  }

  // Test Bolna connection
  async testBolnaConnection() {
    try {
      console.log('Testing Bolna connection...');
      const result = await bolnaService.testConnection();
      
      return {
        success: true,
        message: 'Bolna connection test completed',
        data: result
      };

    } catch (error) {
      console.error('Bolna connection test failed:', error);
      return {
        success: false,
        message: 'Bolna connection test failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  // Verify and sync a specific assistant with Bolna
  async verifyAndSyncAssistant(assistantId, userId) {
    try {
      // Get assistant from database
      const assistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);
      
      if (!assistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // Check if assistant exists in Bolna
      const bolnaResult = await bolnaService.callGetAssistantAPI(assistant.bolnaAssistantId);
      
      if (bolnaResult.success) {
        // Assistant exists in Bolna - update sync status
        await assistantRepository.updateAssistantById(assistantId, {
          syncStatus: 'synced',
          lastSyncDate: new Date(),
          lastSyncError: null
        });

        return {
          success: true,
          message: 'Assistant is in sync with Bolna',
          data: {
            assistantId: assistant._id,
            name: assistant.name,
            bolnaAssistantId: assistant.bolnaAssistantId,
            syncStatus: 'synced',
            bolnaData: bolnaResult.data
          }
        };
      } else {
        // Assistant does not exist in Bolna - mark as out of sync
        await assistantRepository.updateAssistantById(assistantId, {
          syncStatus: 'out-of-sync',
          lastSyncError: 'Assistant not found in Bolna - needs to be re-created'
        });

        return {
          success: false,
          message: `Assistant "${assistant.name}" is NOT in sync. It needs to be re-created in Bolna.`,
          data: {
            assistantId: assistant._id,
            name: assistant.name,
            bolnaAssistantId: assistant.bolnaAssistantId,
            syncStatus: 'out-of-sync',
            error: bolnaResult.error,
            solution: 'Please delete and re-create this assistant'
          }
        };
      }

    } catch (error) {
      console.error('verifyAndSyncAssistant Error:', error);
      return {
        success: false,
        message: 'Failed to verify assistant sync',
        error: error.message
      };
    }
  }

  // Check sync status for all user's assistants
  async checkAllAssistantsSync(userId) {
    try {
      const assistants = await assistantRepository.getAssistantsByOwner(userId);
      
      if (assistants.length === 0) {
        return {
          success: true,
          message: 'No assistants found',
          data: {
            total: 0,
            synced: 0,
            outOfSync: 0,
            assistants: []
          }
        };
      }

      const results = [];
      let syncedCount = 0;
      let outOfSyncCount = 0;

      for (const assistant of assistants) {
        // Check each assistant in Bolna
        const bolnaResult = await bolnaService.callGetAssistantAPI(assistant.bolnaAssistantId);
        
        const syncStatus = bolnaResult.success ? 'synced' : 'out-of-sync';
        
        if (syncStatus === 'synced') {
          syncedCount++;
        } else {
          outOfSyncCount++;
        }

        // Update database
        await assistantRepository.updateAssistantById(assistant._id, {
          syncStatus: syncStatus,
          lastSyncDate: new Date(),
          lastSyncError: bolnaResult.success ? null : 'Assistant not found in Bolna'
        });

        results.push({
          assistantId: assistant._id,
          name: assistant.name,
          bolnaAssistantId: assistant.bolnaAssistantId,
          syncStatus: syncStatus,
          inBolna: bolnaResult.success,
          error: bolnaResult.success ? null : bolnaResult.error
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        message: 'Assistant sync check completed',
        data: {
          total: assistants.length,
          synced: syncedCount,
          outOfSync: outOfSyncCount,
          assistants: results
        }
      };

    } catch (error) {
      console.error('checkAllAssistantsSync Error:', error);
      return {
        success: false,
        message: 'Failed to check assistants sync',
        error: error.message
      };
    }
  }
}

module.exports = new AssistantService();