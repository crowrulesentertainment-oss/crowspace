import {getUniverseContext,loadMyCrowSpaceProfile} from "./universe-bridge.js";
export async function initProfileEditor(){
 const form=document.querySelector("[data-profile-editor]");if(!form)return;
 const status=document.querySelector("[data-editor-status]");const context=await getUniverseContext();
 if(!context.user){if(status)status.textContent="Sign in to edit your profile.";form.querySelectorAll("input,textarea,button").forEach(x=>x.disabled=true);return}
 const{data:profile,error}=await loadMyCrowSpaceProfile(context.user.id);
 if(error||!profile){if(status)status.textContent=error?error.message:"Your profile record is not available.";return}
 for(const field of ["display_name","bio","avatar_url","location","portfolio_tagline","portfolio_bio"]){const input=form.elements.namedItem(field);if(input)input.value=profile[field]||""}
 form.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector("button[type=submit]");button.disabled=true;if(status)status.textContent="Saving…";
 const value=name=>String(form.elements.namedItem(name)?.value||"").trim();
 const avatar=value("avatar_url");if(avatar){try{if(new URL(avatar).protocol!=="https:")throw new Error()}catch{if(status)status.textContent="Avatar URL must be a valid HTTPS address.";button.disabled=false;return}}
 const patch={display_name:value("display_name"),bio:value("bio"),avatar_url:avatar||null,location:value("location"),portfolio_tagline:value("portfolio_tagline"),portfolio_bio:value("portfolio_bio"),updated_at:new Date().toISOString()};
 const{error:saveError}=await context.supabase.from("crowspace_profiles").update(patch).eq("user_id",context.user.id);
 button.disabled=false;if(saveError){if(status)status.textContent="Profile could not be saved: "+saveError.message;return}
 if(status)status.textContent="Profile saved. Connected branch profile fields will sync through the existing database trigger.";
 })
}
