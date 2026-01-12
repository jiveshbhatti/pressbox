import { NextRequest, NextResponse } from 'next/server';

// Use Arctic Shift API to search for Reddit game threads
// This is a Reddit archive that isn't blocked like direct Reddit access
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');
  const query = searchParams.get('q');

  if (!subreddit) {
    return NextResponse.json({ error: 'Missing subreddit parameter' }, { status: 400 });
  }

  try {
    // Search for game threads using Arctic Shift (Pushshift replacement)
    const arcticUrl = new URL('https://arctic-shift.photon-reddit.com/api/posts/search');
    arcticUrl.searchParams.set('subreddit', subreddit);
    arcticUrl.searchParams.set('sort', 'desc');
    arcticUrl.searchParams.set('limit', '50');

    if (query) {
      arcticUrl.searchParams.set('title', query);
    }

    const response = await fetch(arcticUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Arctic Shift API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Arctic Shift proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Arctic Shift' },
      { status: 500 }
    );
  }
}
