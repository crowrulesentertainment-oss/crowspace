import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./config.js";
// The same browser origin and storage key preserve the existing Podcasting sign-in session.
export const sb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,storage:window.localStorage,storageKey:"crowrules-podcasting-auth",autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}});
