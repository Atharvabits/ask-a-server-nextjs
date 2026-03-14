import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

export const supabase: SupabaseClient = createClient(url, serviceKey);

export const supabaseAnon: SupabaseClient = createClient(url, anonKey);

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
