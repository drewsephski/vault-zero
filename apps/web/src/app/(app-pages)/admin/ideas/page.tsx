import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAdminIdeasData } from '@/data/user/vaultzero-pages';
import { formatStatus } from '@/lib/vaultzero/helpers';

const sections = [
  { title: 'Moderation Queue', filter: (state: string) => state === 'pending_review' },
  { title: 'All Ideas', filter: () => true },
  { title: 'Accepted/Public', filter: (state: string) => state === 'accepted' },
  { title: 'Needs Edits', filter: (state: string) => state === 'needs_edits' },
  { title: 'Rejected', filter: (state: string) => state === 'rejected' },
  { title: 'Archived', filter: (state: string) => state === 'archived' },
];

export default async function AdminIdeasPage() {
  const { ideas } = await getAdminIdeasData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-normal">Admin ideas</h1>
          <Button asChild variant="outline"><Link href="/admin">Admin home</Link></Button>
        </div>
        <div className="mt-6 space-y-6">
          {sections.map((section) => {
            const rows = ideas.filter((idea) => section.filter(idea.review_state));
            return (
              <section key={section.title} className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black">{section.title}</h2>
                  <Badge variant="outline">{rows.length}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {rows.map((idea) => (
                    <Link key={idea.id} href={`/admin/ideas/${idea.id}`} className="block rounded-md border border-[#eee5d7] p-3 hover:bg-[#fffaf1]">
                      <span className="block font-black">{idea.title}</span>
                      <span className="mt-1 block text-sm text-[#6b6578]">
                        @{idea.author?.username ?? 'unknown'} · {formatStatus(idea.review_state)} · {formatStatus(idea.status)} · {idea.score} votes
                      </span>
                    </Link>
                  ))}
                  {rows.length === 0 ? <p className="text-sm text-[#6b6578]">No ideas in this group.</p> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

