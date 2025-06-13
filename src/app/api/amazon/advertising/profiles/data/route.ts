import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Get session from query parameters
    const searchParams = request.nextUrl.searchParams;
    const session = searchParams.get('session');

    // Get authorization header
    const authHeader = request.headers.get('Authorization');

    if (!session) {
      return NextResponse.json(
        { error: 'Missing required parameter: session' },
        { status: 400 }
      );
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      );
    }

    console.log(`Fetching advertising profiles for session: ${session}`);

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/amazon/advertising/profiles/data?session=${session}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      // Handle non-JSON responses gracefully
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = { error: `Server error: ${text.substring(0, 100)}...` };
      }

      console.error('Error fetching advertising profiles:', errorData);

      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch Amazon Advertising profiles' },
        { status: response.status }
      );
    }

    // Return the profiles from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Amazon Advertising profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 