import 'server-only';

import { createVaultZeroSupabaseClient } from './supabase';

type RateLimitOptions = {
  userId: string;
  action: string;
  limit: number;
  window: 'hour' | 'day';
};

function getWindowStart(window: RateLimitOptions['window']) {
  const now = new Date();
  if (window === 'day') {
    now.setUTCHours(0, 0, 0, 0);
    return now.toISOString();
  }

  now.setUTCMinutes(0, 0, 0);
  return now.toISOString();
}

export async function enforceRateLimit({
  userId,
  action,
  limit,
  window,
}: RateLimitOptions) {
  const supabase = await createVaultZeroSupabaseClient();
  const windowStart = getWindowStart(window);

  const { data: existing, error: readError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('ip_hash', 'auth')
    .eq('action', action)
    .eq('window_start', windowStart)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (existing && existing.count >= limit) {
    throw new Error('Rate limit reached. Try again later.');
  }

  if (existing) {
    const { error } = await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from('rate_limits').insert({
    user_id: userId,
    ip_hash: 'auth',
    action,
    window_start: windowStart,
    count: 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}

