'use client';

interface KoPointsBalanceProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function KoPointsBalance({ balance, size = 'md', className = '' }: KoPointsBalanceProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-xl gap-2',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span className={`inline-flex items-center font-bold ${sizeClasses[size]} ${className}`}>
      <span className={`${iconSize[size]} rounded-full bg-accent-gold flex items-center justify-center text-white flex-shrink-0`}
        style={{ fontSize: size === 'sm' ? 10 : size === 'md' ? 12 : 14 }}>
        KO
      </span>
      <span className="text-accent-gold">{(balance ?? 0).toLocaleString()}</span>
    </span>
  );
}

// Backward compat alias
export { KoPointsBalance as KnockCoinsBalance };
