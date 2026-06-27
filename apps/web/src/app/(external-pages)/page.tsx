import { Suspense } from 'react';
import { DiscoverPage } from '@/components/vaultzero/discover-page';
import { getDiscoverData } from '@/data/anon/vaultzero';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff7eb]" />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const data = await getDiscoverData();
  return <DiscoverPage {...data} />;
}
