import {getSupabase} from "./supabase.js";import {isSupabaseConfigured} from "./config-loader.js";
export async function getAuthState(){if(!isSupabaseConfigured())return{configured:false,user:null,session:null};const s=await getSupabase();const{data,error}=await s.auth.getSession();if(error)throw error;return{configured:true,user:data.session?.user||null,session:data.session||null}}
export async function signInWithProvider(provider){const s=await getSupabase();if(!s)throw new Error("Supabase has not been configured.");const{error}=await s.auth.signInWithOAuth({provider,options:{redirectTo:location.href}});if(error)throw error}
export async function signOut(){const s=await getSupabase();if(!s)return;const{error}=await s.auth.signOut();if(error)throw error}
