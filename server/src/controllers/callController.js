const callService = require('../services/callService');

class CallController {
  // Create a call with assistant
  async createCall(req, res) {
    try {
      const result = await callService.createCall(req.body, req.user.id);

      if (result.success) {
        return res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('CallController.createCall error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Handle VAPI webhooks
  async handleWebhook(req, res) {
    try {
      console.log('🚨 WEBHOOK RECEIVED 🚨');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('========================');
      
      const result = await callService.handleWebhook(req.body);

      if (result.success) {
        console.log('✅ Webhook processed successfully');
        return res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        console.log('❌ Webhook processing failed:', result.error);
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ CallController.handleWebhook error:', error);
      return res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  }

  // Get call history for an assistant
  async getAssistantCallHistory(req, res) {
    try {
      const { assistantId } = req.params;
      const result = await callService.getAssistantCallHistory(assistantId, req.user.id, req.query);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          pagination: result.pagination
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.getAssistantCallHistory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all call history for user (across all assistants)
  async getAllCallHistory(req, res) {
    try {
      const result = await callService.getAllUserCallHistory(req.user.id, req.query);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          pagination: result.pagination
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.getAllCallHistory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get specific call recording
  async getCallRecording(req, res) {
    try {
      const { callId } = req.params;
      const result = await callService.getCallRecording(callId, req.user.id);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('Access denied') ? 403 : 400;
        return res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.getCallRecording error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get call statistics by date range
  async getCallStatsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const result = await callService.getCallStatsByDateRange(req.user.id, startDate, endDate);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.getCallStatsByDateRange error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search call history
  async searchCallHistory(req, res) {
    try {
      const { search } = req.query;
      
      if (!search || search.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const result = await callService.searchCallHistory(req.user.id, search.trim(), req.query);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.searchCallHistory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get recent calls for dashboard
  async getRecentCalls(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const result = await callService.getRecentCalls(req.user.id, limit);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('CallController.getRecentCalls error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Test webhook endpoint
  async testWebhook(req, res) {
    try {
      console.log('🧪 WEBHOOK TEST ENDPOINT CALLED');
      
      // Simulate a webhook event for testing
      const testWebhookData = {
        type: 'call-ended',
        data: {
          id: 'test-call-' + Date.now(),
          assistantId: '4bcac740-9c7d-4aac-96b5-125eed5d8496',
          customer: {
            number: req.body.phoneNumber || '+919876543210'
          },
          endedReason: 'assistant-ended-call',
          durationSeconds: 45,
          startedAt: new Date(Date.now() - 45000).toISOString(),
          endedAt: new Date().toISOString(),
          cost: 0.05
        }
      };
      
      const result = await callService.handleWebhook(testWebhookData);
      
      return res.status(200).json({
        success: true,
        message: 'Test webhook processed successfully',
        data: result
      });
      
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      return res.status(500).json({
        success: false,
        message: 'Test webhook failed',
        error: error.message
      });
    }
  }
}

module.exports = new CallController();