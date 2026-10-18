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
  size = 40,
  showText = true,
  showIcon = true,
  theme = 'sand',
  href = '/',
  asDiv = false,
  className = '',
}: BrandMarkProps) {
  const wordmarkHeight = Math.round(size * 0.85);
  const wordmarkWidth = Math.round(wordmarkHeight * (165 / 60));

  const content = (
    <>
      {showIcon && (
        <div
          className="relative overflow-hidden transition-transform group-hover:scale-105 shrink-0 bg-transparent"
          style={{ width: size, height: size }}
        >
          <Image
            src="/logo.png"
            alt="purelyistanbul"
            width={size}
            height={size}
            unoptimized
            className="object-contain w-full h-full"
            priority
          />
        </div>
      )}
      {showText && (
        <div translate="no" className="notranslate flex items-center leading-none shrink-0 bg-transparent">
          <Image
            src="/purely-wordmark.png"
            alt="purelyistanbul"
            width={wordmarkWidth}
            height={wordmarkHeight}
            unoptimized
            priority
            className={`object-contain w-auto ${theme === 'dark' ? 'brightness-110' : ''}`}
            style={{ height: wordmarkHeight }}
          />
        </div>
      )}
    </>
  );

  if (asDiv) {
    return (
      <div translate="no" className={`notranslate inline-flex items-center gap-1.5 group ${className}`}>
        {content}
      </div>
    );
  }

  if (href.startsWith('/')) {
    return (
      <Link href={href} translate="no" className={`notranslate inline-flex items-center gap-1.5 group ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href || "https://www.purelyistanbul.com"} target="_blank" rel="noopener noreferrer" translate="no" className={`notranslate inline-flex items-center gap-1.5 group ${className}`}>
      {content}
    </a>
  );
}

