import { IdeaCard } from '@/components/vaultzero/idea-card';
import { getSavedIdeasPageData } from '@/data/user/vaultzero-pages';

export default async function BookmarksPage() {
  const { ideas, profile } = await getSavedIdeasPageData('bookmarks');

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black tracking-normal">Bookmarks</h1>
        <p className="mt-1 text-sm text-[#6b6578]">Ideas you saved for later review.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={{ ...idea, hasBookmarked: true }} isLoggedIn hasProfile={Boolean(profile)} />
          ))}
        </div>
      </div>
    </main>
  );
}

