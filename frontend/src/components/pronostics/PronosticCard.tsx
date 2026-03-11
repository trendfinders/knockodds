import Link from 'next/link';

interface PronosticCardProps {
  slug: string;
  title: string;
  excerpt: string;
  confidence: number;
  predictedMethod: string;
  date: string;
}

const confidenceStars = (level: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < level ? 'text-accent-gold' : 'text-gray-300'}>&#9733;</span>
  ));
};

const methodBadgeColor: Record<string, string> = {
  KO: 'bg-red-50 text-red-600',
  SUB: 'bg-blue-50 text-blue-600',
  DEC: 'bg-amber-50 text-amber-700',
};

export function PronosticCard({ slug, title, excerpt, confidence, predictedMethod, date }: PronosticCardProps) {
  return (
    <Link href={`/pronostics/${slug}`} className="card group">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg">{confidenceStars(confidence)}</div>
          <span className={`badge ${methodBadgeColor[predictedMethod] || 'bg-gray-500/20 text-gray-400'}`}>
            {predictedMethod}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3 mb-3">{excerpt}</p>
        <time className="text-xs text-gray-500">{new Date(date).toLocaleDateString('it-IT')}</time>
      </div>
    </Link>
  );
}
