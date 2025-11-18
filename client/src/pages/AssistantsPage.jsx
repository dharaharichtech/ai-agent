import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Phone,
  TrendingUp,
  Users,
  Clock,
  Star,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import CreateAssistantModal from '../components/CreateAssistantModal';
import assistantService from '../api/assistantService';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';

const AssistantsPage = () => {
  const navigate = useNavigate();
  // State management
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalCalls: 0,
    successRate: 0
  });
  const [alert, setAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load assistants on component mount
  useEffect(() => {
    loadAssistants();
  }, []);

  // Load assistants from API
  const loadAssistants = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      };

      const result = await assistantService.getUserAssistants(filters);
      
      if (result.success) {
        // The API returns { data: { assistants: [], summary: {} } }
        const assistants = result.data?.assistants || [];
        setAssistants(assistants);
        calculateStats(assistants);
      } else {
        showAlert('error', result.error || 'Failed to load assistants');
        setAssistants([]);
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
      showAlert('error', 'An unexpected error occurred');
      setAssistants([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateStats = (assistantList) => {
    const total = assistantList.length;
    const active = assistantList.filter(a => a.status === 'active').length;
    const totalCalls = assistantList.reduce((sum, a) => sum + (a.stats?.totalCalls || 0), 0);
    const avgSuccessRate = assistantList.length > 0 
      ? assistantList.reduce((sum, a) => sum + (a.stats?.successRate || 0), 0) / assistantList.length 
      : 0;

    setStats({
      total,
      active,
      totalCalls,
      successRate: Math.round(avgSuccessRate)
    });
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssistants();
    setRefreshing(false);
    showAlert('success', 'Data refreshed successfully');
  };

  // Handle search and filters
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!loading) {
        loadAssistants();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, typeFilter]);

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle create assistant
  const handleCreateAssistant = async (assistantData) => {
    try {
      const result = await assistantService.createAssistant(assistantData);
      
      if (result.success) {
        showAlert('success', result.message || 'Assistant created successfully');
        await loadAssistants(); // Reload the list
        setShowCreateModal(false);
      } else {
        showAlert('error', result.error || 'Failed to create assistant');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (assistantId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await assistantService.toggleAssistantStatus(assistantId, newStatus);
      
      if (result.success) {
        showAlert('success', `Assistant ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await loadAssistants();
      } else {
        showAlert('error', result.error || 'Failed to update assistant status');
      }
    } catch (error) {
      console.error('Error toggling assistant status:', error);
      showAlert('error', 'An unexpected error occurred');
    }
  };

  // Handle delete assistant
  const handleDeleteAssistant = async (assistantId, assistantName) => {
    if (!window.confirm(`Are you sure you want to delete "${assistantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await assistantService.deleteAssistant(assistantId);
      
      if (result.success) {
        showAlert('success', 'Assistant deleted successfully');
        await loadAssistants();
      } else {
        showAlert('error', result.error || 'Failed to delete assistant');
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
      showAlert('error', 'An unexpected error occurred');
    }
  };

  // Filter assistants based on search and filters
  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assistant.status === statusFilter;
    const matchesType = typeFilter === 'all' || assistant.metadata?.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Assistants</h1>
          <p className="text-gray-600 mt-1">Manage your voice AI assistants and call automation</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {/* <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Assistant
          </button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assistants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Assistants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assistants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="testing">Testing</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="lead-capture">Lead Capture</option>
              <option value="follow-up">Follow-up</option>
              <option value="survey">Survey</option>
              <option value="appointment">Appointment</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assistants List */}
      <div className="bg-white rounded-lg border">
        {filteredAssistants.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {assistants.length === 0 ? 'No assistants yet' : 'No assistants found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {assistants.length === 0
                ? 'Create your first AI assistant to get started with automated calls'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {assistants.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Assistant
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredAssistants.map((assistant) => {
              const leadsData = {
                totalLeads: assistant.stats?.totalCalls || 0,
                pending: Math.round((assistant.stats?.totalCalls || 0) * 0.3),
                connected: Math.round((assistant.stats?.totalCalls || 0) * 0.4),
                completed: Math.round((assistant.stats?.totalCalls || 0) * 0.2),
                failed: Math.round((assistant.stats?.totalCalls || 0) * 0.1)
              };
              
              return (
                <div
                  key={assistant.id}
                  onClick={() => navigate(`/leads/assistants/${encodeURIComponent(assistant.name)}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(assistant.status)}`}>
                        {assistant.status}
                      </span>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="p-6">
                    {/* Total call */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">Total Calls</span>
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
                        <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-600">Completed</div>
                          <div className="font-semibold">{leadsData.completed}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" />
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
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${((leadsData.completed + leadsData.failed) / leadsData.totalLeads) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="px-6 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(assistant.id, assistant.status);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            assistant.status === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={assistant.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {assistant.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Assistant"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssistant(assistant.id, assistant.name);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Assistant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Assistant Modal */}
      <CreateAssistantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAssistant}
      />
    </div>
  );
};

export default AssistantsPage;