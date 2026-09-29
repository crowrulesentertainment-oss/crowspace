/* CrowSpace — Portfolio Bandit Allocation v31
   Browser-only reward learning with exploration floor and concentration cap.
*/
(function(){
const V30="crowspace-portfolio-confidence-allocation-v30",VAL="crowspace-replacement-validation-v27",KEY="crowspace-portfolio-bandit-v31",HIST="crowspace-portfolio-bandit-history-v31",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function reward(k){
 const v=L(VAL,{})[k],t=v?.tests||[];if(!t.length)return{reward:0,observations:0};
 const w=t.map(x=>Math.pow(.5,Math.max(0,(Date.now()-N(x.completedAt))/DAY)/30)),sum=w.reduce((a,b)=>a+b,0)||1;
 const r=t.reduce((n,x,i)=>n+w[i]*(x.positive?1:x.negative?-1:N(x.effect)/100),0)/sum;
 return{reward:+Math.max(-1,Math.min(1,r)).toFixed(3),observations:t.length};
}
function allocate(){
 const base=L(V30,{}),keys=new Set([...Object.keys(base),...Object.keys(L(VAL,{}))]),rows=[...keys].map(k=>{const b=base[k]||{},r=reward(k),explore=r.observations<2?1:Math.sqrt(Math.log(Math.max(2,Object.keys(base).length+1))/Math.max(1,r.observations));let value=Math.max(0,(r.reward+1)/2)+.35*explore;const conf=N(b.confidence);value*=.65+.35*Math.min(1,conf/100);return{key:k,reward:r.reward,observations:r.observations,confidence:conf,value:+value.toFixed(4),exploration:+explore.toFixed(4)}}).filter(x=>x.key);
 if(!rows.length)return{};
 const floor=Math.min(0.15,1/Math.max(1,rows.length)*.75),cap=.45,total=rows.reduce((n,x)=>n+x.value,0)||1;
 rows.forEach(x=>x.share=x.value/total);
 const remaining=Math.max(0,1-floor*rows.length),norm=rows.map(x=>({...x,share:floor+x.share*remaining}));
 let over=norm.filter(x=>x.share>cap),excess=over.reduce((n,x)=>n+x.share-cap,0);if(excess>0){over.forEach(x=>x.share=cap);const under=norm.filter(x=>x.share<cap);const u=under.reduce((n,x)=>n+x.value,0)||1;under.forEach(x=>x.share+=excess*x.value/u)}
 const out={};norm.forEach(x=>{x.share=+Math.min(cap,x.share).toFixed(3);x.mode=x.reward>=.25&&x.confidence>=65?"EXPLOIT":x.observations<2?"EXPLORE":"BALANCED";x.version=31;out[x.key]=x});S(KEY,out);S(HIST,[{at:Date.now(),allocation:out},...L(HIST,[])].slice(0,100));return out;
}
function choose(){const a=allocate(),v=Object.values(a);return v.sort((x,y)=>y.share-x.share)[0]||null}
function state(){return L(KEY,{})}
window.CrowSpacePortfolioBanditV31={allocate,choose,state,reward};
setTimeout(allocate,18000);setInterval(allocate,15000);
})();