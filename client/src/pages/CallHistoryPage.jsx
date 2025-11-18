import React, { useState, useEffect } from 'react'
import { Phone, Clock, DollarSign, Eye, Calendar, Download, Search, Filter } from 'lucide-react'
import CallHistoryModal from '../components/CallHistoryModal'
import Loader from '../components/common/Loader'
import Alert from '../components/common/Alert'
import callService from '../api/callService'
import assistantService from '../api/assistantService'

const CallHistoryPage = () => {
  const [callHistories, setCallHistories] = useState([])
  const [assistants, setAssistants] = useState([])
  const [selectedCall, setSelectedCall] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [assistantsLoading, setAssistantsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    assistant: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchCallHistories()
  }, [pagination.page, filters])

  useEffect(() => {
    fetchAssistants()
  }, [])

  const fetchAssistants = async () => {
    try {
      setAssistantsLoading(true)
      const response = await assistantService.getUserAssistants()
      if (response.success) {
        // The assistants are nested in data.assistants
        const assistantsData = response.data?.assistants || response.data || []
        const assistantsArray = Array.isArray(assistantsData) ? assistantsData : []
        setAssistants(assistantsArray)
      } else {
        console.error('Failed to fetch assistants:', response.error)
        setAssistants([])
      }
    } catch (err) {
      console.error('Error fetching assistants:', err)
      setAssistants([])
    } finally {
      setAssistantsLoading(false)
    }
  }

  const fetchCallHistories = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Build query params
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit
      }

      // Add filters
      if (filters.status && filters.status !== '') {
        // Handle date filters
        if (filters.status === 'today') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          queryParams.startDate = today.toISOString()
          queryParams.endDate = tomorrow.toISOString()
        } else if (filters.status === 'yesterday') {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          yesterday.setHours(0, 0, 0, 0)
          const today = new Date(yesterday)
          today.setDate(today.getDate() + 1)
          queryParams.startDate = yesterday.toISOString()
          queryParams.endDate = today.toISOString()
        } else if (filters.status === 'last7days') {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          weekAgo.setHours(0, 0, 0, 0)
          queryParams.startDate = weekAgo.toISOString()
        } else if (filters.status === 'last30days') {
          const monthAgo = new Date()
          monthAgo.setDate(monthAgo.getDate() - 30)
          monthAgo.setHours(0, 0, 0, 0)
          queryParams.startDate = monthAgo.toISOString()
        } else {
          // It's a regular status filter
          queryParams.status = filters.status
        }
      }

      if (filters.assistant && filters.assistant !== '') {
        queryParams.assistantId = filters.assistant
      }

      let response
      
      // Use search endpoint if search term is provided
      if (filters.search && filters.search.trim()) {
        response = await callService.searchCalls(filters.search.trim(), queryParams)
      } else {
        response = await callService.getAllCallHistory(queryParams)
      }
      
      if (response.success) {
        const callHistory = response.data.callHistory || response.data || []
        setCallHistories(callHistory)
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.totalRecords || response.data?.count || callHistory.length,
          pages: response.pagination?.total || Math.ceil((response.data?.count || callHistory.length) / pagination.limit)
        }))
      } else {
        setError(response.message || 'Failed to fetch call histories')
      }
    } catch (err) {
      console.error('Error fetching call histories:', err)
      setError('Failed to fetch call histories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewCall = (call) => {
    setSelectedCall(call)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSelectedCall(null)
    setIsSidebarOpen(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatTime = (call) => {
    // Try to calculate from startedAt and endedAt first
    if (call.startedAt && call.endedAt) {
      const start = new Date(call.startedAt);
      const end = new Date(call.endedAt);
      const durationMs = end - start;
      const durationSeconds = Math.floor(durationMs / 1000);
      
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Fallback to bolnaCallData duration or duration field
    const durationSeconds = call.bolnaCallData?.durationSeconds || call.duration || 0;
    const minutes = Math.floor(durationSeconds / 60);
    const remainingSeconds = Math.floor(durationSeconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(4)}`
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      'no-answer': 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      initiated: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.initiated}`}>
        {status || 'Unknown'}
      </span>
    )
  }

  const downloadRecording = (recordingUrl, callId) => {
    if (recordingUrl) {
      const link = document.createElement('a')
      link.href = recordingUrl
      link.download = `call-recording-${callId}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Call History</h1>
          <p className="text-gray-600">
            View and manage all your call recordings and transcripts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Phone number, call ID, assistant name..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assistant
              </label>
              <select
                value={filters.assistant}
                onChange={(e) => handleFilterChange('assistant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                disabled={assistantsLoading}
              >
                <option value="">{assistantsLoading ? 'Loading Assistants...' : 'All Assistants'}</option>
                {Array.isArray(assistants) && assistants.map((assistant) => (
                  <option key={assistant._id || assistant.id} value={assistant._id || assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Records</option>
                <option value="completed">Completed</option>
                <option value="no-answer">No Answer</option>
                <option value="failed">Failed</option>
                <option value="in-progress">In Progress</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert
            type="error"
            message={error}
            className="mb-6"
          />
        )}

        {/* Call Histories Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {callHistories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <Phone className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No call history</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Call history will appear here once calls are made.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      callHistories.map((call) => (
                        <tr key={call._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {call.assistantId?.name || 'Unknown Assistant'}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                {call.callId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {call.phoneNumber}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Clock className="w-4 h-4 text-gray-400 mr-2" />
                              {formatTime(call)}
                            </div>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                                            {formatCurrency(call.cost || call.bolnaCallData?.cost)}
                            </div>
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(call.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(call.startedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewCall(call)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="View Call Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {call.bolnaCallData?.recordingUrl && (
                                <button
                                  onClick={() => downloadRecording(call.bolnaCallData.recordingUrl, call.callId)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded"
                                  title="Download Recording"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Call History Sliding Sidebar */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">Call Details</h3>
            <button
              onClick={handleCloseSidebar}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{maxHeight: 'calc(100vh - 80px)'}}>
            {selectedCall && (
              <div className="space-y-6 pb-6">
                {/* Debug: Add height indicator */}
                <div className="text-xs text-gray-400 mb-2">
                  Scroll down to see all details ↓
                </div>
                {/* Basic Call Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">Call Information</h4>
                      <p className="text-sm text-gray-500">{selectedCall.callId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedCall.phoneNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <p className="font-medium">{formatTime(selectedCall)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{formatDate(selectedCall.startedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedCall.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Assistant Info */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assistant
                  </h5>
                  <p className="text-gray-700">{selectedCall.assistantId?.name || 'Unknown Assistant'}</p>
                </div>

                {/* Bolna Data */}
                {selectedCall.bolnaCallData && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                      Call Analytics
                    </h5>
                    <div className="space-y-2 text-sm">
                      {selectedCall.bolnaCallData.cost && (
                        <div className="flex justify-between">
                          {/* <span className="text-gray-500">Cost:</span> */}
                          {/* <span className="font-medium">{formatCurrency(selectedCall.bolnaCallData.cost)}</span> */}
                        </div>
                      )}
                      {selectedCall.bolnaCallData.durationSeconds && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration (seconds):</span>
                          <span className="font-medium">{selectedCall.bolnaCallData.durationSeconds}s</span>
                        </div>
                      )}
                      {selectedCall.bolnaCallData.endedReason && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">End Reason:</span>
                          <span className="font-medium">{selectedCall.bolnaCallData.endedReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recording Section */}
                {selectedCall.bolnaCallData?.recordingUrl && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 12.054a9 9 0 01-6.072 0M12 3v9m0 0l3-3m-3 3l-3-3" />
                      </svg>
                      Recording
                    </h5>
                    <div className="space-y-3">
                      <audio controls className="w-full">
                        <source src={selectedCall.vapiCallData.recordingUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                      <button
                        onClick={() => downloadRecording(selectedCall.vapiCallData.recordingUrl, selectedCall.callId)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Recording
                      </button>
                    </div>
                  </div>
                )}

                {/* Metadata Section */}
                {selectedCall.metadata && Object.keys(selectedCall.metadata).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Additional Info
                    </h5>
                    <div className="bg-gray-50 rounded-md p-3">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedCall.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

            

                {/* Transcript Section - Full Display at End */}
                {selectedCall.vapiCallData?.transcript && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="font-medium text-gray-900 mb-4 flex items-center text-lg">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      📝 Full Call Transcript
                    </h5>
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-inner">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Complete Conversation</span>
                        <span className="text-xs text-gray-400">Scroll to read full transcript</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto border rounded p-3 bg-gray-50" style={{scrollbarWidth: 'thin'}}>
                        <div className="space-y-3">
                          {typeof selectedCall.vapiCallData.transcript === 'string' ? (
                            // Parse string transcript and display as chat messages
                            (() => {
                              const lines = selectedCall.vapiCallData.transcript.split('\n').filter(line => line.trim());
                              return lines.map((line, index) => {
                                // Try to detect speaker patterns
                                const isAssistant = line.toLowerCase().includes('assistant:') || 
                                                  line.toLowerCase().includes('ai:') || 
                                                  line.toLowerCase().includes('bot:') ||
                                                  (index % 2 === 0); // Fallback alternating pattern
                                
                                const cleanedMessage = line
                                  .replace(/^(assistant|ai|bot|user|customer):\s*/i, '')
                                  .trim();
                                
                                return cleanedMessage ? (
                                  <div key={index} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                                      isAssistant 
                                        ? 'bg-blue-100 text-blue-900 rounded-bl-none' 
                                        : 'bg-green-100 text-green-900 rounded-br-none'
                                    }`}>
                                      <div className="flex items-center mb-1">
                                        <span className="text-xs font-semibold">
                                          {isAssistant ? '🤖 Assistant' : '👤 Customer'}
                                        </span>
                                      </div>
                                      <div className="text-sm leading-relaxed">
                                        {cleanedMessage}
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              });
                            })()
                          ) : (
                            <div>
                              {Array.isArray(selectedCall.vapiCallData.transcript) ? (
                                selectedCall.vapiCallData.transcript.map((entry, index) => {
                                  const isAssistant = entry.role === 'assistant' || entry.role === 'ai' || entry.role === 'bot';
                                  const message = entry.content || entry.message || entry.text;
                                  
                                  return message ? (
                                    <div key={index} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
                                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                                        isAssistant 
                                          ? 'bg-blue-100 text-blue-900 rounded-bl-none' 
                                          : 'bg-green-100 text-green-900 rounded-br-none'
                                      }`}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-semibold">
                                            {isAssistant ? '🤖 Assistant' : '👤 Customer'}
                                          </span>
                                          {entry.timestamp && (
                                            <span className="text-xs text-gray-500 ml-2">
                                              {new Date(entry.timestamp).toLocaleTimeString()}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm leading-relaxed">
                                          {message}
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })
                              ) : (
                                // Fallback for other formats
                                <div className="bg-gray-100 rounded-lg p-4">
                                  <div className="text-xs text-gray-500 mb-2">Raw transcript data:</div>
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                                    {JSON.stringify(selectedCall.vapiCallData.transcript, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        💡 This is the complete conversation transcript from the call
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={handleCloseSidebar}
          />
        )}
      </div>
    </div>
  )
}

export default CallHistoryPage