'use server';

import {
  type BookmarkRow,
  type CommentRow,
  type Contributor,
  type FollowRow,
  type IdeaRow,
  type ProfileRow,
  type PublicComment,
  type PublicIdea,
  type VoteRow,
} from '@/types/vaultzero';
import { createVaultZeroSupabaseClient } from '@/lib/vaultzero/supabase';
import { canAdmin } from '@/lib/vaultzero/helpers';
import type { User } from '@supabase/supabase-js';

function mapById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function getProfiles(ids: string[]) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const supabase = await createVaultZeroSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return mapById(data ?? []);
}

async function getViewerState(userId: string | null, ideaIds: string[]) {
  if (!userId || ideaIds.length === 0) {
    return {
      votes: new Set<string>(),
      bookmarks: new Set<string>(),
      follows: new Set<string>(),
    };
  }

  const supabase = await createVaultZeroSupabaseClient();
  const [votes, bookmarks, follows] = await Promise.all([
    supabase.from('votes').select('idea_id').eq('user_id', userId).in('idea_id', ideaIds),
    supabase.from('bookmarks').select('idea_id').eq('user_id', userId).in('idea_id', ideaIds),
    supabase.from('follows').select('idea_id').eq('user_id', userId).in('idea_id', ideaIds),
  ]);

  for (const result of [votes, bookmarks, follows]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    votes: new Set(((votes.data ?? []) as Pick<VoteRow, 'idea_id'>[]).map((row) => row.idea_id)),
    bookmarks: new Set(
      ((bookmarks.data ?? []) as Pick<BookmarkRow, 'idea_id'>[]).map((row) => row.idea_id)
    ),
    follows: new Set(((follows.data ?? []) as Pick<FollowRow, 'idea_id'>[]).map((row) => row.idea_id)),
  };
}

export async function getCurrentVaultZeroUser() {
  const supabase = await createVaultZeroSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: ProfileRow | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data ?? null;
  }

  return {
    user: user as User | null,
    profile,
    isAdmin: canAdmin(user as User | null, profile),
  };
}

export async function getDiscoverData() {
  const supabase = await createVaultZeroSupabaseClient();
  const current = await getCurrentVaultZeroUser();

  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('review_state', 'accepted')
    .neq('status', 'archived')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(error.message);
  }

  const ideaRows = (ideas ?? []) as IdeaRow[];
  const profileMap = await getProfiles(ideaRows.map((idea) => idea.author_id));
  const viewerState = await getViewerState(
    current.user?.id ?? null,
    ideaRows.map((idea) => idea.id)
  );

  const publicIdeas: PublicIdea[] = ideaRows.map((idea) => ({
    ...idea,
    author: profileMap.get(idea.author_id) ?? null,
    hasVoted: viewerState.votes.has(idea.id),
    hasBookmarked: viewerState.bookmarks.has(idea.id),
    hasFollowed: viewerState.follows.has(idea.id),
  }));

  const boardCounts = publicIdeas.reduce<Record<string, number>>((counts, idea) => {
    counts[idea.status] = (counts[idea.status] ?? 0) + 1;
    return counts;
  }, {});

  return {
    ...current,
    ideas: publicIdeas,
    featuredIdea: publicIdeas[0] ?? null,
    boardCounts,
    contributors: await getTopContributors(6),
  };
}

export async function getTopContributors(limit = 10): Promise<Contributor[]> {
  const supabase = await createVaultZeroSupabaseClient();
  const { data: snapshots, error } = await supabase
    .from('leaderboard_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = snapshots ?? [];
  const profileMap = await getProfiles(rows.map((row) => row.user_id));

  return rows.flatMap((row) => {
    const profile = profileMap.get(row.user_id);
    if (!profile) {
      return [];
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      score: row.score,
      ideasAccepted: row.ideas_accepted,
      votesReceived: row.votes_received,
      commentsReceived: row.comments_received,
      bookmarksReceived: row.bookmarks_received,
      followersReceived: row.followers_received,
    };
  });
}

export async function getPublicIdeaBySlug(slug: string) {
  const supabase = await createVaultZeroSupabaseClient();
  const current = await getCurrentVaultZeroUser();

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!idea) {
    return null;
  }

  const profileMap = await getProfiles([idea.author_id]);
  const viewerState = await getViewerState(current.user?.id ?? null, [idea.id]);

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('idea_id', idea.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const commentRows = (comments ?? []) as CommentRow[];
  const commentProfiles = await getProfiles(commentRows.map((comment) => comment.author_id));

  const publicIdea: PublicIdea = {
    ...(idea as IdeaRow),
    author: profileMap.get(idea.author_id) ?? null,
    hasVoted: viewerState.votes.has(idea.id),
    hasBookmarked: viewerState.bookmarks.has(idea.id),
    hasFollowed: viewerState.follows.has(idea.id),
  };

  const publicComments: PublicComment[] = commentRows.map((comment) => ({
    ...comment,
    author: commentProfiles.get(comment.author_id) ?? null,
  }));

  const related = await getRelatedIdeas(publicIdea.category, publicIdea.id);

  return {
    ...current,
    idea: publicIdea,
    comments: publicComments,
    related,
  };
}

async function getRelatedIdeas(category: string, excludeId: string) {
  const supabase = await createVaultZeroSupabaseClient();
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('review_state', 'accepted')
    .eq('category', category)
    .neq('id', excludeId)
    .order('score', { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as IdeaRow[];
  const profileMap = await getProfiles(rows.map((idea) => idea.author_id));
  return rows.map((idea) => ({
    ...idea,
    author: profileMap.get(idea.author_id) ?? null,
    hasVoted: false,
    hasBookmarked: false,
    hasFollowed: false,
  }));
}

export async function getPublicProfile(username: string) {
  const supabase = await createVaultZeroSupabaseClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    return null;
  }

  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .eq('author_id', profile.id)
    .eq('review_state', 'accepted')
    .order('score', { ascending: false });

  if (ideasError) {
    throw new Error(ideasError.message);
  }

  const snapshot = (await getTopContributors(100)).find(
    (contributor) => contributor.id === profile.id
  );

  return {
    profile: profile as ProfileRow,
    ideas: ((ideas ?? []) as IdeaRow[]).map((idea) => ({
      ...idea,
      author: profile,
      hasVoted: false,
      hasBookmarked: false,
      hasFollowed: false,
    })),
    contributor: snapshot ?? null,
  };
}

