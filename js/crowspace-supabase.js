/* CrowSpace Universal Supabase Connector — shared by every HTML page. */
(function(){
  const URL='https://cevylpnoexugwgygvtgu.supabase.co';
  const KEY='sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';
  window.CrowSpaceConfig={url:URL,key:KEY};
  window.CrowSpaceSupabase={
    client:null,
    ready:null,
    connect:function(){
      if(this.ready)return this.ready;
      this.ready=new Promise((resolve,reject)=>{
        const start=()=>{try{
          if(!window.supabase)throw new Error('Supabase JS did not load.');
          this.client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
          window.CrowSpaceSupabaseClient=this.client;
          document.documentElement.dataset.supabase='connected';
          resolve(this.client);
        }catch(e){document.documentElement.dataset.supabase='error';reject(e)}};
        if(window.supabase)start();else{
          const t=setInterval(()=>{if(window.supabase){clearInterval(t);start()}},25);
          setTimeout(()=>{clearInterval(t);if(!this.client)reject(new Error('Supabase JS load timeout.'))},10000);
        }
      });
      return this.ready;
    }
  };
  window.CrowSpaceSupabase.connect().catch(e=>console.error('CrowSpace Supabase:',e));
})();