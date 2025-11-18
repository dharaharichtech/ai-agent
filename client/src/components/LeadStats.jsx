import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeadStats } from '../redux/slices/leadSlice'
import { Users, Phone, CheckCircle, XCircle, Thermometer, Snowflake } from 'lucide-react'
import StatsCard from './ui/StatsCard'
import Loader from './common/Loader'

const LeadStats = () => {
  const dispatch = useDispatch()
  const { stats, isLoading } = useSelector((state) => state.leads)

  useEffect(() => {
    dispatch(fetchLeadStats())
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader />
      </div>
    )
  }

  const statsData = [
    {
      id: 'total',
      name: 'Total Leads',
      value: stats.total || 0,
      icon: Users,
      color: 'blue',
      description: 'Total number of leads'
    },
    {
      id: 'pending',
      name: 'Pending Calls',
      value: stats.pending || 0,
      icon: Phone,
      color: 'yellow',
      description: 'Calls waiting to be made'
    },
    {
      id: 'connected',
      name: 'Connected',
      value: stats.connected || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'Successfully connected calls'
    },
    {
      id: 'completed',
      name: 'Completed',
      value: stats.completed || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'Completed interactions'
    },
    {
      id: 'failed',
      name: 'Failed',
      value: stats.failed || 0,
      icon: XCircle,
      color: 'red',
      description: 'Failed call attempts'
    },
    {
      id: 'hot',
      name: 'Hot Leads',
      value: stats.hotLeads || 0,
      icon: Thermometer,
      color: 'red',
      description: 'High priority leads'
    },
    {
      id: 'cold',
      name: 'Cold Leads',
      value: stats.coldLeads || 0,
      icon: Snowflake,
      color: 'blue',
      description: 'New or inactive leads'
    }
  ]

  // Calculate percentages
  const totalCalls = (stats.pending || 0) + (stats.connected || 0) + (stats.completed || 0) + (stats.failed || 0)
  const successRate = totalCalls > 0 ? Math.round(((stats.connected || 0) + (stats.completed || 0)) / totalCalls * 100) : 0
  const hotLeadPercentage = stats.total > 0 ? Math.round((stats.hotLeads || 0) / stats.total * 100) : 0

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                stat.color === 'green' ? 'bg-green-50 border border-green-200' :
                stat.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                stat.color === 'red' ? 'bg-red-50 border border-red-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'red' ? 'text-red-600' :
                  'text-gray-600'
                }`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {stat.name}
              </div>
              <div className="text-xs text-gray-500">
                {stat.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Call Success Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Call Success Rate</h3>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{successRate}%</span>
              <span className="text-sm text-gray-500">
                {(stats.connected || 0) + (stats.completed || 0)} / {totalCalls} calls
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {successRate >= 70 ? 'Excellent' : successRate >= 50 ? 'Good' : 'Needs Improvement'} success rate
            </p>
          </div>
        </div>

        {/* Lead Quality */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Lead Quality</h3>
            <Thermometer className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{hotLeadPercentage}%</span>
              <span className="text-sm text-gray-500">
                {stats.hotLeads || 0} hot / {stats.total || 0} total
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${hotLeadPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {hotLeadPercentage >= 30 ? 'High' : hotLeadPercentage >= 15 ? 'Medium' : 'Low'} quality leads
            </p>
          </div>
        </div>
      </div>

      {/* Call Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Call Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Phone className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
            <div className="text-sm font-medium text-gray-700">Pending Calls</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting connection</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.connected || 0}</div>
            <div className="text-sm font-medium text-gray-700">Connected</div>
            <div className="text-xs text-gray-500 mt-1">Successfully connected</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
            <div className="text-sm font-medium text-gray-700">Completed</div>
            <div className="text-xs text-gray-500 mt-1">Call finished</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{stats.failed || 0}</div>
            <div className="text-sm font-medium text-gray-700">Failed</div>
            <div className="text-xs text-gray-500 mt-1">Connection failed</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadStats