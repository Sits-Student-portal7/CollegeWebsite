/// <reference types="node" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// Ensure this file is never bundled or executed in browser code
if (typeof window !== 'undefined') {
  throw new Error('src/lib/supabase-server.ts must never be executed on the client side.');
}

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

export const getSupabaseUrl = (): string | undefined =>
  getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');

export const getSupabaseServiceKey = (): string | undefined =>
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Checks whether valid server-side Supabase credentials are provided.
 * Rejects placeholder template values.
 */
export const isServerConfigValid = (): boolean => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  return Boolean(
    url &&
    serviceKey &&
    !url.includes('placeholder') &&
    !url.includes('your-project') &&
    !serviceKey.includes('placeholder') &&
    !serviceKey.includes('your-servi')
  );
};

let _adminClient: SupabaseClient | null = null;
let _cachedKey: string | null = null;

/**
 * Returns an authenticated Supabase admin client using the service-role key.
 * Strictly forbids falling back to an anonymous key.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!url) {
    throw new Error('SUPABASE_URL is not configured in the server environment.');
  }

  if (!serviceKey || serviceKey.includes('placeholder') || serviceKey.includes('your-servi')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for privileged server operations. Never fall back to anon key.'
    );
  }

  if (!_adminClient || _cachedKey !== serviceKey) {
    _adminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    _cachedKey = serviceKey;
  }

  return _adminClient;
};

/**
 * Proxy that lazily invokes getSupabaseAdmin() when properties are accessed.
 * Throws immediately with a clear security error if the service-role key is missing.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
