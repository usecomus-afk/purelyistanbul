import type { Metadata } from 'next';
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav';

export const metadata: Metadata = {
  title: 'purelyİstanbul - Premium Experiences & Digital Concierge',
  description: 'Discover curated Istanbul experiences, premium boutique hotel in-room services, and AI-powered concierge. Book Bosphorus tours, culinary adventures, and exclusive stays.',
  keywords: ['Istanbul', 'experiences', 'Bosphorus tours', 'concierge', 'boutique hotels', 'purelyistanbul', 'travel', 'AI concierge'],
  openGraph: {
    title: 'purelyİstanbul - Premium Experiences',
    description: 'Curated Istanbul experiences and premium digital concierge services.',
    url: 'https://www.purelyistanbul.com',
    siteName: 'purelyİstanbul',
    images: [
      {
        url: 'https://www.purelyistanbul.com/logo-mark.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'purelyİstanbul - Premium Experiences',
    description: 'Curated Istanbul experiences and premium digital concierge services.',
    images: ['https://www.purelyistanbul.com/logo-mark.png'],
  },
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'purelyİstanbul',
    url: 'https://www.purelyistanbul.com',
    description: 'Curated Istanbul experiences and premium digital concierge services.',
    publisher: {
      '@type': 'Organization',
      name: 'purelyİstanbul',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.purelyistanbul.com/logo-mark.png'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#f8f6f0] text-zinc-900 w-full pb-28 antialiased">
        {children}
      </div>
      {/* Alt Navibar doğrudan root layout seviyesinde render edilir */}
      <MobileFooterNav />
    </>
  );
}

