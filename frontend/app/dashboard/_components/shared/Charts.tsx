'use client'

import { useState } from 'react'

interface ChartData {
  name: string
  value: number
}

export function SimpleBarChart({ data, height = 300, color = '#3b82f6' }: { data: ChartData[], height?: number, color?: string }) {
  if (!data || data.length === 0) return null

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  const svgWidth = 800
  const svgHeight = height
  const padding = { top: 30, right: 40, bottom: 60, left: 70 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = 0
  
  // Round max for cleaner Y-axis
  const roundedMax = Math.ceil(maxValue / 5) * 5 || 5
  const roundedRange = roundedMax - minValue
  
  // Calculate Y-axis ticks (5 ticks)
  const yTicks = 5
  const yTickValues: number[] = []
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(minValue + (roundedRange * i / yTicks))
  }

  // Show only some dates on X-axis (every nth date based on data length)
  const showEveryNth = Math.max(1, Math.floor(data.length / 8)) // Show ~8 labels max
  const visibleDateIndices = new Set<number>()
  for (let i = 0; i < data.length; i++) {
    if (i % showEveryNth === 0 || i === data.length - 1) {
      visibleDateIndices.add(i)
    }
  }

  const barWidth = chartWidth / data.length
  const barSpacing = barWidth * 0.15
  const actualBarWidth = barWidth - barSpacing

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        {/* Y-axis labels and grid lines */}
        {yTickValues.map((tickValue, index) => {
          const y = padding.top + chartHeight - (((tickValue - minValue) / roundedRange) * chartHeight)
          return (
            <g key={index}>
              {/* Grid line */}
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.2"
              />
              {/* Y-axis label */}
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--text-tertiary)"
              >
                {Math.round(tickValue).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Y-axis line */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="var(--border-color)"
          strokeWidth="2"
        />
        
        {/* X-axis line */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="var(--border-color)"
          strokeWidth="2"
        />

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = roundedRange > 0 ? (item.value / roundedRange) * chartHeight : 0
          const x = padding.left + (index * barWidth) + (barSpacing / 2)
          const y = padding.top + chartHeight - barHeight

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill={color}
                rx={4}
                style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement
                  if (svg) {
                    const rect = svg.getBoundingClientRect()
                    const svgPoint = svg.createSVGPoint()
                    svgPoint.x = x + actualBarWidth / 2
                    svgPoint.y = y
                    const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                    setTooltip({
                      x: screenPoint.x - rect.left,
                      y: screenPoint.y - rect.top,
                      content: `${item.name}: ${item.value.toLocaleString()}`
                    })
                  }
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  setTooltip(null)
                  e.currentTarget.style.opacity = '1'
                }}
              />
              {/* X-axis labels (only visible dates) */}
              {visibleDateIndices.has(index) && (
                <text
                  x={x + actualBarWidth / 2}
                  y={padding.top + chartHeight + 25}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--text-tertiary)"
                >
                  {item.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function SimpleLineChart({ data, height = 300, color = '#3b82f6' }: { data: ChartData[], height?: number, color?: string }) {
  if (!data || data.length === 0) return null

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  const svgWidth = 800
  const svgHeight = height
  const padding = { top: 30, right: 40, bottom: 60, left: 70 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom
  
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  
  // Round max/min for cleaner Y-axis
  const roundedMax = Math.ceil(maxValue / 50) * 50
  const roundedMin = Math.max(0, Math.floor(minValue / 50) * 50)
  const roundedRange = roundedMax - roundedMin || 1
  
  // Calculate Y-axis ticks (5 ticks)
  const yTicks = 5
  const yTickValues: number[] = []
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(roundedMin + (roundedRange * i / yTicks))
  }

  // Show only some dates on X-axis (every nth date based on data length)
  const showEveryNth = Math.max(1, Math.floor(data.length / 8)) // Show ~8 labels max
  const visibleDateIndices = new Set<number>()
  for (let i = 0; i < data.length; i++) {
    if (i % showEveryNth === 0 || i === data.length - 1) {
      visibleDateIndices.add(i)
    }
  }

  // Calculate points
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - (((item.value - roundedMin) / roundedRange) * chartHeight)
    return { x, y, value: item.value, name: item.name, index }
  })

  // Create path strings for line and area
  const linePath = points.map((p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  }).join(' ')

  const areaPath = `${linePath} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis labels and grid lines */}
        {yTickValues.map((tickValue, index) => {
          const y = padding.top + chartHeight - (((tickValue - roundedMin) / roundedRange) * chartHeight)
          return (
            <g key={index}>
              {/* Grid line */}
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.2"
              />
              {/* Y-axis label */}
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--text-tertiary)"
              >
                {Math.round(tickValue).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Y-axis line */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="var(--border-color)"
          strokeWidth="2"
        />
        
        {/* X-axis line */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="var(--border-color)"
          strokeWidth="2"
        />

        {/* Gradient fill area */}
        <path
          d={areaPath}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
        
        {/* Line chart */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill={color}
            stroke="var(--bg-primary)"
            strokeWidth="2.5"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              const svg = e.currentTarget.ownerSVGElement
              if (svg) {
                const rect = svg.getBoundingClientRect()
                const svgPoint = svg.createSVGPoint()
                svgPoint.x = point.x
                svgPoint.y = point.y
                const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                setTooltip({
                  x: screenPoint.x - rect.left,
                  y: screenPoint.y - rect.top,
                  content: `${point.name}: ${point.value.toLocaleString()}`
                })
              }
              e.currentTarget.setAttribute('r', '7')
            }}
            onMouseLeave={(e) => {
              setTooltip(null)
              e.currentTarget.setAttribute('r', '5')
            }}
          />
        ))}

        {/* X-axis labels (only visible dates) */}
        {points.filter(p => visibleDateIndices.has(p.index)).map((point) => (
          <text
            key={point.index}
            x={point.x}
            y={padding.top + chartHeight + 25}
            textAnchor="middle"
            fontSize="12"
            fill="var(--text-tertiary)"
          >
            {point.name}
          </text>
          ))}
      </svg>
    </div>
  )
}

interface PieChartData {
  label: string
  value: number
  color: string
}

export function SimplePieChart({ data, size = 280 }: { data: PieChartData[], size?: number }) {
  if (!data || data.length === 0) return null

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let currentAngle = -90

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-6 w-full relative">
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}
      {/* Pie Chart - responsive sizing */}
      <div className="flex-shrink-0 relative">
        <svg 
          className="w-[220px] md:w-[240px] xl:w-[280px] h-[220px] md:h-[240px] xl:h-[280px]"
          viewBox="0 0 280 280"
          preserveAspectRatio="xMidYMid meet"
        >
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const angle = (percentage / 100) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle

            const center = 140
            const radius = 110
            const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180)
            const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180)
            const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180)
            const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180)

            const largeArcFlag = angle > 180 ? 1 : 0

            const pathData = [
              `M ${center} ${center}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')

            // Calculate label position (middle of arc)
            const labelAngle = (startAngle + endAngle) / 2
            const labelRadius = radius * 0.7
            const labelX = center + labelRadius * Math.cos((labelAngle * Math.PI) / 180)
            const labelY = center + labelRadius * Math.sin((labelAngle * Math.PI) / 180)

            currentAngle += angle

            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={item.color}
                  stroke="var(--bg-primary)"
                  strokeWidth="3"
                  style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const svg = e.currentTarget.ownerSVGElement
                    if (svg) {
                      const rect = svg.getBoundingClientRect()
                      const svgPoint = svg.createSVGPoint()
                      svgPoint.x = labelX
                      svgPoint.y = labelY
                      const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                      const percentage = ((item.value / total) * 100).toFixed(1)
                      setTooltip({
                        x: screenPoint.x - rect.left,
                        y: screenPoint.y - rect.top,
                        content: `${item.label}: ${item.value.toLocaleString()} (${percentage}%)`
                      })
                    }
                    e.currentTarget.style.opacity = '0.8'
                  }}
                  onMouseLeave={(e) => {
                    setTooltip(null)
                    e.currentTarget.style.opacity = '1'
                  }}
                />
                {/* Show percentage label if slice is large enough */}
                {percentage > 5 && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="white"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {percentage.toFixed(1)}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend - responsive width */}
      <div className="space-y-3 w-full xl:w-auto xl:min-w-[200px]">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="h-1.5 rounded-full flex-1"
                    style={{ 
                      backgroundColor: 'var(--border-color)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: item.color,
                        width: `${percentage}%`
                      }}
                    />
                  </div>
                  <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
