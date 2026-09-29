/* CrowSpace — Confidence-Aware Portfolio Allocation v30
   Browser-only. Confidence changes how often replacement strategies receive portfolio capacity.
*/
(function(){
const CONF="crowspace-replacement-confidence-v28",GOV="crowspace-replacement-confidence-v29",KEY="crowspace-portfolio-confidence-allocation-v30",L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),N=x=>Number(x)||0;
function allocations(){
 const c=L(CONF,{}),g=L(GOV,{}),out={};
 Object.keys(c).forEach(k=>{const x=c[k],tier=g[k]?.tier||x.status||"LOW";let weight=10,mode="EXPLORE";
  if(tier==="HIGH"){weight=55;mode="EXPLOIT"}else if(tier==="STRONG"){weight=40;mode="EXPLOIT"}else if(tier==="PROMISING"){weight=25;mode="BALANCED"}else if(tier==="EARLY"){weight=15;mode="EXPLORE"}else{weight=5;mode="EXPLORE"}
  const negative=N(x.negativeTests||0);if(negative){weight=Math.max(2,weight-negative*8);mode="EXPLORE"}
  out[k]={key:k,tier,weight,mode,confidence:N(x.confidence),positiveTests:N(x.positiveTests),negativeTests:negative,seriesCount:N(x.seriesCount),updatedAt:Date.now(),version:30};
 });
 const sum=Object.values(out).reduce((n,x)=>n+x.weight,0)||1;Object.values(out).forEach(x=>x.share=+(x.weight/sum*100).toFixed(1));S(KEY,out);return out;
}
function choose(keys){
 const a=allocations(),pool=(keys||Object.keys(a)).map(k=>a[k]).filter(Boolean);return pool.sort((x,y)=>y.weight-x.weight)[0]||null;
}
function state(){return L(KEY,{})}
window.CrowSpacePortfolioConfidenceV30={allocations,choose,state};
setTimeout(allocations,17000);setInterval(allocations,15000);
})();