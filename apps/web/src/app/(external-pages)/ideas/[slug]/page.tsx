import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IdeaActionButtons } from '@/components/vaultzero/idea-action-buttons';
import { CommentForm } from '@/components/vaultzero/comment-form';
import { IdeaCard } from '@/components/vaultzero/idea-card';
import { getPublicIdeaBySlug } from '@/data/anon/vaultzero';
import { displayName, formatStatus, parseJsonStringArray } from '@/lib/vaultzero/helpers';

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fff7eb]" />}>
      <IdeaDetailContent params={params} />
    </Suspense>
  );
}

async function IdeaDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicIdeaBySlug(slug);

  if (!data) {
    notFound();
  }

  const { idea, comments, related, user, profile } = data;
  const supportingLinks = parseJsonStringArray(idea.supporting_links);
  const validationQuestions = parseJsonStringArray(idea.validation_questions);
  const isLoggedIn = Boolean(user);
  const hasProfile = Boolean(profile);

  const sections = [
    ['Problem', idea.problem],
    ['Intended audience', idea.intended_audience],
    ['Existing alternatives', idea.existing_alternatives],
    ['Proposed solution', idea.proposed_solution],
    ['Why now', idea.why_now],
    ['Expected impact', idea.expected_impact],
    ['Monetization potential', idea.monetization_potential],
    ['Go to market', idea.go_to_market],
    ['MVP scope', idea.mvp_scope],
    ['Key risks', idea.key_risks],
  ].filter((section): section is [string, string] => Boolean(section[1]));

  return (
    <main className="min-h-screen bg-[#fff7eb] px-4 py-6 text-[#171529] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#3157ff]">Back to Discover</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-lg border border-[#e7dfd2] bg-white p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-md bg-[#efe8ff] text-[#5f35d4] hover:bg-[#efe8ff]">{formatStatus(idea.status)}</Badge>
              <Badge className="rounded-md bg-[#edf1ff] text-[#3157ff] hover:bg-[#edf1ff]">{idea.category}</Badge>
              <Badge className="rounded-md bg-[#fff4cf] text-[#735400] hover:bg-[#fff4cf]">{idea.effort_estimate} effort</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal md:text-5xl">{idea.title}</h1>
            <p className="mt-4 text-lg leading-8 text-[#5f5a6d]">{idea.one_line_summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[#eee5d7] py-4 text-sm font-semibold text-[#6b6578]">
              <Link href={`/u/${idea.author?.username}`} className="text-[#171529] hover:text-[#3157ff]">
                @{idea.author?.username}
              </Link>
              <span>{idea.score} votes</span>
              <span>{idea.comment_count} comments</span>
              <span>{idea.bookmark_count} saves</span>
              <span>{idea.follower_count} follows</span>
            </div>

            <div className="mt-6">
              <IdeaActionButtons
                ideaId={idea.id}
                isLoggedIn={isLoggedIn}
                hasProfile={hasProfile}
                hasVoted={idea.hasVoted}
                hasBookmarked={idea.hasBookmarked}
                hasFollowed={idea.hasFollowed}
              />
            </div>

            <div className="mt-8 space-y-6">
              {sections.map(([title, body]) => (
                <section key={title}>
                  <h2 className="text-sm font-black uppercase text-[#8a8297]">{title}</h2>
                  <p className="mt-2 whitespace-pre-line text-base leading-7 text-[#282338]">{body}</p>
                </section>
              ))}
            </div>

            {validationQuestions.length > 0 ? (
              <section className="mt-8">
                <h2 className="text-sm font-black uppercase text-[#8a8297]">Validation questions</h2>
                <ul className="mt-3 space-y-2">
                  {validationQuestions.map((question) => (
                    <li key={question} className="rounded-md bg-[#fff7eb] px-3 py-2 text-sm text-[#282338]">{question}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-md border-[#e7dfd2]">{tag}</Badge>
              ))}
            </div>
          </article>

          <aside className="space-y-4">
            <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
              <h2 className="text-sm font-black uppercase text-[#171529]">Contributor</h2>
              <p className="mt-3 text-lg font-black">{displayName(idea.author)}</p>
              <p className="mt-1 text-sm text-[#6b6578]">@{idea.author?.username}</p>
              {idea.author?.bio ? <p className="mt-3 text-sm leading-6 text-[#5f5a6d]">{idea.author.bio}</p> : null}
            </section>

            {supportingLinks.length > 0 ? (
              <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <h2 className="text-sm font-black uppercase text-[#171529]">Supporting links</h2>
                <div className="mt-3 space-y-2">
                  {supportingLinks.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[#3157ff]">
                      <ExternalLink className="size-4" />
                      {link.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-[#3157ff]" />
              <h2 className="text-xl font-black">Comments</h2>
            </div>
            <CommentForm ideaId={idea.id} isLoggedIn={isLoggedIn} hasProfile={hasProfile} />
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <p className="text-sm font-bold">@{comment.author?.username ?? 'unknown'}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#282338]">{comment.body}</p>
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <h2 className="text-xl font-black">Related ideas</h2>
            {related.map((relatedIdea) => (
              <IdeaCard key={relatedIdea.id} idea={relatedIdea} isLoggedIn={isLoggedIn} hasProfile={hasProfile} />
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}
