export interface CompanyData {
  summary: {
    users_flagged: number
    flagged_percentage: number
    total_users_analyzed: number
    total_devices_tracked: number
    total_potential_borrowers: number
    estimated_monthly_revenue_at_risk: number
  }
  metrics_trend: {
    data: Array<{
      date: string
      conversions: number
      active_borrowers: number
      true_conversions: number
      accounts_with_borrowers: number
    }>
  }
  geographic_data: {
    all_locations: Array<{
      lat: number
      lon: number
      city: string
      total_users: number
      flagged_users: number
    }>
  }
  sharing_activity: {
    data: Array<{
      name: string
      sharing: number
    }>
  }
  detection_breakdown: {
    data: Array<{
      color: string
      count: number
      signal: string
    }>
  }
  top_flagged_accounts: {
    data: Array<{
      score: number
      risk_level: string
      user_email: string
      evidence_summary: string
      potential_borrowers: number
    }>
  }
}

export interface MarkerData {
  name: string
  flaggedUsers: number
  totalUsers: number
  coordinates: [number, number]
}
