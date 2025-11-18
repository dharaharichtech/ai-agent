const autoCallService = require('../services/autoCallService');

class AutoCallController {
  // Start auto calling service
  async startAutoCalling(req, res) {
    try {
      const userId = req.user.id;
      const options = req.body || {};

      const result = await autoCallService.startAutoCalling(userId, options);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: autoCallService.getStatus()
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('AutoCallController.startAutoCalling error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Stop auto calling service
  async stopAutoCalling(req, res) {
    try {
      const result = autoCallService.stopAutoCalling();

      return res.status(200).json({
        success: true,
        message: result.message,
        data: autoCallService.getStatus()
      });
    } catch (error) {
      console.error('AutoCallController.stopAutoCalling error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get auto calling status
  async getAutoCallStatus(req, res) {
    try {
      const status = autoCallService.getStatus();

      return res.status(200).json({
        success: true,
        message: 'Auto call status retrieved successfully',
        data: status
      });
    } catch (error) {
      console.error('AutoCallController.getAutoCallStatus error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update auto calling settings
  async updateAutoCallSettings(req, res) {
    try {
      const settings = req.body;
      const updatedStatus = autoCallService.updateSettings(settings);

      return res.status(200).json({
        success: true,
        message: 'Auto call settings updated successfully',
        data: updatedStatus
      });
    } catch (error) {
      console.error('AutoCallController.updateAutoCallSettings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get leads eligible for auto calling
  async getEligibleLeads(req, res) {
    try {
      const userId = req.user.id;
      const { statuses, projectName, limit } = req.query;

      const options = {};
      if (statuses) options.statuses = statuses.split(',');
      if (projectName) options.projectName = projectName;
      if (limit) options.limit = parseInt(limit);

      const leads = await autoCallService.getLeadsForAutoCalling(userId, options);

      return res.status(200).json({
        success: true,
        message: 'Eligible leads retrieved successfully',
        data: leads
      });
    } catch (error) {
      console.error('AutoCallController.getEligibleLeads error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new AutoCallController();