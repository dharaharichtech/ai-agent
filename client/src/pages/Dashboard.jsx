import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Users, 
  Phone, 
  FileText, 
  Bot, 
  TrendingUp, 
  TrendingDown,
  Activity,

  AlertCircle,
  CheckCircle,
  Star,
  BarChart3,
  PieChart,
  Target,
  Zap
} from 'lucide-react'
import CallCreate from '../components/CallCreate'
import { leadService } from '../api/leadService'
import callService from '../api/callService'

const Dashboard = () => {
  const { user } = useSelector((state) => state.user)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('calls')
  const [totalLeads, setTotalLeads] = useState(0)
  const [totalCalls, setTotalCalls] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [yesterdayLeads, setYesterdayLeads] = useState(0)
  const [yesterdayCalls, setYesterdayCalls] = useState(0)
  const [yesterdayMinutes, setYesterdayMinutes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch total leads count
        const leadsResponse = await leadService.getLeads({ limit: 1, page: 1 })
        if (leadsResponse.success && leadsResponse.data) {
          setTotalLeads(leadsResponse.data.pagination?.total || 0)
        }

        // Fetch total calls count and duration
        const callsResponse = await callService.getAllCallHistory({ limit: 1000, page: 1 })
        if (callsResponse.success && callsResponse.pagination) {
          setTotalCalls(callsResponse.pagination.totalRecords || 0)
        }
        
        // Calculate total duration from all calls
        if (callsResponse.success && callsResponse.data?.callHistory) {
          let totalSeconds = 0
          
          callsResponse.data.callHistory.forEach(call => {
            // Try to get duration from multiple sources
            if (call.duration && call.duration > 0) {
              totalSeconds += call.duration
            } else if (call.vapiCallData?.startedAt && call.vapiCallData?.endedAt) {
              // Calculate from timestamps
              const start = new Date(call.vapiCallData.startedAt).getTime()
              const end = new Date(call.vapiCallData.endedAt).getTime()
              const durationInSeconds = Math.floor((end - start) / 1000)
              if (durationInSeconds > 0) {
                totalSeconds += durationInSeconds
              }
            }
          })
          
          const durationInMinutes = Math.floor(totalSeconds / 60)
          setTotalMinutes(durationInMinutes)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Dynamic stats data
  const stats = [
    {
      id: 1,
      title: 'Total Leads',
      value: loading ? '...' : totalLeads.toLocaleString(),
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Calls Made',
      value: loading ? '...' : totalCalls.toLocaleString(),
      change: '+8.2%',
      changeType: 'increase',
      icon: Phone,
      color: 'green'
    },
    {
      id: 3,
      title: 'Total Minutes',
      value: loading ? '...' : `${totalMinutes.toLocaleString()} min`,
      change: '+23.7%',
      changeType: 'increase',
      icon: Bot,
      color: 'orange'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'lead',
      title: 'New lead added: John Doe',
      time: '5 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'call',
      title: 'Call completed with Sarah Johnson',
      time: '12 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'pdf',
      title: 'PDF uploaded: Product Catalog.pdf',
      time: '25 minutes ago',
      status: 'info'
    },
    {
      id: 4,
      type: 'ai',
      title: 'AI analysis completed for lead scoring',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: 5,
      type: 'alert',
      title: 'Follow-up reminder: Contact Mike Wilson',
      time: '2 hours ago',
      status: 'warning'
    }
  ]

  const quickActions = [
    { title: 'Add New Lead', icon: Users, color: 'blue', path: '/leads' },
    { title: 'Make a Call', icon: Phone, color: 'green', path: '/calls' },
    { title: 'Upload PDF', icon: FileText, color: 'purple', path: '/pdf-upload' },
    { title: 'AI Analysis', icon: Bot, color: 'orange', path: '/ai-analysis' }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50 border-blue-200',
      green: 'bg-green-500 text-green-600 bg-green-50 border-green-200',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50 border-purple-200',
      orange: 'bg-orange-500 text-orange-600 bg-orange-50 border-orange-200'
    }
    return colors[color] || colors.blue
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your AI Agent today.
          </p>
        </div>
       
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
        {stats.map((stat) => {
          const colorClasses = getColorClasses(stat.color).split(' ')
          const IconComponent = stat.icon
          
          return (
            <div
              key={stat.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[2]} ${colorClasses[3]}`}>
                  <IconComponent className={`w-6 h-6 ${colorClasses[1]}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('assistants')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'assistants'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            AI Assistants
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'calls'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Make Call
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {/* {activeTab === 'assistants' && (
        <div className="space-y-6">
          <AssistantList />
        </div>
      )} */}

      {activeTab === 'calls' && (
        <div className="space-y-6">
          <CallCreate />
        </div>
      )}
    </div>
  )
}

export default Dashboard