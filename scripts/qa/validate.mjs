#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Static repository checks only; authenticated browser and WebRTC QA remain manual.
const root=process.cwd(), failures=[];
const counts={javascript:0,html:0,scriptAssets:0,stylesheetAssets:0,migrations:0};
function walk(dir){
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const f=path.join(dir,e.name);return e.isDirectory()?walk(f):[f];
 });
}
function fail(s){failures.push(s);console.error("::error::"+s);}
function asset(raw,htmlFile,kind){
 const v=raw.trim().replaceAll("&amp;","&");
 if(!v||/^(?:[a-z]+:|\/\/|#|data:|blob:|javascript:)/i.test(v))return true;
 const clean=v.split(/[?#]/,1)[0];if(!clean)return true;
 const f=clean.startsWith("/")?path.join(root,clean.replace(/^\/+/,"")):path.resolve(path.dirname(htmlFile),clean);
 if(!fs.existsSync(f)||!fs.statSync(f).isFile()){fail("Missing local "+kind+" asset in "+path.relative(root,htmlFile)+": "+raw);return false;}
 return true;
}
for(const f of walk(path.join(root,"assets","js")).filter(x=>x.endsWith(".js"))){
 const r=spawnSync(process.execPath,["--check","--input-type=module"],{input:fs.readFileSync(f,"utf8"),encoding:"utf8"});
 counts.javascript++;
 if(r.status!==0)fail("JavaScript syntax error in "+path.relative(root,f)+"\n"+(r.stderr||r.stdout));
}
for(const f of walk(root).filter(x=>x.endsWith(".html"))){
 const h=fs.readFileSync(f,"utf8");counts.html++;
 for(const m of h.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi))if(asset(m[1],f,"script"))counts.scriptAssets++;
 for(const m of h.matchAll(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*stylesheet[^"']*["'])[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi))if(asset(m[1],f,"stylesheet"))counts.stylesheetAssets++;
}
const migrationFiles=walk(path.join(root,"supabase","migrations")).filter(f=>f.endsWith(".sql"));
const expected=[
"20261110203203_crowspace_3_profiles_groups_events_branch_integrations.sql",
"20261110205100_crowspace_3_realtime_private_channels.sql",
"20261110205221_crowspace_3_cross_branch_notifications.sql",
"20261110205304_crowspace_3_branch_notification_preferences.sql"
];
const names=new Set(migrationFiles.map(f=>path.basename(f)));
for(const n of expected)if(!names.has(n))fail("Required migration missing: "+n);
const versions=new Map();
for(const f of migrationFiles){
 counts.migrations++;const n=path.basename(f),v=n.split("_",1)[0];
 if(!/^\d{14}$/.test(v))fail("Migration filename must start with 14-digit version: "+n);
 if(versions.has(v))fail("Duplicate migration version "+v+": "+versions.get(v)+" and "+n);
 versions.set(v,n);
}
const clientFiles=[...walk(path.join(root,"assets")),...walk(root).filter(f=>f.endsWith(".html"))];
for(const f of clientFiles){
 if(!/\.(?:js|html|json|css|map)$/i.test(f))continue;
 const s=fs.readFileSync(f,"utf8");
 if(/\bservice_role\b|\bsb_secret_[A-Za-z0-9_-]{12,}/i.test(s))fail("Possible server-side Supabase credential in client asset: "+path.relative(root,f));
}
console.log("CrowSpace CI validation summary:");
for(const [k,v] of Object.entries(counts))console.log("  "+k+": "+v);
if(failures.length){console.error("\nValidation failed with "+failures.length+" issue(s).");process.exit(1);}
console.log("\nAll static validation checks passed.");
