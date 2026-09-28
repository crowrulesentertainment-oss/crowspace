document.addEventListener("DOMContentLoaded",()=>{const c=window.crowSupabase,msg=document.getElementById("msg");if(!c)return;

const setMsg=(text,type="")=>{if(!msg)return;msg.textContent=String(text||"");msg.className="signup-status"+(type?" "+type:"")};
const redirectTo=new URL("profile.html",location.href).href;
const verifyTo=new URL("verify-email.html",location.href).href;

const friendlyAuthError=error=>{
  if(!error)return "";
  const raw=String(error.message||error.error_description||error.msg||"");
  const lower=raw.toLowerCase();
  if(lower.includes("database error saving new user")) return "We couldn't finish creating your account because the account profile could not be saved. Please try again. If it keeps happening, contact CrowSpace support.";
  if(lower.includes("user already registered")) return "That email is already registered. Try signing in or use a different email address.";
  if(lower.includes("email rate limit")) return "Too many verification emails have been requested. Please wait before trying again.";
  if(lower.includes("rate limit")) return "Too many requests were made. Please wait a few minutes and try again.";
  if(lower.includes("password")) return "Please choose a stronger password and try again.";
  if(lower.includes("invalid email")) return "Enter a valid email address.";
  if(lower.includes("network")||lower.includes("fetch")) return "CrowSpace could not reach the account service. Check your connection and try again.";
  return raw||"Something went wrong. Please try again.";
};

const oauthError=()=>{
  const h=new URLSearchParams(location.hash.replace(/^#/,"")),q=new URLSearchParams(location.search);
  const code=h.get("error_code")||q.get("error_code"),desc=h.get("error_description")||q.get("error_description");
  if(!code&&!desc)return false;
  let text=desc||code||"Google sign-in failed";
  try{text=decodeURIComponent(text)}catch{}
  setMsg(text.replace(/\+/g," "),"error");
  history.replaceState({},document.title,location.pathname);
  return true;
};
oauthError();

const profileFor=async u=>{
  if(!u)return null;
  const m=u.user_metadata||{},email=u.email||"";
  const base=(email.split("@")[0]||"crowmember").toLowerCase().replace(/[^a-z0-9_]+/g,"").slice(0,30)||"crowmember";
  const display_name=m.display_name||m.full_name||m.name||email.split("@")[0]||"CrowSpace Member";
  const avatar_url=m.avatar_url||m.picture||"";
  const wanted=(m.username||base).toLowerCase().replace(/[^a-z0-9_]+/g,"").slice(0,30)||"crowmember";
  const {data:existing}=await c.from("membership_profiles").select("id,display_name,username,bio,avatar_url").eq("id",u.id).maybeSingle();
  if(existing)return existing;
  let username=wanted;
  let {data,error}=await c.from("membership_profiles").insert({id:u.id,display_name,username,bio:"",avatar_url,updated_at:new Date().toISOString()}).select().maybeSingle();
  if(error&&error.code==="23505"){
    username=(wanted.slice(0,23)||"crowmember")+"_"+u.id.replace(/-/g,"").slice(0,6);
    const retry=await c.from("membership_profiles").insert({id:u.id,display_name,username,bio:"",avatar_url,updated_at:new Date().toISOString()}).select().maybeSingle();
    data=retry.data;error=retry.error;
  }
  if(error)console.warn("CrowSpace profile:",error.message);
  return data||null;
};

const signupForm=document.getElementById("signupForm");
signupForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  const display_name=document.getElementById("display_name")?.value.trim()||"";
  const first_name=document.getElementById("first_name")?.value.trim()||"";
  const last_name=document.getElementById("last_name")?.value.trim()||"";
  const username=document.getElementById("username")?.value.trim().toLowerCase()||"";
  const email=document.getElementById("email")?.value.trim().toLowerCase()||"";
  const password=document.getElementById("password")?.value||"";
  const password_confirm=document.getElementById("password_confirm")?.value||"";
  const terms=document.getElementById("terms")?.checked===true;
  const submit=document.getElementById("signupSubmit");

  if(!display_name){setMsg("Enter a display name.","error");document.getElementById("display_name")?.focus();return}
  if(username.length<3||username.length>30||!/^[a-z0-9_]+$/i.test(username)){setMsg("Username must be 3–30 characters using letters, numbers, or underscores.","error");document.getElementById("username")?.focus();return}
  if(!/^\S+@\S+\.\S+$/.test(email)){setMsg("Enter a valid email address.","error");document.getElementById("email")?.focus();return}
  if(password.length<8){setMsg("Password must be at least 8 characters.","error");document.getElementById("password")?.focus();return}
  if(password.length>128){setMsg("Password must be 128 characters or fewer.","error");document.getElementById("password")?.focus();return}
  if(password!==password_confirm){setMsg("Your passwords do not match.","error");document.getElementById("password_confirm")?.focus();return}
  if(!terms){setMsg("Please agree to the CrowSpace Terms and Community Rules.","error");document.getElementById("terms")?.focus();return}

  if(submit){submit.disabled=true;submit.textContent="Creating account…"}
  setMsg("Creating your CrowRules account…","info");

  try{
    const {data,error}=await c.auth.signUp({
      email,
      password,
      options:{
        data:{display_name,first_name,last_name,username},
        emailRedirectTo:verifyTo
      }
    });

    if(error){
      console.error("CrowSpace signup:",error);
      setMsg(friendlyAuthError(error),"error");
      return;
    }

    if(data.user&&data.session){
      await profileFor(data.user);
      localStorage.removeItem("crowspace_pending_verification_email");
      setMsg("Welcome to CrowSpace!","success");
      setTimeout(()=>location.href=redirectTo,500);
      return;
    }

    if(data.user){
      localStorage.setItem("crowspace_pending_verification_email",email);
      const box=document.getElementById("verifyBox"),ve=document.getElementById("verifyEmail");
      if(box)box.hidden=false;
      if(ve)ve.textContent=email;
      setMsg("Account created. Check your email to verify your CrowSpace account.","success");
      return;
    }

    setMsg("Your account request was received. Check your email for the verification link.","success");
  }catch(error){
    console.error("CrowSpace signup exception:",error);
    setMsg(friendlyAuthError(error),"error");
  }finally{
    if(submit){submit.disabled=false;submit.textContent="Create Universal Account"}
  }
});

document.getElementById("resendVerification")?.addEventListener("click",async()=>{\n  const last=Number(localStorage.getItem("crowspace_last_verification_resend")||0);\n  const wait=Math.ceil((30000-(Date.now()-last))/1000);\n  if(wait>0){setMsg("Please wait "+wait+" seconds before requesting another verification email.","info");return}
  const email=(document.getElementById("email")?.value||localStorage.getItem("crowspace_pending_verification_email")||"").trim().toLowerCase();
  if(!email){setMsg("Enter your email address first.","error");return}
  const b=document.getElementById("resendVerification");
  if(b){b.disabled=true;b.textContent="Sending…"}
  setMsg("Sending a new verification email…","info");
  try{
    const {error}=await c.auth.resend({type:"signup",email,options:{emailRedirectTo:verifyTo}});
    if(error)setMsg(friendlyAuthError(error),"error");
    else setMsg("A new verification email has been requested. Check your inbox and spam folder.","success");
  }catch(error){setMsg(friendlyAuthError(error),"error")}
  finally{setTimeout(()=>{if(b){b.disabled=false;b.textContent="Resend verification email"}},6000)}
});

document.getElementById("loginForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const email=document.getElementById("email")?.value.trim().toLowerCase()||"";
  setMsg("Signing in…","info");
  const {data,error}=await c.auth.signInWithPassword({email,password:document.getElementById("password")?.value||""});
  if(error){
    setMsg(friendlyAuthError(error),"error");
    if(/confirm|verified|not confirmed/i.test(error.message||"")&&email){
      const box=document.getElementById("msg");
      if(box&&!document.getElementById("loginResendVerification")){
        const b=document.createElement("button");
        b.id="loginResendVerification";b.className="btn";b.type="button";b.textContent="Resend verification email";
        box.appendChild(document.createTextNode(" "));
        box.appendChild(b);
        b.onclick=async()=>{
          b.disabled=true;b.textContent="Sending…";
          const r=await c.auth.resend({type:"signup",email,options:{emailRedirectTo:verifyTo}});
          if(r.error)setMsg(friendlyAuthError(r.error),"error");
          else setMsg("Verification email requested. Check your inbox.","success");
          setTimeout(()=>{b.disabled=false;b.textContent="Resend verification email"},6000);
        };
      }
    }
    return;
  }
  if(data.user)await profileFor(data.user);
  if(data.session){location.href=redirectTo}else setMsg("Check your email to confirm your CrowSpace account.","info");
});

document.getElementById("password")?.addEventListener("input",e=>{
  const el=document.getElementById("passwordStrength");if(!el)return;
  const v=e.target.value,s=(v.length>=8?1:0)+(/[A-Z]/.test(v)?1:0)+(/[0-9]/.test(v)?1:0)+(/[^A-Za-z0-9]/.test(v)?1:0);
  el.textContent=s>=4?"Strong password.":s>=2?"Good password — add more variety for extra strength.":"Use 8+ characters with a mix of letters and numbers.";
});

document.getElementById("google")?.addEventListener("click",async()=>{
  const b=document.getElementById("google");
  if(b){b.disabled=true;b.textContent="Connecting to Google…"}
  setMsg("Connecting to Google…","info");
  const {error}=await c.auth.signInWithOAuth({provider:"google",options:{redirectTo,queryParams:{prompt:"select_account"}}});
  if(error){setMsg(friendlyAuthError(error),"error");if(b){b.disabled=false;b.textContent="Continue with Google"}}
});

c.auth.onAuthStateChange((event,session)=>{
  if(!session?.user){if(event==="SIGNED_OUT")setMsg("Signed out.","info");return}
  setTimeout(()=>{
    profileFor(session.user).catch(err=>console.warn("CrowSpace auth profile:",err));
    if(event==="SIGNED_IN"&&(location.pathname.endsWith("login.html")||location.pathname.endsWith("signup.html")))location.href=redirectTo;
  },0);
});
});