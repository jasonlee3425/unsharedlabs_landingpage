# Company Data API Documentation

This document describes how to integrate with the company data system for storing and retrieving dashboard data.

## Overview

The system uses two tables:
- **`company_data`**: Stores the current/latest dashboard data for each company
- **`company_data_history`**: Stores all historical versions of the data

## Database Schema

### `company_data` Table
- `id`: UUID primary key
- `company_id`: UUID foreign key to companies table
- `data`: JSONB field containing the dashboard data
- `version`: Integer version number (auto-increments on updates)
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

### `company_data_history` Table
- `id`: UUID primary key
- `company_id`: UUID foreign key to companies table
- `data`: JSONB field containing historical snapshot
- `version`: Integer version number of this snapshot
- `created_at`: Timestamp when this version was created
- `company_data_id`: UUID reference to the company_data record

## Automatic History Tracking

A database trigger automatically saves the previous version to `company_data_history` whenever `company_data` is updated. The version number is automatically incremented.

## API Endpoints

### 1. Update Company Data (External System)

**Endpoint**: `POST /api/companies/[companyId]/data`

**Authentication**: Requires service role key (SUPABASE_API_KEY)

**Request Body**:
```json
{
  "data": {
    // Your JSON dashboard data structure
    "metrics": {...},
    "reports": [...],
    // etc.
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Company data updated successfully",
  "version": 2,
  "company_id": "uuid-here"
}
```

### 2. Get Current Company Data

**Endpoint**: `GET /api/companies/[companyId]/data`

**Authentication**: User must belong to the company or be a super admin

**Response**:
```json
{
  "success": true,
  "data": {
    // Current dashboard data
  },
  "version": 2,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. Get Company Data History

**Endpoint**: `GET /api/companies/[companyId]/data/history`

**Authentication**: User must belong to the company or be a super admin

**Query Parameters**:
- `limit` (optional): Number of versions to return (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "version": 2,
      "data": {...},
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "version": 1,
      "data": {...},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 2
}
```

### 4. Get Specific Version

**Endpoint**: `GET /api/companies/[companyId]/data/history/[version]`

**Authentication**: User must belong to the company or be a super admin

**Response**:
```json
{
  "success": true,
  "version": 1,
  "data": {...},
  "created_at": "2024-01-01T00:00:00Z"
}
```

## External System Integration

To update company data from your external system:

1. **Use the service role key** (`SUPABASE_API_KEY`) to bypass RLS
2. **Call the API endpoint** or directly update the database:

```typescript
// Example using Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey)

// Upsert company data (creates if doesn't exist, updates if exists)
const { data, error } = await supabase
  .from('company_data')
  .upsert({
    company_id: companyId,
    data: yourJsonData,
  }, {
    onConflict: 'company_id'
  })
  .select()
  .single()

// The trigger will automatically:
// 1. Save old version to history (if updating)
// 2. Increment version number
// 3. Update updated_at timestamp
```

## Frontend Usage

In your dashboard component, fetch the current data:

```typescript
const fetchCompanyData = async () => {
  const response = await fetch(`/api/companies/${companyId}/data`)
  const result = await response.json()
  if (result.success) {
    setDashboardData(result.data)
  }
}
```

## Best Practices

1. **Data Structure**: Keep your JSON structure consistent across updates
2. **Versioning**: The system automatically handles versioning - don't manually set version numbers
3. **History Retention**: Consider implementing a cleanup job to archive old history if needed
4. **Error Handling**: Always check for errors when updating data
5. **Validation**: Validate your JSON structure before sending to the API

## Example Data Structure

```json
{
  "metrics": {
    "totalRevenue": 100000,
    "activeUsers": 500,
    "growthRate": 15.5
  },
  "reports": [
    {
      "id": "report-1",
      "name": "Monthly Report",
      "date": "2024-01-01",
      "data": {...}
    }
  ],
  "settings": {
    "currency": "USD",
    "timezone": "America/New_York"
  }
}
```
