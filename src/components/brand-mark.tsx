import Image from 'next/image';
import Link from 'next/link';

interface BrandMarkProps {
  size?: number;
  showText?: boolean;
  showIcon?: boolean;
  theme?: 'sand' | 'dark' | 'light';
  href?: string;
  asDiv?: boolean;
  className?: string;
}

export function BrandMark({
  size = 44,
  showText = true,
  showIcon = false,
  theme = 'sand',
  href = '/',
  asDiv = false,
  className = '',
}: BrandMarkProps) {
  const content = (
    <>
      {showIcon && (
        <div 
          className={`relative overflow-hidden rounded-xl shadow-xs transition-transform group-hover:scale-105 shrink-0 ${
            theme === 'dark' ? 'bg-zinc-800/80 ring-1 ring-amber-500/30' : 'bg-white ring-1 ring-amber-200/70'
          }`}
          style={{ width: size, height: size }}
        >
          <Image 
            src="/logo.png" 
            alt="purelyİstanbul" 
            width={size} 
            height={size}
            unoptimized
            className="object-cover w-full h-full rounded-xl"
            priority
          />
        </div>
      )}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-serif tracking-tight font-bold text-lg sm:text-xl leading-none ${
            theme === 'dark' ? 'text-amber-400' : 'text-zinc-900'
          }`}>
            purely<span className="text-red-600 font-bold">İstanbul</span>
          </span>
          <span className={`text-[9px] sm:text-[10px] tracking-wider uppercase mt-0.5 ${
            theme === 'dark' ? 'text-zinc-400' : 'text-amber-800/70'
          }`}>
            Digital Guest Concierge
          </span>
        </div>
      )}
    </>
  );

  if (asDiv) {
    return (
      <div className={`inline-flex items-center gap-2 group ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`inline-flex items-center gap-2 group ${className}`}>
      {content}
    </Link>
  );
}
