import Image from 'next/image';
import Link from 'next/link';

interface BrandMarkProps {
  size?: number;
  showText?: boolean;
  theme?: 'sand' | 'dark' | 'light';
  href?: string;
  asDiv?: boolean;
  className?: string;
}

export function BrandMark({
  size = 44,
  showText = true,
  theme = 'sand',
  href = '/',
  asDiv = false,
  className = '',
}: BrandMarkProps) {
  const content = (
    <>
      <div 
        className={`relative overflow-hidden rounded-xl shadow-xs transition-transform group-hover:scale-105 ${
          theme === 'dark' ? 'bg-zinc-800/80 ring-1 ring-amber-500/30' : 'bg-white ring-1 ring-amber-200/70'
        }`}
        style={{ width: size, height: size }}
      >
        <Image 
          src="/logo.png" 
          alt="Xenios Istanbul" 
          width={size} 
          height={size}
          unoptimized
          className="object-cover w-full h-full rounded-xl"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif tracking-[0.2em] font-bold text-lg leading-tight ${
            theme === 'dark' ? 'text-amber-400' : 'text-zinc-900'
          }`}>
            XENIOS
          </span>
          <span className={`text-[10px] tracking-wider uppercase ${
            theme === 'dark' ? 'text-zinc-400' : 'text-amber-800/70'
          }`}>
            İstanbul Concierge
          </span>
        </div>
      )}
    </>
  );

  if (asDiv) {
    return (
      <div className={`inline-flex items-center gap-3 group ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`inline-flex items-center gap-3 group ${className}`}>
      {content}
    </Link>
  );
}
