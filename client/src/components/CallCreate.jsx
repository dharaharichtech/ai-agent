import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import useAssistants from '../hooks/useAssistants'
import assistantService from '../api/assistantService'
import Alert from '../components/common/Alert'
import Loader from '../components/common/Loader'
import AssistantSelector from '../components/ui/AssistantSelector'

const CallCreate = ({ preSelectedAssistant }) => {
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
    assistantId: preSelectedAssistant?.id || '',
    phoneNumber: '',
    customerName: ''
  })

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000)
  }, [])

  // Handle call success
  useEffect(() => {
    if (lastCallResult) {
      showAlert('Call initiated successfully!', 'success')
      // Reset form
      setCallData({
        assistantId: '',
        phoneNumber: '',
        customerName: ''
      })
      // Clear the result after showing
      setTimeout(() => clearCallResult(), 100)
    }
  }, [lastCallResult, clearCallResult, showAlert])

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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setCallData(prev => ({
      ...prev,
      [name]: value
    }))
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

    // Use the new validation function
    const phoneValidation = validatePhoneNumber(callData.phoneNumber)
    if (!phoneValidation.isValid) {
      showAlert(phoneValidation.message, 'error')
      return
    }

    // Dispatch the call creation
    makeCall(callData)
  }, [callData, makeCall, showAlert, validatePhoneNumber])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Make a Call</h2>
        <p className="text-gray-600">Select an assistant and phone number to initiate a call</p>
      </div>

      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: '', type: 'info' })}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <p className="text-xs text-gray-500 mt-1">
            Enter 10-digit Indian mobile number starting with 6, 7, 8, or 9
            <br />
            Example: Type "9876543210" and it will become "+919876543210"
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name (Optional)
          </label>
          <input
            type="text"
            name="customerName"
            value={callData.customerName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
            maxLength={100}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={callLoading || !isCallReady}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {callLoading && <Loader size="sm" className="mr-2" />}
            {callLoading ? 'Initiating Call...' : 'Make Call'}
          </button>
        </div>
      </form>
    </div>
  )
}

CallCreate.propTypes = {
  preSelectedAssistant: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })
}

CallCreate.defaultProps = {
  preSelectedAssistant: null
}

export default CallCreate