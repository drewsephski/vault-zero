'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Archive, Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  adminReviewIdeaAction,
  adminUpdateIdeaWorkflowAction,
} from '@/data/user/vaultzero';
import { ideaStatuses, reviewStates } from '@/utils/zod-schemas/vaultzero';
import type { IdeaRow, IdeaStatus, ReviewState } from '@/types/vaultzero';
import { formatStatus } from '@/lib/vaultzero/helpers';

export function AdminIdeaActions({ idea }: { idea: IdeaRow }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [reviewState, setReviewState] = useState<ReviewState>(idea.review_state);
  const [error, setError] = useState<string | null>(null);
  const reviewAction = useAction(adminReviewIdeaAction, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => setError(error.serverError ?? 'Moderation failed.'),
  });
  const workflowAction = useAction(adminUpdateIdeaWorkflowAction, {
    onSuccess: () => router.refresh(),
    onError: ({ error }) => setError(error.serverError ?? 'Workflow update failed.'),
  });

  return (
    <div className="space-y-3 rounded-lg border border-[#e7dfd2] bg-white p-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional moderation note or feedback"
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={reviewAction.status === 'executing'}
          onClick={() => reviewAction.execute({ ideaId: idea.id, reviewState: 'accepted', status: 'accepted', note })}
        >
          <Check className="size-4" />
          Accept
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={reviewAction.status === 'executing'}
          onClick={() => reviewAction.execute({ ideaId: idea.id, reviewState: 'needs_edits', note })}
        >
          <RotateCcw className="size-4" />
          Needs edits
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={reviewAction.status === 'executing'}
          onClick={() => reviewAction.execute({ ideaId: idea.id, reviewState: 'rejected', note })}
        >
          <X className="size-4" />
          Reject
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={reviewAction.status === 'executing'}
          onClick={() => reviewAction.execute({ ideaId: idea.id, reviewState: 'archived', status: 'archived', note })}
        >
          <Archive className="size-4" />
          Archive
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={reviewState} onValueChange={(value) => setReviewState(value as ReviewState)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {reviewStates.map((state) => <SelectItem key={state} value={state}>{formatStatus(state)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as IdeaStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ideaStatuses.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={workflowAction.status === 'executing'}
        onClick={() => workflowAction.execute({ ideaId: idea.id, status, reviewState, note })}
      >
        Change workflow status
      </Button>
    </div>
  );
}

