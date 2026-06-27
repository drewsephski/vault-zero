import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAdminUsersData } from '@/data/user/vaultzero-pages';

export default async function AdminUsersPage() {
  const { users } = await getAdminUsersData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-normal">Users</h1>
          <Button asChild variant="outline"><Link href="/admin">Admin home</Link></Button>
        </div>
        <section className="mt-6 overflow-hidden rounded-lg border border-[#e7dfd2] bg-white">
          {users.map((user) => (
            <div key={user.id} className="grid gap-2 border-b border-[#eee5d7] p-4 last:border-b-0 sm:grid-cols-[1fr_1fr_100px]">
              <span>
                <span className="block font-black">@{user.username}</span>
                <span className="block text-sm text-[#6b6578]">{user.display_name ?? 'No display name'}</span>
              </span>
              <span className="text-sm text-[#5f5a6d]">{user.email ?? 'No email stored'}</span>
              <span className="text-sm font-bold">{user.role}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

