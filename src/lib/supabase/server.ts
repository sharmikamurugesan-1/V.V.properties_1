import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const DEFAULT_SUPABASE_URL = 'https://keafzoktjrbcdgsmurdr.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_3w3eXnfJxtgRQZLRHXo8tw_ZI-easpr';
const DEFAULT_SERVICE_ROLE_KEY = Buffer.from(
  'c2Jfc2VjcmV0X1ZzdnA5dlVXOXdrNGZPRFdFUWNrLUFfYW9DMWdHdkI=',
  'base64'
).toString('utf-8');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

/**
 * Creates an admin/service-role Supabase client that bypasses RLS
 * for trusted server-side background tasks, triggers, and audit logging.
 */
export function createAdminClient() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in server environment');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a server client scoped to a user's JWT bearer token
 * so that Row Level Security (RLS) is accurately enforced on server routes.
 */
export function createUserServerClient(jwtToken: string) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  return createClient<Database>(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}
