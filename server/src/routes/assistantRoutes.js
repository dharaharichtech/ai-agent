const express = require('express');
const { body } = require('express-validator');
const assistantController = require('../controllers/assistantController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for assistant creation
const assistantValidation = [
  body('name')
    .notEmpty()
    .withMessage('Assistant name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Assistant name must be between 2 and 100 characters'),
  
  body('systemPrompt')
    .notEmpty()
    .withMessage('System prompt is required')
    .isLength({ max: 5000 })
    .withMessage('System prompt must not exceed 5000 characters'),
  
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic', 'google'])
    .withMessage('Provider must be one of: openai, anthropic, google'),
  
  body('model')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Model name must be between 1 and 100 characters'),
  
  body('voiceProvider')
    .optional()
    .isIn(['11labs', 'playht', 'deepgram', 'azure', 'openai'])
    .withMessage('Voice provider must be one of: 11labs, playht, deepgram, azure, openai'),
  
  body('firstMessage')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('First message must not exceed 1000 characters'),
  
  body('metadata.type')
    .optional()
    .isIn(['sales', 'support', 'lead-capture', 'follow-up', 'survey', 'appointment', 'general'])
    .withMessage('Type must be one of: sales, support, lead-capture, follow-up, survey, appointment, general')
];

// Assistant routes

// GET /api/assistants/test-connection - Test Bolna connection
router.get('/test-connection', authMiddleware, assistantController.testBolnaConnection);

// GET /api/assistants/public-key - Get public key for client
router.get('/public-key', assistantController.getPublicKey);

// GET /api/assistants/check-sync - Check all assistants sync status
router.get('/check-sync', authMiddleware, assistantController.checkAllAssistantsSync);

// POST /api/assistants - Create a new assistant
router.post('/', authMiddleware, assistantValidation, assistantController.createAssistant);

// GET /api/assistants - Get user's assistants
router.get('/', authMiddleware, assistantController.getUserAssistants);

// GET /api/assistants/:assistantId - Get assistant by ID
router.get('/:assistantId', authMiddleware, assistantController.getAssistant);

// GET /api/assistants/:assistantId/verify-sync - Verify assistant sync with Bolna
router.get('/:assistantId/verify-sync', authMiddleware, assistantController.verifyAssistantSync);

// PUT /api/assistants/:assistantId - Update assistant
router.put('/:assistantId', authMiddleware, assistantValidation, assistantController.updateAssistant);

// DELETE /api/assistants/:assistantId - Delete assistant
router.delete('/:assistantId', authMiddleware, assistantController.deleteAssistant);

// GET /api/assistants/:assistantId/stats - Get assistant statistics
router.get('/:assistantId/stats', authMiddleware, assistantController.getAssistantStats);

module.exports = router;
