import { NextRequest, NextResponse } from 'next/server';

// Proxy requests to Reddit's public JSON API to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const redditUrl = `https://www.reddit.com${path}`;

    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Pressbox/1.0 (personal game threads viewer)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Reddit API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Reddit proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Reddit' },
      { status: 500 }
    );
  }
}
