/* CrowSpace — Alert Command Center Detail Actions v153
   Browser-only. Adds explicit local review actions and notes to alert drill-down.
   These actions record review state only; they do not alter underlying evidence.
*/
(function(){
const HIST='crowspace-controlled-effect-regime-alert-history-v142',KEY='crowspace-alert-command-center-detail-actions-v153',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{notes:{},actions:[]})}
function act(eventId,action,note){
 const st=state(),now=Date.now();if(!eventId)return null;
 st.actions=[{eventId:String(eventId),action:String(action||'REVIEW'),note:String(note||''),at:now},...(st.actions||[])].slice(0,200);
 if(note){st.notes[eventId]=[{text:String(note),at:now},...(st.notes[eventId]||[])].slice(0,20)}
 S(KEY,st);return st.actions[0]
}
function notes(eventId){return state().notes[String(eventId)]||[]}
function actions(eventId){return state().actions.filter(x=>!eventId||x.eventId===String(eventId))}
window.CrowSpaceAlertCommandCenterDetailActionsV153={state,act,notes,actions};
})();