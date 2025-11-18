const express = require('express');
const { body } = require('express-validator');
const callController = require('../controllers/callController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for call creation
const callValidation = [
  body('assistantId')
    .notEmpty()
    .withMessage('Assistant ID is required'),
  
  body('customer')
    .optional()
    .isObject()
    .withMessage('Customer must be an object'),
  
  body('customer.number')
    .optional()
    .isMobilePhone()
    .withMessage('Customer phone number must be valid'),
  
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Call name must not exceed 100 characters')
];

// Call routes

// POST /api/calls - Create a new call
router.post('/', authMiddleware, callValidation, callController.createCall);

// GET /api/calls - Get all call history for user
router.get('/', authMiddleware, callController.getAllCallHistory);

// GET /api/calls/recent - Get recent calls for dashboard
router.get('/recent', authMiddleware, callController.getRecentCalls);

// GET /api/calls/search - Search call history
router.get('/search', authMiddleware, callController.searchCallHistory);

// GET /api/calls/stats - Get call statistics by date range
router.get('/stats', authMiddleware, callController.getCallStatsByDateRange);

// GET /api/calls/:callId/recording - Get specific call recording
router.get('/:callId/recording', authMiddleware, callController.getCallRecording);

// GET /api/calls/assistant/:assistantId - Get call history for specific assistant
router.get('/assistant/:assistantId', authMiddleware, callController.getAssistantCallHistory);

// Webhook route (no auth required for VAPI webhooks)
// POST /api/calls/webhook - Handle VAPI webhooks
router.post('/webhook', callController.handleWebhook);

// Test webhook route (for debugging)
// POST /api/calls/test-webhook - Test webhook processing
router.post('/test-webhook', callController.testWebhook);

module.exports = router;