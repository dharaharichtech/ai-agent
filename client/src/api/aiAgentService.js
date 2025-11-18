import axiosInstance from './axiosInstance'

// Auth services
export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials)
    // Server returns { success: true, message: "...", data: { user, token } }
    return response.data.data
  },
  
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData)
    // Return the full response so component can access response.data.data.user
    return response
  },
}

// Lead services
export const leadService = {
  getLeads: async () => {
    const response = await axiosInstance.get('/leads')
    return response.data
  },
  
  createLead: async (leadData) => {
    const response = await axiosInstance.post('/leads', leadData)
    return response.data
  },
  
  updateLead: async (id, leadData) => {
    const response = await axiosInstance.put(`/leads/${id}`, leadData)
    return response.data
  },
  
  deleteLead: async (id) => {
    const response = await axiosInstance.delete(`/leads/${id}`)
    return response.data
  },
}

// PDF services
export const pdfService = {
  getPdfs: async () => {
    const response = await axiosInstance.get('/pdf')
    return response.data.data // Server returns { success: true, data: [...] }
  },
  
  uploadPdf: async (formData, onProgress) => {
    const response = await axiosInstance.post('/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })
    return response.data.data // Server returns { success: true, data: {...} }
  },
  
  deletePdf: async (id) => {
    const response = await axiosInstance.delete(`/pdf/${id}`)
    return response.data // Server returns { success: true, message: "..." }
  },
}

// AI services
export const aiService = {
  makeCall: async (leadData) => {
    const response = await axiosInstance.post('/ai/call', leadData)
    return response.data
  },
  
  getCallHistory: async () => {
    const response = await axiosInstance.get('/ai/calls')
    return response.data
  },
}