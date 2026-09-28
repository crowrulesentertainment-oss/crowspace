import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Content-Type":"application/json" };

const ratios = { portfolio: 16/9, gallery: 4/3, album: 1 };
const sizes = { portfolio:[1280,720], gallery:[1200,900], album:[1000,1000] };

async function fingerprint(parts: unknown[]) {
  const data = new TextEncoder().encode(JSON.stringify(parts));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function claim(worker: string) {
  const { data, error } = await supabase.rpc("crowspace_claim_thumbnail_job", { worker });
  if (error) throw error;
  return data?.[0] || null;
}

async function processJob(job: any) {
  const { data: media, error: me } = await supabase.from("crowspace_hero_media").select("*").eq("id",job.media_id).eq("user_id",job.user_id).single();
  if (me) throw me;
  if (!media) throw new Error("Media not found");

  // Server-side Edge Functions do not provide a DOM Canvas. The worker
  // therefore uses the source image's available presentation metadata and
  // stores a deterministic job/fingerprint. Actual pixel transcoding is
  // delegated to the image service endpoint configured below when available.
  const sourceHash = await fingerprint([media.public_url,media.storage_path,media.size_bytes,media.updated_at||""]);
  const cropHash = await fingerprint([media.thumbnail_crop_portfolio||{},media.thumbnail_crop_gallery||{},media.thumbnail_crop_album||{}]);

  const imageService = Deno.env.get("THUMBNAIL_IMAGE_SERVICE_URL");
  if (!imageService) throw new Error("THUMBNAIL_IMAGE_SERVICE_URL is not configured");

  const response = await fetch(imageService, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      source_url:media.public_url,
      media_id:media.id,
      user_id:media.user_id,
      crops:{portfolio:media.thumbnail_crop_portfolio||{},gallery:media.thumbnail_crop_gallery||{},album:media.thumbnail_crop_album||{}},
      outputs:sizes
    })
  });
  if (!response.ok) throw new Error("Thumbnail image service returned "+response.status);
  const generated = await response.json();

  const update:any = {
    thumbnail_portfolio_url:generated.portfolio?.url||"",
    thumbnail_gallery_url:generated.gallery?.url||"",
    thumbnail_album_url:generated.album?.url||"",
    thumbnail_portfolio_path:generated.portfolio?.path||"",
    thumbnail_gallery_path:generated.gallery?.path||"",
    thumbnail_album_path:generated.album?.path||"",
    thumbnail_source_hash:sourceHash,
    thumbnail_crop_hash:cropHash,
    thumbnail_generated_at:new Date().toISOString()
  };
  update.thumbnail_url=update.thumbnail_portfolio_url||media.thumbnail_url||media.public_url;
  const { error: ue } = await supabase.from("crowspace_hero_media").update(update).eq("id",media.id).eq("user_id",media.user_id);
  if (ue) throw ue;
  await supabase.from("crowspace_thumbnail_jobs").update({status:"completed",progress:100,completed_at:new Date().toISOString(),updated_at:new Date().toISOString(),error_message:"",locked_at:null,locked_by:""}).eq("id",job.id);
  return update;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:cors});
  try {
    const body = await req.json().catch(()=>({}));
    const job = await claim(body.worker || "thumbnail-worker");
    if (!job) return new Response(JSON.stringify({ok:true,message:"No queued jobs"}),{headers:cors});
    try {
      const result = await processJob(job);
      return new Response(JSON.stringify({ok:true,job_id:job.id,result}),{headers:cors});
    } catch (e) {
      const message = String((e as any)?.message || e);
      const retry = (job.attempts||0) < (job.max_attempts||3);
      await supabase.from("crowspace_thumbnail_jobs").update({status:retry?"queued":"failed",progress:retry?0:job.progress,error_message:message,updated_at:new Date().toISOString(),locked_at:null,locked_by:""}).eq("id",job.id);
      return new Response(JSON.stringify({ok:false,job_id:job.id,retry,error:message}),{status:retry?202:500,headers:cors});
    }
  } catch (e) {
    return new Response(JSON.stringify({ok:false,error:String((e as any)?.message||e)}),{status:500,headers:cors});
  }
});