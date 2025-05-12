import React from 'react'
import { IconType } from 'react-icons'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

interface StatCardProps {
  title: string
  value: string | number
  icon: IconType
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <FiTrendingUp className="h-4 w-4" />
                ) : (
                  <FiTrendingDown className="h-4 w-4" />
                )}
                <span className="ml-1">{trend.value}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </div>
  )
}

export default StatCard 