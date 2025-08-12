import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');

    // Construct backend URL
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard-api/sales-trend-asin/`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (period) params.append('period', period);

    const url = `${backendUrl}?${params.toString()}`;
    
    console.log('Sales Trend ASIN API Request:', url);

    // Forward request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Sales Trend ASIN API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch sales trend ASIN data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Sales Trend ASIN API Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sales Trend ASIN API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
