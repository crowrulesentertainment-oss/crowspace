import {getUniverseContext,loadMyCrowSpaceProfile} from "./universe-bridge.js";
import {signInWithProvider,signOut} from "./auth.js";
import {getBranch} from "./branch-registry.js";
const CROSPACE_URL="https://crowrulesentertainment-oss.github.io/crowspace/";
export async function connectCrowRulesBranch({branchKey}={}){
 const branch=getBranch(branchKey);if(!branch)throw new Error("Unknown CrowRules branch key.");
 const getContext=()=>getUniverseContext();
 return Object.freeze({
  branchKey:branch.key,
  branchName:branch.name,
  async getAuth(){const c=await getContext();return{configured:c.configured,user:c.user,session:c.session}},
  async getProfile(){const c=await getContext();if(!c.user)return{data:null,error:null};return loadMyCrowSpaceProfile(c.user.id)},
  async signIn(provider){return signInWithProvider(provider)},
  async signOut(){return signOut()},
  async sharePost({body,visibility="public",postKind="text"}={}){const c=await getContext();if(!c.user)throw new Error("Sign in to CrowSpace before sharing.");if(!c.supabase)throw new Error("CrowSpace connection is not configured.");const content=String(body||"").trim();if(!content)throw new Error("Post text is required.");return c.supabase.from("crowspace_posts").insert({author_id:c.user.id,body:content,visibility,post_kind:postKind,branch_key:branch.key})},
  openCrowSpace(path="feed.html"){const target=new URL(path,CROSPACE_URL);if(target.origin!==new URL(CROSPACE_URL).origin)throw new Error("CrowSpace destination must stay on the CrowSpace site.");location.assign(target.href)}
 })
}
if(typeof window!=="undefined")window.CrowRulesUniverseBridge=Object.freeze({connect:connectCrowRulesBranch});
