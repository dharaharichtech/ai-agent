const leadService = require('../services/leadService')

class LeadController {
  // Create a new lead
  async createLead(req, res) {
    try {
      const userId = req.user._id
      const leadData = req.body

      // Validate input data
      const validationErrors = leadService.validateLeadData(leadData)
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        })
      }

      const result = await leadService.createLead(leadData, userId)

      if (result.success) {
        return res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Create lead error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get lead by ID
  async getLeadById(req, res) {
    try {
      const { id } = req.params
      const userId = req.user._id
      const userRole = req.user.role

      const result = await leadService.getLeadById(id, userId, userRole)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('Unauthorized') ? 403 : 400
        return res.status(statusCode).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get lead by ID error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get user's leads with pagination and filtering
  async getUserLeads(req, res) {
    try {
      const userId = req.user._id
      const userRole = req.user.role

      // Extract query parameters
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        leadtype,
        callConnectionStatus,
        search,
        project_name // Add project_name filter
      } = req.query

      // Build filter object
      const filter = {}
      if (leadtype) filter.leadtype = leadtype
      if (callConnectionStatus) filter.callConnectionStatus = callConnectionStatus
      
      // Handle project_name and search filters
      const orConditions = []
      
      if (project_name) {
        // Filter by project_name or full_name (for backward compatibility)
        filter.$and = filter.$and || []
        filter.$and.push({
          $or: [
            { project_name: project_name },
            { full_name: project_name }
          ]
        })
      }
      
      // Add search functionality
      if (search) {
        orConditions.push(
          { full_name: { $regex: search, $options: 'i' } },
          { hindi_name: { $regex: search, $options: 'i' } },
          { contact_number: { $regex: search, $options: 'i' } }
        )
        filter.$and = filter.$and || []
        filter.$and.push({ $or: orConditions })
      }

      // Build sort object
      const sort = {}
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        filter
      }

      let result
      if (userRole === 'admin') {
        result = await leadService.getAllLeads(options)
      } else {
        result = await leadService.getUserLeads(userId, options)
      }

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          pagination: {
            page: result.data.page,
            pages: result.data.pages,
            total: result.data.total,
            limit: parseInt(limit)
          }
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get user leads error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Update lead
  async updateLead(req, res) {
    try {
      const { id } = req.params
      const userId = req.user._id
      const userRole = req.user.role
      const updateData = req.body

      // Validate input data if provided (skip required field validation for updates)
      if (Object.keys(updateData).length > 0) {
        const validationErrors = leadService.validatePartialLeadData(updateData)
        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
          })
        }
      }

      const result = await leadService.updateLead(id, updateData, userId, userRole)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('Unauthorized') ? 403 : 400
        return res.status(statusCode).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Update lead error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Delete lead (soft delete)
  async deleteLead(req, res) {
    try {
      const { id } = req.params
      const userId = req.user._id
      const userRole = req.user.role

      const result = await leadService.deleteLead(id, userId, userRole)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        })
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 
                          result.message.includes('Unauthorized') ? 403 : 400
        return res.status(statusCode).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Delete lead error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get lead statistics
  async getLeadStatistics(req, res) {
    try {
      const userId = req.user._id
      const userRole = req.user.role

      const result = await leadService.getLeadStatistics(userId, userRole)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get lead statistics error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get all leads (admin only)
  async getAllLeads(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. Admin access required.'
        })
      }

      // Extract query parameters
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        leadtype,
        callConnectionStatus,
        search
      } = req.query

      // Build filter object
      const filter = {}
      if (leadtype) filter.leadtype = leadtype
      if (callConnectionStatus) filter.callConnectionStatus = callConnectionStatus
      
      // Add search functionality
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { hindi_name: { $regex: search, $options: 'i' } },
          { contact_number: { $regex: search, $options: 'i' } }
        ]
      }

      // Build sort object
      const sort = {}
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        filter
      }

      const result = await leadService.getAllLeads(options)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          pagination: {
            page: result.data.page,
            pages: result.data.pages,
            total: result.data.total,
            limit: parseInt(limit)
          }
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get all leads error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get leads by project name
  async getLeadsByProject(req, res) {
    try {
      const { projectName } = req.params
      const userId = req.user.id
      
      console.log('📞 getLeadsByProject called:')
      console.log('   Project Name (raw):', projectName)
      console.log('   Project Name (decoded):', decodeURIComponent(projectName))
      console.log('   User ID:', userId)
      console.log('   Query params:', req.query)
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: { [req.query.sortBy || 'createdAt']: req.query.sortOrder === 'asc' ? 1 : -1 },
        filter: {}
      }

      // Add filters
      if (req.query.search) {
        options.filter.$or = [
          { full_name: { $regex: req.query.search, $options: 'i' } },
          { hindi_name: { $regex: req.query.search, $options: 'i' } },
          { contact_number: { $regex: req.query.search, $options: 'i' } }
        ]
      }

      if (req.query.callConnectionStatus) {
        options.filter.callConnectionStatus = req.query.callConnectionStatus
      }

      if (req.query.leadtype) {
        options.filter.leadtype = req.query.leadtype
      }

      console.log('   Options:', JSON.stringify(options, null, 2))

      const result = await leadService.getLeadsByProject(userId, decodeURIComponent(projectName), options)

      console.log('   Result success:', result.success)
      console.log('   Leads count:', result.data?.leads?.length || 0)
      console.log('   Total in DB:', result.data?.pagination?.total || 0)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get leads by project error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get project names
  async getProjectNames(req, res) {
    try {
      const userId = req.user.id
      const result = await leadService.getProjectNames(userId)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get project names error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Get leads count by project
  async getLeadsCountByProject(req, res) {
    try {
      const userId = req.user.id
      const result = await leadService.getLeadsCountByProject(userId)

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        })
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Get leads count by project error:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

module.exports = new LeadController()