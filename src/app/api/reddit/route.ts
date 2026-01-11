import { NextRequest, NextResponse } from 'next/server';

// Use Edge Runtime - runs on Cloudflare's network with different IPs
export const runtime = 'edge';

// Proxy requests to Reddit's public JSON API to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Try multiple Reddit endpoints - some may work better than others
  const endpoints = [
    `https://www.reddit.com${path}`,
    `https://old.reddit.com${path}`,
    `https://api.reddit.com${path}`,
  ];

  // Browser-like headers to avoid bot detection
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  let lastError = '';

  for (const redditUrl of endpoints) {
    try {
      const response = await fetch(redditUrl, {
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          },
        });
      }

      lastError = `${response.status} from ${new URL(redditUrl).hostname}`;
    } catch (error) {
      lastError = `Error from ${new URL(redditUrl).hostname}: ${error}`;
    }
  }

  console.error('Reddit proxy error:', lastError);
  return NextResponse.json(
    { error: `Failed to fetch from Reddit: ${lastError}` },
    { status: 502 }
  );
}
