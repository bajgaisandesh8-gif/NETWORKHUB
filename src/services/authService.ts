import { isSupabaseConfigured } from './supabaseClient';

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

class AuthService {
  private currentProfile: UserProfile | null = null;
  private listeners: ((profile: UserProfile | null) => void)[] = [];

  constructor() {
    this.loadInitialSession();
  }

  private loadInitialSession() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentProfile = JSON.parse(stored);
      } else {
        // Default guest / student profile for local-first mode
        this.currentProfile = {
          id: 'local-student-01',
          email: 'student@netlab.local',
          fullName: 'Networking Student',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        this.saveSession();
      }
    } catch {
      this.currentProfile = null;
    }
  }

  private saveSession() {
    if (this.currentProfile) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentProfile));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentProfile));
  }

  public getProfile(): UserProfile | null {
    return this.currentProfile;
  }

  public subscribe(callback: (profile: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentProfile);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public async login(email: string, _password?: string): Promise<UserProfile> {
    const res = await this.signIn(email);
    if (!res.profile) throw new Error(res.error || 'Login failed');
    return res.profile;
  }

  public async signup(email: string, _password: string, fullName: string, role: UserRole = 'student'): Promise<UserProfile> {
    const res = await this.signUp(email, fullName, role);
    if (!res.profile) throw new Error(res.error || 'Signup failed');
    return res.profile;
  }

  public async signUp(email: string, fullName: string, role: UserRole = 'student'): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const newProfile: UserProfile = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        email,
        fullName,
        role,
        createdAt: new Date().toISOString()
      };
      this.currentProfile = newProfile;
      this.saveSession();
      return { success: true, profile: newProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    }
  }

  public async signIn(email: string, role: UserRole = 'student'): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const profile: UserProfile = {
        id: `usr-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        fullName: email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
        role,
        createdAt: new Date().toISOString()
      };
      this.currentProfile = profile;
      this.saveSession();
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed' };
    }
  }

  public async signOut(): Promise<void> {
    this.currentProfile = null;
    this.saveSession();
  }

  public updateRole(role: UserRole) {
    if (this.currentProfile) {
      this.currentProfile.role = role;
      this.saveSession();
    }
  }

  public isSupabaseConnected(): boolean {
    return isSupabaseConfigured;
  }
}

export const authService = new AuthService();
