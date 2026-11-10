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
      setMessage(error.message || "That sign-in option is unavailable right now.", "error");
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
    if (mode === "signup") {
      const display_name = $("#display-name").value.trim();
      if (!display_name) throw new Error("Please enter a display name.");
      if (password.length < 8) throw new Error("Your password must be at least 8 characters.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name }, emailRedirectTo: authUrl("signup-confirmed") }
      });
      if (error) throw error;
      if (data.session) {
        location.replace("home.html");
        return;
      }
      confirmationEmail = email;
      setMessage("Your account request is ready. Check your inbox for the confirmation link. If it doesn't arrive, you can resend it below.", "success");
      $("#resend-wrap").classList.remove("hidden");
    } else if (mode === "forgot") {
      if (!email) throw new Error("Enter the email address for your CrowSpace account.");
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
      setMessage("Your password has been updated. Taking you to CrowSpace…", "success");
      setTimeout(() => location.replace("home.html"), 900);
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.replace("home.html");
      return;
    }
  } catch (error) {
    setMessage(error.message || "Unable to continue. Please try again.", "error");
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
    setMessage(error.message || "We couldn't resend the email. Please try again.", "error");
  } finally {
    setBusy(false);
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" || callbackType === "recovery") {
    setMode("recovery");
    return;
  }
  if (session && !["INITIAL_SESSION", "TOKEN_REFRESHED"].includes(event)) {
    location.replace("home.html");
  }
});

const { data: { session } } = await supabase.auth.getSession();
if (callbackType === "recovery") {
  setMode("recovery");
} else if (session) {
  location.replace("home.html");
} else {
  setMode(mode);
  const callbackError = hashParams.get("error_description") || params.get("error_description");
  if (callbackError) setMessage(callbackError.replace(/\+/g, " "), "error");
}
