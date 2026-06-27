'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { createVaultZeroSupabaseClient } from '@/lib/vaultzero/supabase';
import { enforceRateLimit } from '@/lib/vaultzero/rate-limit';
import { canAdmin, uniqueSlug } from '@/lib/vaultzero/helpers';
import { generateIdeaQuestions, generatePolishedIdea } from '@/lib/vaultzero/ai';
import {
  adminIdeaDecisionSchema,
  adminIdeaUpdateSchema,
  aiFinalizeSchema,
  aiStartSchema,
  commentSchema,
  ideaIdSchema,
  ideaPayloadSchema,
  moderateCommentSchema,
  profileSchema,
  submitIdeaSchema,
  type IdeaPayloadInput,
} from '@/utils/zod-schemas/vaultzero';
import type {
  AiQuestionRow,
  IdeaRow,
  ProfileRow,
  ReviewState,
} from '@/types/vaultzero';

async function getVerifiedUserAndProfile(userId: string) {
  const supabase = await createVaultZeroSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== userId) {
    throw new Error('User not logged in');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { supabase, user, profile: profile as ProfileRow | null };
}

async function requireProfile(userId: string) {
  const context = await getVerifiedUserAndProfile(userId);
  if (!context.profile) {
    throw new Error('Choose a public username before interacting with ideas.');
  }

  return { ...context, profile: context.profile };
}

async function requireAdmin(userId: string) {
  const context = await requireProfile(userId);
  if (!canAdmin(context.user, context.profile)) {
    throw new Error('Admin access required.');
  }

  return context;
}

function toIdeaInsert(input: IdeaPayloadInput, userId: string, reviewState: ReviewState) {
  return {
    author_id: userId,
    title: input.title,
    slug: uniqueSlug(input.title),
    one_line_summary: input.oneLineSummary,
    problem: input.problem,
    intended_audience: input.intendedAudience,
    existing_alternatives: input.existingAlternatives || null,
    proposed_solution: input.proposedSolution,
    why_now: input.whyNow || null,
    expected_impact: input.expectedImpact || null,
    monetization_potential: input.monetizationPotential || null,
    go_to_market: input.goToMarket || null,
    mvp_scope: input.mvpScope || null,
    key_risks: input.keyRisks || null,
    validation_questions: input.validationQuestions,
    effort_estimate: input.effortEstimate,
    category: input.category,
    tags: input.tags,
    supporting_links: input.supportingLinks,
    review_state: reviewState,
    status: 'under_review' as const,
    submitted_at: reviewState === 'pending_review' ? new Date().toISOString() : null,
  };
}

function toIdeaUpdate(input: IdeaPayloadInput) {
  return {
    title: input.title,
    one_line_summary: input.oneLineSummary,
    problem: input.problem,
    intended_audience: input.intendedAudience,
    existing_alternatives: input.existingAlternatives || null,
    proposed_solution: input.proposedSolution,
    why_now: input.whyNow || null,
    expected_impact: input.expectedImpact || null,
    monetization_potential: input.monetizationPotential || null,
    go_to_market: input.goToMarket || null,
    mvp_scope: input.mvpScope || null,
    key_risks: input.keyRisks || null,
    validation_questions: input.validationQuestions,
    effort_estimate: input.effortEstimate,
    category: input.category,
    tags: input.tags,
    supporting_links: input.supportingLinks,
    review_state: 'pending_review' as const,
    status: 'under_review' as const,
    submitted_at: new Date().toISOString(),
  };
}

export const upsertProfileAction = authActionClient
  .schema(profileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, user, profile } = await getVerifiedUserAndProfile(ctx.userId);
    const payload = {
      id: ctx.userId,
      email: user.email ?? null,
      username: parsedInput.username,
      display_name: parsedInput.displayName || null,
      bio: parsedInput.bio || null,
      avatar_url: parsedInput.avatarUrl || null,
      website_url: parsedInput.websiteUrl || null,
      x_url: parsedInput.xUrl || null,
      github_url: parsedInput.githubUrl || null,
    };

    const query = profile
      ? supabase.from('profiles').update(payload).eq('id', ctx.userId)
      : supabase.from('profiles').insert(payload);

    const { error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    revalidatePath('/settings/profile');
    return { success: true };
  });

export const submitIdeaAction = authActionClient
  .schema(submitIdeaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    await enforceRateLimit({
      userId: ctx.userId,
      action: 'idea_submission',
      limit: 5,
      window: 'day',
    });

    const { data, error } = await supabase
      .from('ideas')
      .insert(toIdeaInsert(parsedInput, ctx.userId, parsedInput.submitState))
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    revalidatePath('/my-ideas');
    return { idea: data as IdeaRow };
  });

export const updateMyIdeaAction = authActionClient
  .schema(ideaPayloadSchema.extend({ ideaId: ideaIdSchema.shape.ideaId }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    const { error } = await supabase
      .from('ideas')
      .update(toIdeaUpdate(parsedInput))
      .eq('id', parsedInput.ideaId)
      .eq('author_id', ctx.userId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/my-ideas');
    return { success: true };
  });

export const deleteMyIdeaAction = authActionClient
  .schema(ideaIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', parsedInput.ideaId)
      .eq('author_id', ctx.userId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/my-ideas');
    return { success: true };
  });

async function toggleIdeaJoinTable(
  table: 'votes' | 'bookmarks' | 'follows',
  userId: string,
  ideaId: string
) {
  const { supabase } = await requireProfile(userId);
  const rateLimitAction =
    table === 'votes' ? 'vote' : table === 'bookmarks' ? 'bookmark' : 'follow';

  await enforceRateLimit({
    userId,
    action: rateLimitAction,
    limit: 240,
    window: 'hour',
  });

  const { data: existing, error: readError } = await supabase
    .from(table)
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (existing) {
    const { error } = await supabase.from(table).delete().eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return { active: false };
  }

  const { error } = await supabase.from(table).insert({
    idea_id: ideaId,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { active: true };
}

export const toggleVoteAction = authActionClient
  .schema(ideaIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await toggleIdeaJoinTable('votes', ctx.userId, parsedInput.ideaId);
    revalidatePath('/');
    revalidatePath('/ideas');
    return result;
  });

export const toggleBookmarkAction = authActionClient
  .schema(ideaIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await toggleIdeaJoinTable('bookmarks', ctx.userId, parsedInput.ideaId);
    revalidatePath('/');
    revalidatePath('/bookmarks');
    return result;
  });

export const toggleFollowAction = authActionClient
  .schema(ideaIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await toggleIdeaJoinTable('follows', ctx.userId, parsedInput.ideaId);
    revalidatePath('/');
    revalidatePath('/following');
    return result;
  });

export const addCommentAction = authActionClient
  .schema(commentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    await enforceRateLimit({
      userId: ctx.userId,
      action: 'comment',
      limit: 30,
      window: 'hour',
    });

    const { error } = await supabase.from('comments').insert({
      idea_id: parsedInput.ideaId,
      author_id: ctx.userId,
      body: parsedInput.body,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    return { success: true };
  });

export const startAiEnhancementAction = authActionClient
  .schema(aiStartSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    await enforceRateLimit({
      userId: ctx.userId,
      action: 'ai_enhance',
      limit: 10,
      window: 'day',
    });

    const questions = await generateIdeaQuestions(parsedInput);
    const { data: session, error: sessionError } = await supabase
      .from('ai_enhancement_sessions')
      .insert({
        user_id: ctx.userId,
        rough_idea: parsedInput.roughIdea,
        category_guess: parsedInput.categoryGuess ?? null,
        model: process.env.AI_MODEL || 'openai/gpt-4.1-mini',
      })
      .select('*')
      .single();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    const questionPayloads = questions.map((question, index) => ({
      session_id: session.id,
      question: question.question,
      question_type: question.questionType,
      options: question.options,
      sort_order: index,
    }));

    const { data: savedQuestions, error: questionsError } = await supabase
      .from('ai_questions')
      .insert(questionPayloads)
      .select('*')
      .order('sort_order', { ascending: true });

    if (questionsError) {
      throw new Error(questionsError.message);
    }

    return {
      session,
      questions: (savedQuestions ?? []) as AiQuestionRow[],
    };
  });

export const finalizeAiEnhancementAction = authActionClient
  .schema(aiFinalizeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireProfile(ctx.userId);
    const { data: session, error: sessionError } = await supabase
      .from('ai_enhancement_sessions')
      .select('*')
      .eq('id', parsedInput.sessionId)
      .eq('user_id', ctx.userId)
      .single();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    const { data: questions, error: questionsError } = await supabase
      .from('ai_questions')
      .select('*')
      .eq('session_id', parsedInput.sessionId)
      .order('sort_order', { ascending: true });

    if (questionsError) {
      throw new Error(questionsError.message);
    }

    const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
    const answerPayloads = parsedInput.answers.map((answer) => ({
      session_id: parsedInput.sessionId,
      question_id: answer.questionId,
      answer: answer.answer,
    }));

    const { error: answerError } = await supabase
      .from('ai_answers')
      .insert(answerPayloads);

    if (answerError) {
      throw new Error(answerError.message);
    }

    const finalIdea = await generatePolishedIdea({
      roughIdea: session.rough_idea,
      categoryGuess: session.category_guess,
      questions: parsedInput.answers.map((answer) => ({
        question: questionMap.get(answer.questionId)?.question ?? 'Unknown question',
        answer: answer.answer,
      })),
    });

    const { error: updateError } = await supabase
      .from('ai_enhancement_sessions')
      .update({
        status: 'completed',
        final_payload: finalIdea,
      })
      .eq('id', parsedInput.sessionId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { idea: finalIdea };
  });

export const adminReviewIdeaAction = authActionClient
  .schema(adminIdeaDecisionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireAdmin(ctx.userId);
    const { data: current, error: currentError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', parsedInput.ideaId)
      .single();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const nextStatus =
      parsedInput.status ??
      (parsedInput.reviewState === 'accepted'
        ? 'accepted'
        : parsedInput.reviewState === 'archived'
          ? 'archived'
          : 'under_review');

    const { error: updateError } = await supabase
      .from('ideas')
      .update({
        review_state: parsedInput.reviewState,
        status: nextStatus,
        admin_feedback:
          parsedInput.reviewState === 'needs_edits' ? parsedInput.note || null : current.admin_feedback,
        rejection_reason:
          parsedInput.reviewState === 'rejected' ? parsedInput.note || null : current.rejection_reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: ctx.userId,
      })
      .eq('id', parsedInput.ideaId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase.from('status_history').insert({
      idea_id: parsedInput.ideaId,
      actor_id: ctx.userId,
      from_review_state: current.review_state,
      to_review_state: parsedInput.reviewState,
      from_status: current.status,
      to_status: nextStatus,
      note: parsedInput.note || null,
    });

    await supabase.from('moderation_events').insert({
      target_type: 'idea',
      target_id: parsedInput.ideaId,
      admin_id: ctx.userId,
      action: parsedInput.reviewState,
      reason: parsedInput.note || null,
      metadata: { fromReviewState: current.review_state, fromStatus: current.status },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/ideas');
    return { success: true };
  });

export const adminUpdateIdeaWorkflowAction = authActionClient
  .schema(adminIdeaUpdateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireAdmin(ctx.userId);
    const { data: current, error: currentError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', parsedInput.ideaId)
      .single();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const { error } = await supabase
      .from('ideas')
      .update({
        status: parsedInput.status,
        review_state: parsedInput.reviewState,
        reviewed_at: new Date().toISOString(),
        reviewed_by: ctx.userId,
      })
      .eq('id', parsedInput.ideaId);

    if (error) {
      throw new Error(error.message);
    }

    await supabase.from('status_history').insert({
      idea_id: parsedInput.ideaId,
      actor_id: ctx.userId,
      from_review_state: current.review_state,
      to_review_state: parsedInput.reviewState,
      from_status: current.status,
      to_status: parsedInput.status,
      note: parsedInput.note || null,
    });

    await supabase.from('moderation_events').insert({
      target_type: 'idea',
      target_id: parsedInput.ideaId,
      admin_id: ctx.userId,
      action: 'workflow_update',
      reason: parsedInput.note || null,
      metadata: { status: parsedInput.status, reviewState: parsedInput.reviewState },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  });

export const moderateCommentAction = authActionClient
  .schema(moderateCommentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = await requireAdmin(ctx.userId);

    if (parsedInput.action === 'delete') {
      const { error } = await supabase.from('comments').delete().eq('id', parsedInput.commentId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase
        .from('comments')
        .update({
          is_hidden: parsedInput.action === 'hide',
          hidden_reason: parsedInput.action === 'hide' ? parsedInput.reason || null : null,
        })
        .eq('id', parsedInput.commentId);
      if (error) {
        throw new Error(error.message);
      }
    }

    await supabase.from('moderation_events').insert({
      target_type: 'comment',
      target_id: parsedInput.commentId,
      admin_id: ctx.userId,
      action: parsedInput.action,
      reason: parsedInput.reason || null,
      metadata: {},
    });

    revalidatePath('/admin/comments');
    return { success: true };
  });

