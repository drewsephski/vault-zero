import { z } from 'zod';

export const vaultCategories = [
  'AI apps',
  'SaaS',
  'Devtools',
  'Creator tools',
  'Consumer apps',
  'Marketplaces',
  'Education',
  'Productivity',
  'Finance',
  'Health and wellness',
  'Ecommerce',
  'Community',
] as const;

export const reviewStates = [
  'draft',
  'pending_review',
  'needs_edits',
  'accepted',
  'rejected',
  'archived',
] as const;

export const ideaStatuses = [
  'new',
  'trending',
  'under_review',
  'accepted',
  'building',
  'shipped',
  'archived',
] as const;

export const effortEstimates = ['low', 'medium', 'high'] as const;

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/, 'Use 3-32 lowercase letters, numbers, or underscores'),
  displayName: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(400).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  websiteUrl: z.string().url().or(z.literal('')).optional(),
  xUrl: z.string().url().or(z.literal('')).optional(),
  githubUrl: z.string().url().or(z.literal('')).optional(),
});

const optionalText = z.string().trim().max(2400).optional();

export const ideaPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(4).max(140),
  oneLineSummary: z.string().trim().min(10).max(220),
  problem: z.string().trim().min(20).max(2400),
  intendedAudience: z.string().trim().min(5).max(800),
  existingAlternatives: optionalText,
  proposedSolution: z.string().trim().min(20).max(2400),
  whyNow: optionalText,
  expectedImpact: optionalText,
  monetizationPotential: optionalText,
  goToMarket: optionalText,
  mvpScope: optionalText,
  keyRisks: optionalText,
  validationQuestions: z.array(z.string().trim().min(4).max(220)).max(8).default([]),
  effortEstimate: z.enum(effortEstimates),
  category: z.enum(vaultCategories),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  supportingLinks: z.array(z.string().url()).max(5).default([]),
});

export const submitIdeaSchema = ideaPayloadSchema.extend({
  submitState: z.enum(['draft', 'pending_review']).default('pending_review'),
});

export const ideaIdSchema = z.object({
  ideaId: z.string().uuid(),
});

export const commentSchema = ideaIdSchema.extend({
  body: z.string().trim().min(1).max(2000),
});

export const adminIdeaDecisionSchema = z.object({
  ideaId: z.string().uuid(),
  reviewState: z.enum(['accepted', 'rejected', 'needs_edits', 'archived']),
  status: z.enum(ideaStatuses).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const adminIdeaUpdateSchema = z.object({
  ideaId: z.string().uuid(),
  status: z.enum(ideaStatuses),
  reviewState: z.enum(reviewStates),
  note: z.string().trim().max(2000).optional(),
});

export const moderateCommentSchema = z.object({
  commentId: z.string().uuid(),
  action: z.enum(['hide', 'restore', 'delete']),
  reason: z.string().trim().max(1000).optional(),
});

export const aiQuestionSchema = z.object({
  question: z.string().min(8).max(220),
  questionType: z.enum(['single_choice', 'multi_choice', 'short_text']).default('single_choice'),
  options: z.array(z.string().min(1).max(120)).min(2).max(6),
});

export const aiQuestionsOutputSchema = z.object({
  questions: z.array(aiQuestionSchema).min(3).max(6),
});

export const aiStartSchema = z.object({
  roughIdea: z.string().trim().min(20).max(5000),
  categoryGuess: z.enum(vaultCategories).optional(),
  supportingLinks: z.array(z.string().url()).max(5).default([]),
});

export const aiAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.union([z.string(), z.array(z.string())]),
});

export const aiFinalizeSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.array(aiAnswerSchema).min(1),
});

export const aiFinalOutputSchema = z.object({
  idea: ideaPayloadSchema.omit({ id: true }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type IdeaPayloadInput = z.infer<typeof ideaPayloadSchema>;
export type SubmitIdeaInput = z.infer<typeof submitIdeaSchema>;

