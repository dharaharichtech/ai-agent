import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import callService from '../../api/callService'

// Async thunk for creating a call
export const createCall = createAsyncThunk(
  'calls/createCall',
  async (callData, { rejectWithValue }) => {
    try {
      const result = await callService.createCall(callData)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create call')
    }
  }
)

// Async thunk for fetching user calls
export const fetchUserCalls = createAsyncThunk(
  'calls/fetchUserCalls',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const result = await callService.getUserCalls(filters)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch calls')
    }
  }
)

// Async thunk for fetching recent calls
export const fetchRecentCalls = createAsyncThunk(
  'calls/fetchRecentCalls',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const result = await callService.getRecentCalls(limit)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch recent calls')
    }
  }
)

// Async thunk for fetching call statistics
export const fetchCallStats = createAsyncThunk(
  'calls/fetchCallStats',
  async (dateRange = {}, { rejectWithValue }) => {
    try {
      const result = await callService.getCallStats(dateRange)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch call stats')
    }
  }
)

// Async thunk for processing webhook
export const processWebhookEvent = createAsyncThunk(
  'calls/processWebhookEvent',
  async (webhookData, { rejectWithValue }) => {
    try {
      // Process webhook and determine lead status update
      const callData = webhookData.data;
      const leadStatus = callService.getLeadStatusFromCall(callData);
      
      return {
        webhook: webhookData,
        callData,
        leadStatus,
        phoneNumber: callData.customer?.number
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to process webhook')
    }
  }
)

const initialState = {
  calls: [],
  recentCalls: [],
  callStats: {},
  selectedCall: null,
  isLoading: false,
  isCreatingCall: false,
  error: null,
  callError: null,
  lastCallResult: null,
  
  // Webhook state
  webhookEvents: [],
  lastWebhookEvent: null,
  
  // Real-time updates
  activeCall: null,
  callUpdates: {},
  
  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
}

const callSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.callError = null
    },
    clearLastCallResult: (state) => {
      state.lastCallResult = null
    },
    setSelectedCall: (state, action) => {
      state.selectedCall = action.payload
    },
    clearSelectedCall: (state) => {
      state.selectedCall = null
    },
    
    // Real-time webhook handlers
    handleCallStarted: (state, action) => {
      const callData = action.payload
      state.activeCall = callData
      state.callUpdates[callData.id] = {
        status: 'connected',
        startedAt: callData.startedAt
      }
    },
    
    handleCallEnded: (state, action) => {
      const callData = action.payload
      state.activeCall = null
      state.callUpdates[callData.id] = {
        status: 'ended',
        endedAt: callData.endedAt,
        endedReason: callData.endedReason,
        durationSeconds: callData.durationSeconds,
        recordingUrl: callData.recordingUrl,
        transcript: callData.transcript
      }
    },
    
    handleCallProgress: (state, action) => {
      const callData = action.payload
      if (state.activeCall && state.activeCall.id === callData.id) {
        state.activeCall = { ...state.activeCall, ...callData }
      }
      state.callUpdates[callData.id] = {
        ...state.callUpdates[callData.id],
        ...callData
      }
    },
    
    // Lead status update from webhook
    updateLeadFromCall: (state, action) => {
      const { phoneNumber, status, callData } = action.payload
      // This will be used to update lead status in lead slice
      state.lastWebhookEvent = {
        phoneNumber,
        status,
        callData,
        timestamp: Date.now()
      }
    },
    
    clearWebhookEvent: (state) => {
      state.lastWebhookEvent = null
    },
    
    resetCallState: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // Create call
      .addCase(createCall.pending, (state) => {
        state.isCreatingCall = true
        state.callError = null
        state.lastCallResult = null
      })
      .addCase(createCall.fulfilled, (state, action) => {
        state.isCreatingCall = false
        state.lastCallResult = action.payload
        state.calls.unshift(action.payload) // Add to beginning of list
        state.callError = null
      })
      .addCase(createCall.rejected, (state, action) => {
        state.isCreatingCall = false
        state.callError = action.payload
        state.lastCallResult = null
      })

      // Fetch user calls
      .addCase(fetchUserCalls.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserCalls.fulfilled, (state, action) => {
        state.isLoading = false
        state.calls = action.payload.calls || []
        state.pagination = action.payload.pagination || state.pagination
        state.error = null
      })
      .addCase(fetchUserCalls.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.calls = []
      })

      // Fetch recent calls
      .addCase(fetchRecentCalls.fulfilled, (state, action) => {
        state.recentCalls = action.payload
      })

      // Fetch call stats
      .addCase(fetchCallStats.fulfilled, (state, action) => {
        state.callStats = action.payload
      })

      // Process webhook event
      .addCase(processWebhookEvent.fulfilled, (state, action) => {
        const { webhook, callData, leadStatus, phoneNumber } = action.payload
        
        // Add to webhook events
        state.webhookEvents.unshift(webhook)
        
        // Update call updates
        state.callUpdates[callData.id] = {
          ...state.callUpdates[callData.id],
          ...callData,
          leadStatus
        }
        
        // Set last webhook event for lead status update
        state.lastWebhookEvent = {
          phoneNumber,
          status: leadStatus,
          callData,
          timestamp: Date.now()
        }

        // Handle specific webhook types
        if (webhook.type === 'call-started') {
          state.activeCall = callData
        } else if (webhook.type === 'call-ended') {
          state.activeCall = null
          
          // Update the call in calls array if exists
          const callIndex = state.calls.findIndex(call => call.id === callData.id)
          if (callIndex !== -1) {
            state.calls[callIndex] = { ...state.calls[callIndex], ...callData }
          }
        }
      })
  },
})

export const {
  clearError,
  clearLastCallResult,
  setSelectedCall,
  clearSelectedCall,
  handleCallStarted,
  handleCallEnded,
  handleCallProgress,
  updateLeadFromCall,
  clearWebhookEvent,
  resetCallState,
} = callSlice.actions

// Selectors
export const selectCalls = (state) => state.calls.calls
export const selectRecentCalls = (state) => state.calls.recentCalls
export const selectCallStats = (state) => state.calls.callStats
export const selectSelectedCall = (state) => state.calls.selectedCall
export const selectCallsLoading = (state) => state.calls.isLoading
export const selectCallsError = (state) => state.calls.error
export const selectCallCreating = (state) => state.calls.isCreatingCall
export const selectCallError = (state) => state.calls.callError
export const selectLastCallResult = (state) => state.calls.lastCallResult
export const selectActiveCall = (state) => state.calls.activeCall
export const selectCallUpdates = (state) => state.calls.callUpdates
export const selectLastWebhookEvent = (state) => state.calls.lastWebhookEvent
export const selectWebhookEvents = (state) => state.calls.webhookEvents
export const selectCallsPagination = (state) => state.calls.pagination

export default callSlice.reducer