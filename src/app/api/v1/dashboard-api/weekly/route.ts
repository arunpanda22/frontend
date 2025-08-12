import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const focus_level = searchParams.get('focus_level') || 'all';
    const aggregation = searchParams.get('aggregation') || 'weekly';

    // Get the backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    // Construct the backend URL
    const backendApiUrl = `${backendUrl}/dashboard-api/weekly/?focus_level=${focus_level}&aggregation=${aggregation}`;
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    console.log('Proxying weekly data request to:', backendApiUrl);
    
    // Make the request to the backend
    const response = await fetch(backendApiUrl, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend weekly data error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend responded with status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Weekly data response received, data length:', data?.weekly_data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
