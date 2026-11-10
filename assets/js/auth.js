import { supabase } from "./supabase.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#auth-form");
const message = $("#auth-message");
const submit = $("#auth-submit");
const tabs = [...document.querySelectorAll("[data-mode]")];
const params = new URLSearchParams(location.search);
const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
const callbackType = params.get("type") || hashParams.get("type");
let mode = params.get("mode") === "signup" ? "signup" : "signin";
let busy = false;
let confirmationEmail = "";

const HOME_URL = new URL("home.html", location.href).href;

function authUrl(type) {
  const url = new URL("auth.html", location.href);
  if (type) url.searchParams.set("type", type);
  return url.href;
}

function setMessage(text = "", kind = "") {
  message.textContent = text;
  message.className = kind;
}

function setMode(nextMode) {
  mode = nextMode;
  const recovery = mode === "recovery";
  const forgot = mode === "forgot";
  const signup = mode === "signup";
  $("#auth-tabs").classList.toggle("hidden", recovery || forgot);
  $("#social-auth").classList.toggle("hidden", recovery || forgot);
  $("#auth-divider").classList.toggle("hidden", recovery || forgot);
  $("#name-wrap").classList.toggle("hidden", !signup);
  $("#name-wrap input").required = signup;
  $("#signup-confirm-wrap").classList.toggle("hidden", !signup);
  $("#signup-confirm-password").required = signup;
  $("#email-wrap").classList.toggle("hidden", recovery);
  $("#email").required = !recovery;
  $("#password-wrap").classList.toggle("hidden", forgot);
  $("#password").required = !forgot;
  $("#confirm-wrap").classList.toggle("hidden", !recovery);
  $("#confirm-password").required = recovery;
  $("#forgot-wrap").classList.toggle("hidden", signup || recovery || forgot);
  $("#resend-wrap").classList.add("hidden");
  $("#back-to-signin").classList.toggle("hidden", !(recovery || forgot));
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  const copy = {
    signin: ["Welcome back.", "Sign in to continue to your CrowSpace.", "Sign in →"],
    signup: ["Create your space.", "Create your account and claim your CrowID.", "Create account →"],
    forgot: ["Let's get you back in.", "Enter your email and we'll send you a secure password-reset link.", "Send reset link →"],
    recovery: ["Choose a new password.", "Create a new password for your CrowSpace account.", "Update password →"]
  }[mode];
  $("#auth-title").textContent = copy[0];
  $("#auth-subtitle").textContent = copy[1];
  submit.textContent = copy[2];
  $("#password").autocomplete = signup || recovery ? "new-password" : "current-password";
  $("#signup-confirm-password").value = "";
  $("#confirm-password").value = "";
  setMessage();
}

function setBusy(value) {
  busy = value;
  submit.disabled = value;
  submit.textContent = value ? "Please wait…" : ({
    signin: "Sign in →", signup: "Create account →",
    forgot: "Send reset link →", recovery: "Update password →"
  }[mode]);
  document.querySelectorAll("[data-provider], #resend-confirmation").forEach((button) => {
    button.disabled = value;
  });
}

function friendlyError(error) {
  const raw = String(error?.message || "");
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials")) return "That email and password combination wasn't recognized. Check your details or reset your password.";
  if (lower.includes("email not confirmed")) return "Please confirm your email address before signing in. You can resend the confirmation email below.";
  if (lower.includes("user already registered")) return "An account already exists for this email. Sign in instead, or reset your password.";
  if (lower.includes("password should be at least")) return "Choose a password with at least 8 characters.";
  if (lower.includes("redirect") && (lower.includes("allow") || lower.includes("not"))) return "The sign-in redirect is not yet allowed in Supabase. Add the CrowSpace auth.html address to Authentication → URL Configuration → Redirect URLs.";
  if (lower.includes("rate limit")) return "Too many requests were made. Please wait a minute and try again.";
  return raw || "We couldn't complete that request. Please try again.";
}

function goHome() {
  location.replace(HOME_URL);
}

tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
$("#forgot-link").addEventListener("click", () => setMode("forgot"));
$("#back-to-signin").addEventListener("click", () => {
  history.replaceState({}, document.title, authUrl());
  setMode("signin");
});

document.querySelectorAll("[data-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = $("#" + button.dataset.toggle);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
    button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
});

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (busy) return;
    setBusy(true);
    setMessage("Connecting securely…");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: button.dataset.provider,
        options: { redirectTo: authUrl() }
      });
      if (error) throw error;
    } catch (error) {
      setMessage(friendlyError(error), "error");
      setBusy(false);
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  setBusy(true);
  setMessage("Please wait…");
  try {
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#password").value;
    if (mode !== "recovery" && !email) throw new Error("Enter your email address.");
    if (mode === "signup") {
      const displayName = $("#display-name").value.trim();
      const confirmation = $("#signup-confirm-password").value;
      if (displayName.length < 2) throw new Error("Please enter a display name with at least 2 characters.");
      if (password.length < 8) throw new Error("Your password must be at least 8 characters.");
      if (password !== confirmation) throw new Error("Your passwords don't match. Please try again.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: authUrl("signup-confirmed")
        }
      });
      if (error) throw error;
      if (data.session) {
        setMessage("Your CrowSpace account is ready. Opening your space…", "success");
        goHome();
        return;
      }
      confirmationEmail = email;
      setMessage("Almost there! Check your inbox and confirm your email address before signing in. If the email doesn't arrive, you can resend it below.", "success");
      $("#resend-wrap").classList.remove("hidden");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authUrl("recovery")
      });
      if (error) throw error;
      confirmationEmail = email;
      setMessage("If an account exists for that email, a password-reset link is on its way. Check your inbox.", "success");
    } else if (mode === "recovery") {
      const confirm = $("#confirm-password").value;
      if (password.length < 8) throw new Error("Your new password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Those passwords don't match. Please try again.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Your password has been updated. You can now sign in with your new password.", "success");
      history.replaceState({}, document.title, authUrl());
      setMode("signin");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (String(error.message || "").toLowerCase().includes("email not confirmed")) {
          confirmationEmail = email;
          $("#resend-wrap").classList.remove("hidden");
        }
        throw error;
      }
      if (!data.session) throw new Error("Sign-in completed but no active session was returned. Please try again.");
      setMessage("You're signed in. Opening CrowSpace…", "success");
      goHome();
      return;
    }
  } catch (error) {
    setMessage(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

$("#resend-confirmation").addEventListener("click", async () => {
  if (busy || !confirmationEmail) return;
  setBusy(true);
  setMessage("Sending a new confirmation email…");
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: { emailRedirectTo: authUrl("signup-confirmed") }
    });
    if (error) throw error;
    setMessage("If the address is eligible, a new confirmation email has been sent.", "success");
  } catch (error) {
    setMessage(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" || callbackType === "recovery") {
    if (mode !== "recovery") setMode("recovery");
    return;
  }
  if (session && event === "SIGNED_IN" && mode !== "recovery") goHome();
});

async function initializeAuthPage() {
  const callbackError = hashParams.get("error_description") || params.get("error_description");
  if (callbackError) {
    setMessage(decodeURIComponent(callbackError.replace(/\+/g, " ")), "error");
    return;
  }

  // supabase-js detects and exchanges OAuth/PKCE callback credentials before getSession resolves.
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (callbackType === "recovery") {
    setMode("recovery");
    if (!data.session) setMessage("This password-reset link is invalid or expired. Request a new one to continue.", "error");
    return;
  }
  if (data.session) {
    goHome();
    return;
  }
  setMode(mode);
  if (callbackType === "signup-confirmed") {
    setMessage("Your email confirmation was received. You can now sign in.", "success");
  }
}

try {
  await initializeAuthPage();
} catch (error) {
  setMode(mode);
  setMessage(friendlyError(error), "error");
}
