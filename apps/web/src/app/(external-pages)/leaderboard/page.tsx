import Link from 'next/link';
import { Suspense } from 'react';
import { Trophy } from 'lucide-react';
import { getTopContributors } from '@/data/anon/vaultzero';

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fff7eb]" />}>
      <LeaderboardContent />
    </Suspense>
  );
}

async function LeaderboardContent() {
  const contributors = await getTopContributors(50);

  return (
    <main className="min-h-screen bg-[#fff7eb] px-4 py-8 text-[#171529] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-[#3157ff]">Back to Discover</Link>
        <header className="mt-6 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-md bg-[#ffd166] text-[#171529]">
            <Trophy className="size-6" />
          </span>
          <div>
            <h1 className="text-4xl font-black tracking-normal">Leaderboard</h1>
            <p className="mt-1 text-[#5f5a6d]">Scores reward accepted ideas, shipped progress, votes, comments, saves, and followers.</p>
          </div>
        </header>

        <section className="mt-8 overflow-hidden rounded-lg border border-[#e7dfd2] bg-white">
          {contributors.map((contributor, index) => (
            <Link
              key={contributor.id}
              href={`/u/${contributor.username}`}
              className="grid gap-4 border-b border-[#eee5d7] p-4 last:border-b-0 hover:bg-[#fffaf1] sm:grid-cols-[72px_minmax(0,1fr)_repeat(5,90px)] sm:items-center"
            >
              <span className="text-2xl font-black text-[#3157ff]">#{index + 1}</span>
              <span>
                <span className="block font-black">@{contributor.username}</span>
                <span className="block text-sm text-[#6b6578]">{contributor.display_name ?? 'VaultZero contributor'}</span>
              </span>
              <Metric label="Score" value={contributor.score} />
              <Metric label="Accepted" value={contributor.ideasAccepted} />
              <Metric label="Votes" value={contributor.votesReceived} />
              <Metric label="Comments" value={contributor.commentsReceived} />
              <Metric label="Followers" value={contributor.followersReceived} />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="block text-xs font-bold uppercase text-[#8a8297]">{label}</span>
      <span className="block text-lg font-black">{value}</span>
    </span>
  );
}
