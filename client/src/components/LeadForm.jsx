import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createLead, updateLead } from '../redux/slices/leadSlice'
import { X, Save, Loader2, User, Phone, Users, Settings } from 'lucide-react'
import Alert from './common/Alert'

const LeadForm = ({ lead = null, isOpen, onClose, onSuccess, projectName = '' }) => {
  const dispatch = useDispatch()
  const { isCreating, isUpdating, error } = useSelector((state) => state.leads)

  const [formData, setFormData] = useState({
    full_name: '',
    hindi_name: '',
    contact_number: '',
    leadtype: 'cold',
    callconnections_tatus: 'pending',
    project_name: '',
    upload_leads: ''
  })

  const [errors, setErrors] = useState({})
  const [isClosing, setIsClosing] = useState(false)

  // Handle form closing animation
  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  // Prefill form data when editing a lead
  useEffect(() => {
    if (lead) {
      setFormData({
        full_name: lead.full_name || '',
        hindi_name: lead.hindi_name || '',
        contact_number: lead.contact_number || '',
        leadtype: lead.leadtype || 'cold',
        callConnectionStatus: lead.callConnectionStatus || 'pending',
        project_name: lead.project_name || projectName || '',
        upload_leads: lead.upload_leads || ''
      })
    } else {
      // Reset form for new lead creation
      setFormData({
        full_name: '',
        hindi_name: '',
        contact_number: '',
        leadtype: 'cold',
        callconnections_tatus: 'pending',
        project_name: projectName || '',
        upload_leads: ''
      })
    }
    // Clear any existing errors when form data changes
    setErrors({})
  }, [lead])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required'
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Invalid contact number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      let result
      if (lead) {
        // Update existing lead
        result = await dispatch(updateLead({
          leadId: lead._id,
          updateData: formData
        })).unwrap()
      } else {
        // Create new lead
        result = await dispatch(createLead(formData)).unwrap()
      }

      if (result) {
        onSuccess?.(result)
        // Add a small delay for visual feedback
        setTimeout(() => {
          handleClose()
        }, 100)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {lead ? 'Edit Lead' : 'Create New Lead'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {lead ? 'Update lead information' : 'Add a new lead to your database'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <Alert
              type="error"
              message={error}
              className="mb-6"
            />
          )}

          <div className="space-y-6">
            {/* Full Name */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.full_name 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="h-5 w-5 text-red-500">⚠</div>
                  </div>
                )}
              </div>
              {errors.full_name && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">•</span>
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Hindi Name */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <span className="text-orange-500 mr-2">अ</span>
                Hindi Name
              </label>
              <input
                type="text"
                name="hindi_name"
                value={formData.hindi_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white"
                placeholder="हिंदी नाम दर्ज करें"
              />
            </div>

            {/* Contact Number */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                Contact Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.contact_number 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="+91-9876543210"
                />
                {errors.contact_number && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="h-5 w-5 text-red-500">⚠</div>
                  </div>
                )}
              </div>
              {errors.contact_number && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">•</span>
                  {errors.contact_number}
                </p>
              )}
            </div>

            {/* Project Name */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Settings className="h-4 w-4 mr-2 text-gray-500" />
                Project Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white`}
                  placeholder="Enter project or assistant name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Associate this lead with a specific project or AI assistant
              </p>
            </div>

            {/* Two column layout for selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lead Type */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Lead Type
                </label>
                <select
                  name="leadtype"
                  value={formData.leadtype}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="cold">🧊 Cold Lead</option>
                  <option value="hot">🔥 Hot Lead</option>
                </select>
              </div>

              {/* Call Connection Status */}
              <div className="group">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Settings className="h-4 w-4 mr-2 text-gray-500" />
                  Call Status
                </label>
                <select
                  name="callconnections_tatus"
                  value={formData.callconnections_tatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 focus:border-blue-500 hover:border-gray-300 bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="connected">✅ Connected</option>
                  <option value="failed">❌ Failed</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">⚫ Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-sm font-semibold text-gray-600 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-transparent rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 transform hover:scale-105 flex items-center shadow-lg"
            >
              {(isCreating || isUpdating) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              {lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeadForm