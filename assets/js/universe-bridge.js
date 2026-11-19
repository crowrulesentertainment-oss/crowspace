import {getSupabase} from "./supabase.js";import {getAuthState} from "./auth.js";
export async function getUniverseContext(){const auth=await getAuthState();return{...auth,supabase:auth.configured?await getSupabase():null,branchKey:document.body.dataset.branch||null}}
export async function loadMyCrowSpaceProfile(userId){const s=await getSupabase();if(!s||!userId)return{data:null,error:null};return s.from("crowspace_profiles").select("user_id,username,display_name,bio,avatar_url,crow_id,cover_url,location,profile_visibility,onboarding_complete,profile_theme,creator_category").eq("user_id",userId).maybeSingle()}
export function branchShareUrl(branchKey){const u=new URL(location.href);u.searchParams.set("branch",branchKey);return u.toString()}
