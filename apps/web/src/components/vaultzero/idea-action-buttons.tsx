'use client';

import { useAction } from 'next-safe-action/hooks';
import { Bookmark, MessageCircle, Radio, Sparkles, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  toggleBookmarkAction,
  toggleFollowAction,
  toggleVoteAction,
} from '@/data/user/vaultzero';
import { cn } from '@/lib/utils';

type IdeaActionButtonsProps = {
  ideaId: string;
  slug?: string;
  isLoggedIn: boolean;
  hasProfile: boolean;
  hasVoted: boolean;
  hasBookmarked: boolean;
  hasFollowed: boolean;
  compact?: boolean;
};

export function IdeaActionButtons({
  ideaId,
  slug,
  isLoggedIn,
  hasProfile,
  hasVoted,
  hasBookmarked,
  hasFollowed,
  compact = false,
}: IdeaActionButtonsProps) {
  const vote = useAction(toggleVoteAction);
  const bookmark = useAction(toggleBookmarkAction);
  const follow = useAction(toggleFollowAction);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button asChild size={compact ? 'sm' : 'default'} className="bg-[#ff6b57] text-[#211b2d] hover:bg-[#ff7d6b]">
          <Link href="/login">
            <Sparkles className="size-4" />
            Sign in to act
          </Link>
        </Button>
        {slug ? (
          <Button asChild variant="outline" size={compact ? 'sm' : 'default'}>
            <Link href={`/ideas/${slug}`}>
              <MessageCircle className="size-4" />
              Discuss
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <Button asChild size={compact ? 'sm' : 'default'} variant="outline">
        <Link href="/settings/profile">Create username</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        variant="outline"
        className={cn(hasVoted && 'border-[#3157ff] bg-[#3157ff] text-white hover:bg-[#2648d8] hover:text-white')}
        disabled={vote.status === 'executing'}
        onClick={() => vote.execute({ ideaId })}
      >
        <ThumbsUp className="size-4" />
        {hasVoted ? 'Voted' : 'Vote'}
      </Button>
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        variant="outline"
        className={cn(hasBookmarked && 'border-[#ffd166] bg-[#ffd166] text-[#211b2d]')}
        disabled={bookmark.status === 'executing'}
        onClick={() => bookmark.execute({ ideaId })}
      >
        <Bookmark className="size-4" />
        {compact ? '' : hasBookmarked ? 'Saved' : 'Save'}
      </Button>
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        variant="outline"
        className={cn(hasFollowed && 'border-[#7ee0b7] bg-[#7ee0b7] text-[#12221b]')}
        disabled={follow.status === 'executing'}
        onClick={() => follow.execute({ ideaId })}
      >
        <Radio className="size-4" />
        {compact ? '' : hasFollowed ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
}

