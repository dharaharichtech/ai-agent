import { TrendingUp, TrendingDown } from 'lucide-react'
import PropTypes from 'prop-types'

const StatsCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50 border-blue-200',
      green: 'bg-green-500 text-green-600 bg-green-50 border-green-200',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50 border-purple-200',
      orange: 'bg-orange-500 text-orange-600 bg-orange-50 border-orange-200',
      red: 'bg-red-500 text-red-600 bg-red-50 border-red-200',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    return colors[color] || colors.blue
  }

  const colorClasses = getColorClasses(color).split(' ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[2]} ${colorClasses[3]}`}>
          <Icon className={`w-6 h-6 ${colorClasses[1]}`} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          changeType === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'increase' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </h3>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
    </div>
  )
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string.isRequired,
  changeType: PropTypes.oneOf(['increase', 'decrease']).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange', 'red', 'yellow']).isRequired
}

export default StatsCard