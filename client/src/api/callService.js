import axiosInstance from './axiosInstance.js'

class CallService {
  constructor() {
    this.baseURL = '/calls';
  }

  // Build a final request URL that avoids duplicate '/api'
  _buildUrl(endpoint) {
    try {
      const base = axiosInstance.defaults.baseURL || '';
      if (base.endsWith('/api') && endpoint.startsWith('/api')) {
        return endpoint.replace(/^\/api/, '');
      }
      return endpoint;
    } catch (e) {
      return endpoint;
    }
  }

  // Create a new call
  async createCall(callData) {
    try {
      const transformedCallData = {
        assistantId: callData.assistantId,
        phoneNumber: callData.phoneNumber,
        customer: {
          number: callData.phoneNumber
        },
        name: callData.customerName || 'Call via Web App',
        metadata: {
          leadId: callData.leadId || null,
          source: 'web-app'
        }
      };

      const endpoint = this.baseURL;
      console.debug('[CallService] POST', axiosInstance.defaults.baseURL, endpoint);
      console.debug('[CallService] Call Data:', transformedCallData);
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
        error: error.response?.data?.message || error.message || 'Failed to create call'
      };
    }
  }

  // Get all calls for the current user
  async getUserCalls(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const endpoint = `${this.baseURL}?${params.toString()}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching calls:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch calls',
        data: []
      };
    }
  }

  // Get all call history with full details including recordings and transcripts
  async getAllCallHistory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const endpoint = `${this.baseURL}?${params.toString()}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching call history:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch call history',
        data: { callHistory: [], total: 0, pages: 0 }
      };
    }
  }

  // Get recent calls for dashboard
  async getRecentCalls(limit = 10) {
    try {
      const endpoint = `${this.baseURL}/recent?limit=${limit}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching recent calls:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent calls',
        data: []
      };
    }
  }

  // Get call statistics
  async getCallStats(dateRange = {}) {
    try {
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const endpoint = `${this.baseURL}/stats?${params.toString()}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching call stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch call stats',
        data: {}
      };
    }
  }

  // Get call by ID
  async getCallById(callId) {
    try {
      const endpoint = `${this.baseURL}/${callId}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching call:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch call'
      };
    }
  }

  // Get call recording URL
  async getCallRecording(callId) {
    try {
      const endpoint = `${this.baseURL}/${callId}/recording`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching call recording:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch call recording'
      };
    }
  }

  // Get calls for a specific assistant
  async getAssistantCalls(assistantId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const endpoint = `${this.baseURL}/assistant/${assistantId}?${params.toString()}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching assistant calls:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assistant calls',
        data: []
      };
    }
  }

  // Search call history
  async searchCalls(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const endpoint = `${this.baseURL}/search?${params.toString()}`;
      console.debug('[CallService] GET', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.get(this._buildUrl(endpoint));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error searching calls:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search calls',
        data: []
      };
    }
  }

  // Process webhook data (for real-time updates)
  async processWebhook(webhookData) {
    try {
      const endpoint = `${this.baseURL}/webhook`;
      console.debug('[CallService] POST', axiosInstance.defaults.baseURL, endpoint);
      const response = await axiosInstance.post(this._buildUrl(endpoint), webhookData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process webhook'
      };
    }
  }

  // Helper method to determine lead status based on call data
  getLeadStatusFromCall(callData) {
    if (!callData) return 'pending';

    // For completed/ended calls, check the endedReason to determine actual outcome
    if (callData.status === 'completed' || callData.status === 'ended') {
      return this._getEndedStatus(callData);
    }

    // Map call statuses to lead statuses
    const statusMapping = {
      'initiated': 'pending',
      'queued': 'pending',
      'ringing': 'pending', 
      'in-progress': 'connected',
      'forwarding': 'connected',
      'failed': 'failed',
      'no-answer': 'failed',
      'busy': 'failed'
    };

    return statusMapping[callData.status] || 'pending';
  }

  // Helper method to determine final status based on how call ended
  _getEndedStatus(callData) {
    const endedReason = callData.endedReason;
    const durationSeconds = callData.durationSeconds || 0;
    
    console.log(`Determining end status for call - Reason: ${endedReason}, Duration: ${durationSeconds}s`);
    
    // If no duration or very short duration + customer didn't answer = failed
    if (durationSeconds < 5 && (
      endedReason === 'customer-did-not-answer' ||
      endedReason === 'customer-busy' ||
      !endedReason
    )) {
      console.log('Call failed - no/short duration + no answer');
      return 'failed';
    }
    
    if (!endedReason) {
      // If no ended reason but has decent duration, consider it completed
      return durationSeconds > 5 ? 'completed' : 'failed';
    }

    // Map end reasons to lead statuses
    const endReasonMapping = {
      'assistant-ended-call': 'completed',
      'customer-ended-call': 'completed',
      'assistant-forwarded-call': 'completed',
      'customer-did-not-answer': 'failed',
      'customer-busy': 'failed',
      'assistant-did-not-respond': 'failed',
      'assistant-not-available': 'failed',
      'call-cancelled': 'failed',
      'voicemail': 'completed',
      'unknown': 'failed'
    };

    const finalStatus = endReasonMapping[endedReason] || 'failed';
    console.log(`Final status determined: ${finalStatus}`);
    return finalStatus;
  }

  // Format call duration
  formatDuration(seconds) {
    if (!seconds) return '0s';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  // Format call date
  formatCallDate(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export default new CallService()