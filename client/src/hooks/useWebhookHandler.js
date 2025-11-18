import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  processWebhookEvent,
  handleCallStarted,
  handleCallEnded,
  handleCallProgress,
  clearWebhookEvent,
  selectLastWebhookEvent
} from '../redux/slices/callSlice'
import { updateLeadStatus, fetchLeads } from '../redux/slices/leadSlice'
import callService from '../api/callService' // Import call service for authenticated calls

/**
 * Custom hook for handling Bolna webhook events and updating lead status
 */
export const useWebhookHandler = () => {
  const dispatch = useDispatch()
  const lastWebhookEvent = useSelector(selectLastWebhookEvent)

  // Process incoming webhook data
  const processWebhook = useCallback((webhookData) => {
    console.log('Processing webhook:', webhookData)
    console.log('Call status:', webhookData.data?.status)
    console.log('Ended reason:', webhookData.data?.endedReason)
    console.log('Duration:', webhookData.data?.durationSeconds)
    
    // Dispatch to call slice for processing
    dispatch(processWebhookEvent(webhookData))
    
    // Handle different webhook types
    switch (webhookData.type) {
      case 'call-started':
        dispatch(handleCallStarted(webhookData.data))
        break
        
      case 'call-ended':
        dispatch(handleCallEnded(webhookData.data))
        break
        
      case 'call-progress':
      case 'call-update':
      case 'call-status-update':
        dispatch(handleCallProgress(webhookData.data))
        break
        
      default:
        console.log('Unknown webhook type:', webhookData.type)
    }
  }, [dispatch])

  // Handle lead status updates from webhook events
  useEffect(() => {
    if (lastWebhookEvent) {
      const { phoneNumber, status, callData } = lastWebhookEvent
      
      // Find and update lead by phone number
      if (phoneNumber && status) {
        console.log(`Updating lead with phone ${phoneNumber} to status ${status}`)
        
        // Update lead status in the database
        dispatch(updateLeadStatus({ 
          phoneNumber, 
          status,
          callData: {
            callId: callData.id,
            duration: callData.durationSeconds,
            recordingUrl: callData.recordingUrl,
            transcript: callData.transcript,
            endedReason: callData.endedReason,
            startedAt: callData.startedAt,
            endedAt: callData.endedAt
          }
        }))
        
        // Clear the webhook event after processing
        setTimeout(() => {
          dispatch(clearWebhookEvent())
        }, 1000)
      }
    }
  }, [lastWebhookEvent, dispatch])

  // Simulate webhook events for testing (remove in production)
  const simulateWebhook = useCallback((type, callData) => {
    const webhookData = {
      type,
      data: {
        id: 'test-call-' + Date.now(),
        assistantId: 'test-assistant',
        ...callData
      }
    }
    processWebhook(webhookData)
  }, [processWebhook])

  // Listen for real webhook events (WebSocket or polling)
  const startWebhookListener = useCallback(() => {
    console.log('Webhook listener started')
    
    // Track processed calls to avoid duplicates
    const processedCalls = new Set()
    
    // For now, implement polling to check for webhook events
    // In the future, this could be replaced with WebSockets
    const pollInterval = setInterval(async () => {
      try {
        // Poll for recent call updates using authenticated call service
        const result = await callService.getRecentCalls(5)
        
        if (result.success && result.data) {
          // Process recent calls to check for status changes
          result.data.forEach(call => {
            // Create a unique identifier for this call status
            const callStatusKey = `${call.callId}-${call.status}-${call.duration}`
            
            // Only process if we haven't seen this exact call status before
            if (call.status && call.phoneNumber && !processedCalls.has(callStatusKey)) {
              processedCalls.add(callStatusKey)
              
              processWebhook({
                type: 'call-status-update',
                data: {
                  id: call.callId,
                  customer: { number: call.phoneNumber },
                  status: call.status,
                  endedReason: call.endedReason,
                  durationSeconds: call.duration
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('Error polling for webhook updates:', error)
      }
    }, 30000) // Poll every 30 seconds (reduced frequency)
    
    return () => clearInterval(pollInterval)
  }, [processWebhook])

  const stopWebhookListener = useCallback(() => {
    console.log('Webhook listener stopped')
  }, [])

  return {
    processWebhook,
    simulateWebhook,
    startWebhookListener,
    stopWebhookListener,
    lastWebhookEvent
  }
}

/**
 * Hook for managing call status updates from webhooks
 */
export const useCallStatusUpdater = () => {
  const dispatch = useDispatch()
  
  // Update call status based on webhook event
  const updateCallStatus = useCallback((callId, status, data = {}) => {
    dispatch(handleCallProgress({
      id: callId,
      status,
      ...data
    }))
  }, [dispatch])

  // Handle call completion and lead status update
  const completeCall = useCallback((callData) => {
    const { customer, endedReason, durationSeconds } = callData
    
    if (customer?.number) {
      let leadStatus = 'completed'
      
      // Determine lead status based on call outcome
      if (endedReason === 'customer-did-not-answer' || 
          endedReason === 'customer-busy' ||
          endedReason === 'assistant-did-not-respond') {
        leadStatus = 'failed'
      } else if (durationSeconds && durationSeconds < 10) {
        leadStatus = 'failed' // Very short calls are likely failed
      }
      
      // Update lead status
      dispatch(updateLeadStatus({
        phoneNumber: customer.number,
        status: leadStatus,
        callData
      }))
    }
  }, [dispatch])

  return {
    updateCallStatus,
    completeCall
  }
}

export default useWebhookHandler