const Lead = require('../models/Lead')
const mongoose = require('mongoose')

class LeadRepository {
  // Create a new lead
  async create(leadData) {
    try {
      const lead = new Lead(leadData)
      return await lead.save()
    } catch (error) {
      throw error
    }
  }

  // Find lead by ID
  async findById(id) {
    try {
      return await Lead.findById(id).populate('user_id', 'name email companyName')
    } catch (error) {
      throw error
    }
  }

  // Find leads by user ID
  async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {}
      } = options

      const skip = (page - 1) * limit

      // Add user filter and exclude deleted leads
      const query = {
        user_id: userId,
        deleted_at: null,
        ...filter
      }

      const leads = await Lead.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email companyName')

      const total = await Lead.countDocuments(query)

      return {
        leads,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    } catch (error) {
      throw error
    }
  }

  // Find all active leads (for admin)
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {}
      } = options

      const skip = (page - 1) * limit

      // Exclude deleted leads
      const query = {
        deleted_at: null,
        ...filter
      }

      const leads = await Lead.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email companyName')

      const total = await Lead.countDocuments(query)

      return {
        leads,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    } catch (error) {
      throw error
    }
  }

  // Update lead
  async update(id, updateData) {
    try {
      return await Lead.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('user_id', 'name email companyName')
    } catch (error) {
      throw error
    }
  }

  // Soft delete lead
  async softDelete(id) {
    try {
      return await Lead.findByIdAndUpdate(
        id,
        { deleted_at: new Date() },
        { new: true }
      )
    } catch (error) {
      throw error
    }
  }

  // Check if lead exists
  async exists(id) {
    try {
      const lead = await Lead.findById(id).select('_id')
      return !!lead
    } catch (error) {
      throw error
    }
  }

  // Check if contact number already exists for user
  async findByContactNumber(contactNumber, userId) {
    try {
      return await Lead.findOne({
        contact_number: contactNumber,
        user_id: userId,
        deleted_at: null
      })
    } catch (error) {
      throw error
    }
  }

  // Get lead statistics for user
  async getLeadStats(userId) {
    try {
      const stats = await Lead.aggregate([
        {
          $match: {
            user_id: userId,
            deleted_at: null
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$callConnectionStatus', 'pending'] }, 1, 0]
              }
            },
            connected: {
              $sum: {
                $cond: [{ $eq: ['$callConnectionStatus', 'connected'] }, 1, 0]
              }
            },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$callConnectionStatus', 'completed'] }, 1, 0]
              }
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ['$callConnectionStatus', 'failed'] }, 1, 0]
              }
            },
            coldLeads: {
              $sum: {
                $cond: [{ $eq: ['$leadtype', 'cold'] }, 1, 0]
              }
            },
            hotLeads: {
              $sum: {
                $cond: [{ $eq: ['$leadtype', 'hot'] }, 1, 0]
              }
            }
          }
        }
      ])

      return stats[0] || {
        total: 0,
        pending: 0,
        connected: 0,
        completed: 0,
        failed: 0,
        coldLeads: 0,
        hotLeads: 0
      }
    } catch (error) {
      throw error
    }
  }

  // Find lead by phone number
  async getLeadByPhone(phoneNumber) {
    try {
      if (!phoneNumber) return null;
      
      // Clean the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Create multiple phone number variants to search for
      const phoneVariants = [
        phoneNumber,                                      // Original
        cleanPhone,                                       // Only digits
        `+91${cleanPhone}`,                               // With country code
        `+91${cleanPhone.replace(/^91/, '')}`,            // Remove leading 91 if exists and add +91
        cleanPhone.replace(/^91/, ''),                    // Remove leading 91
        `91${cleanPhone.replace(/^91/, '')}`,             // Ensure single 91 prefix
      ].filter((phone, index, arr) => arr.indexOf(phone) === index); // Remove duplicates

      // Search using regex for any of the variants
      const lead = await Lead.findOne({
        $or: phoneVariants.map(phone => ({ contact_number: { $regex: phone.replace(/[+]/g, '\\+'), $options: 'i' } })),
        deleted_at: null
      }).populate('user_id', 'name email companyName');

      return lead;
    } catch (error) {
      console.error('Error finding lead by phone:', error);
      return null;
    }
  }

  // Get leads grouped by project/assistant name
  async getLeadsByProjectName(userId, projectName = null, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {}
      } = options

      const skip = (page - 1) * limit

      // Build query
      const query = {
        user_id: userId,
        deleted_at: null,
        ...filter
      }

      // If project name specified, filter by it (case-insensitive)
      if (projectName) {
        query.project_name = { $regex: new RegExp(`^${projectName}$`, 'i') }
      }

      console.log('🔍 Repository Query:', JSON.stringify(query, null, 2))
      console.log('   Sort:', sort)
      console.log('   Skip:', skip, 'Limit:', limit)

      const leads = await Lead.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email companyName')

      const total = await Lead.countDocuments(query)
      
      console.log('✅ Found leads:', leads.length, '/ Total:', total)
      if (leads.length > 0) {
        console.log('   First lead project_name:', leads[0].project_name)
        console.log('   Sample lead names:', leads.slice(0, 3).map(l => l.full_name))
      }

      return {
        leads,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    } catch (error) {
      console.error('❌ Repository error:', error)
      throw error
    }
  }

  // Get all unique project names for a user
  async getProjectNames(userId) {
    try {
      const projectNames = await Lead.distinct('project_name', {
        user_id: userId,
        deleted_at: null,
        project_name: { $ne: null, $ne: '' }
      })

      return projectNames.filter(name => name) // Remove null/empty values
    } catch (error) {
      throw error
    }
  }

  // Get leads count by project name
  async getLeadsCountByProject(userId) {
    try {
      const pipeline = [
        {
          $match: {
            user_id: new mongoose.Types.ObjectId(userId),
            deleted_at: null,
            $or: [
              { project_name: { $ne: null, $ne: '' } },
              { full_name: { $ne: null, $ne: '' } }
            ]
          }
        },
        {
          $addFields: {
            // Use project_name if available, otherwise use full_name
            effectiveProjectName: {
              $ifNull: [
                { $cond: [{ $eq: ['$project_name', ''] }, null, '$project_name'] },
                '$full_name'
              ]
            }
          }
        },
        {
          $group: {
            _id: '$effectiveProjectName',
            count: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$callConnectionStatus', 'pending'] }, 1, 0] } },
            connected: { $sum: { $cond: [{ $eq: ['$callConnectionStatus', 'connected'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$callConnectionStatus', 'completed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$callConnectionStatus', 'failed'] }, 1, 0] } }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]

      const result = await Lead.aggregate(pipeline)
      return result.map(item => ({
        projectName: item._id,
        totalLeads: item.count,
        pending: item.pending,
        connected: item.connected,
        completed: item.completed,
        failed: item.failed
      }))
    } catch (error) {
      throw error
    }
  }

  // Find leads with custom filter for auto calling
  async findLeadsWithFilter(filter, options = {}) {
    try {
      const {
        limit = 10,
        sort = { createdAt: 1 },
        populate = true
      } = options;

      let query = Lead.find(filter);

      if (populate) {
        query = query.populate('user_id', 'name email companyName');
      }

      const leads = await query
        .sort(sort)
        .limit(limit);

      return leads;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LeadRepository()