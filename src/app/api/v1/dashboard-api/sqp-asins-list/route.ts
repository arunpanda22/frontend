import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Construct backend URL
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard-api/sqp-asins-list/`;
    
    console.log('SQP ASINs List API Request:', backendUrl);

    // Forward request to backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('SQP ASINs List API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch SQP ASINs list' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('SQP ASINs List API Response received');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQP ASINs List API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
