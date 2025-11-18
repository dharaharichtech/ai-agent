import axiosInstance from './axiosInstance.js'

class AutoCallService {
  constructor() {
    this.baseURL = '/auto-calls';
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

  // Start auto calling service
  async startAutoCalling(options = {}) {
    try {
      console.debug('[AutoCallService] Starting auto calling with options:', options);
      const response = await axiosInstance.post(this._buildUrl(`${this.baseURL}/start`), options);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error starting auto calling:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to start auto calling'
      };
    }
  }

  // Stop auto calling service
  async stopAutoCalling() {
    try {
      console.debug('[AutoCallService] Stopping auto calling');
      const response = await axiosInstance.post(this._buildUrl(`${this.baseURL}/stop`));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error stopping auto calling:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to stop auto calling'
      };
    }
  }

  // Get auto calling status
  async getAutoCallStatus() {
    try {
      const response = await axiosInstance.get(this._buildUrl(`${this.baseURL}/status`));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting auto call status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get auto call status'
      };
    }
  }

  // Update auto calling settings
  async updateSettings(settings) {
    try {
      console.debug('[AutoCallService] Updating settings:', settings);
      const response = await axiosInstance.put(this._buildUrl(`${this.baseURL}/settings`), settings);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating auto call settings:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update auto call settings'
      };
    }
  }

  // Get leads eligible for auto calling
  async getEligibleLeads(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.statuses && Array.isArray(options.statuses)) {
        params.append('statuses', options.statuses.join(','));
      }
      
      if (options.projectName) {
        params.append('projectName', options.projectName);
      }
      
      if (options.limit) {
        params.append('limit', options.limit.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}/eligible-leads?${queryString}` : `${this.baseURL}/eligible-leads`;
      
      const response = await axiosInstance.get(this._buildUrl(url));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting eligible leads:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get eligible leads'
      };
    }
  }
}

export default new AutoCallService();