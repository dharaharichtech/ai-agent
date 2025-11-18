const bolnaService = require('./bolnaService');
const callRepository = require('../repositories/callRepository');
const assistantRepository = require('../repositories/assistantRepository');
const leadRepository = require('../repositories/leadRepository');

class CallService {
  constructor() {
    // Bolna handles phone numbers differently
    this.agentId = process.env.BOLNA_AGENT_ID || '2632f810-8d83-4296-a27a-a2ac166a2743';
  }

  // Handle Bolna webhooks
  async handleWebhook(webhookData) {
    try {
      console.log('Bolna Webhook received:', JSON.stringify(webhookData, null, 2));
      
      const { type, data } = webhookData;
      
      // Process webhook data based on event type
      switch (type) {
        case 'call-started':
          console.log('Call started:', data);
          await this.handleCallStarted(data);
          break;
          
        case 'call-ended':
          console.log('Call ended:', data);
          await this.handleCallEnded(data);
          break;
          
        case 'call-status-update':
          console.log('Call status update:', data);
          await this.handleCallStatusUpdate(data);
          break;
          
        case 'function-call':
          console.log('Function call:', data);
          break;
          
        default:
          console.log('Unknown webhook type:', type);
      }

      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      console.error('handleWebhook Error:', error);
      return {
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      };
    }
  }

  // Handle call started event
  async handleCallStarted(data) {
    try {
      console.log('Processing call started event:', data);
      
      // Find assistant by Bolna ID
      const assistant = await assistantRepository.getAssistantByBolnaId(data.assistantId);

      if (!assistant) {
        console.warn('Assistant not found for call started event:', data.assistantId);
        return;
      }

      // Create call history record
      const callHistoryData = {
        callId: data.id,
        assistantId: assistant._id,
        phoneNumber: data.customer?.number || 'Unknown',
        status: 'in-progress',
        startedAt: new Date(),
        metadata: data.metadata || {},
        bolnaCallData: data
      };

      await callRepository.createCallHistory(callHistoryData);
      console.log('Call history created for call:', data.id);

      // Update lead status to "connected" when call starts
      const callHistory = await callRepository.getCallHistoryByCallId(data.id);
      await this.updateLeadStatusFromCall(callHistory, 'connected', data);

    } catch (error) {
      console.error('Error handling call started:', error);
      throw error;
    }
  }

  // Handle call ended event
  async handleCallEnded(data) {
    try {
      console.log('Processing call ended event:', data);
      
      // Find existing call history or create new one
      let callHistory = await callRepository.getCallHistoryByCallId(data.id);
      
      if (!callHistory) {
        // If no call history exists, try to find assistant and create record
        const assistant = await assistantRepository.getAssistantByBolnaId(data.assistantId);
        
        if (assistant) {
          const callHistoryData = {
            callId: data.id,
            assistantId: assistant._id,
            phoneNumber: data.customer?.number || 'Unknown',
            startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
            metadata: data.metadata || {},
            bolnaCallData: data
          };
          
          callHistory = await callRepository.createCallHistory(callHistoryData);
        } else {
          console.warn('Assistant not found for call ended event:', data.assistantId);
          return;
        }
      }

      // Update call history with end data
      const updateData = {
        status: this.getCallStatus(data.endedReason, data.durationSeconds),
        endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
        duration: data.durationSeconds || 0,
        cost: data.cost || 0,
        bolnaCallData: data
      };

      console.log(`📊 Call ended - Duration: ${data.durationSeconds}s, Reason: ${data.endedReason}, Final Status: ${updateData.status}`);

      // Store recording URL if available
      if (data.recordingUrl) {
        updateData.recordingUrl = data.recordingUrl;
        console.log('Recording URL stored:', data.recordingUrl);
      }
      
      // Store transcript if available
      if (data.transcript) {
        updateData.transcript = data.transcript;
      }

      await callRepository.updateCallHistoryByCallId(data.id, updateData);
      console.log('Call history updated for call:', data.id);

      // Update assistant stats if we have the assistant
      if (callHistory.assistantId) {
        try {
          const successful = data.endedReason !== 'error';
          await assistantRepository.updateAssistantCallStats(
            callHistory.assistantId, 
            updateData.duration, 
            successful
          );
          console.log('Assistant stats updated');
        } catch (statsError) {
          console.error('Error updating assistant stats:', statsError);
          // Continue processing even if stats update fails
        }
      }

      // Update lead status if this call was associated with a lead
      console.log('🔄 About to update lead status for call:', callHistory?.callId, 'with status:', updateData.status);
      await this.updateLeadStatusFromCall(callHistory, updateData.status, data);
      console.log('✅ Lead status update completed');

    } catch (error) {
      console.error('Error handling call ended:', error);
      throw error;
    }
  }

  // Handle call status update event
  async handleCallStatusUpdate(data) {
    try {
      console.log('Processing call status update event:', data);
      
      // Try to find existing call history
      let callHistory = await callRepository.getCallHistoryByCallId(data.id);
      
      if (!callHistory) {
        console.log('No existing call history found for status update, skipping...');
        return;
      }

      // Update call status based on the data
      const updateData = {
        status: data.status || 'in-progress',
        bolnaCallData: data
      };

      // If there's duration info, update it
      if (data.durationSeconds) {
        updateData.duration = data.durationSeconds;
      }

      // Update call history
      await callRepository.updateCallHistoryByCallId(data.id, updateData);
      console.log('Call history status updated for call:', data.id);

      // Update lead status if available
      await this.updateLeadStatusFromCall(callHistory, updateData.status, data);

    } catch (error) {
      console.error('Error handling call status update:', error);
      throw error;
    }
  }

  // Helper method to determine call status from ended reason and duration
  getCallStatus(endedReason, durationSeconds = 0) {
    // If call duration is more than 30 seconds, consider it completed regardless of end reason
    if (durationSeconds >= 30) {
      console.log(`✅ Call duration ${durationSeconds}s >= 30s, marking as completed`);
      return 'completed';
    }
    
    switch (endedReason) {
      case 'customer-ended-call':
      case 'assistant-ended-call':
        return 'completed';
      case 'customer-did-not-answer':
        return 'no-answer';
      case 'customer-busy':
        return 'busy';
      case 'error':
      case 'assistant-error':
        return 'failed';
      default:
        // If duration is provided but less than 30s, still mark as completed if it ended normally
        return durationSeconds > 0 ? 'completed' : 'failed';
    }
  }

  // Get call history for an assistant
  async getAssistantCallHistory(assistantId, userId, queryParams) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        startDate,
        endDate 
      } = queryParams;

      const skip = (page - 1) * limit;
      
      // Verify assistant ownership
      const assistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);

      if (!assistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // Build query filter
      const filter = {};
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.startedAt = {};
        if (startDate) filter.startedAt.$gte = new Date(startDate);
        if (endDate) filter.startedAt.$lte = new Date(endDate);
      }

      // Get call history
      const { callHistory, total } = await callRepository.getAssistantCallHistory(
        assistantId, filter, { startedAt: -1 }, skip, parseInt(limit)
      );

      // Get summary stats
      const stats = await callRepository.getAssistantCallStats(assistant._id);

      return {
        success: true,
        message: 'Call history retrieved successfully',
        data: {
          callHistory,
          stats
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: callHistory.length,
          totalRecords: total
        }
      };

    } catch (error) {
      console.error('getAssistantCallHistory Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve call history',
        error: error.message
      };
    }
  }

  // Get all call history for user (across all assistants)
  async getAllUserCallHistory(userId, queryParams) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        startDate,
        endDate,
        assistantId 
      } = queryParams;

      const skip = (page - 1) * limit;

      // Get all assistants for the user first
      const userAssistants = await assistantRepository.getAssistantsByOwner(userId);
      let assistantIds = userAssistants.map(a => a._id);

      // If specific assistant filter is provided, use only that assistant
      if (assistantId && assistantId.trim() !== '') {
        // Verify the assistant belongs to the user
        const isOwner = assistantIds.some(id => id.toString() === assistantId);
        if (!isOwner) {
          return {
            success: false,
            message: 'Assistant not found or access denied'
          };
        }
        // Filter to only the selected assistant
        assistantIds = assistantIds.filter(id => id.toString() === assistantId);
      }

      // Build query filter
      const filter = {};
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.startedAt = {};
        if (startDate) filter.startedAt.$gte = new Date(startDate);
        if (endDate) filter.startedAt.$lte = new Date(endDate);
      }

      // Get call history
      const { callHistory, total } = await callRepository.getUserCallHistory(
        assistantIds, filter, { startedAt: -1 }, skip, parseInt(limit)
      );

      // Get summary stats
      const stats = await callRepository.getUserCallStats(assistantIds);

      return {
        success: true,
        message: 'All call history retrieved successfully',
        data: {
          callHistory,
          stats
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: callHistory.length,
          totalRecords: total
        }
      };

    } catch (error) {
      console.error('getAllUserCallHistory Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve call history',
        error: error.message
      };
    }
  }

  // Get specific call recording
  async getCallRecording(callId, userId) {
    try {
      // Find call history with populated assistant details
      const callHistory = await callRepository.getCallHistoryWithAssistant(callId);

      if (!callHistory) {
        return {
          success: false,
          message: 'Call not found'
        };
      }

      // Verify ownership
      if (callHistory.assistantId.owner.toString() !== userId) {
        return {
          success: false,
          message: 'Access denied'
        };
      }

      if (!callHistory.recordingUrl) {
        return {
          success: false,
          message: 'Recording not available for this call'
        };
      }

      return {
        success: true,
        message: 'Call recording retrieved successfully',
        data: {
          callId: callHistory.callId,
          recordingUrl: callHistory.recordingUrl,
          duration: callHistory.duration,
          phoneNumber: callHistory.phoneNumber,
          status: callHistory.status,
          startedAt: callHistory.startedAt,
          endedAt: callHistory.endedAt,
          transcript: callHistory.transcript
        }
      };

    } catch (error) {
      console.error('getCallRecording Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve call recording',
        error: error.message
      };
    }
  }

  // Create a call with assistant
  async createCall(callData, userId) {
    try {
      const { assistantId } = callData;

      if (!assistantId) {
        return {
          success: false,
          message: 'Assistant ID is required'
        };
      }

      let dbAssistant = null;

      // Check if assistantId is MongoDB ObjectId or Bolna UUID
      if (/^[0-9a-fA-F]{24}$/.test(assistantId)) {
        dbAssistant = await assistantRepository.getAssistantByIdAndOwner(assistantId, userId);
      } else {
        dbAssistant = await assistantRepository.getAssistantByBolnaId(assistantId);
      }

      if (!dbAssistant) {
        return {
          success: false,
          message: 'Assistant not found'
        };
      }

      // Validate that assistant exists in Bolna
      console.log(`🔍 Validating assistant in Bolna: ${dbAssistant.bolnaAssistantId}`);
      const bolnaCheck = await bolnaService.callGetAssistantAPI(dbAssistant.bolnaAssistantId);
      if (!bolnaCheck.success) {
        console.error(`❌ Assistant not found in Bolna: ${dbAssistant.bolnaAssistantId}`);
        
        // Update sync status
        await assistantRepository.updateAssistantById(dbAssistant._id, {
          syncStatus: 'out-of-sync',
          lastSyncError: 'Assistant not found in Bolna - needs re-sync'
        });
        
        return {
          success: false,
          message: `Assistant "${dbAssistant.name}" is not synced with Bolna. Please re-sync or re-create the assistant.`,
          error: 'Assistant not found in Bolna',
          requiresResync: true
        };
      }
      console.log(`✅ Assistant validated in Bolna: ${dbAssistant.name}`);

      // Prepare call data for Bolna
      const bolnaCallData = {
        assistantId: dbAssistant.bolnaAssistantId,  // Always send Bolna ID to Bolna
        customer: callData.customer,
        name: callData.name,
        metadata: {
          ...callData.metadata,
          dbAssistantId: dbAssistant._id.toString(),
          userId: userId,
          createdAt: new Date().toISOString()
        }
      };

      const result = await bolnaService.callCreateCallAPI(bolnaCallData);

      if (result.success) {
        // Create initial call history record immediately
        try {
          // Generate call ID if Bolna doesn't provide one
          const callId = result.data?.id || `bolna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const callHistoryData = {
            callId: callId, // Use Bolna call ID or generate one
            assistantId: dbAssistant._id,
            phoneNumber: callData.customer?.number || 'Unknown',
            status: 'initiated',
            startedAt: new Date(),
            metadata: bolnaCallData.metadata,
            bolnaCallData: result.data || {}
          };

          await callRepository.createCallHistory(callHistoryData);
          console.log('Initial call history created for call:', callId);
          
          // Add call ID to result if generated
          if (!result.data?.id) {
            result.data = { ...result.data, id: callId };
          }
        } catch (historyError) {
          console.error('Error creating call history:', historyError);
          // Don't fail the entire operation if history creation fails
        }

        // Update assistant call stats (will be updated again when call ends)
        await assistantRepository.updateAssistantCallStats(dbAssistant._id, 0, true);
      }

      return result;

    } catch (error) {
      console.error('createCall Error:', error);
      return {
        success: false,
        message: 'Failed to create call',
        error: error.message
      };
    }
  }

  // Get call statistics by date range
  async getCallStatsByDateRange(userId, startDate, endDate) {
    try {
      const userAssistants = await assistantRepository.getAssistantsByOwner(userId);
      const assistantIds = userAssistants.map(a => a._id);

      const callHistory = await callRepository.getCallHistoryByDateRange(
        assistantIds, startDate, endDate
      );

      const stats = await callRepository.getUserCallStats(assistantIds);
      const statusStats = await callRepository.getCallStatsByStatus(assistantIds);

      return {
        success: true,
        message: 'Call statistics retrieved successfully',
        data: {
          callHistory,
          stats,
          statusBreakdown: statusStats
        }
      };

    } catch (error) {
      console.error('getCallStatsByDateRange Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve call statistics',
        error: error.message
      };
    }
  }

  // Search call history
  async searchCallHistory(userId, searchTerm, queryParams = {}) {
    try {
      const { assistantId } = queryParams;
      
      const userAssistants = await assistantRepository.getAssistantsByOwner(userId);
      let assistantIds = userAssistants.map(a => a._id);

      // If specific assistant filter is provided, use only that assistant
      if (assistantId && assistantId.trim() !== '') {
        // Verify the assistant belongs to the user
        const isOwner = assistantIds.some(id => id.toString() === assistantId);
        if (!isOwner) {
          return {
            success: false,
            message: 'Assistant not found or access denied'
          };
        }
        // Filter to only the selected assistant
        assistantIds = assistantIds.filter(id => id.toString() === assistantId);
      }

      const callHistory = await callRepository.searchCallHistory(assistantIds, searchTerm);

      return {
        success: true,
        message: 'Call search completed successfully',
        data: {
          callHistory,
          searchTerm,
          count: callHistory.length
        }
      };

    } catch (error) {
      console.error('searchCallHistory Error:', error);
      return {
        success: false,
        message: 'Failed to search call history',
        error: error.message
      };
    }
  }

  // Get recent calls for dashboard
  async getRecentCalls(userId, limit = 5) {
    try {
      const userAssistants = await assistantRepository.getAssistantsByOwner(userId);
      const assistantIds = userAssistants.map(a => a._id);

      const recentCalls = await callRepository.getRecentCallHistory(assistantIds, limit);

      // Check VAPI for updated call statuses and sync our database
      const updatedCalls = await Promise.all(
        recentCalls.map(async (call) => {
          try {
            // Only check calls that are still in progress - ignore completed/failed calls
            if (call.status === 'initiated' || call.status === 'in-progress' || call.status === 'ringing') {
              console.log(`Checking Bolna status for call: ${call.callId}`);
              const bolnaResult = await bolnaService.callGetCallAPI(call.callId);
              
              if (bolnaResult.success) {
                const bolnaCall = bolnaResult.data;
                console.log(`Bolna call status: ${bolnaCall.status}, endedReason: ${bolnaCall.endedReason}, duration: ${bolnaCall.durationSeconds}s`);
                
                // If Bolna shows call is ended, update our database
                if (bolnaCall.status === 'ended') {
                  const finalStatus = this.getCallStatus(bolnaCall.endedReason, bolnaCall.durationSeconds);
                  
                  await callRepository.updateCallHistoryByCallId(call.callId, {
                    status: finalStatus,
                    endedAt: bolnaCall.endedAt ? new Date(bolnaCall.endedAt) : new Date(),
                    duration: bolnaCall.durationSeconds || 0,
                    cost: bolnaCall.cost || 0,
                    bolnaCallData: bolnaCall
                  });
                  
                  console.log(`Updated call ${call.callId} to status: ${finalStatus} (duration: ${bolnaCall.durationSeconds}s)`);
                  
                  // Update lead status when call ends
                  try {
                    console.log('🔄 About to update lead status for call:', call.callId, 'with status:', finalStatus);
                    await this.updateLeadStatusFromCall(call, finalStatus, bolnaCall);
                    console.log('✅ Lead status update completed');
                  } catch (leadError) {
                    console.error('❌ Error updating lead status:', leadError);
                  }
                  
                  // Return updated call data
                  return {
                    ...call,
                    status: finalStatus,
                    endedReason: bolnaCall.endedReason,
                    duration: bolnaCall.durationSeconds || 0
                  };
                }
              }
            } else {
              // For completed/failed calls, don't check Bolna again
              console.log(`Skipping Bolna check for already finished call: ${call.callId} (status: ${call.status})`);
            }
            return call;
          } catch (error) {
            console.error(`Error checking Bolna status for call ${call.callId}:`, error);
            return call;
          }
        })
      );

      return {
        success: true,
        message: 'Recent calls retrieved successfully',
        data: updatedCalls
      };

    } catch (error) {
      console.error('getRecentCalls Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve recent calls',
        error: error.message
      };
    }
  }

  // Update lead status based on call events
  async updateLeadStatusFromCall(callHistory, callStatus, vapiData) {
    try {
      console.log('\n=== Updating Lead Status ===');
      console.log('📞 Call ID:', callHistory?.callId);
      console.log('📱 Phone Number:', callHistory?.phoneNumber);
      console.log('📊 Call Status:', callStatus);
      console.log('⏱️ Duration:', callHistory?.duration || vapiData?.durationSeconds, 'seconds');
      console.log('🔚 End Reason:', vapiData?.endedReason);
      
      if (!callHistory || !callHistory.phoneNumber) {
        console.log('❌ No call history or phone number to update lead status');
        return;
      }

      // Clean phone number and find matching lead
      const cleanPhone = callHistory.phoneNumber.replace(/\D/g, '');
      const phoneVariants = [
        callHistory.phoneNumber,
        cleanPhone,
        `+91${cleanPhone.replace(/^91/, '')}`,
        cleanPhone.replace(/^91/, '')
      ];

      console.log('🔍 Searching for lead with phone variants:', phoneVariants);

      // Try to find lead with any phone number variant
      let lead = null;
      for (const phone of phoneVariants) {
        lead = await leadRepository.getLeadByPhone(phone);
        if (lead) {
          console.log('✅ Found lead:', lead._id, 'with phone:', phone);
          break;
        }
      }

      if (!lead) {
        console.log(`❌ No lead found for phone: ${callHistory.phoneNumber}`);
        console.log('📋 Available phone variants tried:', phoneVariants);
        return;
      }
      // Map call status to lead status
      const statusMapping = {
        'in-progress': 'connected',
        'connected': 'connected', 
        'completed': 'completed',
        'failed': 'failed',
        'no-answer': 'failed',
        'busy': 'failed',
        'cancelled': 'failed'
      };

      const newStatus = statusMapping[callStatus] || 'pending';

      // Fetch latest lead from DB to avoid overwriting a newer completed status
      const freshLead = await leadRepository.findById(lead._id);
      if (freshLead) {
        // If lead is already completed or connected (and new status is not completed), never downgrade it
        if ((freshLead.callConnectionStatus === 'completed' || freshLead.callConnectionStatus === 'connected') && 
            !['completed', 'connected'].includes(newStatus)) {
          console.log(`ℹLead ${lead._id} is already '${freshLead.callConnectionStatus}' — skipping downgrade to '${newStatus}'`);
          return;
        }
        
        // Also prevent downgrading from connected to failed unless it's actually a failure
        if (freshLead.callConnectionStatus === 'connected' && newStatus === 'failed' && 
            !['no-answer', 'busy', 'cancelled'].includes(callStatus)) {
          console.log(`ℹ️ Lead ${lead._id} is 'connected' — not downgrading to 'failed' for status '${callStatus}'`);
          return;
        }
      }

      console.log(`🔄 Updating lead ${lead._id} status from '${freshLead.callConnectionStatus}' to '${newStatus}'`);

      // Update lead with new status, last call time and call data
      const updatePayload = {
        callConnectionStatus: newStatus,
        lastCallData: {
          callId: callHistory.callId,
          status: callStatus,
          startedAt: callHistory.startedAt,
          endedAt: callHistory.endedAt,
          duration: callHistory.duration || vapiData?.durationSeconds || 0,
          vapiData: vapiData
        },
        lastCallTime: new Date(),
        updatedAt: new Date()
      };

      // Reset auto-call attempts when call is successful (completed or connected)
      if (newStatus === 'completed' || newStatus === 'connected') {
        updatePayload.autoCallAttempts = 0;
        updatePayload.callCycleStartTime = null;
        console.log(`✅ Call successful! Resetting auto-call attempts for lead ${lead._id}`);
        console.log(`📊 Call Duration: ${updatePayload.lastCallData.duration}s`);
      } else {
        console.log(`⚠️ Call status: ${newStatus} - attempts NOT reset`);
      }

      const updateResult = await leadRepository.update(lead._id, updatePayload);

      if (updateResult) {
        console.log(`✅ Lead status updated successfully!`);
        console.log(`   Lead ID: ${lead._id}`);
        console.log(`   New Status: ${newStatus}`);
        console.log(`   Auto-call Attempts: ${updatePayload.autoCallAttempts !== undefined ? updatePayload.autoCallAttempts : 'unchanged'}`);
        console.log(`   Duration: ${updatePayload.lastCallData.duration}s`);
        console.log('================================\n');
      } else {
        console.log(`❌ Failed to update lead status: ${lead._id}`);
      }
      
    } catch (error) {
      console.error('Error updating lead status from call:', error);
      // Don't throw error as this shouldn't break webhook processing
    }
  }
}

module.exports = new CallService();