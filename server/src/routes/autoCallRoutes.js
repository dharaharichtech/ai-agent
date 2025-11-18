const express = require('express');
const router = express.Router();
const autoCallController = require('../controllers/autoCallController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Start auto calling service
router.post('/start', autoCallController.startAutoCalling);

// Stop auto calling service
router.post('/stop', autoCallController.stopAutoCalling);

// Get auto calling status
router.get('/status', autoCallController.getAutoCallStatus);

// Update auto calling settings
router.put('/settings', autoCallController.updateAutoCallSettings);

// Get leads eligible for auto calling
router.get('/eligible-leads', autoCallController.getEligibleLeads);

module.exports = router;