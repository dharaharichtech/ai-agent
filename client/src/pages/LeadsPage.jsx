import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeads, setFilters, setPagination, clearError } from '../redux/slices/leadSlice'
import { fetchUserAssistants } from '../redux/slices/assistantSlice'
import { Plus, Download, Upload, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import useDebounce from '../hooks/useDebounce'
import useWebhookHandler from '../hooks/useWebhookHandler'
import LeadForm from '../components/LeadForm'
import LeadTable from '../components/LeadTable'
import LeadStats from '../components/LeadStats'
import ExcelImport from '../components/ExcelImport'
// import AutoCallPanel from '../components/AutoCallPanel' // Removed since auto-call runs in background
// import CallModal from '../components/CallModal' // Commented out CallModal
import callService from '../api/callService'
import Alert from '../components/common/Alert'
import Loader from '../components/common/Loader'

const LeadsPage = () => {
  const dispatch = useDispatch()
  const { 
    leads, 
    pagination, 
    filters, 
    isLoading, 
    error
  } = useSelector((state) => state.leads)

  const { assistants } = useSelector((state) => state.assistants)
  const { projectLeadsCounts } = useSelector((state) => state.projects)

  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [showImport, setShowImport] = useState(false)
  // const [showCallModal, setShowCallModal] = useState(false) // Commented out CallModal state
  // const [callingLead, setCallingLead] = useState(null) // Commented out calling lead state
  const [callingLeadIds, setCallingLeadIds] = useState(new Set()) // Track multiple leads being called
  const [callAlert, setCallAlert] = useState(null) // For call result alerts
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false) // Track auto-refresh status
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date()) // Track last refresh time

  // Initialize webhook handler for real-time lead status updates
  const webhookHandler = useWebhookHandler()

  // Start webhook listener on component mount
  useEffect(() => {
    const stopListener = webhookHandler.startWebhookListener()
    return stopListener // Cleanup on unmount
  }, [webhookHandler])

  // Auto-dismiss success alerts after 4 seconds
  useEffect(() => {
    if (callAlert && callAlert.type === 'success') {
      const timer = setTimeout(() => {
        setCallAlert(null)
      }, 4000)
      
      return () => clearTimeout(timer) // Cleanup on unmount or alert change
    }
  }, [callAlert])

  // Debounce the search filter to prevent API calls on every keystroke
  const debouncedSearch = useDebounce(filters.search, 500)

  // Auto-refresh leads every 30 seconds when in overview view
  useEffect(() => {
    let refreshInterval;
    
    refreshInterval = setInterval(async () => {
      console.log('Auto-refreshing leads to show latest status...');
      setIsAutoRefreshing(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: debouncedSearch
      };
      
      try {
        await dispatch(fetchLeads(params));
        setLastRefreshTime(new Date()); // Update last refresh time
      } finally {
        // Hide auto-refresh indicator after 2 seconds
        setTimeout(() => setIsAutoRefreshing(false), 2000);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [dispatch, pagination.page, pagination.limit, filters, debouncedSearch])

  // Fetch leads on component mount and when filters/pagination change
  // Separate useEffect for search to handle debouncing
  useEffect(() => {
    // Fetch assistants for call functionality
    dispatch(fetchUserAssistants())
    
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
      search: debouncedSearch
    }
    dispatch(fetchLeads(params))
  }, [dispatch, pagination.page, pagination.limit, filters.leadtype, filters.callConnectionStatus, filters.sortBy, filters.sortOrder, debouncedSearch])

  // Reset to page 1 when search changes (but not on initial load)
  useEffect(() => {
    if (debouncedSearch !== '' && pagination.page > 1) {
      dispatch(setPagination({ page: 1 }))
    }
  }, [debouncedSearch, dispatch])

  // Reset to page 1 when non-search filters change
  useEffect(() => {
    if (pagination.page > 1) {
      dispatch(setPagination({ page: 1 }))
    }
  }, [filters.leadtype, filters.callConnectionStatus, filters.sortBy, filters.sortOrder, dispatch])

  const handleCreateLead = () => {
    setEditingLead(null)
    setShowForm(true)
  }

  const handleEditLead = (lead) => {
    setEditingLead(lead)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLead(null)
  }

  const handleFormSuccess = () => {
    // Refresh the current page
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    dispatch(fetchLeads(params))
  }

  const handleCallLead = async (lead) => {
    try {
      // Add this lead ID to calling set
      setCallingLeadIds(prev => new Set(prev).add(lead._id))
      
      // Find the assistant that matches this lead's project
      const projectName = lead.project_name || lead.full_name
      const normalizedProjectName = normalizeString(projectName)
      
      // Find matching assistant
      const matchingAssistant = assistants.find(assistant => 
        normalizeString(assistant.name) === normalizedProjectName
      )
      
      if (!matchingAssistant) {
        setCallAlert({
          type: 'error',
          message: 'No matching assistant found for this lead\'s project'
        })
        return
      }
      
      // Format phone number to E.164 format
      let formattedNumber = lead.contact_number.toString().replace(/\s+/g, '') // Remove spaces
      
      // Add +91 if not present
      if (!formattedNumber.startsWith('+91')) {
        if (formattedNumber.startsWith('91')) {
          formattedNumber = '+' + formattedNumber
        } else if (formattedNumber.startsWith('0')) {
          // Remove leading 0 and add +91
          formattedNumber = '+91' + formattedNumber.substring(1)
        } else {
          // Add +91 prefix
          formattedNumber = '+91' + formattedNumber
        }
      }
      
      // Prepare call data
      const callData = {
        assistantId: matchingAssistant._id,
        phoneNumber: formattedNumber,
        customerName: `${lead.user_id?.name || 'Customer'} - ${projectName}`,
        leadId: lead._id
      }
      
      console.log('Making direct call with formatted data:', callData)
      
      // Make the call directly
      const result = await callService.createCall(callData)
      
      if (result.success) {
        setCallAlert({
          type: 'success',
          message: `Call initiated successfully to ${formattedNumber}`
        })
        // Success message will auto-dismiss after 4 seconds via useEffect
      } else {
        setCallAlert({
          type: 'error',
          message: result.error || 'Failed to initiate call'
        })
      }
      
    } catch (error) {
      console.error('Error making call:', error)
      setCallAlert({
        type: 'error',
        message: 'Failed to initiate call. Please try again.'
      })
    } finally {
      // Remove this lead ID from calling set
      setCallingLeadIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(lead._id)
        return newSet
      })
    }
  }

  // Commented out old modal-based call handling
  // const handleCallModalClose = () => {
  //   setShowCallModal(false)
  //   setCallingLead(null)
  // }

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }))
  }

  const handleRefresh = () => {
    dispatch(fetchUserAssistants())
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    dispatch(fetchLeads(params))
    setLastRefreshTime(new Date()) // Update last refresh time
  }

  // Function to normalize string for matching (remove case, spaces, special chars)
  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[\s\-_,.]+/g, '')
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting leads...')
  }

  const handleImport = () => {
    setShowImport(true)
  }

  const handleImportClose = () => {
    setShowImport(false)
  }

  const handleImportSuccess = () => {
    // Refresh the current page after successful import
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    dispatch(fetchLeads(params))
  }

  const clearFilters = () => {
    dispatch(setFilters({
      search: '',
      leadtype: '',
      callConnectionStatus: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }))
    // Reset to page 1 when clearing filters
    dispatch(setPagination({ page: 1 }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Manage your leads and track call performance
                </p>
                <p className="text-xs text-gray-500 ml-4">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                  {isAutoRefreshing && <span className="text-blue-600 ml-2">● Auto-refreshing...</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isAutoRefreshing ? 'bg-blue-50 border-blue-300' : ''}`}
                disabled={isLoading}
                title={isAutoRefreshing ? 'Auto-refreshing...' : 'Refresh leads'}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isAutoRefreshing ? 'animate-spin' : ''}`} />
                {isAutoRefreshing ? 'Auto-refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleCreateLead}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => dispatch(clearError())}
            className="mb-6"
          />
        )}

        {/* Call Alert */}
        {callAlert && (
          <Alert
            type={callAlert.type}
            message={callAlert.message}
            onClose={() => setCallAlert(null)}
            className="mb-6"
          />
        )}

        {
          <div className="space-y-6">
            <LeadStats />
            
            {/* Active Filters */}
            {(filters.search || filters.leadtype || filters.callConnectionStatus) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <span>Active filters:</span>
                    {filters.search && (
                      <span className="bg-blue-100 px-2 py-1 rounded">
                        Search: "{filters.search}"
                      </span>
                    )}
                    {filters.leadtype && (
                      <span className="bg-blue-100 px-2 py-1 rounded">
                        Type: {filters.leadtype}
                      </span>
                    )}
                    {filters.callConnectionStatus && (
                      <span className="bg-blue-100 px-2 py-1 rounded">
                        Status: {filters.callConnectionStatus}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {/* Leads Table */}
            <LeadTable
              onEdit={handleEditLead}
              onCall={handleCallLead}
              callingLeadIds={callingLeadIds}
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-gray-200 rounded-b-lg">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {((pagination.page - 1) * pagination.limit) + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum
                        if (pagination.pages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        }

        {/* Lead Form Modal */}
        <LeadForm
          lead={editingLead}
          isOpen={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        {/* Excel Import Modal */}
        <ExcelImport
          isOpen={showImport}
          onClose={handleImportClose}
          onSuccess={handleImportSuccess}
        />

        {/* Call Modal - Commented out for direct calling */}
        {/* <CallModal
          isOpen={showCallModal}
          onClose={handleCallModalClose}
          lead={callingLead}
        /> */}
      </div>
    </div>
  )
}

export default LeadsPage