import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchLeadsByProject, setProjectFilters, setProjectPagination, setCurrentProject, clearCurrentProject } from '../redux/slices/projectSlice'
import { Plus, Download, Upload, RefreshCw, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import useDebounce from '../hooks/useDebounce'
import LeadTable from '../components/LeadTable'
import LeadForm from '../components/LeadForm'
import CallModal from '../components/CallModal'
import Alert from '../components/common/Alert'
import Loader from '../components/common/Loader'

const ProjectLeadsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { assistantName } = useParams()
  
  const { 
    currentProjectLeads,
    currentProjectPagination,
    projectFilters,
    currentProject,
    isLoadingProjectLeads,
    error
  } = useSelector((state) => state.projects)

  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callingLead, setCallingLead] = useState(null)

  // Debug logging
  console.log('🔍 ProjectLeadsPage State:', {
    assistantName,
    currentProjectLeads,
    leadsCount: currentProjectLeads?.length || 0,
    isLoadingProjectLeads,
    currentProject,
    pagination: currentProjectPagination
  })

  // Debounce the search filter
  const debouncedSearch = useDebounce(projectFilters.search, 500)

  useEffect(() => {
    if (assistantName) {
      // Set current project in redux
      dispatch(setCurrentProject({ name: decodeURIComponent(assistantName) }))
      
      // Fetch leads for this assistant
      const params = {
        page: currentProjectPagination.page,
        limit: currentProjectPagination.limit,
        ...projectFilters,
        search: debouncedSearch
      }
      dispatch(fetchLeadsByProject({ projectName: decodeURIComponent(assistantName), params }))
    }
  }, [dispatch, assistantName, currentProjectPagination.page, currentProjectPagination.limit, projectFilters.leadtype, projectFilters.callConnectionStatus, projectFilters.sortBy, projectFilters.sortOrder, debouncedSearch])

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch !== '' && currentProjectPagination.page > 1) {
      dispatch(setProjectPagination({ page: 1 }))
    }
  }, [debouncedSearch, dispatch])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearCurrentProject())
    }
  }, [dispatch])

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    dispatch(setProjectFilters({ [filterName]: value }))
    if (currentProjectPagination.page > 1) {
      dispatch(setProjectPagination({ page: 1 }))
    }
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    dispatch(setProjectPagination({ page: newPage }))
  }

  // Handle call initiation
  const handleCall = (lead) => {
    setCallingLead(lead)
    setShowCallModal(true)
  }

  // Handle edit lead
  const handleEdit = (lead) => {
    setEditingLead(lead)
    setShowForm(true)
  }

  // Handle refresh
  const handleRefresh = () => {
    const params = {
      page: currentProjectPagination.page,
      limit: currentProjectPagination.limit,
      ...projectFilters,
      search: debouncedSearch
    }
    dispatch(fetchLeadsByProject({ projectName: decodeURIComponent(assistantName), params }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assistants')}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assistants
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {decodeURIComponent(assistantName)} - Leads
            </h1>
            <p className="text-gray-600 mt-1">
              Manage leads for this assistant
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoadingProjectLeads}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProjectLeads ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} />
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Leads
            </label>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={projectFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Lead Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Type
            </label>
            <select
              value={projectFilters.leadtype}
              onChange={(e) => handleFilterChange('leadtype', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="hot">Hot</option>
              <option value="cold">Cold</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Status
            </label>
            <select
              value={projectFilters.callConnectionStatus}
              onChange={(e) => handleFilterChange('callConnectionStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="connected">Connected</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={`${projectFilters.sortBy}-${projectFilters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                dispatch(setProjectFilters({ sortBy, sortOrder }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="full_name-asc">Name A-Z</option>
              <option value="full_name-desc">Name Z-A</option>
              <option value="callConnectionStatus-asc">Status A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {isLoadingProjectLeads ? (
        <Loader />
      ) : (
        <>
          <LeadTable 
            leads={currentProjectLeads}
            onCall={handleCall}
            onEdit={handleEdit}
            isLoading={isLoadingProjectLeads}
          />

          {/* Pagination */}
          {currentProjectPagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {((currentProjectPagination.page - 1) * currentProjectPagination.limit) + 1} to {' '}
                  {Math.min(currentProjectPagination.page * currentProjectPagination.limit, currentProjectPagination.total)} of {' '}
                  {currentProjectPagination.total} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentProjectPagination.page - 1)}
                  disabled={currentProjectPagination.page === 1}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentProjectPagination.page} of {currentProjectPagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentProjectPagination.page + 1)}
                  disabled={currentProjectPagination.page === currentProjectPagination.pages}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={() => {
            setShowForm(false)
            setEditingLead(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingLead(null)
            handleRefresh()
          }}
          projectName={decodeURIComponent(assistantName)} // Pre-fill assistant name as project
        />
      )}

      {/* Call Modal */}
      {showCallModal && callingLead && (
        <CallModal
          lead={callingLead}
          onClose={() => {
            setShowCallModal(false)
            setCallingLead(null)
          }}
        />
      )}
    </div>
  )
}

export default ProjectLeadsPage