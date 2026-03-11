/**
 * Automatic Entity Interlinking System
 *
 * Scans HTML/text content and inserts internal links to:
 * - Fighter profiles (/fighters/{id})
 * - Event pages (/odds/{event-slug})
 * - Bookmaker reviews (/bookmakers/{slug})
 * - Organization pages
 *
 * Rules:
 * - Only link first occurrence of each entity per article
 * - Don't link inside headings (h1-h6)
 * - Don't link inside existing <a> tags
 * - Max 3-5 interlinks per 500 words
 * - Don't link the entity if we're on that entity's page
 */

export interface EntityLink {
  pattern: string;       // Text to match (case-insensitive)
  url: string;           // Internal URL to link to
  title: string;         // Title attribute for the link
  type: 'fighter' | 'event' | 'bookmaker' | 'organization';
}

// Static bookmaker entities (always available)
const BOOKMAKER_ENTITIES: EntityLink[] = [
  { pattern: '22Bet', url: '/bookmakers/22bet', title: '22Bet UFC Review', type: 'bookmaker' },
  { pattern: '22bet', url: '/bookmakers/22bet', title: '22Bet UFC Review', type: 'bookmaker' },
  { pattern: 'Bet365', url: '/bookmakers/bet365', title: 'Bet365 UFC Review', type: 'bookmaker' },
  { pattern: 'bet365', url: '/bookmakers/bet365', title: 'Bet365 UFC Review', type: 'bookmaker' },
  { pattern: 'Unibet', url: '/bookmakers/unibet', title: 'Unibet MMA Review', type: 'bookmaker' },
  { pattern: 'Betway', url: '/bookmakers/betway', title: 'Betway UFC Review', type: 'bookmaker' },
  { pattern: '888Sport', url: '/bookmakers/888sport', title: '888Sport MMA Review', type: 'bookmaker' },
  { pattern: '888sport', url: '/bookmakers/888sport', title: '888Sport MMA Review', type: 'bookmaker' },
];

// Static organization entities
const ORG_ENTITIES: EntityLink[] = [
  { pattern: 'UFC', url: '/odds', title: 'UFC Events - All Odds', type: 'organization' },
  { pattern: 'Bellator', url: '/odds', title: 'Bellator MMA Odds', type: 'organization' },
  { pattern: 'PFL', url: '/odds', title: 'PFL MMA Odds', type: 'organization' },
  { pattern: 'ONE Championship', url: '/odds', title: 'ONE Championship Odds', type: 'organization' },
];

export class InterlinkingEngine {
  private entities: EntityLink[] = [];
  private currentPageUrl: string = '';
  private maxLinksPerArticle: number = 10;

  constructor(currentPageUrl: string = '') {
    this.currentPageUrl = currentPageUrl;
    // Load static entities
    this.entities = [...BOOKMAKER_ENTITIES, ...ORG_ENTITIES];
  }

  /**
   * Add fighter entities (loaded from API/CMS)
   */
  addFighters(fighters: Array<{ id: number; name: string }>) {
    for (const f of fighters) {
      // Add full name
      this.entities.push({
        pattern: f.name,
        url: `/fighters/${f.id}`,
        title: `${f.name} - Record & Statistics`,
        type: 'fighter',
      });

      // Add last name only if it's unique enough (>4 chars)
      const lastName = f.name.split(' ').pop() || '';
      if (lastName.length > 4) {
        this.entities.push({
          pattern: lastName,
          url: `/fighters/${f.id}`,
          title: `${f.name} Profile`,
          type: 'fighter',
        });
      }
    }
  }

  /**
   * Add event entities (loaded from API/CMS)
   */
  addEvents(events: Array<{ slug: string; name: string }>) {
    for (const e of events) {
      this.entities.push({
        pattern: e.name,
        url: `/odds/${e.slug}`,
        title: `${e.name} Odds`,
        type: 'event',
      });
    }
  }

  /**
   * Process HTML content and insert interlinks
   *
   * @param html - The HTML content to process
   * @returns HTML with internal links inserted
   */
  process(html: string): string {
    if (!html || html.length < 50) return html;

    // Track which entities have been linked (first occurrence only)
    const linked = new Set<string>();
    let linkCount = 0;

    // Sort entities by pattern length (longer first to avoid partial matches)
    const sortedEntities = [...this.entities].sort(
      (a, b) => b.pattern.length - a.pattern.length
    );

    let result = html;

    for (const entity of sortedEntities) {
      if (linkCount >= this.maxLinksPerArticle) break;

      // Skip if this URL is the current page
      if (entity.url === this.currentPageUrl) continue;

      // Skip if already linked this entity
      const entityKey = entity.url;
      if (linked.has(entityKey)) continue;

      // Build regex that:
      // 1. Matches the pattern as a whole word
      // 2. NOT inside an existing <a> tag
      // 3. NOT inside a heading tag
      // 4. NOT inside an HTML attribute
      const escapedPattern = entity.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?<![<\\/\\w])(?<!<a[^>]*>.*?)\\b(${escapedPattern})\\b(?![^<]*<\\/a>)(?![^<]*<\\/h[1-6]>)`,
        'i'
      );

      // Only replace first occurrence
      const match = result.match(regex);
      if (match && match.index !== undefined) {
        // Verify we're not inside an HTML tag
        const before = result.substring(0, match.index);
        const openTags = (before.match(/<a[\s>]/gi) || []).length;
        const closeTags = (before.match(/<\/a>/gi) || []).length;
        const insideLink = openTags > closeTags;

        const openHeadings = (before.match(/<h[1-6][\s>]/gi) || []).length;
        const closeHeadings = (before.match(/<\/h[1-6]>/gi) || []).length;
        const insideHeading = openHeadings > closeHeadings;

        if (!insideLink && !insideHeading) {
          const replacement = `<a href="${entity.url}" title="${entity.title}" class="text-primary hover:text-primary-light transition-colors">${match[0]}</a>`;
          result = result.substring(0, match.index) + replacement + result.substring(match.index + match[0].length);
          linked.add(entityKey);
          linkCount++;
        }
      }
    }

    return result;
  }
}

/**
 * Simple helper for common use case
 */
export function interlink(
  html: string,
  currentPageUrl: string = '',
  fighters: Array<{ id: number; name: string }> = [],
  events: Array<{ slug: string; name: string }> = [],
): string {
  const engine = new InterlinkingEngine(currentPageUrl);
  engine.addFighters(fighters);
  engine.addEvents(events);
  return engine.process(html);
}
