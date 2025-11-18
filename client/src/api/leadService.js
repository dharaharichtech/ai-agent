import axiosInstance from './axiosInstance'

// Lead Service API functions
export const leadService = {
  // Create a new lead
  async createLead(leadData) {
    try {
      const response = await axiosInstance.post('/leads', leadData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create lead'
      }
    }
  },

  // Get user's leads with pagination and filtering
  async getLeads(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        leadtype,
        callConnectionStatus,
        search,
        project_name // Add project_name filter
      } = params

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(leadtype && { leadtype }),
        ...(callConnectionStatus && { callConnectionStatus }),
        ...(search && { search }),
        ...(project_name && { project_name }) // Include project_name in query
      })

      const response = await axiosInstance.get(`/leads?${queryParams}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch leads'
      }
    }
  },

  // Get lead by ID
  async getLeadById(leadId) {
    try {
      const response = await axiosInstance.get(`/leads/${leadId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch lead'
      }
    }
  },

  // Update lead
  async updateLead(leadId, updateData) {
    try {
      const response = await axiosInstance.put(`/leads/${leadId}`, updateData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update lead'
      }
    }
  },

  // Delete lead (soft delete)
  async deleteLead(leadId) {
    try {
      const response = await axiosInstance.delete(`/leads/${leadId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete lead'
      }
    }
  },

  // Get lead statistics
  async getLeadStats() {
    try {
      const response = await axiosInstance.get('/leads/stats')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch lead statistics'
      }
    }
  },

  // Get all leads (admin only)
  async getAllLeads(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        leadtype,
        callConnectionStatus,
        search
      } = params

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(leadtype && { leadtype }),
        ...(callConnectionStatus && { callConnectionStatus }),
        ...(search && { search })
      })

      const response = await axiosInstance.get(`/leads/all?${queryParams}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch all leads'
      }
    }
  },

  // Upload Excel file for bulk lead import
  async uploadLeadsFile(file) {
    try {
      const formData = new FormData()
      formData.append('leadFile', file)

      const response = await axiosInstance.post('/leads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload leads file'
      }
    }
  },

  // Get project names
  async getProjectNames() {
    try {
      const response = await axiosInstance.get('/leads/projects')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch project names'
      }
    }
  },

  // Get leads count by project
  async getLeadsCountByProject() {
    try {
      const response = await axiosInstance.get('/leads/projects/counts')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch leads count by project'
      }
    }
  },

  // Get leads by project name
  async getLeadsByProject(projectName, params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        leadtype,
        callConnectionStatus,
        search
      } = params

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(leadtype && { leadtype }),
        ...(callConnectionStatus && { callConnectionStatus }),
        ...(search && { search })
      })

      const response = await axiosInstance.get(`/leads/projects/${encodeURIComponent(projectName)}?${queryParams}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch leads by project'
      }
    }
  }
}

export default leadService