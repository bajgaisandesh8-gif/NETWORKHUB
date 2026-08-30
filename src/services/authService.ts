import { isSupabaseConfigured, supabase } from './supabaseClient';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

const AUTH_STORAGE_KEY = 'netlab_auth_session';

const isUserRole = (value: unknown): value is UserRole =>
  value === 'student' || value === 'instructor' || value === 'admin';

class AuthService {
  private currentProfile: UserProfile | null = null;
  private listeners: ((profile: UserProfile | null) => void)[] = [];
  private supabaseUnsubscribe: (() => void) | null = null;

  constructor() {
    this.loadInitialSession();
    this.bindSupabaseAuth();
  }

  private loadInitialSession() {
    if (isSupabaseConfigured) return;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        this.currentProfile = isUserRole(parsed.role) ? parsed : null;
      } else {
        this.currentProfile = {
          id: 'local-student-01',
          email: 'student@netlab.local',
          fullName: 'Networking Student',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        this.saveLocalSession();
      }
    } catch {
      this.currentProfile = null;
    }
  }

  private bindSupabaseAuth() {
    if (!supabase) return;

    this.supabaseUnsubscribe = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        this.currentProfile = null;
        this.notifyListeners();
        return;
      }
      // Do not trust user_metadata.role. Fetch the database profile protected by RLS.
      void this.hydrateSupabaseProfile(session.user.id, session.user.email || '');
    }).data.subscription.unsubscribe;

    void this.restoreSupabaseSession();
  }

  private async restoreSupabaseSession() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      this.currentProfile = null;
      this.notifyListeners();
      return;
    }
    await this.hydrateSupabaseProfile(data.user.id, data.user.email || '');
  }

  private async hydrateSupabaseProfile(userId: string, email: string): Promise<void> {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Unable to load user profile:', error.message);
      this.currentProfile = null;
      this.notifyListeners();
      return;
    }

    if (!data) {
      this.currentProfile = null;
      this.notifyListeners();
      return;
    }

    const role: UserRole = isUserRole(data.role) ? data.role : 'student';
    this.currentProfile = {
      id: data.id,
      email,
      fullName: data.full_name || email.split('@')[0] || 'Networking Student',
      role,
      avatarUrl: data.avatar_url || undefined,
      createdAt: data.created_at || new Date().toISOString()
    };
    this.notifyListeners();
  }

  private saveLocalSession() {
    if (this.currentProfile) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentProfile));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentProfile));
  }

  public getProfile(): UserProfile | null {
    return this.currentProfile;
  }

  public subscribe(callback: (profile: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentProfile);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  public async login(email: string, password?: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      if (!password) throw new Error('Password is required.');
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Login succeeded but no user session was returned.');
      await this.hydrateSupabaseProfile(data.user.id, data.user.email || email.trim());
      if (!this.currentProfile) throw new Error('Account exists, but its profile could not be loaded.');
      return this.currentProfile;
    }

    const res = await this.signIn(email);
    if (!res.profile) throw new Error(res.error || 'Login failed');
    return res.profile;
  }

  public async signup(email: string, password: string, fullName: string, _role: UserRole = 'student'): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Account creation failed.');
      if (!data.session) throw new Error('Account created. Please check your email to confirm your account before signing in.');

      await this.hydrateSupabaseProfile(data.user.id, data.user.email || email.trim());
      if (!this.currentProfile) throw new Error('Account created, but the user profile could not be loaded.');
      return this.currentProfile;
    }

    const res = await this.signUp(email, fullName, 'student');
    if (!res.profile) throw new Error(res.error || 'Signup failed');
    return res.profile;
  }

  public async signUp(email: string, fullName: string, _role: UserRole = 'student'): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const newProfile: UserProfile = {
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email: email.trim(), fullName: fullName.trim(), role: 'student', createdAt: new Date().toISOString()
      };
      this.currentProfile = newProfile;
      this.saveLocalSession();
      return { success: true, profile: newProfile };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  }

  public async signIn(email: string, role: UserRole = 'student'): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const safeRole: UserRole = isUserRole(role) && role !== 'admin' ? role : 'student';
      const profile: UserProfile = {
        id: `usr-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        email: email.trim(),
        fullName: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/^\w/, c => c.toUpperCase()),
        role: safeRole,
        createdAt: new Date().toISOString()
      };
      this.currentProfile = profile;
      this.saveLocalSession();
      return { success: true, profile };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  }

  public async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      this.currentProfile = null;
      this.notifyListeners();
      return;
    }
    this.currentProfile = null;
    this.saveLocalSession();
  }

  public updateRole(role: UserRole) {
    // Local demo only. Production roles come from public.profiles + RLS.
    if (isSupabaseConfigured) return;
    if (this.currentProfile && role !== 'admin') {
      this.currentProfile.role = role;
      this.saveLocalSession();
    }
  }

  public isSupabaseConnected(): boolean { return isSupabaseConfigured; }

  public destroy() {
    this.supabaseUnsubscribe?.();
    this.supabaseUnsubscribe = null;
  }
}

export const authService = new AuthService();
