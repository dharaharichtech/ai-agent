const leadRepository = require('../repositories/leadRepository')
const userRepository = require('../repositories/userRepository')
const mongoose = require('mongoose')

class LeadService {
  // Create a new lead
  async createLead(leadData, userId) {
    try {
      // Validate user exists
      const userExists = await userRepository.findById(userId)
      if (!userExists) {
        throw new Error('User not found')
      }

      // Check if contact number already exists for this user
      const existingLead = await leadRepository.findByContactNumber(
        leadData.contact_number,
        userId
      )
      
      if (existingLead) {
        throw new Error('Lead with this contact number already exists')
      }

      // Prepare lead data
      const newLeadData = {
        ...leadData,
        user_id: userId
      }

      // Validate required fields
      if (!newLeadData.full_name || !newLeadData.contact_number) {
        throw new Error('Full name and contact number are required')
      }

      // Create lead
      const lead = await leadRepository.create(newLeadData)
      
      return {
        success: true,
        message: 'Lead created successfully',
        data: lead
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create lead',
        data: null
      }
    }
  }

  // Get lead by ID
  async getLeadById(leadId, userId, userRole) {
    try {
      // Validate lead ID
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new Error('Invalid lead ID')
      }

      const lead = await leadRepository.findById(leadId)
      
      if (!lead) {
        throw new Error('Lead not found')
      }

      // Check if user has permission to view this lead
      if (userRole !== 'admin' && lead.user_id._id.toString() !== userId.toString()) {
        throw new Error('Unauthorized to access this lead')
      }

      return {
        success: true,
        message: 'Lead retrieved successfully',
        data: lead
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve lead',
        data: null
      }
    }
  }

  // Get leads for a user
  async getUserLeads(userId, options = {}) {
    try {
      // Validate user exists
      const userExists = await userRepository.findById(userId)
      if (!userExists) {
        throw new Error('User not found')
      }

      const result = await leadRepository.findByUserId(userId, options)
      
      return {
        success: true,
        message: 'Leads retrieved successfully',
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leads',
        data: null
      }
    }
  }

  // Get all leads (admin only)
  async getAllLeads(options = {}) {
    try {
      const result = await leadRepository.findAll(options)
      
      return {
        success: true,
        message: 'All leads retrieved successfully',
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leads',
        data: null
      }
    }
  }

  // Update lead
  async updateLead(leadId, updateData, userId, userRole) {
    try {
      // Validate lead ID
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new Error('Invalid lead ID')
      }

      // Get existing lead
      const existingLead = await leadRepository.findById(leadId)
      if (!existingLead) {
        throw new Error('Lead not found')
      }

      // Check permission
      if (userRole !== 'admin' && existingLead.user_id._id.toString() !== userId.toString()) {
        throw new Error('Unauthorized to update this lead')
      }

      // If updating contact number, check for duplicates
      if (updateData.contact_number && updateData.contact_number !== existingLead.contact_number) {
        const duplicateLead = await leadRepository.findByContactNumber(
          updateData.contact_number,
          existingLead.user_id._id
        )
        
        if (duplicateLead && duplicateLead._id.toString() !== leadId) {
          throw new Error('Lead with this contact number already exists')
        }
      }

      // Remove fields that shouldn't be updated
      const { user_id, _id, ...cleanUpdateData } = updateData

      const updatedLead = await leadRepository.update(leadId, cleanUpdateData)
      
      return {
        success: true,
        message: 'Lead updated successfully',
        data: updatedLead
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update lead',
        data: null
      }
    }
  }

  // Delete lead (soft delete)
  async deleteLead(leadId, userId, userRole) {
    try {
      // Validate lead ID
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new Error('Invalid lead ID')
      }

      // Get existing lead
      const existingLead = await leadRepository.findById(leadId)
      if (!existingLead) {
        throw new Error('Lead not found')
      }

      // Check permission
      if (userRole !== 'admin' && existingLead.user_id._id.toString() !== userId.toString()) {
        throw new Error('Unauthorized to delete this lead')
      }

      await leadRepository.softDelete(leadId)
      
      return {
        success: true,
        message: 'Lead deleted successfully',
        data: null
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete lead',
        data: null
      }
    }
  }

  // Get lead statistics
  async getLeadStatistics(userId, userRole) {
    try {
      let stats

      if (userRole === 'admin') {
        // For admin, get overall stats (this would need additional repository method)
        stats = await leadRepository.getLeadStats(null)
      } else {
        // For regular user, get their stats
        const userExists = await userRepository.findById(userId)
        if (!userExists) {
          throw new Error('User not found')
        }
        
        stats = await leadRepository.getLeadStats(userId)
      }
      
      return {
        success: true,
        message: 'Lead statistics retrieved successfully',
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve lead statistics',
        data: null
      }
    }
  }

  // Validate lead data (for creating new leads)
  validateLeadData(leadData) {
    const errors = []

    if (!leadData.full_name || leadData.full_name.trim().length === 0) {
      errors.push('Full name is required')
    }

    if (!leadData.contact_number || leadData.contact_number.trim().length === 0) {
      errors.push('Contact number is required')
    }

    if (leadData.contact_number && !/^\+?[\d\s-()]+$/.test(leadData.contact_number)) {
      errors.push('Invalid contact number format')
    }

    if (leadData.leadtype && !['cold', 'hot'].includes(leadData.leadtype)) {
      errors.push('Lead type must be either "cold" or "hot"')
    }

    if (leadData.callConnectionStatus && 
        !['pending', 'connected', 'failed', 'completed', 'cancelled', 'in-progress'].includes(leadData.callConnectionStatus)) {
      errors.push('Invalid call connection status')
    }

    return errors
  }

  // Validate partial lead data (for updates - only validates provided fields)
  validatePartialLeadData(leadData) {
    const errors = []

    // Only validate fields that are provided
    if (leadData.full_name !== undefined && 
        (!leadData.full_name || leadData.full_name.trim().length === 0)) {
      errors.push('Full name cannot be empty')
    }

    if (leadData.contact_number !== undefined && 
        (!leadData.contact_number || leadData.contact_number.trim().length === 0)) {
      errors.push('Contact number cannot be empty')
    }

    if (leadData.contact_number && !/^\+?[\d\s-()]+$/.test(leadData.contact_number)) {
      errors.push('Invalid contact number format')
    }

    if (leadData.leadtype && !['cold', 'hot'].includes(leadData.leadtype)) {
      errors.push('Lead type must be either "cold" or "hot"')
    }

    if (leadData.callConnectionStatus && 
        !['pending', 'connected', 'failed', 'completed', 'cancelled', 'in-progress'].includes(leadData.callConnectionStatus)) {
      errors.push('Invalid call connection status')
    }

    return errors
  }
  
  // Get leads by project name
  async getLeadsByProject(userId, projectName, options = {}) {
    try {
      const result = await leadRepository.getLeadsByProjectName(userId, projectName, options)
      
      return {
        success: true,
        message: 'Leads retrieved successfully',
        data: result
      }
    } catch (error) {
      console.error('getLeadsByProject Error:', error)
      return {
        success: false,
        message: 'Failed to retrieve leads by project',
        error: error.message
      }
    }
  }

  // Get all project names for user
  async getProjectNames(userId) {
    try {
      const projectNames = await leadRepository.getProjectNames(userId)
      
      return {
        success: true,
        message: 'Project names retrieved successfully',
        data: projectNames
      }
    } catch (error) {
      console.error('getProjectNames Error:', error)
      return {
        success: false,
        message: 'Failed to retrieve project names',
        error: error.message
      }
    }
  }

  // Get leads count by project
  async getLeadsCountByProject(userId) {
    try {
      const counts = await leadRepository.getLeadsCountByProject(userId)
      
      return {
        success: true,
        message: 'Project lead counts retrieved successfully',
        data: counts
      }
    } catch (error) {
      console.error('getLeadsCountByProject Error:', error)
      return {
        success: false,
        message: 'Failed to retrieve project lead counts',
        error: error.message
      }
    }
  }
}

module.exports = new LeadService()