import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const focus_level = searchParams.get('focus_level')
    
    // Construct the backend URL
    const backendUrl = new URL('/dashboard-api/campaign-summary/', process.env.NEXT_PUBLIC_BACKEND_URL!)
    
    // Add query parameters
    if (period) backendUrl.searchParams.append('period', period)
    if (start_date) backendUrl.searchParams.append('start_date', start_date)
    if (end_date) backendUrl.searchParams.append('end_date', end_date)
    if (focus_level) backendUrl.searchParams.append('focus_level', focus_level)
    
    console.log('📤 Forwarding Campaign Summary request to:', backendUrl.toString())
    
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      }
    })
    
    if (!response.ok) {
      console.error('❌ Backend response error:', response.status, response.statusText)
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Campaign Summary data received from backend')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Campaign Summary API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign summary data' },
      { status: 500 }
    )
  }
}
