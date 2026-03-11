import Link from 'next/link';
import Image from 'next/image';

interface NewsCardProps {
  slug: string;
  title: string;
  excerpt: string;
  image?: string;
  blurPlaceholder?: string;
  date: string;
  category?: string;
}

export function NewsCard({ slug, title, excerpt, image, blurPlaceholder, date, category }: NewsCardProps) {
  return (
    <Link href={`/news/${slug}`} className="card group">
      {image && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            {...(blurPlaceholder ? { placeholder: 'blur', blurDataURL: blurPlaceholder } : {})}
          />
        </div>
      )}
      <div className="p-5">
        {category && <span className="badge-category mb-2">{category}</span>}
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{excerpt}</p>
        <time className="text-xs text-gray-500">{new Date(date).toLocaleDateString('it-IT')}</time>
      </div>
    </Link>
  );
}
