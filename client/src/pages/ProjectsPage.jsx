import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAssistantsForProjects, fetchProjectLeadsCounts, setCurrentProject } from '../redux/slices/projectSlice'
import { Plus, Users, Phone, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import Loader from '../components/common/Loader'
import Alert from '../components/common/Alert'

const ProjectsPage = () => {
  const dispatch = useDispatch()
  const { 
    assistants,
    projectLeadsCounts,
    isLoadingProjects,
    isLoadingAssistants,
    error
  } = useSelector((state) => state.projects)

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Fetch assistants and project leads counts
    dispatch(fetchAssistantsForProjects())
    dispatch(fetchProjectLeadsCounts())
  }, [dispatch])

  // Filter assistants based on search
  const filteredAssistants = (assistants || []).filter(assistant =>
    assistant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get leads count for a project/assistant
  const getProjectLeadsCount = (assistantName) => {
    const projectData = projectLeadsCounts.find(
      project => project.projectName === assistantName
    )
    return projectData || {
      totalLeads: 0,
      pending: 0,
      connected: 0,
      completed: 0,
      failed: 0
    }
  }

  // Handle project/assistant selection
  const handleAssistantSelect = (assistant) => {
    dispatch(setCurrentProject({
      name: assistant.name,
      assistantId: assistant._id,
      vapiId: assistant.vapiId
    }))
    // Navigate to project leads page (we'll implement this)
    window.location.href = `/leads/projects/${encodeURIComponent(assistant.name)}`
  }

  if (isLoadingAssistants || isLoadingProjects) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Assistants</h1>
          <p className="text-gray-600 mt-1">
            Manage leads organized by AI assistants and projects
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/assistants'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Assistant
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} />
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assistants/projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Assistant/Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssistants.map((assistant) => {
          const leadsData = getProjectLeadsCount(assistant.name)
          
          return (
            <div
              key={assistant._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleAssistantSelect(assistant)}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assistant.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        AI Assistant Bot
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-6">
                {/* Total Leads */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Total Leads</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {leadsData.totalLeads}
                  </span>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-600">Pending</div>
                      <div className="font-semibold">{leadsData.pending}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-600">Connected</div>
                      <div className="font-semibold">{leadsData.connected}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-600">Completed</div>
                      <div className="font-semibold">{leadsData.completed}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-600">Failed</div>
                      <div className="font-semibold">{leadsData.failed}</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {leadsData.totalLeads > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.round(((leadsData.completed + leadsData.failed) / leadsData.totalLeads) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((leadsData.completed + leadsData.failed) / leadsData.totalLeads) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Click to view leads
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAssistants.length === 0 && !isLoadingAssistants && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No assistants found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Create your first AI assistant to get started.'}
          </p>
          <button
            onClick={() => window.location.href = '/assistants'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Assistant
          </button>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage