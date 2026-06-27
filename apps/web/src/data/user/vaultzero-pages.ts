'use server';

import { redirect } from 'next/navigation';
import { createVaultZeroSupabaseClient } from '@/lib/vaultzero/supabase';
import { canAdmin } from '@/lib/vaultzero/helpers';
import type {
  AiEnhancementSessionRow,
  CommentRow,
  IdeaRow,
  ModerationEventRow,
  ProfileRow,
  PublicIdea,
  StatusHistoryRow,
} from '@/types/vaultzero';

async function currentContext() {
  const supabase = await createVaultZeroSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    supabase,
    user,
    profile: profile as ProfileRow | null,
    isAdmin: canAdmin(user, profile as ProfileRow | null),
  };
}

async function profilesById(ids: string[]) {
  const supabase = await createVaultZeroSupabaseClient();
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await supabase.from('profiles').select('*').in('id', unique);
  if (error) {
    throw new Error(error.message);
  }
  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

function attachAuthors(ideas: IdeaRow[], profiles: Map<string, ProfileRow>): PublicIdea[] {
  return ideas.map((idea) => ({
    ...idea,
    author: profiles.get(idea.author_id) ?? null,
    hasVoted: false,
    hasBookmarked: false,
    hasFollowed: false,
  }));
}

export async function getMyIdeasPageData() {
  const { supabase, user, profile } = await currentContext();
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user,
    profile,
    ideas: (data ?? []) as IdeaRow[],
  };
}

export async function getSavedIdeasPageData(kind: 'bookmarks' | 'following') {
  const { supabase, user, profile } = await currentContext();
  const table = kind === 'bookmarks' ? 'bookmarks' : 'follows';
  const { data: joins, error } = await supabase
    .from(table)
    .select('idea_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const ideaIds = (joins ?? []).map((row) => row.idea_id);
  if (ideaIds.length === 0) {
    return { user, profile, ideas: [] as PublicIdea[] };
  }

  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .in('id', ideaIds)
    .order('score', { ascending: false });

  if (ideasError) {
    throw new Error(ideasError.message);
  }

  const rows = (ideas ?? []) as IdeaRow[];
  const profileMap = await profilesById(rows.map((idea) => idea.author_id));
  return { user, profile, ideas: attachAuthors(rows, profileMap) };
}

export async function getProfileSettingsData() {
  const { user, profile } = await currentContext();
  return { user, profile };
}

export async function requireAdminPage() {
  const context = await currentContext();
  if (!context.isAdmin) {
    redirect('/');
  }
  return context;
}

export async function getAdminDashboardData() {
  const { supabase, profile } = await requireAdminPage();
  const [ideas, profiles, comments, moderation] = await Promise.all([
    supabase.from('ideas').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('comments').select('*').order('created_at', { ascending: false }),
    supabase
      .from('moderation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  for (const result of [ideas, profiles, comments, moderation]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const ideaRows = (ideas.data ?? []) as IdeaRow[];

  return {
    profile,
    ideas: ideaRows,
    users: (profiles.data ?? []) as ProfileRow[],
    comments: (comments.data ?? []) as CommentRow[],
    moderationEvents: (moderation.data ?? []) as ModerationEventRow[],
    counts: {
      pending: ideaRows.filter((idea) => idea.review_state === 'pending_review').length,
      accepted: ideaRows.filter((idea) => idea.review_state === 'accepted').length,
      needsEdits: ideaRows.filter((idea) => idea.review_state === 'needs_edits').length,
      rejected: ideaRows.filter((idea) => idea.review_state === 'rejected').length,
      totalUsers: profiles.data?.length ?? 0,
      totalComments: comments.data?.length ?? 0,
    },
  };
}

export async function getAdminIdeasData() {
  const { supabase } = await requireAdminPage();
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (ideas ?? []) as IdeaRow[];
  const profileMap = await profilesById(rows.map((idea) => idea.author_id));
  return { ideas: attachAuthors(rows, profileMap) };
}

export async function getAdminIdeaDetailData(id: string) {
  const { supabase } = await requireAdminPage();
  const [ideaResult, commentsResult, historyResult, moderationResult, aiResult] =
    await Promise.all([
      supabase.from('ideas').select('*').eq('id', id).single(),
      supabase.from('comments').select('*').eq('idea_id', id).order('created_at', { ascending: false }),
      supabase
        .from('status_history')
        .select('*')
        .eq('idea_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('moderation_events')
        .select('*')
        .eq('target_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ai_enhancement_sessions')
        .select('*')
        .eq('idea_id', id)
        .order('created_at', { ascending: false }),
    ]);

  for (const result of [
    ideaResult,
    commentsResult,
    historyResult,
    moderationResult,
    aiResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const idea = ideaResult.data as IdeaRow;
  const profileMap = await profilesById([
    idea.author_id,
    ...((commentsResult.data ?? []) as CommentRow[]).map((comment) => comment.author_id),
  ]);

  return {
    idea: {
      ...idea,
      author: profileMap.get(idea.author_id) ?? null,
      hasVoted: false,
      hasBookmarked: false,
      hasFollowed: false,
    },
    comments: ((commentsResult.data ?? []) as CommentRow[]).map((comment) => ({
      ...comment,
      author: profileMap.get(comment.author_id) ?? null,
    })),
    history: (historyResult.data ?? []) as StatusHistoryRow[],
    moderationEvents: (moderationResult.data ?? []) as ModerationEventRow[],
    aiSessions: (aiResult.data ?? []) as AiEnhancementSessionRow[],
  };
}

export async function getAdminCommentsData() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const comments = (data ?? []) as CommentRow[];
  const profileMap = await profilesById(comments.map((comment) => comment.author_id));
  return {
    comments: comments.map((comment) => ({
      ...comment,
      author: profileMap.get(comment.author_id) ?? null,
    })),
  };
}

export async function getAdminUsersData() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return { users: (data ?? []) as ProfileRow[] };
}

