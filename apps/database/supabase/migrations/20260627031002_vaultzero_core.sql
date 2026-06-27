-- VaultZero core product schema.
-- Public browsing is backed by RLS; mutations require Supabase Auth.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      NEW.updated_at = timezone('utc', now());
      RETURN NEW;
    END;
    $function$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  x_url text,
  github_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,32}$')
);

CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 4 AND 140),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  one_line_summary text NOT NULL CHECK (char_length(one_line_summary) BETWEEN 10 AND 220),
  problem text NOT NULL,
  intended_audience text NOT NULL,
  existing_alternatives text,
  proposed_solution text NOT NULL,
  why_now text,
  expected_impact text,
  monetization_potential text,
  go_to_market text,
  mvp_scope text,
  key_risks text,
  validation_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  effort_estimate text NOT NULL CHECK (effort_estimate IN ('low', 'medium', 'high')),
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  supporting_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'under_review' CHECK (status IN ('new', 'trending', 'under_review', 'accepted', 'building', 'shipped', 'archived')),
  review_state text NOT NULL DEFAULT 'pending_review' CHECK (review_state IN ('draft', 'pending_review', 'needs_edits', 'accepted', 'rejected', 'archived')),
  admin_feedback text,
  rejection_reason text,
  score integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  bookmark_count integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT votes_idea_id_user_id_key UNIQUE (idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  is_hidden boolean NOT NULL DEFAULT false,
  hidden_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT bookmarks_idea_id_user_id_key UNIQUE (idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT follows_idea_id_user_id_key UNIQUE (idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.status_history (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_review_state text,
  to_review_state text,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.moderation_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_enhancement_sessions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  rough_idea text NOT NULL,
  category_guess text,
  status text NOT NULL DEFAULT 'questions_generated' CHECK (status IN ('questions_generated', 'answers_submitted', 'completed', 'failed')),
  final_payload jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_questions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.ai_enhancement_sessions(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'single_choice',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_answers (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.ai_enhancement_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.ai_questions(id) ON DELETE CASCADE,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT ai_answers_session_id_question_id_key UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  ip_hash text,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT rate_limits_user_action_window_key UNIQUE (user_id, ip_hash, action, window_start)
);

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  snapshot_date date NOT NULL DEFAULT current_date,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  ideas_submitted integer NOT NULL DEFAULT 0,
  ideas_accepted integer NOT NULL DEFAULT 0,
  ideas_shipped integer NOT NULL DEFAULT 0,
  votes_received integer NOT NULL DEFAULT 0,
  comments_received integer NOT NULL DEFAULT 0,
  bookmarks_received integer NOT NULL DEFAULT 0,
  followers_received integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT leaderboard_snapshots_snapshot_date_user_id_key UNIQUE (snapshot_date, user_id)
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS ideas_public_feed_idx ON public.ideas (review_state, status, score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_author_review_state_idx ON public.ideas (author_id, review_state, created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_category_idx ON public.ideas (category);
CREATE INDEX IF NOT EXISTS ideas_tags_idx ON public.ideas USING gin (tags);
CREATE INDEX IF NOT EXISTS votes_idea_id_idx ON public.votes (idea_id);
CREATE INDEX IF NOT EXISTS comments_idea_id_created_at_idx ON public.comments (idea_id, created_at DESC) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_user_id_idx ON public.follows (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS status_history_idea_id_idx ON public.status_history (idea_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_events_target_idx ON public.moderation_events (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_sessions_user_id_idx ON public.ai_enhancement_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON public.leaderboard_snapshots (snapshot_date DESC, score DESC);

CREATE OR REPLACE FUNCTION public.vaultzero_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.vaultzero_is_accepted_idea(target_idea_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.ideas
    WHERE id = target_idea_id
      AND review_state = 'accepted'
      AND status <> 'archived'
  );
$function$;

REVOKE ALL ON FUNCTION public.vaultzero_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vaultzero_is_accepted_idea(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vaultzero_is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vaultzero_is_accepted_idea(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.recalculate_idea_counts(target_idea_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.ideas
  SET
    score = (SELECT COUNT(*)::integer FROM public.votes WHERE idea_id = target_idea_id),
    comment_count = (SELECT COUNT(*)::integer FROM public.comments WHERE idea_id = target_idea_id AND is_hidden = false),
    bookmark_count = (SELECT COUNT(*)::integer FROM public.bookmarks WHERE idea_id = target_idea_id),
    follower_count = (SELECT COUNT(*)::integer FROM public.follows WHERE idea_id = target_idea_id),
    updated_at = timezone('utc', now())
  WHERE id = target_idea_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_leaderboard_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.leaderboard_snapshots (
    snapshot_date,
    user_id,
    score,
    ideas_submitted,
    ideas_accepted,
    ideas_shipped,
    votes_received,
    comments_received,
    bookmarks_received,
    followers_received
  )
  SELECT
    current_date,
    p.id,
    (
      COALESCE(SUM(i.score), 0)
      + COUNT(i.id) FILTER (WHERE i.review_state = 'accepted') * 10
      + COUNT(i.id) FILTER (WHERE i.status = 'shipped') * 25
      + COALESCE(SUM(i.comment_count), 0) * 2
      + COALESCE(SUM(i.bookmark_count), 0) * 3
      + COALESCE(SUM(i.follower_count), 0) * 4
    )::integer,
    COUNT(i.id)::integer,
    COUNT(i.id) FILTER (WHERE i.review_state = 'accepted')::integer,
    COUNT(i.id) FILTER (WHERE i.status = 'shipped')::integer,
    COALESCE(SUM(i.score), 0)::integer,
    COALESCE(SUM(i.comment_count), 0)::integer,
    COALESCE(SUM(i.bookmark_count), 0)::integer,
    COALESCE(SUM(i.follower_count), 0)::integer
  FROM public.profiles p
  LEFT JOIN public.ideas i ON i.author_id = p.id
  WHERE p.id = target_user_id
  GROUP BY p.id
  ON CONFLICT (snapshot_date, user_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    ideas_submitted = EXCLUDED.ideas_submitted,
    ideas_accepted = EXCLUDED.ideas_accepted,
    ideas_shipped = EXCLUDED.ideas_shipped,
    votes_received = EXCLUDED.votes_received,
    comments_received = EXCLUDED.comments_received,
    bookmarks_received = EXCLUDED.bookmarks_received,
    followers_received = EXCLUDED.followers_received,
    created_at = timezone('utc', now());
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_idea_and_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_idea uuid;
  target_author uuid;
BEGIN
  target_idea := COALESCE(NEW.idea_id, OLD.idea_id);

  PERFORM public.recalculate_idea_counts(target_idea);

  SELECT author_id INTO target_author
  FROM public.ideas
  WHERE id = target_idea;

  IF target_author IS NOT NULL THEN
    PERFORM public.recalculate_leaderboard_for_user(target_author);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_new_idea_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.recalculate_leaderboard_for_user(COALESCE(NEW.author_id, OLD.author_id));
  RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE ALL ON FUNCTION public.recalculate_idea_counts(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_leaderboard_for_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_idea_and_author() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_new_idea_author() FROM PUBLIC;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_ideas
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_ai_sessions
  BEFORE UPDATE ON public.ai_enhancement_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_rate_limits
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER recalculate_idea_counts_after_votes
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_idea_and_author();

CREATE TRIGGER recalculate_idea_counts_after_comments
  AFTER INSERT OR UPDATE OF is_hidden OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_idea_and_author();

CREATE TRIGGER recalculate_idea_counts_after_bookmarks
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_idea_and_author();

CREATE TRIGGER recalculate_idea_counts_after_follows
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_idea_and_author();

CREATE TRIGGER recalculate_leaderboard_after_ideas
  AFTER INSERT OR UPDATE OF review_state, status OR DELETE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_new_idea_author();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_enhancement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_public_select_policy ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY profiles_insert_own_policy ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id AND role = 'user');

CREATE POLICY profiles_update_own_policy ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.vaultzero_is_admin())
  WITH CHECK ((SELECT auth.uid()) = id OR public.vaultzero_is_admin());

CREATE POLICY ideas_public_select_policy ON public.ideas
  FOR SELECT
  USING (
    review_state = 'accepted'
    OR author_id = (SELECT auth.uid())
    OR public.vaultzero_is_admin()
  );

CREATE POLICY ideas_insert_own_policy ON public.ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND review_state IN ('draft', 'pending_review')
    AND status = 'under_review'
  );

CREATE POLICY ideas_update_own_unpublished_policy ON public.ideas
  FOR UPDATE
  TO authenticated
  USING (
    (author_id = (SELECT auth.uid()) AND review_state IN ('draft', 'pending_review', 'needs_edits'))
    OR public.vaultzero_is_admin()
  )
  WITH CHECK (
    (author_id = (SELECT auth.uid()) AND review_state IN ('draft', 'pending_review', 'needs_edits') AND status = 'under_review')
    OR public.vaultzero_is_admin()
  );

CREATE POLICY ideas_delete_own_unpublished_policy ON public.ideas
  FOR DELETE
  TO authenticated
  USING (
    (author_id = (SELECT auth.uid()) AND review_state IN ('draft', 'pending_review', 'needs_edits', 'rejected'))
    OR public.vaultzero_is_admin()
  );

CREATE POLICY votes_select_policy ON public.votes
  FOR SELECT
  USING (public.vaultzero_is_accepted_idea(idea_id) OR user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY votes_insert_own_policy ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.vaultzero_is_accepted_idea(idea_id));

CREATE POLICY votes_delete_own_policy ON public.votes
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY comments_public_select_policy ON public.comments
  FOR SELECT
  USING ((is_hidden = false AND public.vaultzero_is_accepted_idea(idea_id)) OR author_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY comments_insert_own_policy ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND public.vaultzero_is_accepted_idea(idea_id));

CREATE POLICY comments_update_own_or_admin_policy ON public.comments
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()) OR public.vaultzero_is_admin())
  WITH CHECK (author_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY comments_delete_own_or_admin_policy ON public.comments
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY bookmarks_select_policy ON public.bookmarks
  FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY bookmarks_insert_own_policy ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.vaultzero_is_accepted_idea(idea_id));

CREATE POLICY bookmarks_delete_own_policy ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY follows_select_policy ON public.follows
  FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY follows_insert_own_policy ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.vaultzero_is_accepted_idea(idea_id));

CREATE POLICY follows_delete_own_policy ON public.follows
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY status_history_select_policy ON public.status_history
  FOR SELECT
  USING (
    public.vaultzero_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = status_history.idea_id
        AND ideas.author_id = (SELECT auth.uid())
    )
  );

CREATE POLICY status_history_insert_admin_policy ON public.status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.vaultzero_is_admin());

CREATE POLICY moderation_events_select_admin_policy ON public.moderation_events
  FOR SELECT
  TO authenticated
  USING (public.vaultzero_is_admin());

CREATE POLICY moderation_events_insert_admin_policy ON public.moderation_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.vaultzero_is_admin());

CREATE POLICY ai_sessions_select_own_or_admin_policy ON public.ai_enhancement_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY ai_sessions_insert_own_policy ON public.ai_enhancement_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY ai_sessions_update_own_policy ON public.ai_enhancement_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY ai_questions_select_own_or_admin_policy ON public.ai_questions
  FOR SELECT
  TO authenticated
  USING (
    public.vaultzero_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ai_enhancement_sessions
      WHERE ai_enhancement_sessions.id = ai_questions.session_id
        AND ai_enhancement_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY ai_questions_insert_own_policy ON public.ai_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_enhancement_sessions
      WHERE ai_enhancement_sessions.id = ai_questions.session_id
        AND ai_enhancement_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY ai_answers_select_own_or_admin_policy ON public.ai_answers
  FOR SELECT
  TO authenticated
  USING (
    public.vaultzero_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ai_enhancement_sessions
      WHERE ai_enhancement_sessions.id = ai_answers.session_id
        AND ai_enhancement_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY ai_answers_insert_own_policy ON public.ai_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_enhancement_sessions
      WHERE ai_enhancement_sessions.id = ai_answers.session_id
        AND ai_enhancement_sessions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY rate_limits_select_own_policy ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.vaultzero_is_admin());

CREATE POLICY rate_limits_insert_own_policy ON public.rate_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY rate_limits_update_own_policy ON public.rate_limits
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY leaderboard_public_select_policy ON public.leaderboard_snapshots
  FOR SELECT
  USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.ideas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT SELECT ON public.votes TO anon, authenticated;
GRANT INSERT, DELETE ON public.votes TO authenticated;
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.bookmarks TO authenticated;
GRANT INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT ON public.follows TO authenticated;
GRANT INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT ON public.status_history TO authenticated;
GRANT SELECT, INSERT ON public.moderation_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_enhancement_sessions TO authenticated;
GRANT SELECT, INSERT ON public.ai_questions TO authenticated;
GRANT SELECT, INSERT ON public.ai_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
GRANT SELECT ON public.leaderboard_snapshots TO anon, authenticated;
