'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { upsertProfileAction } from '@/data/user/vaultzero';
import type { ProfileRow } from '@/types/vaultzero';

export function ProfileForm({ profile }: { profile: ProfileRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: profile?.username ?? '',
    displayName: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatar_url ?? '',
    websiteUrl: profile?.website_url ?? '',
    xUrl: profile?.x_url ?? '',
    githubUrl: profile?.github_url ?? '',
  });

  const action = useAction(upsertProfileAction, {
    onSuccess: () => {
      setError(null);
      router.refresh();
    },
    onError: ({ error }) => setError(error.serverError ?? 'Could not save profile.'),
  });

  return (
    <form
      className="space-y-4 rounded-lg border border-[#e7dfd2] bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        action.execute(form);
      }}
    >
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-[#171529]">
          Username
          <Input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            placeholder="founder_zero"
            required
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-[#171529]">
          Display name
          <Input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            placeholder="Drew"
          />
        </label>
      </div>
      <label className="space-y-1 text-sm font-medium text-[#171529]">
        Bio
        <Textarea
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          rows={4}
          placeholder="What do you like building?"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="Website URL" />
        <Input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="GitHub URL" />
        <Input value={form.xUrl} onChange={(event) => setForm({ ...form, xUrl: event.target.value })} placeholder="X URL" />
        <Input value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="Avatar URL" />
      </div>
      <Button type="submit" disabled={action.status === 'executing'} className="bg-[#3157ff] text-white hover:bg-[#2648d8]">
        {action.status === 'executing' ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  );
}

