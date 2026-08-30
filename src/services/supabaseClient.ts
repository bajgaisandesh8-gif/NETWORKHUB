/**
 * NET-LAB Supabase Integration Layer
 * Connects to Supabase when environment variables are supplied.
 * Transparently falls back to local-first storage mode when unconfigured.
 */

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

// Lightweight REST helper for Supabase PostgREST endpoints when configured
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
      Object.entries(options.query).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    } else {
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }

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
  } catch (err: any) {
    return { data: null, error: err };
  }
}
