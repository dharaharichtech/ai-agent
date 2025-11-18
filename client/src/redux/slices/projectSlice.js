import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import leadService from '../../api/leadService'
import assistantService from '../../api/assistantService'

// Async thunks for project-based operations

// Fetch project names from leads
export const fetchProjectNames = createAsyncThunk(
  'projects/fetchProjectNames',
  async (_, { rejectWithValue }) => {
    try {
      const result = await leadService.getProjectNames()
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch project names')
    }
  }
)

// Fetch leads count by project
export const fetchProjectLeadsCounts = createAsyncThunk(
  'projects/fetchProjectLeadsCounts',
  async (_, { rejectWithValue }) => {
    try {
      const result = await leadService.getLeadsCountByProject()
      if (result.success) {
        return result.data
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch project leads counts')
    }
  }
)

// Fetch leads by project name
export const fetchLeadsByProject = createAsyncThunk(
  'projects/fetchLeadsByProject',
  async ({ projectName, params = {} }, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching leads for project:', projectName, 'with params:', params)
      const result = await leadService.getLeadsByProject(projectName, params)
      console.log('📦 API Result:', result)
      if (result.success) {
        const payload = { projectName, ...result.data }
        console.log('✅ Returning payload:', payload)
        return payload
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch leads by project')
    }
  }
)

// Fetch assistants to map with project names
export const fetchAssistantsForProjects = createAsyncThunk(
  'projects/fetchAssistantsForProjects',
  async (_, { rejectWithValue }) => {
    try {
      const result = await assistantService.getUserAssistants()
      if (result.success) {
        // Extract assistants array from data object
        return result.data?.assistants || []
      } else {
        return rejectWithValue(result.error)
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistants')
    }
  }
)

const initialState = {
  // Projects data
  projectNames: [],
  projectLeadsCounts: [],
  assistants: [],
  
  // Current project data
  currentProject: null,
  currentProjectLeads: [],
  currentProjectPagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  },
  
  // Filters for current project
  projectFilters: {
    search: '',
    leadtype: '',
    callConnectionStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Loading states
  isLoadingProjects: false,
  isLoadingProjectLeads: false,
  isLoadingAssistants: false,
  
  // Error state
  error: null
}

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // Set current project
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload
      state.currentProjectLeads = []
      state.projectFilters = initialState.projectFilters
    },
    
    // Set project filters
    setProjectFilters: (state, action) => {
      state.projectFilters = { ...state.projectFilters, ...action.payload }
    },
    
    // Reset project filters
    resetProjectFilters: (state) => {
      state.projectFilters = initialState.projectFilters
    },
    
    // Set project pagination
    setProjectPagination: (state, action) => {
      state.currentProjectPagination = { ...state.currentProjectPagination, ...action.payload }
    },
    
    // Clear current project
    clearCurrentProject: (state) => {
      state.currentProject = null
      state.currentProjectLeads = []
      state.projectFilters = initialState.projectFilters
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    
    // Reset project state
    resetProjectState: (state) => {
      return initialState
    }
  },
  extraReducers: (builder) => {
    // Fetch Project Names
    builder
      .addCase(fetchProjectNames.pending, (state) => {
        state.isLoadingProjects = true
        state.error = null
      })
      .addCase(fetchProjectNames.fulfilled, (state, action) => {
        state.isLoadingProjects = false
        state.projectNames = action.payload
        state.error = null
      })
      .addCase(fetchProjectNames.rejected, (state, action) => {
        state.isLoadingProjects = false
        state.error = action.payload
      })

    // Fetch Project Leads Counts
    builder
      .addCase(fetchProjectLeadsCounts.pending, (state) => {
        state.isLoadingProjects = true
        state.error = null
      })
      .addCase(fetchProjectLeadsCounts.fulfilled, (state, action) => {
        state.isLoadingProjects = false
        state.projectLeadsCounts = action.payload
        state.error = null
      })
      .addCase(fetchProjectLeadsCounts.rejected, (state, action) => {
        state.isLoadingProjects = false
        state.error = action.payload
      })

    // Fetch Leads by Project
    builder
      .addCase(fetchLeadsByProject.pending, (state) => {
        state.isLoadingProjectLeads = true
        state.error = null
      })
      .addCase(fetchLeadsByProject.fulfilled, (state, action) => {
        console.log('🎯 Redux state update - action.payload:', action.payload)
        state.isLoadingProjectLeads = false
        state.currentProjectLeads = action.payload.leads || []
        state.currentProjectPagination = action.payload.pagination || { page: 1, pages: 1, total: 0, limit: 10 }
        console.log('📊 Updated state - leads:', state.currentProjectLeads.length, 'leads')
        state.error = null
      })
      .addCase(fetchLeadsByProject.rejected, (state, action) => {
        state.isLoadingProjectLeads = false
        state.error = action.payload
      })

    // Fetch Assistants for Projects
    builder
      .addCase(fetchAssistantsForProjects.pending, (state) => {
        state.isLoadingAssistants = true
        state.error = null
      })
      .addCase(fetchAssistantsForProjects.fulfilled, (state, action) => {
        state.isLoadingAssistants = false
        state.assistants = action.payload
        state.error = null
      })
      .addCase(fetchAssistantsForProjects.rejected, (state, action) => {
        state.isLoadingAssistants = false
        state.error = action.payload
      })
  }
})

export const {
  setCurrentProject,
  setProjectFilters,
  resetProjectFilters,
  setProjectPagination,
  clearCurrentProject,
  clearError,
  resetProjectState
} = projectSlice.actions

export default projectSlice.reducer