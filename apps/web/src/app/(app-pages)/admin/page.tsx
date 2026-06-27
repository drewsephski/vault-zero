import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAdminDashboardData } from '@/data/user/vaultzero-pages';
import { formatStatus } from '@/lib/vaultzero/helpers';

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal">VaultZero Admin</h1>
            <p className="mt-1 text-sm text-[#6b6578]">Review submissions, moderate comments, and manage workflow state.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/ideas">Ideas</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/comments">Comments</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/users">Users</Link></Button>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Pending" value={data.counts.pending} />
          <Metric label="Accepted" value={data.counts.accepted} />
          <Metric label="Needs edits" value={data.counts.needsEdits} />
          <Metric label="Rejected" value={data.counts.rejected} />
          <Metric label="Users" value={data.counts.totalUsers} />
          <Metric label="Comments" value={data.counts.totalComments} />
        </section>

        <section className="mt-6 rounded-lg border border-[#e7dfd2] bg-white p-4">
          <h2 className="font-black">Newest pending submissions</h2>
          <div className="mt-4 space-y-3">
            {data.ideas
              .filter((idea) => idea.review_state === 'pending_review')
              .slice(0, 8)
              .map((idea) => (
                <Link key={idea.id} href={`/admin/ideas/${idea.id}`} className="block rounded-md border border-[#eee5d7] p-3 hover:bg-[#fffaf1]">
                  <span className="font-black">{idea.title}</span>
                  <span className="ml-3 text-sm text-[#6b6578]">{formatStatus(idea.status)}</span>
                </Link>
              ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-[#e7dfd2] bg-white p-4">
          <h2 className="font-black">Recent moderation events</h2>
          <div className="mt-4 space-y-2 text-sm text-[#5f5a6d]">
            {data.moderationEvents.map((event) => (
              <div key={event.id} className="rounded-md bg-[#fff7eb] p-3">
                <span className="font-semibold text-[#171529]">{event.action}</span> on {event.target_type}
                {event.reason ? <span>: {event.reason}</span> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#e7dfd2] bg-white p-4">
      <p className="text-xs font-bold uppercase text-[#8a8297]">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

