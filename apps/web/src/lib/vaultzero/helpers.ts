import type { IdeaRow, ProfileRow } from '@/types/vaultzero';
import type { User } from '@supabase/supabase-js';

export function slugifyIdeaTitle(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return base || `idea-${crypto.randomUUID().slice(0, 8)}`;
}

export function uniqueSlug(title: string) {
  return `${slugifyIdeaTitle(title)}-${crypto.randomUUID().slice(0, 6)}`;
}

export function parseJsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function isAdminEmail(user: User | null) {
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!user?.email || allowlist.length === 0) {
    return false;
  }

  return allowlist.includes(user.email.toLowerCase());
}

export function canAdmin(user: User | null, profile: ProfileRow | null) {
  return isAdminEmail(user) || profile?.role === 'admin';
}

export function canEditIdea(idea: IdeaRow, userId: string | null, isAdmin: boolean) {
  return (
    isAdmin ||
    (idea.author_id === userId &&
      ['draft', 'pending_review', 'needs_edits'].includes(idea.review_state))
  );
}

export function displayName(profile: Pick<ProfileRow, 'username' | 'display_name'> | null) {
  return profile?.display_name?.trim() || profile?.username || 'VaultZero user';
}

export function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

