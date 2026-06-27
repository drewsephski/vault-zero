import type { VaultZeroSupabaseClient } from '@/types/vaultzero';
import { createSupabaseClient } from '@/supabase-clients/server';

export async function createVaultZeroSupabaseClient() {
  const client = await createSupabaseClient();
  return client as unknown as VaultZeroSupabaseClient;
}

