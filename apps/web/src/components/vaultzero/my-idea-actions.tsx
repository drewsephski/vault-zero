'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteMyIdeaAction } from '@/data/user/vaultzero';

export function MyIdeaActions({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const action = useAction(deleteMyIdeaAction, {
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={action.status === 'executing'}
      onClick={() => action.execute({ ideaId })}
    >
      <Trash2 className="size-4" />
      Delete
    </Button>
  );
}

