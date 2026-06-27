import Link from 'next/link';
import { AdminCommentActions } from '@/components/vaultzero/admin-comment-actions';
import { Button } from '@/components/ui/button';
import { getAdminCommentsData } from '@/data/user/vaultzero-pages';

export default async function AdminCommentsPage() {
  const { comments } = await getAdminCommentsData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-normal">Comment moderation</h1>
          <Button asChild variant="outline"><Link href="/admin">Admin home</Link></Button>
        </div>
        <section className="mt-6 space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-[#e7dfd2] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">@{comment.author?.username ?? 'unknown'} {comment.is_hidden ? '(hidden)' : ''}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5f5a6d]">{comment.body}</p>
                </div>
                <AdminCommentActions commentId={comment.id} isHidden={comment.is_hidden} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

