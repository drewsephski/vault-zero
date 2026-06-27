'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moderateCommentAction } from '@/data/user/vaultzero';

export function AdminCommentActions({
  commentId,
  isHidden,
}: {
  commentId: string;
  isHidden: boolean;
}) {
  const router = useRouter();
  const action = useAction(moderateCommentAction, {
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={action.status === 'executing'}
        onClick={() => action.execute({ commentId, action: isHidden ? 'restore' : 'hide' })}
      >
        {isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        {isHidden ? 'Restore' : 'Hide'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={action.status === 'executing'}
        onClick={() => action.execute({ commentId, action: 'delete' })}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </div>
  );
}

