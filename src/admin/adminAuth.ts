import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const ADMIN_SESSION_KEY = 'mc_admin_session';

export interface AdminSession {
  id: string;
  email: string;
  name: string;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ admin: AdminSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !data) return { admin: null, error: 'Invalid email or password.' };

  let valid = false;
  try {
    valid = await bcrypt.compare(password, data.password_hash);
  } catch (e) {
    console.error('bcrypt error:', e);
  }

  if (!valid) return { admin: null, error: 'Invalid email or password.' };

  const session: AdminSession = { id: data.id, email: data.email, name: data.name };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return { admin: session, error: null };
}

export function getAdminSession(): AdminSession | null {
  try {
    const s = localStorage.getItem(ADMIN_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
