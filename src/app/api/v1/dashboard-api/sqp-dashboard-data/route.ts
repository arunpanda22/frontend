import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selected_asin = searchParams.get('selected_asin');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const period = searchParams.get('period');

    // Construct backend URL
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard-api/sqp-dashboard-data/`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (selected_asin) params.append('selected_asin', selected_asin);
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (period) params.append('period', period);

    const url = `${backendUrl}?${params.toString()}`;
    
    console.log('SQP Dashboard Data API Request:', url);

    // Forward request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('SQP Dashboard Data API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch SQP dashboard data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('SQP Dashboard Data API Response received');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQP Dashboard Data API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
