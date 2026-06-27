import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ExternalLink } from 'lucide-react';
import { IdeaCard } from '@/components/vaultzero/idea-card';
import { getPublicProfile } from '@/data/anon/vaultzero';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fff7eb]" />}>
      <PublicProfileContent params={params} />
    </Suspense>
  );
}

async function PublicProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) {
    notFound();
  }

  const { profile, ideas, contributor } = data;

  return (
    <main className="min-h-screen bg-[#fff7eb] px-4 py-8 text-[#171529] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#3157ff]">Back to Discover</Link>
        <header className="mt-6 rounded-lg border border-[#e7dfd2] bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#3157ff]">@{profile.username}</p>
              <h1 className="mt-1 text-4xl font-black tracking-normal">{profile.display_name ?? profile.username}</h1>
              {profile.bio ? <p className="mt-3 max-w-2xl leading-7 text-[#5f5a6d]">{profile.bio}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[#3157ff]">
                {[profile.website_url, profile.x_url, profile.github_url].filter(Boolean).map((url) => (
                  <a key={url} href={url ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                    <ExternalLink className="size-4" />
                    {url?.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Score" value={contributor?.score ?? 0} />
              <Metric label="Votes" value={contributor?.votesReceived ?? 0} />
              <Metric label="Comments" value={contributor?.commentsReceived ?? 0} />
              <Metric label="Saves" value={contributor?.bookmarksReceived ?? 0} />
            </div>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-2xl font-black">Accepted ideas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} isLoggedIn={false} hasProfile={false} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-[#fff7eb] p-3">
      <span className="block text-xs font-bold uppercase text-[#8a8297]">{label}</span>
      <span className="block text-xl font-black">{value}</span>
    </span>
  );
}
