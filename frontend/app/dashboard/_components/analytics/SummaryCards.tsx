import { Users, Activity, AlertTriangle, DollarSign } from 'lucide-react'
import { CompanyData } from '../../_types/dashboard.types'
import { formatNumber, formatCurrency } from '../../_utils/dashboard.utils'

interface SummaryCardsProps {
  data: CompanyData['summary']
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <div 
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <Users className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(data.total_users_analyzed)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Users Analyzed</p>
      </div>

      <div 
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <Activity className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(data.total_devices_tracked)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Devices Tracked</p>
      </div>

      <div 
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(data.users_flagged)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Users Flagged ({data.flagged_percentage}%)
        </p>
      </div>

      <div 
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(data.total_potential_borrowers)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Borrowers Detected</p>
      </div>

      <div 
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <DollarSign className="w-5 h-5" style={{ color: '#ef4444' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(data.estimated_monthly_revenue_at_risk)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Monthly Revenue at Risk</p>
      </div>
    </div>
  )
}
