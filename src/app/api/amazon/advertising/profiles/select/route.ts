import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get profile selection data from request body
    const data = await request.json();
    const { profiles } = data;

    if (!profiles || !profiles.length) {
      return NextResponse.json(
        { error: 'Missing required parameter: profiles' },
        { status: 400 }
      );
    }

    const profileId = profiles[0]; // Take the first profile ID
    console.log(`Selecting Amazon Advertising profile:`, profileId);

    // Using the testing endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/amazon/advertising/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profileId })
    });

    /* Original endpoint - commented for now
    const response = await fetch(`${BACKEND_URL}/api/v1/amazon/advertising/profiles/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profiles })
    });
    */

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

      console.error('Error selecting advertising profile:', errorData);

      return NextResponse.json(
        { error: errorData.error || 'Failed to select Amazon Advertising profile' },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error selecting Amazon Advertising profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 