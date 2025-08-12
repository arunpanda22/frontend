import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const focus_level = searchParams.get('focus_level');

    // Construct backend URL
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard-api/asin-summary/`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (focus_level) params.append('focus_level', focus_level);

    const url = `${backendUrl}?${params.toString()}`;
    
    console.log('ASIN Summary API Request:', url);

    // Forward request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ASIN Summary API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch ASIN summary data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('ASIN Summary API Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('ASIN Summary API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
