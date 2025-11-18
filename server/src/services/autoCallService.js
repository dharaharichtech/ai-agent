const callService = require('./callService');
const leadRepository = require('../repositories/leadRepository');
const assistantRepository = require('../repositories/assistantRepository');

class AutoCallService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.callDelay = 60000; // 1 minute between checks
    this.maxCallsPerBatch = 10; // Maximum calls per batch
    this.lastCheckTime = null;
    this.totalCalls = 0;
    this.processedLeads = new Set(); // To avoid calling same lead repeatedly
    
    // Auto-start the service when server starts (after 15 seconds to allow server to fully initialize)
    setTimeout(() => {
      this.autoStartService();
    }, 15000);
  }

  // Automatically start the background monitoring service
  async autoStartService() {
    try {
      console.log('🤖 Auto Call Service: Starting automatic background monitoring...');
      console.log('📞 Will check for pending/failed leads every 1 minute');
      console.log('🎯 Target statuses: pending, failed');
      
      this.isRunning = true;
      this.lastCheckTime = new Date();
      
      // Start the monitoring loop
      this.intervalId = setInterval(async () => {
        await this.checkAndCallLeads();
      }, this.callDelay);
      
      // Initial check after 5 seconds
      setTimeout(() => {
        this.checkAndCallLeads();
      }, 5000);
      
      console.log('✅ Auto Call Service: Background monitoring started successfully');
      
    } catch (error) {
      console.error('❌ Error starting auto call service:', error);
    }
  }

  // Check for leads and make calls automatically
  async checkAndCallLeads() {
    try {
      const now = new Date();
      console.log('\n========================================');
      console.log('🔍 Auto Call Service: Checking for leads...');
      console.log(`⏰ Time: ${now.toLocaleString()}`);
      console.log('========================================\n');
      
      this.lastCheckTime = now;
      
      // Get all leads with pending/failed status across all users
      const leads = await this.getLeadsForAutoCalling();
      
      if (leads.length === 0) {
        console.log('📭 No eligible leads found for auto-calling\n');
        return;
      }

      console.log(`📞 Found ${leads.length} eligible leads:\n`);
      
      // Log lead details
      leads.forEach((lead, i) => {
        const attempts = lead.autoCallAttempts || 0;
        const lastCall = lead.lastCallTime ? new Date(lead.lastCallTime) : null;
        const minutesSinceLastCall = lastCall ? Math.floor((now - lastCall) / 60000) : null;
        
        console.log(`${i + 1}. ${lead.full_name} (${lead.contact_number})`);
        console.log(`   Status: ${lead.callConnectionStatus}, Attempts: ${attempts}/2`);
        console.log(`   Last Call: ${lastCall ? `${minutesSinceLastCall} min ago` : 'Never'}`);
        console.log(`   Project: ${lead.project_name}\n`);
      });
      
      let callsMade = 0;
      for (const lead of leads.slice(0, this.maxCallsPerBatch)) {
        // Skip if already processed recently
        const leadKey = `${lead._id}_${lead.contact_number}`;
        if (this.processedLeads.has(leadKey)) {
          continue;
        }

        const success = await this.makeAutoCall(lead);
        if (success) {
          callsMade++;
          this.totalCalls++;
          // makeAutoCall will add the lead to processed set and schedule removal
        }
        
        // Small delay between calls
        await this.delay(2000);
      }
      
      console.log('\n========================================');
      if (callsMade > 0) {
        console.log(`✅ Cycle Complete: ${callsMade} calls initiated`);
      } else {
        console.log(`⚠️ Cycle Complete: No calls initiated`);
      }
      console.log('========================================\n');
      
    } catch (error) {
      console.error('❌ Error in checkAndCallLeads:', error);
    }
  }

  // Get leads that need auto-calling
  async getLeadsForAutoCalling() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000); // 5 minutes
      const sixtyMinutesAgo = new Date(now - 60 * 60 * 1000); // 60 minutes
      
      // Smart retry logic:
      // - New leads (0 attempts): call immediately
      // - 1st attempt failed: retry after 5 minutes (max 2 attempts per cycle)
      // - Both attempts failed: start new cycle after 60 minutes
      const filter = {
        callConnectionStatus: { $in: ['pending', 'failed'] },
        deleted_at: null,
        contact_number: { $exists: true, $ne: null, $ne: '' },
        project_name: { $exists: true, $ne: null, $ne: '' },
        $or: [
          // Case 1: New leads (never called)
          { autoCallAttempts: { $exists: false } },
          { autoCallAttempts: 0 },
          
          // Case 2: 1 attempt made, retry after 5 minutes (within same cycle)
          {
            autoCallAttempts: 1,
            lastCallTime: { $lt: fiveMinutesAgo }
          },
          
          // Case 3: 2 attempts made (cycle complete), start new cycle after 60 minutes
          {
            autoCallAttempts: { $gte: 2 },
            lastCallTime: { $lt: sixtyMinutesAgo }
          }
        ]
      };

      const leads = await leadRepository.findLeadsWithFilter(filter, {
        limit: this.maxCallsPerBatch,
        sort: { createdAt: 1 } // Oldest first
      });

      // Additional filtering to ensure quality and respect attempt limits
      const eligibleLeads = leads.filter(lead => {
        const hasValidPhone = lead.contact_number && lead.contact_number.toString().trim().length >= 10;
        const hasProject = lead.project_name;
        const notProcessedRecently = !this.processedLeads.has(`${lead._id}_${lead.contact_number}`);
        const isValidStatus = ['pending', 'failed'].includes(lead.callConnectionStatus);
        const notInProgress = !['connected', 'completed', 'in-progress'].includes(lead.callConnectionStatus);
        
        // Check attempt limits - STRICT VALIDATION
        const attempts = lead.autoCallAttempts || 0;
        const lastCallTime = lead.lastCallTime ? new Date(lead.lastCallTime) : null;
        const now = new Date();
        
        // Log attempt details for debugging
        console.log(`\n🔍 Checking Lead: ${lead.full_name} (${lead.contact_number})`);
        console.log(`   Current Attempts: ${attempts}/2`);
        console.log(`   Status: ${lead.callConnectionStatus}`);
        console.log(`   Last Call: ${lastCallTime ? lastCallTime.toLocaleString() : 'Never'}`);
        
        let withinAttemptLimits = true;
        let reason = '';
        
        if (lastCallTime) {
          const timeSinceLastCall = now - lastCallTime;
          const minutesSince = Math.floor(timeSinceLastCall / 60000);
          
          console.log(`   Time Since Last Call: ${minutesSince} minutes`);
          
          // If 1 attempt made, need to wait 5 minutes
          if (attempts === 1 && timeSinceLastCall < 5 * 60 * 1000) {
            withinAttemptLimits = false;
            reason = `Need to wait ${5 - minutesSince} more minutes for 2nd attempt`;
          }
          
          // If 2 attempts made, need to wait 60 minutes for new cycle
          else if (attempts >= 2 && timeSinceLastCall < 60 * 60 * 1000) {
            withinAttemptLimits = false;
            reason = `Cycle complete (2 attempts done). Need to wait ${60 - minutesSince} more minutes for new cycle`;
          }
          
          // If 2 attempts done and 60 minutes passed, reset for new cycle
          else if (attempts >= 2 && timeSinceLastCall >= 60 * 60 * 1000) {
            withinAttemptLimits = true;
            reason = 'New cycle starting (60 min passed)';
          }
        }
        
        const isEligible = hasValidPhone && hasProject && notProcessedRecently && isValidStatus && notInProgress && withinAttemptLimits;
        
        if (isEligible) {
          console.log(`   ✅ ELIGIBLE - ${reason || 'Ready for call'}`);
        } else {
          console.log(`   ❌ NOT ELIGIBLE - ${reason || 'Failed validation checks'}`);
          if (!hasValidPhone) console.log(`      - Invalid phone`);
          if (!hasProject) console.log(`      - No project`);
          if (!notProcessedRecently) console.log(`      - Recently processed`);
          if (!isValidStatus) console.log(`      - Invalid status: ${lead.callConnectionStatus}`);
          if (!notInProgress) console.log(`      - Call in progress/completed`);
        }
        
        return isEligible;
      });

      console.log(`📋 Total leads found: ${leads.length}, Eligible after filtering: ${eligibleLeads.length}`);
      
      return eligibleLeads;
    } catch (error) {
      console.error('Error getting leads for auto calling:', error);
      return [];
    }
  }

  // Make an auto call for a lead
  async makeAutoCall(lead) {
    try {
      console.log(`📞 Auto-calling lead: ${lead.contact_number} (Status: ${lead.callConnectionStatus})`);
      
      // Get assistant for this lead's project (includes Bolna validation)
      const assistant = await this.getAssistantForProject(lead.project_name);
      if (!assistant) {
        console.log(`❌ No valid assistant available for project: ${lead.project_name || 'default'}`);
        console.log(`⚠️ Skipping auto-call for ${lead.contact_number}`);
        return false;
      }

      console.log(`✅ Using assistant: ${assistant.name} (${assistant.bolnaAssistantId})`);

      // Check if lead has reached max attempts
      if (lead.autoCallAttempts >= 2) {
        // Check if 60 minutes have passed since cycle start
        if (lead.callCycleStartTime) {
          const timeSinceCycleStart = Date.now() - new Date(lead.callCycleStartTime).getTime();
          const sixtyMinutesInMs = 60 * 60 * 1000;
          
          if (timeSinceCycleStart < sixtyMinutesInMs) {
            const remainingMinutes = Math.ceil((sixtyMinutesInMs - timeSinceCycleStart) / 60000);
            console.log(`   ⏳ WAITING - Max attempts (2) reached. ${remainingMinutes} minutes remaining until next cycle`);
            return false;
          } else {
            // 60 minutes have passed, reset the cycle
            console.log(`   🔄 RESETTING - 60 minutes elapsed, starting new call cycle`);
            lead.autoCallAttempts = 0;
            lead.callCycleStartTime = null;
            const leadRepository = require('../repositories/leadRepository');
            await leadRepository.update(lead._id, {
              autoCallAttempts: 0,
              callCycleStartTime: null
            });
          }
        } else {
          console.log(`   ⚠️ SKIPPED - Max attempts (2) reached`);
          return false;
        }
      }

      // Format phone number
      let phoneNumber = lead.contact_number.toString().replace(/\D/g, ''); // Remove non-digits
      if (phoneNumber.startsWith('91')) {
        phoneNumber = '+' + phoneNumber;
      } else if (phoneNumber.length === 10) {
        phoneNumber = '+91' + phoneNumber;
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+91' + phoneNumber;
      }

      // Create call using the existing call service
      const callResult = await callService.createCall({
        assistantId: assistant._id, // Use MongoDB _id, let callService handle VAPI ID conversion
        customer: {
          number: phoneNumber
        },
        name: `Auto Call - ${lead.full_name || lead.contact_number}`,
        metadata: {
          leadId: lead._id,
          source: 'auto-call',
          originalStatus: lead.callConnectionStatus
        }
      }, lead.user_id); // Pass the lead's user_id

      if (callResult.success) {
        const currentAttempts = lead.autoCallAttempts || 0;
        const now = new Date();
        
        console.log(`\n📊 Updating Lead Attempts:`);
        console.log(`   Lead: ${lead.full_name} (${lead._id})`);
        console.log(`   Current Attempts: ${currentAttempts}`);
        console.log(`   Last Call Time: ${lead.lastCallTime || 'Never'}`);
        
        // Check if starting a new cycle (after 60 min cooldown)
        let newAttempts;
        let cycleStartTime = lead.callCycleStartTime;
        
        if (currentAttempts >= 2 && lead.lastCallTime) {
          const timeSinceLastCall = now - new Date(lead.lastCallTime);
          const minutesSince = Math.floor(timeSinceLastCall / 60000);
          
          if (timeSinceLastCall >= 60 * 60 * 1000) {
            // Starting new cycle - RESET to 1
            newAttempts = 1;
            cycleStartTime = now;
            console.log(`   🔄 NEW CYCLE STARTING (60 min passed)`);
            console.log(`   Resetting attempts from ${currentAttempts} to 1`);
          } else {
            // Should not reach here if filtering works correctly
            console.log(`   ⚠️ WARNING: 2 attempts already made, but only ${minutesSince} minutes passed!`);
            console.log(`   This lead should have been filtered out!`);
            return false; // Don't make call
          }
        } else {
          newAttempts = currentAttempts + 1;
          if (!cycleStartTime) cycleStartTime = now;
          console.log(`   ➕ Incrementing attempts: ${currentAttempts} → ${newAttempts}`);
        }
        
        // STRICT CHECK: Don't allow more than 2 attempts in current cycle
        if (newAttempts > 2 && lead.callCycleStartTime) {
          const cycleAge = now - new Date(lead.callCycleStartTime);
          if (cycleAge < 60 * 60 * 1000) {
            console.log(`   ❌ BLOCKED: Attempt ${newAttempts} exceeds limit of 2 per cycle`);
            console.log(`   Cycle started: ${lead.callCycleStartTime}`);
            console.log(`   Cycle age: ${Math.floor(cycleAge / 60000)} minutes`);
            return false; // Block the call
          }
        }
        
        // Update lead's call tracking in database
        const updateData = {
          lastCallTime: now,
          lastAutoCallId: callResult.data?.id || undefined,
          callConnectionStatus: 'in-progress',
          autoCallAttempts: newAttempts,
          callCycleStartTime: cycleStartTime
        };
        
        console.log(`   💾 Saving to database:`, updateData);
        
        const updateResult = await leadRepository.update(lead._id, updateData);
        
        if (!updateResult) {
          console.log(`   ❌ FAILED to update lead in database!`);
          return false;
        }
        
        // Verify the update was saved
        const verifyLead = await leadRepository.findById(lead._id);
        console.log(`   ✅ Database Updated Successfully:`);
        console.log(`      Attempts: ${verifyLead.autoCallAttempts}`);
        console.log(`      Last Call: ${verifyLead.lastCallTime}`);
        console.log(`      Status: ${verifyLead.callConnectionStatus}`);
        
        console.log(`\n✅ Call initiated - Attempt ${newAttempts}/2, Call ID: ${callResult.data?.id || 'N/A'}`);
        
        // IMPORTANT: Poll Bolna for final status (backup for webhook) - only if call ID exists
        if (callResult.data?.id) {
          this.pollCallStatus(callResult.data.id, lead._id, 3);
        }
        // IMPORTANT: Poll Bolna for final status (backup for webhook) - only if call ID exists
        if (callResult.data?.id) {
          this.pollCallStatus(callResult.data.id, lead._id, 3);
        }
        
        // Track this lead temporarily to avoid duplicates
        const leadKey = `${lead._id}_${lead.contact_number}`;
        this.processedLeads.add(leadKey);
        
        // Remove from temp tracking after 10 minutes
        setTimeout(() => {
          this.processedLeads.delete(leadKey);
        }, 10 * 60 * 1000);
        
        return true;
      } else {
        console.log(`❌ Failed to initiate auto-call for ${lead.contact_number}:`, callResult.message || callResult.error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error making auto call:', error);
      return false;
    }
  }

  // Poll Bolna for call status (backup for webhook)
  async pollCallStatus(callId, leadId, maxAttempts = 3, attemptNumber = 1) {
    const delays = [60000, 120000, 180000]; // 1 min, 2 min, 3 min
    const delay = delays[attemptNumber - 1] || 60000;
    
    setTimeout(async () => {
      try {
        console.log(`🔍 Polling call status (attempt ${attemptNumber}/${maxAttempts}): ${callId}`);
        
        const bolnaService = require('./bolnaService');
        const statusCheck = await bolnaService.callGetCallAPI(callId);
        
        if (statusCheck.success) {
          const callData = statusCheck.data;
          console.log(`📊 Poll Result - Status: ${callData.status}, Duration: ${callData.durationSeconds}s, Reason: ${callData.endedReason}`);
          
          // If call has ended, process the final status
          if (callData.status === 'ended') {
            console.log(`✅ Call ${callId} ended - processing final status`);
            
            // Let callService handle the status update
            await callService.handleCallEnded(callData);
            
            console.log(`✅ Status update completed for call ${callId}`);
          } else if (attemptNumber < maxAttempts) {
            // Call still in progress, poll again
            console.log(`⏳ Call still ${callData.status}, will poll again...`);
            this.pollCallStatus(callId, leadId, maxAttempts, attemptNumber + 1);
          } else {
            console.log(`⚠️ Call ${callId} still not ended after ${maxAttempts} polls`);
          }
        } else {
          console.log(`❌ Failed to poll call status: ${statusCheck.error}`);
          
          // If polling fails after max attempts, mark as failed
          if (attemptNumber >= maxAttempts) {
            console.log(`❌ Max poll attempts reached, marking lead as failed`);
            await leadRepository.update(leadId, {
              callConnectionStatus: 'failed'
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error polling call status:`, error);
      }
    }, delay);
  }

  // Get assistant for a specific project
  async getAssistantForProject(projectName) {
    try {
      const Assistant = require('../models/Assistant');
      const bolnaService = require('./bolnaService');
      
      let assistant = null;
      
      // STRATEGY 1: Try exact project name match in metadata
      if (projectName) {
        assistant = await Assistant.findOne({
          'metadata.project': projectName,
          syncStatus: 'synced',
          status: { $ne: 'archived' }
        }).sort({ updatedAt: -1 }).lean();
        
        if (assistant) {
          console.log(`✅ Found assistant (exact project match): ${assistant.name} for project: ${projectName}`);
        }
      }
      
      // STRATEGY 2: Try fuzzy name match (case-insensitive partial match)
      if (!assistant && projectName) {
        const escapedProjectName = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assistant = await Assistant.findOne({
          $or: [
            { name: { $regex: escapedProjectName, $options: 'i' } },
            { 'metadata.project': { $regex: escapedProjectName, $options: 'i' } }
          ],
          syncStatus: 'synced',
          status: { $ne: 'archived' }
        }).sort({ updatedAt: -1 }).lean();
        
        if (assistant) {
          console.log(`✅ Found assistant (fuzzy match): ${assistant.name} for project: ${projectName}`);
        }
      }
      
      // STRATEGY 3: Get most recently updated active assistant
      if (!assistant) {
        assistant = await Assistant.findOne({
          syncStatus: 'synced',
          status: { $ne: 'archived' }
        }).sort({ updatedAt: -1 }).lean();
        
        if (assistant) {
          console.log(`⚠️ Using fallback assistant: ${assistant.name} (no project-specific match found)`);
        }
      }
      
      // STRATEGY 4: Get ANY assistant (last resort)
      if (!assistant) {
        assistant = await Assistant.findOne({
          status: { $ne: 'archived' }
        }).sort({ updatedAt: -1 }).lean();
        
        if (assistant) {
          console.log(`⚠️ Using any available assistant: ${assistant.name} (no synced assistant found)`);
        }
      }
      
      // VALIDATION: Verify assistant exists in Bolna
      if (assistant) {
        console.log(`🔍 Validating assistant in Bolna: ${assistant.name} (${assistant.bolnaAssistantId})`);
        const bolnaCheck = await bolnaService.callGetAssistantAPI(assistant.bolnaAssistantId);
        
        if (!bolnaCheck.success) {
          console.log(`❌ Assistant ${assistant.name} (${assistant.bolnaAssistantId}) does NOT exist in Bolna!`);
          console.log(`🔄 Marking as out-of-sync in database...`);
          
          // Mark as out of sync
          const assistantRepository = require('../repositories/assistantRepository');
          await assistantRepository.updateAssistantById(assistant._id, {
            syncStatus: 'out-of-sync',
            lastSyncError: 'Agent not found in Bolna - needs re-creation'
          });
          
          // Try to find another synced assistant
          console.log(`🔍 Searching for alternative synced assistant...`);
          const alternativeAssistant = await Assistant.findOne({
            _id: { $ne: assistant._id }, // Exclude the failed one
            syncStatus: 'synced',
            status: { $ne: 'archived' }
          }).sort({ updatedAt: -1 }).lean();
          
          if (alternativeAssistant) {
            // Verify the alternative too
            const altCheck = await bolnaService.callGetAssistantAPI(alternativeAssistant.bolnaAssistantId);
            if (altCheck.success) {
              console.log(`✅ Found alternative assistant: ${alternativeAssistant.name}`);
              return alternativeAssistant;
            }
          }
          
          console.log(`❌ No valid synced assistants available for project: ${projectName}`);
          return null;
        }
        
        console.log(`✅ Assistant validated in Bolna: ${assistant.name}`);
        return assistant;
      } else {
        console.log(`❌ No assistants found in database`);
        return null;
      }
      
    } catch (error) {
      console.error('Error getting assistant for project:', error);
      return null;
    }
  }

  // Utility function to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop the auto-calling service (for emergency stop)
  stopAutoCalling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Auto Call Service stopped manually');
    
    return {
      success: true,
      message: 'Auto call service stopped'
    };
  }

  // Get current status
  getStatus() {
    const nextCheckTime = this.lastCheckTime ? new Date(this.lastCheckTime.getTime() + this.callDelay) : null;
    
    return {
      isRunning: this.isRunning,
      callDelay: this.callDelay,
      maxCallsPerBatch: this.maxCallsPerBatch,
      lastCheckTime: this.lastCheckTime,
      nextCheckTime: nextCheckTime,
      totalCalls: this.totalCalls,
      processedLeadsCount: this.processedLeads.size
    };
  }

  // Legacy methods for backward compatibility with existing API endpoints
  async startAutoCalling(userId, options = {}) {
    return {
      success: true,
      message: 'Auto call service is already running in background automatically'
    };
  }

  async getEligibleLeads(options = {}) {
    try {
      const leads = await this.getLeadsForAutoCalling();
      return {
        success: true,
        data: leads
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAutoCallStatus() {
    return {
      success: true,
      data: this.getStatus()
    };
  }

  // Update settings
  updateSettings(settings = {}) {
    let updated = false;
    
    if (settings.callDelay && settings.callDelay >= 30000) {
      this.callDelay = settings.callDelay;
      updated = true;
      
      // Restart the interval with new delay
      if (this.isRunning && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = setInterval(async () => {
          await this.checkAndCallLeads();
        }, this.callDelay);
      }
    }
    
    if (settings.maxCallsPerBatch && settings.maxCallsPerBatch >= 1) {
      this.maxCallsPerBatch = settings.maxCallsPerBatch;
      updated = true;
    }
    
    if (updated) {
      console.log(`⚙️ Auto Call Service settings updated: Delay=${this.callDelay}ms, Batch=${this.maxCallsPerBatch}`);
    }
    
    return this.getStatus();
  }
}

module.exports = new AutoCallService();