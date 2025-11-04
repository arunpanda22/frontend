# Dashboard API Integration Guide

This document outlines how the dashboard API endpoints are integrated with the frontend components.

## API Structure Analysis

The provided API documentation (`API_DOCUMENTATION.md`) defines 10 main endpoints under `/api/v1/dashboard-api/` that perfectly match the dashboard structure:

### API Endpoints vs Dashboard Pages

| Dashboard Page | API Endpoints Used | Purpose |
|---|---|---|
| Main Dashboard (`/maindashboard`) | `campaign-summary`, `weekly`, `ads-sales` | Overview metrics and trends |
| ASIN Performance (`/maindashboard/asinperformance`) | `asin-summary`, `sales-trend-asin`, `targeting-analysis` | ASIN-level analytics |
| Campaign Performance (`/maindashboard/campain/campainperformance`) | `campaign-summary`, `targeting-analysis`, `ads-trend` | Campaign analytics |
| Inventory (`/maindashboard/inventory`) | `inventory-health`, `asin-liquidation` | Inventory management |

## Implementation

### 1. Service Layer
- **File**: `src/lib/api/services/dashboard.service.ts`
- **Purpose**: Provides typed API client methods for all dashboard endpoints
- **Features**: 
  - Full TypeScript interfaces matching API responses
  - Consistent error handling
  - Parameter validation

### 2. React Query Hooks
- **File**: `src/lib/hooks/queries/use-dashboard.ts`
- **Purpose**: Provides optimized data fetching with caching
- **Features**:
  - Individual hooks for each API endpoint
  - Composite hooks for dashboard sections
  - Cache management and refresh utilities
  - Optimized stale times based on data volatility

### 3. Component Integration

#### Usage Example - Inventory Health Component

```tsx
import { useInventoryPerformanceData } from '@/lib/hooks/queries/use-dashboard'

export function InventoryHealthComponent() {
  const { inventoryHealth, asinLiquidation, isLoading, isError } = useInventoryPerformanceData({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 45
  })

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage />

  return (
    <div>
      {/* Use inventoryHealth.data and asinLiquidation.data */}
    </div>
  )
}
```

## API Endpoint Details

### High-Level Endpoints

1. **Placement Data** (`/api/v1/dashboard-api/placement/`)
   - Parameters: `start_date`, `end_date`
   - Returns: Targeting performance metrics
   - Cache: 5 minutes

2. **Inventory Health** (`/api/v1/dashboard-api/inventory-health/`)
   - Parameters: `sales_days`, `reorder_cover_days`, `supply_chain_lead_time`
   - Returns: Inventory metrics with reorder recommendations
   - Cache: 10 minutes

3. **ASIN Liquidation** (`/api/v1/dashboard-api/asin-liquidation/`)
   - Parameters: `days_window`
   - Returns: Excess inventory and liquidation candidates
   - Cache: 15 minutes

4. **Campaign Summary** (`/api/v1/dashboard-api/campaign-summary/`)
   - Parameters: `period`
   - Returns: Campaign performance metrics
   - Cache: 5 minutes

5. **Targeting Analysis** (`/api/v1/dashboard-api/targeting-analysis/`)
   - Parameters: `period`
   - Returns: Keyword and targeting performance
   - Cache: 5 minutes

6. **Sales Trend ASIN** (`/api/v1/dashboard-api/sales-trend-asin/`)
   - Parameters: `period`
   - Returns: ASIN-level sales trends over time
   - Cache: 10 minutes

7. **Weekly Data** (`/api/v1/dashboard-api/weekly/`)
   - Parameters: `focus_level`, `aggregation`
   - Returns: Aggregated weekly/monthly data
   - Cache: 15 minutes

8. **Ads Sales Data** (`/api/v1/dashboard-api/ads-sales/`)
   - Parameters: `start_date`, `end_date`, `focus_level`
   - Returns: Current vs previous period comparison
   - Cache: 5 minutes

9. **ASIN Summary** (`/api/v1/dashboard-api/asin-summary/`)
   - Parameters: `start_date`, `end_date`, `focus_level`
   - Returns: Comprehensive ASIN-level metrics
   - Cache: 10 minutes

10. **Ads Trend** (`/api/v1/dashboard-api/ads-trend/`)
    - Parameters: `days`
    - Returns: Multi-period advertising trends
    - Cache: 10 minutes

## Data Flow

```
API Response → Service Layer → React Query Hook → Component
     ↓              ↓               ↓             ↓
 Raw JSON    →  Typed Data   →  Cached Data  →  UI Render
```

## Caching Strategy

- **Fast-changing data** (ads metrics): 5 minutes
- **Medium-changing data** (ASIN performance): 10 minutes  
- **Slow-changing data** (inventory): 15+ minutes
- **Long-term cache**: 30-60 minutes for background storage

## Error Handling

All hooks provide:
- `isLoading` - Loading state
- `isError` - Error state
- `error` - Error details
- `refetch` - Manual retry function

## Migration from Static Data

Current components use static JSON files. Migration involves:

1. Replace JSON imports with React Query hooks
2. Update component props to use API response types
3. Add loading and error states
4. Remove static data dependencies

## Environment Configuration

API base URL configured in `src/lib/api/config.ts`:
```typescript
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

## Authentication

All endpoints require authentication header:
```
Authorization: Bearer <token>
```

Handled automatically by `apiClient` in the service layer.
