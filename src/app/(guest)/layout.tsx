import type { Metadata } from 'next';
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav';

export const metadata: Metadata = {
  title: 'purelyİstanbul - Misafir Rehberi & Concierge',
  description: 'İstanbul seçkin butik oteller dijital oda rehberi ve konsiyerj platformu',
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-[#f8f6f0] text-zinc-900 w-full pb-28 antialiased">
        {children}
      </div>
      {/* Alt Navibar doğrudan root layout seviyesinde render edilir */}
      <MobileFooterNav />
    </>
  );
}

