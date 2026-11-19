export function getConfig(){const c=window.CROWRULES_CONFIG||{};return{supabaseUrl:String(c.supabaseUrl||"").trim(),supabasePublishableKey:String(c.supabasePublishableKey||"").trim()}}
export function isSupabaseConfigured(){const c=getConfig();return Boolean(c.supabaseUrl&&c.supabasePublishableKey)}
