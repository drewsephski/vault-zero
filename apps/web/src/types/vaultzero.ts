import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/lib/database.types';

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ReviewState =
  | 'draft'
  | 'pending_review'
  | 'needs_edits'
  | 'accepted'
  | 'rejected'
  | 'archived';

export type IdeaStatus =
  | 'new'
  | 'trending'
  | 'under_review'
  | 'accepted'
  | 'building'
  | 'shipped'
  | 'archived';

export type EffortEstimate = 'low' | 'medium' | 'high';

export type ProfileRow = {
  id: string;
  email: string | null;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  x_url: string | null;
  github_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type IdeaRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  one_line_summary: string;
  problem: string;
  intended_audience: string;
  existing_alternatives: string | null;
  proposed_solution: string;
  why_now: string | null;
  expected_impact: string | null;
  monetization_potential: string | null;
  go_to_market: string | null;
  mvp_scope: string | null;
  key_risks: string | null;
  validation_questions: Json;
  effort_estimate: EffortEstimate;
  category: string;
  tags: string[];
  supporting_links: Json;
  status: IdeaStatus;
  review_state: ReviewState;
  admin_feedback: string | null;
  rejection_reason: string | null;
  score: number;
  comment_count: number;
  bookmark_count: number;
  follower_count: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type CommentRow = {
  id: string;
  idea_id: string;
  author_id: string;
  body: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type VoteRow = {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
};

export type BookmarkRow = VoteRow;
export type FollowRow = VoteRow;

export type StatusHistoryRow = {
  id: string;
  idea_id: string;
  actor_id: string | null;
  from_review_state: ReviewState | null;
  to_review_state: ReviewState | null;
  from_status: IdeaStatus | null;
  to_status: IdeaStatus | null;
  note: string | null;
  created_at: string;
};

export type ModerationEventRow = {
  id: string;
  target_type: string;
  target_id: string;
  admin_id: string | null;
  action: string;
  reason: string | null;
  metadata: Json;
  created_at: string;
};

export type AiEnhancementSessionRow = {
  id: string;
  user_id: string;
  idea_id: string | null;
  rough_idea: string;
  category_guess: string | null;
  status: 'questions_generated' | 'answers_submitted' | 'completed' | 'failed';
  final_payload: Json | null;
  model: string | null;
  created_at: string;
  updated_at: string;
};

export type AiQuestionRow = {
  id: string;
  session_id: string;
  question: string;
  question_type: string;
  options: Json;
  sort_order: number;
  created_at: string;
};

export type AiAnswerRow = {
  id: string;
  session_id: string;
  question_id: string;
  answer: Json;
  created_at: string;
};

export type RateLimitRow = {
  id: string;
  user_id: string | null;
  ip_hash: string | null;
  action: string;
  window_start: string;
  count: number;
  created_at: string;
  updated_at: string;
};

export type LeaderboardSnapshotRow = {
  id: string;
  snapshot_date: string;
  user_id: string;
  score: number;
  ideas_submitted: number;
  ideas_accepted: number;
  ideas_shipped: number;
  votes_received: number;
  comments_received: number;
  bookmarks_received: number;
  followers_received: number;
  created_at: string;
};

export type VaultZeroDatabase = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      ideas: TableShape<IdeaRow>;
      comments: TableShape<CommentRow>;
      votes: TableShape<VoteRow>;
      bookmarks: TableShape<BookmarkRow>;
      follows: TableShape<FollowRow>;
      status_history: TableShape<StatusHistoryRow>;
      moderation_events: TableShape<ModerationEventRow>;
      ai_enhancement_sessions: TableShape<AiEnhancementSessionRow>;
      ai_questions: TableShape<AiQuestionRow>;
      ai_answers: TableShape<AiAnswerRow>;
      rate_limits: TableShape<RateLimitRow>;
      leaderboard_snapshots: TableShape<LeaderboardSnapshotRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type VaultZeroSupabaseClient = SupabaseClient<VaultZeroDatabase>;

export type PublicIdea = IdeaRow & {
  author: Pick<
    ProfileRow,
    'id' | 'username' | 'display_name' | 'avatar_url' | 'bio'
  > | null;
  hasVoted: boolean;
  hasBookmarked: boolean;
  hasFollowed: boolean;
};

export type PublicComment = CommentRow & {
  author: Pick<ProfileRow, 'id' | 'username' | 'display_name' | 'avatar_url'> | null;
};

export type Contributor = Pick<
  ProfileRow,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'bio'
> & {
  score: number;
  ideasAccepted: number;
  votesReceived: number;
  commentsReceived: number;
  bookmarksReceived: number;
  followersReceived: number;
};

