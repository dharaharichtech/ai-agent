import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAssistants } from '../redux/slices/assistantSlice'
import CallCreate from '../components/CallCreate'
import AutoCallPanel from '../components/AutoCallPanel'

const CallPage = () => {
  const location = useLocation()
  const assistants = useSelector(selectAssistants)
  const selectedAssistant = location.state?.selectedAssistant
  const [activeTab, setActiveTab] = useState('manual')

  // If there's a selected assistant from navigation but it's not in our current list,
  // we'll still pass it through as the component will handle fetching if needed
  const assistantInfo = selectedAssistant || 
    (assistants.length > 0 ? assistants.find(a => a.id === selectedAssistant?.id) : null)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Management</h1>
          <p className="text-gray-600">
            Create manual calls or set up automated calling for your leads
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('manual')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manual Calls
              </button>
              <button
                onClick={() => setActiveTab('auto')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'auto'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Auto Calls
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'manual' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Make a Call</h2>
              <p className="text-gray-600 mb-6">
                {assistantInfo 
                  ? `Using assistant: ${assistantInfo.name}` 
                  : 'Select an assistant and phone number to initiate a call'
                }
              </p>
              <CallCreate preSelectedAssistant={assistantInfo} />
            </div>
          )}
          
          {activeTab === 'auto' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto Call Management</h2>
              <p className="text-gray-600 mb-6">
                Set up automated calling for leads with pending or failed status
              </p>
              <AutoCallPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallPage
