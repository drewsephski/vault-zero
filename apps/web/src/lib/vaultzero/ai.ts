import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import {
  aiFinalOutputSchema,
  aiQuestionsOutputSchema,
  type IdeaPayloadInput,
} from '@/utils/zod-schemas/vaultzero';

const defaultModel = 'openai/gpt-4.1-mini';

function getOpenRouterModel() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('AI Enhance is not configured. Add OPENROUTER_API_KEY to enable it.');
  }

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    appName: 'VaultZero',
  });

  return openrouter(process.env.AI_MODEL || defaultModel);
}

export async function generateIdeaQuestions(input: {
  roughIdea: string;
  categoryGuess?: string;
}) {
  const { output } = await generateText({
    model: getOpenRouterModel(),
    output: Output.object({ schema: aiQuestionsOutputSchema }),
    system:
      'You are a startup-review editor for VaultZero. Ask a short set of high-signal multiple-choice questions that help convert rough startup ideas into a structured submission. Return only schema-valid data.',
    prompt: [
      `Rough idea: ${input.roughIdea}`,
      input.categoryGuess ? `Category guess: ${input.categoryGuess}` : '',
      'Ask 4 or 5 questions. Prefer choices about user, severity, MVP scope, willingness to pay, distribution, monetization, why now, and biggest risk.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  return output.questions;
}

export async function generatePolishedIdea(input: {
  roughIdea: string;
  categoryGuess?: string | null;
  questions: Array<{ question: string; answer: unknown }>;
}): Promise<IdeaPayloadInput> {
  const { output } = await generateText({
    model: getOpenRouterModel(),
    output: Output.object({ schema: aiFinalOutputSchema }),
    system:
      'You are a strict startup idea editor. Produce a practical VaultZero idea submission. Avoid hype, jokes, fake metrics, and vague filler. Keep every field editable and concise.',
    prompt: [
      `Rough idea: ${input.roughIdea}`,
      input.categoryGuess ? `Category guess: ${input.categoryGuess}` : '',
      `Question answers: ${JSON.stringify(input.questions)}`,
      'Return one complete idea. Use 3 to 6 tags, 3 to 5 validation questions, and one of low, medium, or high for effortEstimate.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  return output.idea;
}

