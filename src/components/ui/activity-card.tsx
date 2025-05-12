import React from 'react'
import { IconType } from 'react-icons'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityCardProps {
  title: string
  description: string
  icon: IconType
  date: Date
  status?: 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const statusColors = {
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700'
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  description,
  icon: Icon,
  date,
  status = 'info',
  className = ''
}) => {
  return (
    <div className={`flex items-start space-x-4 p-4 hover:bg-gray-50 transition-colors duration-200 ${className}`}>
      <div className={`p-2 rounded-lg ${statusColors[status]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <p className="text-sm text-gray-500">
          {formatDistanceToNow(date, { addSuffix: true, locale: es })}
        </p>
      </div>
    </div>
  )
}

export default ActivityCard 