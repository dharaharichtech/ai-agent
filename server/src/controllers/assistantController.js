const assistantService = require('../services/assistantService');

class AssistantController {
  // Test Bolna connection
  async testBolnaConnection(req, res) {
    try {
      const result = await assistantService.testBolnaConnection();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.testBolnaConnection error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create assistant
  async createAssistant(req, res) {
    try {
      const result = await assistantService.createAssistant(req);

      if (result.success) {
        return res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.errors ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          errors: result.errors,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.createAssistant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user's assistants
  async getUserAssistants(req, res) {
    try {
      const result = await assistantService.getUserAssistants(req.user.id, req.query);

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
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.getUserAssistants error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get assistant by ID
  async getAssistant(req, res) {
    try {
      const { assistantId } = req.params;
      const result = await assistantService.getAssistant(assistantId, req.user.id);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('required') ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.getAssistant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update assistant
  async updateAssistant(req, res) {
    try {
      const result = await assistantService.updateAssistant(req);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.errors ? 400 : 
                          result.message.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          errors: result.errors,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.updateAssistant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete assistant
  async deleteAssistant(req, res) {
    try {
      const { assistantId } = req.params;
      const result = await assistantService.deleteAssistant(assistantId, req.user.id);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('required') ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.deleteAssistant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get assistant statistics
  async getAssistantStats(req, res) {
    try {
      const { assistantId } = req.params;
      const result = await assistantService.getAssistantStats(assistantId, req.user.id);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.getAssistantStats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get public key for client-side usage
  async getPublicKey(req, res) {
    try {
      const result = await assistantService.getPublicKey();

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('AssistantController.getPublicKey error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Verify and sync assistant with Bolna
  async verifyAssistantSync(req, res) {
    try {
      const { assistantId } = req.params;
      const result = await assistantService.verifyAndSyncAssistant(assistantId, req.user.id);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('AssistantController.verifyAssistantSync error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Check all assistants sync status
  async checkAllAssistantsSync(req, res) {
    try {
      const result = await assistantService.checkAllAssistantsSync(req.user.id);

      if (result.success) {
        return res.status(200).json({
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
      console.error('AssistantController.checkAllAssistantsSync error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new AssistantController();