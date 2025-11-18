const express = require('express')
const router = express.Router()
const leadController = require('../controllers/leadController')
const { authMiddleware } = require('../middleware/authMiddleware')


// Apply authentication middleware to all lead routes
router.use(authMiddleware)

/**
 * @route   POST /api/leads
 * @desc    Create a new lead
 * @access  Private (authenticated users)
 * @body    {
 *            full_name: string (required),
 *            hindi_name: string (optional),
 *            contact_number: string (required),
 *            leadtype: string (optional) - 'cold' or 'hot',
 *            callconnections_tatus: string (optional) - 'pending', 'connected', 'failed', 'completed', 'cancelled',
 *            upload_leads: string (optional) - Excel file path
 *          }
 */
router.post('/', leadController.createLead)

/**
 * @route   GET /api/leads
 * @desc    Get user's leads with pagination and filtering
 * @access  Private (authenticated users)
 * @query   {
 *            page: number (default: 1),
 *            limit: number (default: 10),
 *            sortBy: string (default: 'createdAt'),
 *            sortOrder: string (default: 'desc'),
 *            leadtype: string ('cold' or 'hot'),
 *            callconnections_tatus: string,
 *            search: string (searches in full_name, hindi_name, contact_number)
 *          }
 */
router.get('/', leadController.getUserLeads)

/**
 * @route   GET /api/leads/stats
 * @desc    Get lead statistics for the user (or all if admin)
 * @access  Private (authenticated users)
 */
router.get('/stats', leadController.getLeadStatistics)

/**
 * @route   GET /api/leads/projects
 * @desc    Get all project names for the user
 * @access  Private (authenticated users)
 */
router.get('/projects', leadController.getProjectNames)

/**
 * @route   GET /api/leads/projects/counts
 * @desc    Get leads count by project for the user
 * @access  Private (authenticated users)
 */
router.get('/projects/counts', leadController.getLeadsCountByProject)

/**
 * @route   GET /api/leads/projects/:projectName
 * @desc    Get leads by project name
 * @access  Private (authenticated users)
 */
router.get('/projects/:projectName', leadController.getLeadsByProject)

/**
 * @route   GET /api/leads/all
 * @desc    Get all leads (admin only)
 * @access  Private (admin only)
 * @query   Same as GET /api/leads
 */
router.get('/all', leadController.getAllLeads)

/**
 * @route   GET /api/leads/:id
 * @desc    Get lead by ID
 * @access  Private (authenticated users - can only access their own leads unless admin)
 */
router.get('/:id', leadController.getLeadById)

/**
 * @route   PUT /api/leads/:id
 * @desc    Update lead by ID
 * @access  Private (authenticated users - can only update their own leads unless admin)
 * @body    Any lead fields to update (same structure as POST)
 */
router.put('/:id', leadController.updateLead)

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete lead by ID (soft delete)
 * @access  Private (authenticated users - can only delete their own leads unless admin)
 */
router.delete('/:id', leadController.deleteLead)

module.exports = router