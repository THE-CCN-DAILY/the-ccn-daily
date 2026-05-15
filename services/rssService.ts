export interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  enclosure?: {
    url: string;
    type: string;
    length?: string;
  };
  itunes?: {
    duration?: string;
    image?: string;
    summary?: string;
    episode?: string;
    season?: string;
  };
}

export interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: FeedItem[];
}

export async function fetchRSSFeed(url: string): Promise<RSSFeed> {
  try {
    const response = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch RSS feed');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    throw error;
  }
}
