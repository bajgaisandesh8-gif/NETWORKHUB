/**
 * NET-LAB Supabase integration layer.
 * Uses the official Supabase JS client for Auth and keeps the lightweight
 * PostgREST helper for existing data access.
 */

import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfigState {
  isConfigured: boolean;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
}

const supabaseUrl: string = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey: string = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabaseConfigState: SupabaseConfigState = {
  isConfigured: isSupabaseConfigured,
  supabaseUrl: isSupabaseConfigured ? supabaseUrl : null,
  supabaseAnonKey: isSupabaseConfigured ? supabaseAnonKey : null
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export async function supabaseRestRequest<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: any;
    query?: Record<string, string>;
    token?: string;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured. Working in Local Storage mode.') };
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => url.searchParams.append(key, value));
    }

    const headers: Record<string, string> = {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Authorization: `Bearer ${options.token || supabaseAnonKey}`
    };

    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errText = await response.text();
      return { data: null, error: new Error(`Supabase API error (${response.status}): ${errText}`) };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
