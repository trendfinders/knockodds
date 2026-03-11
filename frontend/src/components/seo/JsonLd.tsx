interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ArticleJsonLd({ title, description, datePublished, dateModified, image, type }: {
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image: string;
  type?: 'Article' | 'NewsArticle';
}) {
  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': type || 'Article',
      headline: title,
      description,
      datePublished,
      dateModified,
      ...(image && { image }),
      author: { '@type': 'Organization', name: 'KnockOdds' },
      publisher: {
        '@type': 'Organization',
        name: 'KnockOdds',
        logo: { '@type': 'ImageObject', url: 'https://knockodds.com/logo.png' },
      },
    }} />
  );
}

export function SportsEventJsonLd({ name, startDate, fighter1, fighter2, location, organizer, sport, eventStatus, url }: {
  name: string;
  startDate: string;
  fighter1: string;
  fighter2: string;
  location?: string;
  organizer?: string;
  sport?: string;
  eventStatus?: string;
  url?: string;
}) {
  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name,
      startDate,
      sport: sport || 'MMA',
      ...(eventStatus && { eventStatus: `https://schema.org/${eventStatus}` }),
      ...(url && { url }),
      competitor: [
        { '@type': 'Person', name: fighter1 },
        { '@type': 'Person', name: fighter2 },
      ],
      ...(location && { location: { '@type': 'Place', name: location } }),
      organizer: { '@type': 'Organization', name: organizer || 'UFC' },
    }} />
  );
}

export function UGCDiscussionJsonLd({ name, url, commentCount }: {
  name: string;
  url: string;
  commentCount: number;
}) {
  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: name,
      url,
      author: { '@type': 'Organization', name: 'KnockOdds Community' },
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: commentCount,
      },
    }} />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    }} />
  );
}
