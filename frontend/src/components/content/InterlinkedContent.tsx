import { interlink } from '@/lib/services/interlinking';
import { getEntityRegistry, registryToInterlinkEntities } from '@/lib/services/entity-registry';

interface InterlinkedContentProps {
  html: string;
  currentPageUrl?: string;
  className?: string;
}

export async function InterlinkedContent({ html, currentPageUrl = '', className }: InterlinkedContentProps) {
  // Load entity registry
  const registry = await getEntityRegistry();
  const { fighters, events } = registryToInterlinkEntities(registry);

  // Process content with interlinking
  const linkedHtml = interlink(html, currentPageUrl, fighters, events);

  return (
    <div
      className={className || 'prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-a:text-primary'}
      dangerouslySetInnerHTML={{ __html: linkedHtml }}
    />
  );
}
