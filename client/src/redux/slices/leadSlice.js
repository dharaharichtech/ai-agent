import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import leadService from '../../api/leadService'

// Async thunks for API calls
export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params, { rejectWithValue }) => {
    try {
      const result = await leadService.getLeads(params)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch leads')
    }
  }
)

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (leadData, { rejectWithValue }) => {
    try {
      const result = await leadService.createLead(leadData)
      if (result.success) {
        return result.data.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create lead')
    }
  }
)

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ leadId, updateData }, { rejectWithValue }) => {
    try {
      const result = await leadService.updateLead(leadId, updateData)
      if (result.success) {
        return result.data.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update lead')
    }
  }
)

export const deleteLead = createAsyncThunk(
  'leads/deleteLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const result = await leadService.deleteLead(leadId)
      if (result.success) {
        return leadId
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete lead')
    }
  }
)

export const fetchLeadStats = createAsyncThunk(
  'leads/fetchLeadStats',
  async (_, { rejectWithValue }) => {
    try {
      const result = await leadService.getLeadStats()
      if (result.success) {
        return result.data.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch lead statistics')
    }
  }
)

export const getLeadById = createAsyncThunk(
  'leads/getLeadById',
  async (leadId, { rejectWithValue }) => {
    try {
      const result = await leadService.getLeadById(leadId)
      if (result.success) {
        return result.data.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch lead')
    }
  }
)

// Update lead status based on call webhook events
export const updateLeadStatus = createAsyncThunk(
  'leads/updateLeadStatus',
  async ({ phoneNumber, status, callData }, { rejectWithValue, getState }) => {
    try {
      // Find lead by phone number in current state
      const currentLeads = getState().leads.leads
      console.log('Looking for lead with phone:', phoneNumber)
      console.log('Current leads count:', currentLeads.length)
      console.log('Sample leads phone numbers:', currentLeads.slice(0, 5).map(l => ({ id: l._id, phone: l.contact_number })))
      
      const leadToUpdate = currentLeads.find(lead => {
        // Clean and compare phone numbers - normalize both to remove country codes
        const cleanLead = lead.contact_number?.replace(/[^\d]/g, '') // Remove everything except digits
        const cleanPhone = phoneNumber?.replace(/[^\d]/g, '') // Remove everything except digits
        
        // Extract the last 10 digits for comparison (Indian mobile numbers)
        const normalizedLead = cleanLead?.slice(-10)
        const normalizedPhone = cleanPhone?.slice(-10)
        
        console.log(`Comparing: "${normalizedLead}" === "${normalizedPhone}" (from "${cleanLead}" vs "${cleanPhone}")`)
        return normalizedLead === normalizedPhone
      })

      if (!leadToUpdate) {
        console.warn('Lead not found for phone number:', phoneNumber)
        console.warn('Available phone numbers:', currentLeads.map(l => l.contact_number))
        return rejectWithValue('Lead not found')
      }

      // Prepare update data
      const updateData = {
        callConnectionStatus: status
      }

      // Update lead in database
      const result = await leadService.updateLead(leadToUpdate._id, updateData)
      if (result.success) {
        return {
          leadId: leadToUpdate._id,
          phoneNumber,
          status,
          callData,
          updatedLead: result.data.data
        }
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update lead status')
    }
  }
)

const initialState = {
  leads: [],
  currentLead: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  },
  stats: {
    total: 0,
    pending: 0,
    connected: 0,
    completed: 0,
    failed: 0,
    coldLeads: 0,
    hotLeads: 0
  },
  filters: {
    search: '',
    leadtype: '',
    callConnectionStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  callingLead: null, // Track which lead is currently being called
}

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    
    // Clear current lead
    clearCurrentLead: (state) => {
      state.currentLead = null
    },
    
    // AI Call actions
    callLeadStart: (state, action) => {
      state.callingLead = action.payload
      state.error = null
    },
    callLeadSuccess: (state) => {
      state.callingLead = null
      state.error = null
    },
    callLeadFailure: (state, action) => {
      state.callingLead = null
      state.error = action.payload
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    
    // Reset state
    resetLeadState: (state) => {
      return initialState
    }
  },
  extraReducers: (builder) => {
    // Fetch Leads
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.isLoading = false
        state.leads = action.payload.data.leads
        state.pagination = {
          page: action.payload.pagination.page,
          pages: action.payload.pagination.pages,
          total: action.payload.pagination.total,
          limit: action.payload.pagination.limit
        }
        state.error = null
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // Create Lead
    builder
      .addCase(createLead.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.isCreating = false
        state.leads.unshift(action.payload)
        state.error = null
      })
      .addCase(createLead.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
      })

    // Update Lead
    builder
      .addCase(updateLead.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.isUpdating = false
        const index = state.leads.findIndex(lead => lead._id === action.payload._id)
        if (index !== -1) {
          state.leads[index] = action.payload
        }
        if (state.currentLead && state.currentLead._id === action.payload._id) {
          state.currentLead = action.payload
        }
        state.error = null
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload
      })

    // Delete Lead
    builder
      .addCase(deleteLead.pending, (state) => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.isDeleting = false
        state.leads = state.leads.filter(lead => lead._id !== action.payload)
        if (state.currentLead && state.currentLead._id === action.payload) {
          state.currentLead = null
        }
        state.error = null
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload
      })

    // Fetch Lead Stats
    builder
      .addCase(fetchLeadStats.pending, (state) => {
        state.error = null
      })
      .addCase(fetchLeadStats.fulfilled, (state, action) => {
        state.stats = action.payload
        state.error = null
      })
      .addCase(fetchLeadStats.rejected, (state, action) => {
        state.error = action.payload
      })

    // Get Lead By ID
    builder
      .addCase(getLeadById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getLeadById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentLead = action.payload
        state.error = null
      })
      .addCase(getLeadById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // Update Lead Status from Webhook
    builder
      .addCase(updateLeadStatus.pending, (state) => {
        state.error = null
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const { leadId, status, callData, updatedLead } = action.payload
        
        // Update the lead in the leads array
        const leadIndex = state.leads.findIndex(lead => lead._id === leadId)
        if (leadIndex !== -1) {
          state.leads[leadIndex] = {
            ...state.leads[leadIndex],
            callConnectionStatus: status,
            lastCallData: callData,
            updatedAt: new Date().toISOString()
          }
        }
        
        // Update current lead if it's the same lead
        if (state.currentLead && state.currentLead._id === leadId) {
          state.currentLead = {
            ...state.currentLead,
            callConnectionStatus: status,
            lastCallData: callData,
            updatedAt: new Date().toISOString()
          }
        }
        
        state.error = null
      })
      .addCase(updateLeadStatus.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

// All async thunks are already exported individually above

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearCurrentLead,
  callLeadStart,
  callLeadSuccess,
  callLeadFailure,
  clearError,
  resetLeadState,
} = leadSlice.actions

export default leadSlice.reducer