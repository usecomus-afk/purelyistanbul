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
          className="relative overflow-hidden transition-transform group-hover:scale-105 shrink-0 bg-transparent"
          style={{ width: size, height: size }}
        >
          <Image 
            src="/logo.png" 
            alt="purelyİstanbul" 
            width={size} 
            height={size}
            unoptimized
            className="object-contain w-full h-full"
            priority
          />
        </div>
      )}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-serif tracking-tight font-bold text-2xl sm:text-3xl leading-none ${
            theme === 'dark' ? 'text-white' : 'text-slate-900 '
          }`}>
            purely<span className="text-red-600 font-bold">istanbul</span>
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

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={`inline-flex items-center gap-2 group ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href || "https://www.purelyistanbul.com"} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 group ${className}`}>
      {content}
    </a>
  );
}

