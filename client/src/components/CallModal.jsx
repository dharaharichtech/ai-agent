import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import useAssistants from '../hooks/useAssistants'
import { X, Phone } from 'lucide-react'
import Alert from '../components/common/Alert'
import Loader from '../components/common/Loader'
import AssistantSelector from '../components/ui/AssistantSelector'

const CallModal = ({ isOpen, onClose, lead }) => {
  const {
    assistants,
    isLoading: assistantsLoading,
    error: assistantsError,
    callLoading,
    callError,
    lastCallResult,
    makeCall,
    clearErrors,
    clearCallResult,
    hasAssistants,
    isCallReady
  } = useAssistants()

  // Local state
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' })
  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, message: '' })
  const [callData, setCallData] = useState({
    assistantId: '',
    phoneNumber: '',
    customerName: ''
  })

  // Initialize call data when lead changes
  useEffect(() => {
    if (lead) {
      // Format the phone number to Indian format if needed
      let formattedNumber = lead.contact_number || ''
      if (formattedNumber) {
        // Remove any spaces, dashes, or other non-digit characters except +
        const cleaned = formattedNumber.replace(/[^\d+]/g, '')
        
        // If it's 10 digits starting with 6-9, add +91
        if (/^\d{10}$/.test(cleaned) && /^[6-9]/.test(cleaned)) {
          formattedNumber = '+91' + cleaned
        } else if (cleaned.startsWith('91') && cleaned.length === 12) {
          formattedNumber = '+' + cleaned
        } else if (!cleaned.startsWith('+')) {
          formattedNumber = '+' + cleaned
        } else {
          formattedNumber = cleaned
        }
      }

      setCallData({
        assistantId: '',
        phoneNumber: formattedNumber,
        customerName: lead.full_name || lead.hindi_name || ''
      })

      // Validate the formatted phone number
      if (formattedNumber) {
        const validation = validatePhoneNumber(formattedNumber)
        setPhoneValidation(validation)
      }
    }
  }, [lead])

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000)
  }, [])

  // Handle call success
  useEffect(() => {
    if (lastCallResult) {
      showAlert('Call initiated successfully!', 'success')
      // Close modal and clear the result after showing
      setTimeout(() => {
        clearCallResult()
        onClose()
      }, 2000)
    }
  }, [lastCallResult, clearCallResult, showAlert, onClose])

  // Handle call error
  useEffect(() => {
    if (callError) {
      showAlert(callError, 'error')
      // Clear error after showing
      setTimeout(() => clearErrors(), 100)
    }
  }, [callError, clearErrors, showAlert])

  // Handle assistants error
  useEffect(() => {
    if (assistantsError) {
      showAlert('Failed to load assistants', 'error')
      // Clear error after showing
      setTimeout(() => clearErrors(), 100)
    }
  }, [assistantsError, clearErrors, showAlert])

  const validatePhoneNumber = useCallback((phoneNumber) => {
    // STRICT validation - ONLY Indian mobile numbers allowed
    
    // Must start with +91 and be exactly 13 characters (+91 + 10 digits)
    if (!phoneNumber.startsWith('+91') || phoneNumber.length !== 13) {
      return {
        isValid: false,
        message: 'Only Indian mobile numbers allowed. Format: +919876543210'
      }
    }
    
    // Extract the 10-digit mobile number (after +91)
    const mobileNumber = phoneNumber.slice(3) // Remove +91
    
    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(mobileNumber)) {
      return {
        isValid: false,
        message: 'Mobile number must be exactly 10 digits after +91'
      }
    }
    
    // Must start with 6, 7, 8, or 9 (Indian mobile number pattern)
    if (!/^[6-9]/.test(mobileNumber)) {
      return {
        isValid: false,
        message: 'Indian mobile numbers must start with 6, 7, 8, or 9'
      }
    }
    
    return { isValid: true }
  }, [])

  const formatPhoneNumber = useCallback((value) => {
    // Remove all non-digits and spaces
    const cleaned = value.replace(/\D/g, '')
    
    // If empty, return empty
    if (cleaned.length === 0) return ''
    
    // If already starts with +, preserve it and clean the rest
    if (value.startsWith('+')) {
      return '+' + cleaned
    }
    
    // Auto-detect ONLY Indian mobile number pattern (10 digits starting with 6-9)
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      // Indian mobile number pattern (10 digits starting with 6-9)
      return '+91' + cleaned
    } else if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]/.test(cleaned)) {
      // Indian with leading 91
      return '+' + cleaned
    } else if (cleaned.length >= 1) {
      // For any other pattern, just add + but don't auto-format
      return '+' + cleaned
    }
    
    return value
  }, [])

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setCallData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const handlePhoneNumberChange = useCallback((e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setCallData(prev => ({
      ...prev,
      phoneNumber: formatted
    }))
    
    // Real-time validation
    if (formatted.length > 3) {
      const validation = validatePhoneNumber(formatted)
      setPhoneValidation(validation)
    } else {
      setPhoneValidation({ isValid: true, message: '' })
    }
  }, [formatPhoneNumber, validatePhoneNumber])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!callData.assistantId || !callData.phoneNumber) {
      showAlert('Please select an assistant and enter a phone number', 'error')
      return
    }

    // Use the validation function
    const phoneValidation = validatePhoneNumber(callData.phoneNumber)
    if (!phoneValidation.isValid) {
      showAlert(phoneValidation.message, 'error')
      return
    }

    // Make the call
    makeCall(callData)
  }, [callData, makeCall, showAlert, validatePhoneNumber])

  const handleClose = () => {
    setAlert({ show: false, message: '', type: 'info' })
    setCallData({ assistantId: '', phoneNumber: '', customerName: '' })
    setPhoneValidation({ isValid: true, message: '' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Phone className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Make Call
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lead Info */}
        {lead && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {lead.full_name}
                </h4>
                {lead.hindi_name && (
                  <p className="text-sm text-gray-500">{lead.hindi_name}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {lead.contact_number}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lead.leadtype === 'hot' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {lead.leadtype || 'cold'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {alert.show && (
            <Alert
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert({ show: false, message: '', type: 'info' })}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AssistantSelector
              assistants={assistants}
              selectedAssistantId={callData.assistantId}
              onChange={handleInputChange}
              loading={assistantsLoading}
              hasAssistants={hasAssistants}
              disabled={assistantsLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indian Mobile Number * (Required Format: +91XXXXXXXXXX)
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={callData.phoneNumber}
                onChange={handlePhoneNumberChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  callData.phoneNumber && !phoneValidation.isValid 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="+918347478512"
                required
              />
              {callData.phoneNumber && !phoneValidation.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  {phoneValidation.message}
                </p>
              )}
              {callData.phoneNumber && phoneValidation.isValid && callData.phoneNumber.length > 3 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Valid Indian mobile number format
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={callData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer name"
                maxLength={100}
                readOnly
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={callLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={callLoading || !isCallReady || !phoneValidation.isValid}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {callLoading && <Loader size="sm" className="mr-2" />}
                {callLoading ? 'Initiating Call...' : 'Make Call'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

CallModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lead: PropTypes.shape({
    _id: PropTypes.string,
    full_name: PropTypes.string,
    hindi_name: PropTypes.string,
    contact_number: PropTypes.string,
    leadtype: PropTypes.string,
  })
}

export default CallModal