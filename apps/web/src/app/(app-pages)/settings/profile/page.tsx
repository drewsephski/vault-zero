import { ProfileForm } from '@/components/vaultzero/profile-form';
import { getProfileSettingsData } from '@/data/user/vaultzero-pages';

export default async function ProfileSettingsPage() {
  const { user, profile } = await getProfileSettingsData();

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 text-[#171529] sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black tracking-normal">Public profile</h1>
        <p className="mt-1 text-sm text-[#6b6578]">
          VaultZero shows your username publicly. Admins may use your email for moderation context.
        </p>
        <p className="mt-4 rounded-lg border border-[#e7dfd2] bg-white p-3 text-sm text-[#6b6578]">
          Signed in as <span className="font-semibold text-[#171529]">{user.email}</span>
        </p>
        <div className="mt-5">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </main>
  );
}

