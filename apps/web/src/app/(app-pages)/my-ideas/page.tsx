import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MyIdeaActions } from '@/components/vaultzero/my-idea-actions';
import { getMyIdeasPageData } from '@/data/user/vaultzero-pages';
import { formatStatus } from '@/lib/vaultzero/helpers';

const groups = ['draft', 'pending_review', 'needs_edits', 'accepted', 'rejected', 'archived'] as const;

export default async function MyIdeasPage() {
  const { ideas, profile } = await getMyIdeasPageData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal">My Ideas</h1>
            <p className="mt-1 text-sm text-[#6b6578]">Track drafts, review feedback, public ideas, and rejected concepts.</p>
          </div>
          {!profile ? (
            <Button asChild>
              <Link href="/settings/profile">Create username</Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-6 space-y-6">
          {groups.map((group) => {
            const groupIdeas = ideas.filter((idea) => idea.review_state === group);
            return (
              <section key={group} className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black">{formatStatus(group)}</h2>
                  <Badge variant="outline">{groupIdeas.length}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {groupIdeas.map((idea) => (
                    <article key={idea.id} className="rounded-md border border-[#eee5d7] bg-[#fffaf1] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-black">{idea.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-[#5f5a6d]">{idea.one_line_summary}</p>
                          {idea.admin_feedback ? <p className="mt-2 text-sm text-[#5f35d4]">Feedback: {idea.admin_feedback}</p> : null}
                          {idea.rejection_reason ? <p className="mt-2 text-sm text-red-700">Reason: {idea.rejection_reason}</p> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {idea.review_state === 'accepted' ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/ideas/${idea.slug}`}>Public link</Link>
                            </Button>
                          ) : null}
                          {['draft', 'pending_review', 'needs_edits', 'rejected'].includes(idea.review_state) ? (
                            <MyIdeaActions ideaId={idea.id} />
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                  {groupIdeas.length === 0 ? (
                    <p className="rounded-md bg-[#fff7eb] p-3 text-sm text-[#6b6578]">No ideas in this state.</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

