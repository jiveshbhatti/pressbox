import { NextRequest, NextResponse } from 'next/server';

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || ''; // Empty for installed apps

    if (!clientId) {
      return NextResponse.json({ error: 'Missing Reddit client ID' }, { status: 500 });
    }

    // For installed apps, secret is empty string
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(REDDIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Pressbox/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Reddit refresh error:', error);
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: response.status });
    }

    const data = await response.json();

    // Keep the same refresh token if not returned
    const token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };

    return NextResponse.json(token);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
