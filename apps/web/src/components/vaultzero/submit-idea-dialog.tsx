'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { WandSparkles, Send, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  finalizeAiEnhancementAction,
  startAiEnhancementAction,
  submitIdeaAction,
} from '@/data/user/vaultzero';
import {
  effortEstimates,
  vaultCategories,
  type IdeaPayloadInput,
} from '@/utils/zod-schemas/vaultzero';
import type { AiQuestionRow, ProfileRow } from '@/types/vaultzero';

type Mode = 'rough' | 'questions' | 'review';

const blankIdea: IdeaPayloadInput = {
  title: '',
  oneLineSummary: '',
  problem: '',
  intendedAudience: '',
  existingAlternatives: '',
  proposedSolution: '',
  whyNow: '',
  expectedImpact: '',
  monetizationPotential: '',
  goToMarket: '',
  mvpScope: '',
  keyRisks: '',
  validationQuestions: [],
  effortEstimate: 'medium',
  category: 'SaaS',
  tags: [],
  supportingLinks: [],
};

function csv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function textareaList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SubmitIdeaDialog({
  isLoggedIn,
  profile,
}: {
  isLoggedIn: boolean;
  profile: ProfileRow | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('rough');
  const [roughIdea, setRoughIdea] = useState('');
  const [categoryGuess, setCategoryGuess] = useState<IdeaPayloadInput['category']>('SaaS');
  const [supportingLinksText, setSupportingLinksText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AiQuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idea, setIdea] = useState<IdeaPayloadInput>(blankIdea);
  const [error, setError] = useState<string | null>(null);

  const canInteract = isLoggedIn && profile;

  const startAi = useAction(startAiEnhancementAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        return;
      }
      setError(null);
      setSessionId(data.session.id);
      setQuestions(data.questions);
      setMode('questions');
    },
    onError: ({ error }) => setError(error.serverError ?? 'AI Enhance failed.'),
  });

  const finalizeAi = useAction(finalizeAiEnhancementAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        return;
      }
      setError(null);
      setIdea(data.idea);
      setMode('review');
    },
    onError: ({ error }) => setError(error.serverError ?? 'Could not polish this idea.'),
  });

  const submit = useAction(submitIdeaAction, {
    onSuccess: ({ data }) => {
      setError(null);
      setOpen(false);
      setMode('rough');
      router.refresh();
      if (data?.idea.id) {
        router.push('/my-ideas');
      }
    },
    onError: ({ error }) => setError(error.serverError ?? 'Could not submit idea.'),
  });

  const readyAnswers = useMemo(
    () =>
      questions
        .filter((question) => answers[question.id])
        .map((question) => ({ questionId: question.id, answer: answers[question.id] })),
    [answers, questions]
  );

  function skipAi() {
    setIdea({
      ...blankIdea,
      category: categoryGuess,
      supportingLinks: csv(supportingLinksText),
      problem: roughIdea,
      proposedSolution: roughIdea,
    });
    setMode('review');
  }

  function submitFinal() {
    submit.execute({
      ...idea,
      tags: idea.tags,
      supportingLinks: idea.supportingLinks,
      validationQuestions: idea.validationQuestions,
      submitState: 'pending_review',
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#ff6b57] text-[#211b2d] hover:bg-[#ff7b68]">
          <Send className="size-4" />
          Submit an idea
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#e7dfd2] bg-[#fffaf1] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#171529]">Submit to VaultZero</DialogTitle>
          <DialogDescription className="text-[#5f5a6d]">
            AI-enhanced ideas are easier to review and more likely to be accepted.
          </DialogDescription>
        </DialogHeader>

        {!isLoggedIn ? (
          <div className="rounded-lg border border-[#e7dfd2] bg-white p-5">
            <p className="text-sm text-[#5f5a6d]">Sign in before submitting, voting, commenting, bookmarking, or following.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        ) : !profile ? (
          <div className="rounded-lg border border-[#e7dfd2] bg-white p-5">
            <p className="text-sm text-[#5f5a6d]">Create a unique public username before interacting with ideas.</p>
            <Button asChild className="mt-4">
              <Link href="/settings/profile">Create username</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {mode === 'rough' ? (
              <div className="space-y-4">
                <Textarea
                  value={roughIdea}
                  onChange={(event) => setRoughIdea(event.target.value)}
                  minLength={20}
                  rows={7}
                  placeholder="Describe your startup idea in your own words"
                  className="border-[#e7dfd2] bg-white text-base"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={categoryGuess} onValueChange={(value) => setCategoryGuess(value as IdeaPayloadInput['category'])}>
                    <SelectTrigger className="border-[#e7dfd2] bg-white">
                      <SelectValue placeholder="Category guess" />
                    </SelectTrigger>
                    <SelectContent>
                      {vaultCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={supportingLinksText}
                    onChange={(event) => setSupportingLinksText(event.target.value)}
                    placeholder="Optional links, comma separated"
                    className="border-[#e7dfd2] bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!canInteract || roughIdea.length < 20 || startAi.status === 'executing'}
                    onClick={() =>
                      startAi.execute({
                        roughIdea,
                        categoryGuess,
                        supportingLinks: csv(supportingLinksText),
                      })
                    }
                  >
                    <WandSparkles className="size-4" />
                    {startAi.status === 'executing' ? 'Enhancing...' : 'AI Enhance'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={roughIdea.length < 20}
                    onClick={skipAi}
                  >
                    <PencilLine className="size-4" />
                    Skip AI and write manually
                  </Button>
                </div>
              </div>
            ) : null}

            {mode === 'questions' ? (
              <div className="space-y-4">
                {questions.map((question) => {
                  const options = Array.isArray(question.options)
                    ? question.options.filter((option): option is string => typeof option === 'string')
                    : [];
                  return (
                    <section key={question.id} className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                      <h3 className="text-sm font-bold text-[#171529]">{question.question}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                              answers[question.id] === option
                                ? 'border-[#3157ff] bg-[#edf1ff] text-[#3157ff]'
                                : 'border-[#e7dfd2] bg-[#fffaf1] text-[#282338] hover:border-[#3157ff]'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!sessionId || readyAnswers.length !== questions.length || finalizeAi.status === 'executing'}
                    onClick={() => sessionId && finalizeAi.execute({ sessionId, answers: readyAnswers })}
                  >
                    {finalizeAi.status === 'executing' ? 'Structuring...' : 'Generate final idea'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setMode('rough')}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}

            {mode === 'review' ? (
              <div className="space-y-4">
                <Input value={idea.title} onChange={(event) => setIdea({ ...idea, title: event.target.value })} placeholder="Title" className="bg-white" />
                <Textarea value={idea.oneLineSummary} onChange={(event) => setIdea({ ...idea, oneLineSummary: event.target.value })} placeholder="One-line summary" className="bg-white" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={idea.category} onValueChange={(value) => setIdea({ ...idea, category: value as IdeaPayloadInput['category'] })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vaultCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={idea.effortEstimate} onValueChange={(value) => setIdea({ ...idea, effortEstimate: value as IdeaPayloadInput['effortEstimate'] })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {effortEstimates.map((effort) => <SelectItem key={effort} value={effort}>{effort} effort</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {[
                  ['problem', 'Problem'],
                  ['intendedAudience', 'Intended audience'],
                  ['existingAlternatives', 'Existing alternatives'],
                  ['proposedSolution', 'Proposed solution'],
                  ['whyNow', 'Why now'],
                  ['expectedImpact', 'Expected impact'],
                  ['monetizationPotential', 'Monetization potential'],
                  ['goToMarket', 'Go to market'],
                  ['mvpScope', 'MVP scope'],
                  ['keyRisks', 'Key risks'],
                ].map(([key, label]) => (
                  <Textarea
                    key={key}
                    value={String(idea[key as keyof IdeaPayloadInput] ?? '')}
                    onChange={(event) => setIdea({ ...idea, [key]: event.target.value })}
                    placeholder={label}
                    rows={3}
                    className="bg-white"
                  />
                ))}
                <Input
                  value={idea.tags.join(', ')}
                  onChange={(event) => setIdea({ ...idea, tags: csv(event.target.value) })}
                  placeholder="Tags, comma separated"
                  className="bg-white"
                />
                <Textarea
                  value={idea.validationQuestions.join('\n')}
                  onChange={(event) => setIdea({ ...idea, validationQuestions: textareaList(event.target.value) })}
                  placeholder="Validation questions, one per line"
                  rows={4}
                  className="bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={submit.status === 'executing'} onClick={submitFinal}>
                    {submit.status === 'executing' ? 'Submitting...' : 'Submit for review'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setMode('rough')}>
                    Start over
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

