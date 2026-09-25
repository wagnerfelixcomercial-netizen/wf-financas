import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vowypfdcqoysuffwwvww.supabase.co';
const supabaseAnonKey = 'sb_publishable_o3DSI_MRTB6p_p3LpwQXKg_NJq2D054';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const ADMIN_EMAIL = 'wagner.felix.comercial@gmail.com';