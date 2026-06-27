'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import Link from 'next/link';
import {
  Archive,
  Bookmark,
  Flame,
  Lightbulb,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IdeaCard } from './idea-card';
import { SubmitIdeaDialog } from './submit-idea-dialog';
import { formatStatus } from '@/lib/vaultzero/helpers';
import {
  effortEstimates,
  ideaStatuses,
  vaultCategories,
} from '@/utils/zod-schemas/vaultzero';
import type { Contributor, IdeaStatus, ProfileRow, PublicIdea } from '@/types/vaultzero';

type DiscoverPageProps = {
  ideas: PublicIdea[];
  featuredIdea: PublicIdea | null;
  contributors: Contributor[];
  boardCounts: Record<string, number>;
  user: { id: string; email?: string } | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
};

const primaryNav = [
  { href: '/', label: 'Discover', icon: Lightbulb },
  { href: '/my-ideas', label: 'My Ideas', icon: Rocket },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/following', label: 'Following', icon: Radio },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const boardIcons: Partial<Record<IdeaStatus, ElementType>> = {
  new: Lightbulb,
  trending: Flame,
  under_review: ShieldCheck,
  accepted: Trophy,
  building: Rocket,
  shipped: Rocket,
  archived: Archive,
};

export function DiscoverPage({
  ideas,
  featuredIdea,
  contributors,
  boardCounts,
  user,
  profile,
  isAdmin,
}: DiscoverPageProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [effort, setEffort] = useState('all');
  const [sort, setSort] = useState('score');

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ideas
      .filter((idea) => {
        if (category !== 'all' && idea.category !== category) {
          return false;
        }
        if (status !== 'all' && idea.status !== status) {
          return false;
        }
        if (effort !== 'all' && idea.effort_estimate !== effort) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return [
          idea.title,
          idea.one_line_summary,
          idea.problem,
          idea.category,
          idea.author?.username ?? '',
          ...idea.tags,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sort === 'comments') {
          return b.comment_count - a.comment_count;
        }
        if (sort === 'bookmarks') {
          return b.bookmark_count - a.bookmark_count;
        }
        return b.score - a.score;
      });
  }, [category, effort, ideas, query, sort, status]);

  const isLoggedIn = Boolean(user);
  const hasProfile = Boolean(profile);

  return (
    <div className="min-h-screen bg-[#fff7eb] text-[#171529]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-[#e7dfd2] bg-[#fffaf1] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center justify-between lg:block">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-[#171529] text-lg font-black text-[#ff6b57]">
                VZ
              </span>
              <span>
                <span className="block text-lg font-black">VaultZero</span>
                <span className="block text-xs font-medium text-[#6b6578]">Ideas before they trend</span>
              </span>
            </Link>
            <div className="lg:hidden">
              <SubmitIdeaDialog isLoggedIn={isLoggedIn} profile={profile} />
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {[...primaryNav, ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : [])].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#3b354f] hover:bg-white hover:text-[#3157ff]"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden lg:block">
            <p className="px-3 text-xs font-bold uppercase text-[#8a8297]">Boards</p>
            <div className="mt-2 space-y-1">
              {ideaStatuses.map((board) => {
                const Icon = boardIcons[board] ?? Lightbulb;
                return (
                  <button
                    key={board}
                    type="button"
                    onClick={() => setStatus(status === board ? 'all' : board)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium ${
                      status === board ? 'bg-[#171529] text-white' : 'text-[#3b354f] hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {formatStatus(board)}
                    </span>
                    <span>{boardCounts[board] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 hidden rounded-lg border border-[#e7dfd2] bg-white p-3 lg:block">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-[#3157ff]" />
              <span className="text-sm font-bold">{profile?.username ? `@${profile.username}` : 'Public visitor'}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#6b6578]">
              {profile ? 'Your public identity is ready.' : 'Create a username to submit and interact.'}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-[#171529] md:text-5xl">
                Startup ideas worth building
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#5f5a6d]">
                Share ideas, sharpen them with AI, and vote on what deserves to exist.
              </p>
            </div>
            <div className="hidden lg:block">
              <SubmitIdeaDialog isLoggedIn={isLoggedIn} profile={profile} />
            </div>
          </header>

          {featuredIdea ? (
            <section className="mt-8 rounded-lg border border-[#fb5c48] bg-[#ff6b57] p-5 text-[#211b2d] shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-black uppercase">Trending now</p>
                  <Link href={`/ideas/${featuredIdea.slug}`} className="mt-2 block text-2xl font-black leading-tight hover:underline md:text-3xl">
                    {featuredIdea.title}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-[#35263a]">{featuredIdea.one_line_summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded-md bg-white/70 px-3 py-2">{featuredIdea.score} votes</span>
                  <span className="rounded-md bg-white/70 px-3 py-2">{featuredIdea.comment_count} comments</span>
                  <span className="rounded-md bg-white/70 px-3 py-2">{featuredIdea.category}</span>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-6 grid gap-3 rounded-lg border border-[#e7dfd2] bg-white p-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8297]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ideas, tags, founders"
                className="border-[#e7dfd2] pl-9"
              />
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {vaultCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ideaStatuses.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger><SelectValue placeholder="Effort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All efforts</SelectItem>
                {effortEstimates.map((item) => <SelectItem key={item} value={item}>{item} effort</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Top score</SelectItem>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="comments">Most discussed</SelectItem>
                <SelectItem value="bookmarks">Most saved</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="grid gap-4 md:grid-cols-2">
              {filteredIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} isLoggedIn={isLoggedIn} hasProfile={hasProfile} />
              ))}
              {filteredIdeas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#e7dfd2] bg-white p-8 text-center md:col-span-2">
                  <p className="font-bold text-[#171529]">No ideas match those filters.</p>
                  <p className="mt-2 text-sm text-[#6b6578]">Reset a filter or submit the idea you expected to find.</p>
                </div>
              ) : null}
            </section>

            <aside className="space-y-4">
              <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <h2 className="text-sm font-black uppercase text-[#171529]">Top contributors</h2>
                <div className="mt-3 space-y-3">
                  {contributors.map((contributor, index) => (
                    <Link key={contributor.id} href={`/u/${contributor.username}`} className="flex items-center justify-between rounded-md p-2 hover:bg-[#fff7eb]">
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-md bg-[#edf1ff] text-sm font-black text-[#3157ff]">{index + 1}</span>
                        <span>
                          <span className="block text-sm font-bold">@{contributor.username}</span>
                          <span className="block text-xs text-[#6b6578]">{contributor.ideasAccepted} accepted</span>
                        </span>
                      </span>
                      <span className="text-sm font-black">{contributor.score}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <h2 className="text-sm font-black uppercase text-[#171529]">Category key</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vaultCategories.slice(0, 8).map((item) => (
                    <Badge key={item} className="rounded-md bg-[#e9fbf3] text-[#146846] hover:bg-[#e9fbf3]">{item}</Badge>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#e7dfd2] bg-[#171529] p-4 text-white">
                <h2 className="font-black">Idea of the week</h2>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  The strongest submissions describe the pain, buyer, smallest useful MVP, and the fastest validation test.
                </p>
              </section>

              <section className="rounded-lg border border-[#e7dfd2] bg-white p-4">
                <h2 className="font-black text-[#171529]">Pro features coming soon</h2>
                <ul className="mt-3 space-y-2 text-sm text-[#6b6578]">
                  <li>Featured ideas</li>
                  <li>Founder profiles+</li>
                  <li>AI validation plans</li>
                  <li>Private idea rooms</li>
                </ul>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
