import { NextRequest, NextResponse } from 'next/server';

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || ''; // Empty for installed apps
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;

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
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || 'http://localhost:3000/auth/callback',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Reddit token error:', error);
      return NextResponse.json({ error: 'Failed to get token' }, { status: response.status });
    }

    const data = await response.json();

    // Add expires_at timestamp
    const token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };

    return NextResponse.json(token);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
