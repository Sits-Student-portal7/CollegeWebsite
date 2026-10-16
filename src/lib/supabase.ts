/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  'https://placeholder.supabase.co';

const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  'placeholder-anon-key';

/**
 * Checks whether valid client-side Supabase credentials are configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('placeholder') &&
    !supabaseAnonKey.includes('your-anon-')
  );
};

export const getSupabaseConfigStatus = () => {
  return {
    isConfigured: isSupabaseConfigured(),
    urlConfigured: Boolean(supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project')),
    keyConfigured: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('placeholder') && !supabaseAnonKey.includes('your-anon-')),
    configuredHost: (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return 'invalid-url';
      }
    })(),
  };
};

/**
 * Supabase client for client-side operations using the anon/publishable key.
 * Session persistence is explicitly enabled for seamless session restore.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
