import { Bookmark, MessageCircle, Radio, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import type { PublicIdea } from '@/types/vaultzero';
import { Badge } from '@/components/ui/badge';
import { formatStatus } from '@/lib/vaultzero/helpers';
import { IdeaActionButtons } from './idea-action-buttons';

type IdeaCardProps = {
  idea: PublicIdea;
  isLoggedIn: boolean;
  hasProfile: boolean;
};

export function IdeaCard({ idea, isLoggedIn, hasProfile }: IdeaCardProps) {
  return (
    <article className="rounded-lg border border-[#e7dfd2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-[#3157ff] text-white">
            <TrendingUp className="size-4" />
            <span className="text-sm font-bold leading-none">{idea.score}</span>
          </div>
          <div className="min-w-0">
            <Link
              href={`/ideas/${idea.slug}`}
              className="line-clamp-2 text-lg font-bold leading-snug text-[#171529] hover:text-[#3157ff]"
            >
              {idea.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f5a6d]">
              {idea.one_line_summary}
            </p>
          </div>
        </div>
        <Badge className="shrink-0 rounded-md bg-[#efe8ff] text-[#5f35d4] hover:bg-[#efe8ff]">
          {formatStatus(idea.status)}
        </Badge>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#282338]">
        {idea.problem}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-md border-[#3157ff]/20 bg-[#edf1ff] text-[#3157ff]">
          {idea.category}
        </Badge>
        <Badge variant="outline" className="rounded-md border-[#ffb703]/30 bg-[#fff4cf] text-[#735400]">
          {idea.effort_estimate} effort
        </Badge>
        {idea.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="rounded-md border-[#e7dfd2] text-[#5f5a6d]">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-[#eee5d7] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6b6578]">
          <Link href={`/u/${idea.author?.username}`} className="text-[#171529] hover:text-[#3157ff]">
            @{idea.author?.username ?? 'unknown'}
          </Link>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {idea.comment_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3.5" />
            {idea.bookmark_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Radio className="size-3.5" />
            {idea.follower_count}
          </span>
        </div>
        <IdeaActionButtons
          ideaId={idea.id}
          slug={idea.slug}
          isLoggedIn={isLoggedIn}
          hasProfile={hasProfile}
          hasVoted={idea.hasVoted}
          hasBookmarked={idea.hasBookmarked}
          hasFollowed={idea.hasFollowed}
          compact
        />
      </div>
    </article>
  );
}

