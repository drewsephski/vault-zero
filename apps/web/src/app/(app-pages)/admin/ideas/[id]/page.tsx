import Link from 'next/link';
import { AdminCommentActions } from '@/components/vaultzero/admin-comment-actions';
import { AdminIdeaActions } from '@/components/vaultzero/admin-idea-actions';
import { getAdminIdeaDetailData } from '@/data/user/vaultzero-pages';
import { displayName, formatStatus } from '@/lib/vaultzero/helpers';

export default async function AdminIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminIdeaDetailData(id);
  const { idea } = data;

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/ideas" className="text-sm font-semibold text-[#3157ff]">Back to admin ideas</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="rounded-lg border border-[#e7dfd2] bg-white p-5">
            <p className="text-sm font-bold text-[#3157ff]">
              {formatStatus(idea.review_state)} · {formatStatus(idea.status)}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-normal">{idea.title}</h1>
            <p className="mt-3 text-[#5f5a6d]">{idea.one_line_summary}</p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Meta label="Author" value={`${displayName(idea.author)} (@${idea.author?.username})`} />
              <Meta label="Email" value={idea.author?.email ?? 'Unavailable'} />
              <Meta label="Votes" value={String(idea.score)} />
              <Meta label="Comments" value={String(idea.comment_count)} />
              <Meta label="Bookmarks" value={String(idea.bookmark_count)} />
              <Meta label="Follows" value={String(idea.follower_count)} />
            </div>
            <div className="mt-6 space-y-5">
              {[
                ['Problem', idea.problem],
                ['Audience', idea.intended_audience],
                ['Alternatives', idea.existing_alternatives],
                ['Solution', idea.proposed_solution],
                ['Why now', idea.why_now],
                ['Impact', idea.expected_impact],
                ['Monetization', idea.monetization_potential],
                ['Go to market', idea.go_to_market],
                ['MVP scope', idea.mvp_scope],
                ['Risks', idea.key_risks],
              ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => (
                <section key={label}>
                  <h2 className="text-xs font-black uppercase text-[#8a8297]">{label}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6">{value}</p>
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-4">
            <AdminIdeaActions idea={idea} />
            <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
              <h2 className="font-black">AI enhancement history</h2>
              <div className="mt-3 space-y-3">
                {data.aiSessions.map((session) => (
                  <div key={session.id} className="rounded-md bg-[#fff7eb] p-3 text-sm">
                    <p className="font-semibold">{session.status} · {session.model ?? 'unknown model'}</p>
                    <p className="mt-2 line-clamp-4 text-[#5f5a6d]">{session.rough_idea}</p>
                  </div>
                ))}
                {data.aiSessions.length === 0 ? <p className="text-sm text-[#6b6578]">No AI sessions linked.</p> : null}
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
            <h2 className="font-black">Status history</h2>
            <div className="mt-3 space-y-2 text-sm text-[#5f5a6d]">
              {data.history.map((item) => (
                <p key={item.id} className="rounded-md bg-[#fff7eb] p-2">
                  {formatStatus(item.from_review_state ?? 'none')} → {formatStatus(item.to_review_state ?? 'none')}
                  {item.note ? ` · ${item.note}` : ''}
                </p>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
            <h2 className="font-black">Moderation history</h2>
            <div className="mt-3 space-y-2 text-sm text-[#5f5a6d]">
              {data.moderationEvents.map((item) => (
                <p key={item.id} className="rounded-md bg-[#fff7eb] p-2">{item.action}{item.reason ? ` · ${item.reason}` : ''}</p>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
            <h2 className="font-black">Comments</h2>
            <div className="mt-3 space-y-3">
              {data.comments.map((comment) => (
                <div key={comment.id} className="rounded-md bg-[#fff7eb] p-3 text-sm">
                  <p className="font-semibold">@{comment.author?.username ?? 'unknown'} {comment.is_hidden ? '(hidden)' : ''}</p>
                  <p className="mt-1 text-[#5f5a6d]">{comment.body}</p>
                  <div className="mt-2">
                    <AdminCommentActions commentId={comment.id} isHidden={comment.is_hidden} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#fff7eb] p-3">
      <p className="text-xs font-black uppercase text-[#8a8297]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

