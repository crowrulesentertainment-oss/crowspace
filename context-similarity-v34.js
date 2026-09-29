/* CrowSpace — Context Similarity Intelligence v34
   Browser-only. Learns context relationships from observed outcomes.
*/
(function(){
const MEM="crowspace-contextual-bandit-memory-v33",KEY="crowspace-context-similarity-v34",HIST="crowspace-context-similarity-history-v34",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function rows(){return Object.values(L(MEM,{})).filter(x=>x?.context)}
function featureDistance(a,b){
 let d=0,n=0;
 if(a.series&&b.series){n++;if(a.series!==b.series)d+=1}
 if(a.window&&b.window){n++;if(a.window!==b.window)d+=1}
 if(a.momentum&&b.momentum&&a.momentum!=="UNKNOWN"&&b.momentum!=="UNKNOWN"){n++;if(a.momentum!==b.momentum)d+=1}
 if(a.experimentType&&b.experimentType){n++;if(a.experimentType!==b.experimentType)d+=1}
 if(a.ageBucket!=null&&b.ageBucket!=null){n++;d+=Math.min(1,Math.abs(N(a.ageBucket)-N(b.ageBucket))/3)}
 return n?1-d/n:0;
}
function outcome(x){const age=Math.pow(.5,Math.max(0,(Date.now()-N(x.lastAt))/DAY)/30);const signal=x.tests?(N(x.positive)-N(x.negative))/N(x.tests):0;const effect=x.tests?Math.max(-1,Math.min(1,N(x.effectSum)/N(x.tests)/100)):0;return age*(signal*.7+effect*.3)}
function learn(original,ctx){
 const r=rows().filter(x=>x.originalKey===original).map(x=>({...x,similarity:featureDistance(x.context,ctx),outcome:outcome(x)})).sort((a,b)=>b.similarity-a.similarity);
 if(!r.length)return{reward:0,evidence:0,similarity:0,mode:"COLD_START",neighbors:[]};
 const exact=r.filter(x=>x.similarity>=.999),pool=exact.length?exact:r.filter(x=>x.similarity>=.4).slice(0,8);
 if(!pool.length)return{reward:0,evidence:0,similarity:0,mode:"NO_MATCH",neighbors:[]};
 const total=pool.reduce((n,x)=>n+Math.max(.05,x.similarity),0)||1;
 const reward=pool.reduce((n,x)=>n+x.outcome*Math.max(.05,x.similarity),0)/total;
 return{reward:+Math.max(-1,Math.min(1,reward)).toFixed(3),evidence:pool.reduce((n,x)=>n+N(x.tests),0),similarity:+Math.max(...pool.map(x=>x.similarity)).toFixed(2),mode:exact.length?"EXACT":"LEARNED_SIMILAR",neighbors:pool.slice(0,5).map(x=>({experimentId:x.id,series:x.context.series,similarity:+x.similarity.toFixed(2),outcome:+x.outcome.toFixed(3)}))};
}
function relationships(){
 const r=rows(),out=[];
 for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){if(r[i].originalKey!==r[j].originalKey)continue;const s=featureDistance(r[i].context,r[j].context);if(s>=.4)out.push({a:r[i].id,b:r[j].id,originalKey:r[i].originalKey,similarity:+s.toFixed(2),outcomeA:+outcome(r[i]).toFixed(3),outcomeB:+outcome(r[j]).toFixed(3)})}
 return out.sort((a,b)=>b.similarity-a.similarity);
}
function build(){const rel=relationships(),out={updatedAt:Date.now(),version:34,relationships:rel,contexts:rows().length};S(KEY,out);S(HIST,[out,...L(HIST,[])].slice(0,100));return out}
window.CrowSpaceContextSimilarityV34={learn,relationships,build,state:()=>L(KEY,{})};
setTimeout(build,13500);setInterval(build,15000);
})();