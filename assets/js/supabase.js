import {getConfig} from "./config-loader.js";
let clientPromise;
export async function getSupabase(){const c=getConfig();if(!c.supabaseUrl||!c.supabasePublishableKey)return null;if(!clientPromise){clientPromise=import("https://esm.sh/@supabase/supabase-js@2.119.1").then(({createClient})=>createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}))}return clientPromise}
