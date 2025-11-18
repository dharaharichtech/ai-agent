import axiosInstance from './axiosInstance.js'

class AssistantService {
  constructor() {
    this.baseURL = '/assistants';
  }

  // Build a final request URL that avoids duplicate '/api' when axiosInstance.baseURL
  // already contains '/api'. This prevents requests like '/api/api/assistants'.
  _buildUrl(endpoint) {
    try {
      const base = axiosInstance.defaults.baseURL || '';
      // If base already ends with '/api' and endpoint starts with '/api', strip endpoint's leading '/api'
      if (base.endsWith('/api') && endpoint.startsWith('/api')) {
        return endpoint.replace(/^\/api/, '');
      }
      return endpoint;
    } catch (e) {
      return endpoint;
    }
  }

  // Create a new assistant
  async createAssistant(assistantData) {
    try {
      const response = await axiosInstance.post(this.baseURL, assistantData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating assistant:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create assistant',
        details: error.response?.data?.errors || []
      };
    }
  }

  // Get all assistants for the current user
  async getUserAssistants(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

  const endpoint = `${this.baseURL}?${params.toString()}`;
  console.debug('[AssistantService] GET', axiosInstance.defaults.baseURL, endpoint);
  const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assistants',
        data: []
      };
    }
  }

  // Get a specific assistant by ID
  async getAssistantById(assistantId) {
    try {
  const endpoint = `${this.baseURL}/${assistantId}`;
  console.debug('[AssistantService] GET', axiosInstance.defaults.baseURL, endpoint);
  const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching assistant:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assistant'
      };
    }
  }

  // Update an existing assistant
  async updateAssistant(assistantId, updateData) {
    try {
  const endpoint = `${this.baseURL}/${assistantId}`;
  console.debug('[AssistantService] PUT', axiosInstance.defaults.baseURL, endpoint);
  const response = await axiosInstance.put(this._buildUrl(endpoint), updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating assistant:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update assistant',
        details: error.response?.data?.errors || []
      };
    }
  }

  // Delete an assistant
  async deleteAssistant(assistantId) {
    try {
  const endpoint = `${this.baseURL}/${assistantId}`;
  console.debug('[AssistantService] DELETE', axiosInstance.defaults.baseURL, endpoint);
  const response = await axiosInstance.delete(this._buildUrl(endpoint));
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting assistant:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete assistant'
      };
    }
  }

  // Alias method for backward compatibility
  async getAssistants(filters = {}) {
    return this.getUserAssistants(filters);
  }

  // Create a call using an assistant
  async createCall(callData) {
    try {
      if (!callData.assistantId) {
        throw new Error('Assistant ID is required');
      }

      // Transform frontend data to match server expected format
      const transformedCallData = {
        assistantId: callData.assistantId,
        phoneNumber: callData.phoneNumber, // VAPI expects phoneNumber at root level
        customer: {
          number: callData.phoneNumber
        },
        name: callData.customerName || 'Call via Web App'
      };

      const endpoint = '/calls';
      console.debug('[AssistantService] POST', axiosInstance.defaults.baseURL, endpoint);
      console.debug('[AssistantService] Call Data:', transformedCallData);
      const response = await axiosInstance.post(this._buildUrl(endpoint), transformedCallData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating call:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create call'
      };
    }
  }

  // Toggle assistant status (active/inactive)
  async toggleAssistantStatus(assistantId, status) {
    try {
  const endpoint = `${this.baseURL}/${assistantId}/status`;
  console.debug('[AssistantService] PATCH', axiosInstance.defaults.baseURL, endpoint, { status });
  const response = await axiosInstance.patch(this._buildUrl(endpoint), { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error toggling assistant status:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update assistant status'
      };
    }
  }

  // Validate phone number format (E.164)
  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber)
  }

  // Get available voice providers and voices
  getVoiceOptions() {
    return {
      azure: {
        voices: [
          { id: 'andrew', name: 'Andrew (Male, English US)' },
          { id: 'aria', name: 'Aria (Female, English US)' },
          { id: 'brian', name: 'Brian (Male, English US)' },
          { id: 'emma', name: 'Emma (Female, English US)' },
          { id: 'jenny', name: 'Jenny (Female, English US)' },
          { id: 'ryan', name: 'Ryan (Male, English US)' }
        ]
      },
      openai: {
        voices: [
          { id: 'alloy', name: 'Alloy' },
          { id: 'echo', name: 'Echo' },
          { id: 'fable', name: 'Fable' },
          { id: 'onyx', name: 'Onyx' },
          { id: 'nova', name: 'Nova' },
          { id: 'shimmer', name: 'Shimmer' }
        ]
      },
      '11labs': {
        voices: [
          { id: 'adam', name: 'Adam (Male)' },
          { id: 'alice', name: 'Alice (Female)' },
          { id: 'charlie', name: 'Charlie (Male)' },
          { id: 'dorothy', name: 'Dorothy (Female)' }
        ]
      }
    }
  }

  // Get available model options
  getModelOptions() {
    return {
      openai: {
        models: [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
        ]
      },
      anthropic: {
        models: [
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
        ]
      }
    }
  }

  // Helper methods for formatting and validation
  formatAssistantData(rawData) {
    return {
      id: rawData._id || rawData.id,
      name: rawData.name,
      description: rawData.description,
      status: rawData.status,
      provider: rawData.config?.provider || 'openai',
      model: rawData.config?.model || 'gpt-3.5-turbo',
      voiceProvider: rawData.config?.voice?.provider || '11labs',
      voiceId: rawData.config?.voice?.voiceId || 'default',
      totalCalls: rawData.stats?.totalCalls || 0,
      successRate: rawData.stats?.successRate || 0,
      lastUsed: rawData.stats?.lastUsed,
      createdAt: rawData.createdAt,
      updatedAt: rawData.updatedAt,
      bolnaId: rawData.bolnaId,
      syncStatus: rawData.syncStatus,
      metadata: rawData.metadata
    };
  }

  validateAssistantData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Assistant name is required');
    }

    if (!data.systemPrompt || data.systemPrompt.trim().length === 0) {
      errors.push('System prompt is required');
    }

    if (data.systemPrompt && data.systemPrompt.length > 5000) {
      errors.push('System prompt must be under 5000 characters');
    }

    if (!data.provider) {
      errors.push('AI provider is required');
    }

    if (!data.model) {
      errors.push('AI model is required');
    }

    if (!data.voiceProvider) {
      errors.push('Voice provider is required');
    }

    if (data.maxDuration && (data.maxDuration < 30 || data.maxDuration > 3600)) {
      errors.push('Max duration must be between 30 seconds and 1 hour');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new AssistantService()