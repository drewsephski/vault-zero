'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addCommentAction } from '@/data/user/vaultzero';

export function CommentForm({
  ideaId,
  isLoggedIn,
  hasProfile,
}: {
  ideaId: string;
  isLoggedIn: boolean;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const action = useAction(addCommentAction, {
    onSuccess: () => {
      setBody('');
      setError(null);
      router.refresh();
    },
    onError: ({ error }) => setError(error.serverError ?? 'Could not post comment.'),
  });

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-[#e7dfd2] bg-white p-4">
        <p className="text-sm text-[#5f5a6d]">Sign in to comment on this idea.</p>
        <Button asChild className="mt-3">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="rounded-lg border border-[#e7dfd2] bg-white p-4">
        <p className="text-sm text-[#5f5a6d]">Create a public username before commenting.</p>
        <Button asChild className="mt-3">
          <Link href="/settings/profile">Create username</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-[#e7dfd2] bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        action.execute({ ideaId, body });
      }}
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Add a constructive comment"
      />
      <Button type="submit" disabled={body.trim().length === 0 || action.status === 'executing'}>
        {action.status === 'executing' ? 'Posting...' : 'Post comment'}
      </Button>
    </form>
  );
}

