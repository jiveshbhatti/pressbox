import { NextRequest, NextResponse } from 'next/server';

// Use Pullpush API to search for Reddit game threads
// This is a Reddit archive that isn't blocked like direct Reddit access
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');
  const query = searchParams.get('q');

  if (!subreddit) {
    return NextResponse.json({ error: 'Missing subreddit parameter' }, { status: 400 });
  }

  try {
    // Search for game threads using Pullpush (Pushshift replacement)
    const pullpushUrl = new URL('https://api.pullpush.io/reddit/search/submission/');
    pullpushUrl.searchParams.set('subreddit', subreddit);
    pullpushUrl.searchParams.set('sort', 'desc');
    pullpushUrl.searchParams.set('sort_type', 'created_utc');
    pullpushUrl.searchParams.set('limit', '50');

    if (query) {
      pullpushUrl.searchParams.set('q', query);
    }

    const response = await fetch(pullpushUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Pullpush API error: ${response.status}` },
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
    console.error('Pullpush proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Pullpush' },
      { status: 500 }
    );
  }
}
