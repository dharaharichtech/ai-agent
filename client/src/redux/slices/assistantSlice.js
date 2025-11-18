import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import assistantService from '../../api/assistantService'

// Async thunk for fetching user's assistants
export const fetchUserAssistants = createAsyncThunk(
  'assistants/fetchUserAssistants',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const result = await assistantService.getUserAssistants(filters)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistants')
    }
  }
)

// Async thunk for creating a new assistant
export const createAssistant = createAsyncThunk(
  'assistants/createAssistant',
  async (assistantData, { rejectWithValue }) => {
    try {
      const result = await assistantService.createAssistant(assistantData)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create assistant')
    }
  }
)

// Async thunk for updating assistant
export const updateAssistant = createAsyncThunk(
  'assistants/updateAssistant',
  async ({ assistantId, updateData }, { rejectWithValue }) => {
    try {
      const result = await assistantService.updateAssistant(assistantId, updateData)
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update assistant')
    }
  }
)

// Async thunk for deleting assistant
export const deleteAssistant = createAsyncThunk(
  'assistants/deleteAssistant',
  async (assistantId, { rejectWithValue }) => {
    try {
      const result = await assistantService.deleteAssistant(assistantId)
      if (result.success) {
        return { assistantId, message: result.message }
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete assistant')
    }
  }
)

// Async thunk for creating a call with assistant
export const createCall = createAsyncThunk(
  'assistants/createCall',
  async (callData, { rejectWithValue }) => {
    try {
      const result = await assistantService.createCall(callData)
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

const initialState = {
  assistants: [],
  selectedAssistant: null,
  isLoading: false,
  error: null,
  pagination: null,
  callLoading: false,
  callError: null,
  lastCallResult: null,
}

const assistantSlice = createSlice({
  name: 'assistants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.callError = null
    },
    setSelectedAssistant: (state, action) => {
      state.selectedAssistant = action.payload
    },
    clearSelectedAssistant: (state) => {
      state.selectedAssistant = null
    },
    clearLastCallResult: (state) => {
      state.lastCallResult = null
    },
    resetAssistantState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch user assistants
      .addCase(fetchUserAssistants.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserAssistants.fulfilled, (state, action) => {
        state.isLoading = false
        state.assistants = action.payload.assistants || []
        state.pagination = action.payload.pagination || null
        state.error = null
      })
      .addCase(fetchUserAssistants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.assistants = []
      })

      // Create assistant
      .addCase(createAssistant.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createAssistant.fulfilled, (state, action) => {
        state.isLoading = false
        state.assistants.push(action.payload)
        state.error = null
      })
      .addCase(createAssistant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Update assistant
      .addCase(updateAssistant.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateAssistant.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.assistants.findIndex(
          (assistant) => assistant.id === action.payload.id
        )
        if (index !== -1) {
          state.assistants[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateAssistant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Delete assistant
      .addCase(deleteAssistant.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteAssistant.fulfilled, (state, action) => {
        state.isLoading = false
        state.assistants = state.assistants.filter(
          (assistant) => assistant.id !== action.payload.assistantId
        )
        if (state.selectedAssistant?.id === action.payload.assistantId) {
          state.selectedAssistant = null
        }
        state.error = null
      })
      .addCase(deleteAssistant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Create call
      .addCase(createCall.pending, (state) => {
        state.callLoading = true
        state.callError = null
        state.lastCallResult = null
      })
      .addCase(createCall.fulfilled, (state, action) => {
        state.callLoading = false
        state.lastCallResult = action.payload
        state.callError = null
      })
      .addCase(createCall.rejected, (state, action) => {
        state.callLoading = false
        state.callError = action.payload
        state.lastCallResult = null
      })
  },
})

export const {
  clearError,
  setSelectedAssistant,
  clearSelectedAssistant,
  clearLastCallResult,
  resetAssistantState,
} = assistantSlice.actions

// Selectors
export const selectAssistants = (state) => state.assistants.assistants
export const selectSelectedAssistant = (state) => state.assistants.selectedAssistant
export const selectAssistantsLoading = (state) => state.assistants.isLoading
export const selectAssistantsError = (state) => state.assistants.error
export const selectAssistantsPagination = (state) => state.assistants.pagination
export const selectCallLoading = (state) => state.assistants.callLoading
export const selectCallError = (state) => state.assistants.callError
export const selectLastCallResult = (state) => state.assistants.lastCallResult

export default assistantSlice.reducer