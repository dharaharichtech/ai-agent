import { memo } from 'react'
import PropTypes from 'prop-types'
import Loader from '../common/Loader'

/**
 * AssistantSelector Component - Optimized dropdown for selecting assistants
 */
const AssistantSelector = memo(({
  assistants,
  selectedAssistantId,
  onChange,
  disabled,
  loading,
  hasAssistants,
  className = '',
  required = true,
  showLoader = true
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Assistant {required && '*'}
      </label>
      <select
        name="assistantId"
        value={selectedAssistantId}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
        disabled={disabled || loading}
      >
        <option value="">
          {loading ? 'Loading assistants...' : 'Choose an assistant...'}
        </option>
        {assistants.map(assistant => (
          <option 
            key={assistant.id || assistant._id} 
            value={assistant.id || assistant._id}
          >
            {assistant.name}
          </option>
        ))}
      </select>
      
      {/* Helper messages */}
      {!hasAssistants && !loading && (
        <p className="text-sm text-gray-500 mt-1">
          No assistants available. Create an assistant first.
        </p>
      )}
      
      {loading && showLoader && (
        <div className="flex items-center mt-2">
          <Loader size="sm" className="mr-2" />
          <span className="text-sm text-gray-500">Loading assistants...</span>
        </div>
      )}
    </div>
  )
})

AssistantSelector.displayName = 'AssistantSelector'

AssistantSelector.propTypes = {
  assistants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      _id: PropTypes.string,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedAssistantId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  hasAssistants: PropTypes.bool,
  className: PropTypes.string,
  required: PropTypes.bool,
  showLoader: PropTypes.bool,
}

AssistantSelector.defaultProps = {
  disabled: false,
  loading: false,
  hasAssistants: false,
  className: '',
  required: true,
  showLoader: true,
}

export default AssistantSelector