import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const focus_level = searchParams.get('focus_level') || 'all';

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Get the backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    // Construct the backend URL
    const backendApiUrl = `${backendUrl}/dashboard-api/ads-sales/?start_date=${start_date}&end_date=${end_date}&focus_level=${focus_level}`;
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    console.log('Proxying ads-sales request to:', backendApiUrl);
    
    // Make the request to the backend
    const response = await fetch(backendApiUrl, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend ads-sales error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend responded with status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Ads-sales response received:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ads-sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads-sales data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
